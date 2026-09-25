import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import VisitModel, ResidentResponseModel
from ..schemas import (
    VisitLogEntry,
    VisitListResponse,
    ResidentResponse,
    RingEvent,
    CaptionChunk
)

router = APIRouter(prefix="/visits", tags=["Visits"])

def _to_visit_log_entry(v: VisitModel) -> VisitLogEntry:
    """Helper to convert VisitModel DB record into VisitLogEntry schema."""
    event = RingEvent(
        id=v.id,
        eventType=v.event_type,
        timestamp=v.timestamp,
        deviceName=v.device_name,
        deviceId=v.device_id
    )
    
    captions = [
        CaptionChunk(
            id=c.id,
            text=c.text,
            timestamp=c.timestamp,
            isFinal=c.is_final,
            visitId=v.id
        )
        for c in v.captions
    ]
    
    response = None
    if v.response:
        response = ResidentResponse(
            replyId=v.response.reply_id,
            replyLabel=v.response.reply_label,
            respondedAt=v.response.responded_at
        )
        
    return VisitLogEntry(
        id=v.id,
        event=event,
        captions=captions,
        response=response,
        endedAt=v.ended_at
    )

@router.get("", response_model=VisitListResponse)
def list_visits(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    eventType: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Fetch historical visit sessions, paginated and optionally filtered by eventType.
    Ordered by timestamp descending.
    """
    query = db.query(VisitModel)
    if eventType:
        query = query.filter(VisitModel.event_type == eventType)

    total = query.count()
    offset = (page - 1) * pageSize
    visits = query.order_by(VisitModel.timestamp.desc()).offset(offset).limit(pageSize).all()

    return VisitListResponse(
        items=[_to_visit_log_entry(v) for v in visits],
        total=total,
        page=page
    )

@router.get("/{visit_id}", response_model=VisitLogEntry)
def get_visit(visit_id: str, db: Session = Depends(get_db)):
    """Fetch details for a single visit session."""
    visit = db.query(VisitModel).filter(VisitModel.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit session not found")
    return _to_visit_log_entry(visit)

@router.post("/{visit_id}/response", response_model=VisitLogEntry)
def log_resident_response(
    visit_id: str,
    payload: ResidentResponse,
    db: Session = Depends(get_db)
):
    """
    Log the resident's response for a visit session.
    Note: Ring's API does not support injecting synthetic audio back to the doorbell.
    This saves an internal log record for resident/caregiver tracking.
    """
    visit = db.query(VisitModel).filter(VisitModel.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit session not found")

    existing_resp = db.query(ResidentResponseModel).filter(ResidentResponseModel.visit_id == visit_id).first()
    if existing_resp:
        existing_resp.reply_id = payload.replyId
        existing_resp.reply_label = payload.replyLabel
        existing_resp.responded_at = payload.respondedAt
    else:
        new_resp = ResidentResponseModel(
            id=f"resp-{uuid.uuid4().hex[:8]}",
            visit_id=visit_id,
            reply_id=payload.replyId,
            reply_label=payload.replyLabel,
            responded_at=payload.respondedAt
        )
        db.add(new_resp)

    db.commit()
    db.refresh(visit)
    return _to_visit_log_entry(visit)

@router.delete("/{visit_id}")
def delete_visit(visit_id: str, db: Session = Depends(get_db)):
    """Delete a visit session (useful for test resets)."""
    visit = db.query(VisitModel).filter(VisitModel.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit session not found")
    db.delete(visit)
    db.commit()
    return {"deleted": True, "visitId": visit_id}
