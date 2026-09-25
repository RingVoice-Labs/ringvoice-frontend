import logging
from typing import Optional
from fastapi import APIRouter, Request, Header, HTTPException, status
from ..services.ring_service import ring_service
from ..schemas import RingEventType

logger = logging.getLogger("ringvoice.webhooks")
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/ring", status_code=status.HTTP_200_OK)
async def handle_ring_webhook(
    request: Request,
    x_ring_signature: Optional[str] = Header(None)
):
    """
    Ingest doorbell notifications from the Ring partner API.
    Validates HMAC signature header (if configured), creates a visit record,
    broadcasts the ring_event to connected WebSocket clients, and starts speech captioning.
    """
    raw_body = await request.body()
    
    # 1. Verify webhook signature
    if not ring_service.verify_webhook_signature(raw_body, x_ring_signature):
        logger.warning("Rejected Ring webhook: Invalid HMAC signature")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature"
        )
        
    try:
        data = await request.json()
    except Exception:
        data = {}

    # Extract device metadata from Ring payload
    raw_event = str(data.get("event") or data.get("kind") or "button_press").lower()
    event_type: RingEventType = "motion_detected" if "motion" in raw_event else "button_press"
    
    device_id = str(data.get("device_id") or data.get("doorbot_id") or "device-ring-001")
    device_name = str(data.get("device_name") or data.get("description") or "Front Door")
    dialogue = data.get("dialogue")

    visit_record, ring_event = await ring_service.process_ring_event(
        device_id=device_id,
        device_name=device_name,
        event_type=event_type,
        dialogue=dialogue
    )

    logger.info(f"Accepted Ring webhook: visit={visit_record.id}, device={device_name}, type={event_type}")

    return {
        "status": "accepted",
        "visitId": visit_record.id,
        "event": ring_event
    }
