import asyncio
import datetime
import hmac
import hashlib
import logging
import uuid
from typing import Optional, Tuple
from ..config import settings
from ..database import SessionLocal
from ..models import VisitModel
from ..schemas import RingEvent, RingEventType
from .websocket_manager import manager
from .stt_service import stt_service

logger = logging.getLogger("ringvoice.ring")

class RingService:
    @staticmethod
    def verify_webhook_signature(payload_bytes: bytes, signature_header: Optional[str]) -> bool:
        """
        Verify incoming Ring webhook HMAC SHA-256 signature if secret is configured.
        Bypassed if RING_WEBHOOK_SECRET is empty (dev mode).
        """
        if not settings.RING_WEBHOOK_SECRET:
            return True
        if not signature_header:
            return False
            
        expected_sig = hmac.new(
            settings.RING_WEBHOOK_SECRET.encode("utf-8"),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_sig, signature_header)

    @staticmethod
    async def process_ring_event(
        device_id: str,
        device_name: str,
        event_type: RingEventType,
        dialogue: Optional[str] = None,
        custom_visit_id: Optional[str] = None
    ) -> Tuple[VisitModel, RingEvent]:
        """
        Processes a hardware trigger:
        1. Generates visit and event identifiers.
        2. Saves new visit in SQLite.
        3. Broadcasts ring_event to WebSocket clients.
        4. Launches background STT caption stream.
        """
        visit_id = custom_visit_id or f"visit-{uuid.uuid4().hex[:8]}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
        
        # Save to database
        db = SessionLocal()
        try:
            visit_record = VisitModel(
                id=visit_id,
                device_id=device_id,
                device_name=device_name,
                event_type=event_type,
                timestamp=now_iso,
                ended_at=None
            )
            db.add(visit_record)
            db.commit()
            db.refresh(visit_record)
        finally:
            db.close()

        # Construct RingEvent schema
        ring_event = RingEvent(
            id=visit_id,
            eventType=event_type,
            timestamp=now_iso,
            deviceName=device_name,
            deviceId=device_id
        )

        # 1. Broadcast ring_event frame
        await manager.broadcast_ring_event(ring_event)

        # 2. Trigger asynchronous STT caption streaming pipeline
        asyncio.create_task(
            stt_service.stream_transcription_for_visit(
                visit_id=visit_id,
                dialogue=dialogue
            )
        )

        return visit_record, ring_event

ring_service = RingService()
