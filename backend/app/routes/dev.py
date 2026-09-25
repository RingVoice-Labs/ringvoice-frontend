import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db, init_db, Base, engine
from ..schemas import SimulateRingRequest
from ..services.ring_service import ring_service
from ..services.websocket_manager import manager

logger = logging.getLogger("ringvoice.dev")
router = APIRouter(prefix="/api/dev", tags=["Developer & Simulation"])

@router.get("/health")
def health_check():
    """Service health status and live telemetry."""
    return {
        "status": "healthy",
        "service": "RingVoice Backend",
        "version": "1.0.0",
        "activeWebSocketClients": len(manager.active_connections)
    }

@router.post("/simulate-ring")
async def simulate_ring_trigger(payload: SimulateRingRequest):
    """
    Developer Simulator Endpoint:
    Simulates a visitor pressing the doorbell or triggering motion.
    Broadcasts the ring_event to all connected WebSocket clients,
    and begins streaming realistic caption chunks word-by-word.
    """
    visit_record, ring_event = await ring_service.process_ring_event(
        device_id=payload.deviceId or "device-ring-001",
        device_name=payload.deviceName or "Front Door",
        event_type=payload.eventType or "button_press",
        dialogue=payload.dialogue
    )

    logger.info(f"Triggered simulated ring event: {ring_event.id} ({ring_event.eventType})")
    return {
        "status": "simulated",
        "visitId": visit_record.id,
        "event": ring_event
    }

@router.post("/reset-database")
def reset_database(db: Session = Depends(get_db)):
    """Reset the database to clean initial seed data."""
    Base.metadata.drop_all(bind=engine)
    init_db()
    return {"status": "reset", "message": "Database reseeded with demo visits"}
