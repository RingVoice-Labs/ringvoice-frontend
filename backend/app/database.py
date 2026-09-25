import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .config import settings
from .models import Base, VisitModel, CaptionChunkModel, ResidentResponseModel

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed initial visits if table is empty
        if db.query(VisitModel).count() == 0:
            seed_data = [
                {
                    "id": "visit-001",
                    "device_id": "device-ring-001",
                    "device_name": "Front Door",
                    "event_type": "button_press",
                    "timestamp": "2026-09-03T14:05:12Z",
                    "ended_at": "2026-09-03T14:05:35Z",
                    "captions": [
                        {"id": "c-001-1", "text": "Hi, is anyone home?", "timestamp": "2026-09-03T14:05:14Z", "is_final": True, "chunk_order": 1},
                        {"id": "c-001-2", "text": "I'm delivering a package from Amazon.", "timestamp": "2026-09-03T14:05:17Z", "is_final": True, "chunk_order": 2},
                    ],
                    "response": {
                        "id": "resp-001",
                        "reply_id": "leaving_now",
                        "reply_label": "Leaving now",
                        "responded_at": "2026-09-03T14:05:22Z"
                    }
                },
                {
                    "id": "visit-002",
                    "device_id": "device-ring-001",
                    "device_name": "Front Door",
                    "event_type": "button_press",
                    "timestamp": "2026-09-02T09:31:00Z",
                    "ended_at": "2026-09-02T09:31:40Z",
                    "captions": [
                        {"id": "c-002-1", "text": "FedEx delivery!", "timestamp": "2026-09-02T09:31:02Z", "is_final": True, "chunk_order": 1},
                        {"id": "c-002-2", "text": "I need a signature for this box from Dell.", "timestamp": "2026-09-02T09:31:07Z", "is_final": True, "chunk_order": 2},
                    ],
                    "response": {
                        "id": "resp-002",
                        "reply_id": "leave_at_door",
                        "reply_label": "Leave it at the door",
                        "responded_at": "2026-09-02T09:31:15Z"
                    }
                },
                {
                    "id": "visit-003",
                    "device_id": "device-ring-002",
                    "device_name": "Back Patio",
                    "event_type": "motion_detected",
                    "timestamp": "2026-09-01T17:45:20Z",
                    "ended_at": "2026-09-01T17:45:50Z",
                    "captions": [
                        {"id": "c-003-1", "text": "Postal carrier dropping mail into the letterbox.", "timestamp": "2026-09-01T17:45:23Z", "is_final": True, "chunk_order": 1},
                    ],
                    "response": None
                },
                {
                    "id": "visit-004",
                    "device_id": "device-ring-001",
                    "device_name": "Front Door",
                    "event_type": "button_press",
                    "timestamp": "2026-08-30T11:15:00Z",
                    "ended_at": "2026-08-30T11:15:45Z",
                    "captions": [
                        {"id": "c-004-1", "text": "Hey neighbor!", "timestamp": "2026-08-30T11:15:03Z", "is_final": True, "chunk_order": 1},
                        {"id": "c-004-2", "text": "Just wanted to let you know your dog got into our garden.", "timestamp": "2026-08-30T11:15:08Z", "is_final": True, "chunk_order": 2},
                    ],
                    "response": {
                        "id": "resp-004",
                        "reply_id": "one_moment",
                        "reply_label": "One moment please",
                        "responded_at": "2026-08-30T11:15:18Z"
                    }
                },
                {
                    "id": "visit-005",
                    "device_id": "device-ring-001",
                    "device_name": "Front Door",
                    "event_type": "button_press",
                    "timestamp": "2026-08-28T16:02:10Z",
                    "ended_at": "2026-08-28T16:02:38Z",
                    "captions": [
                        {"id": "c-005-1", "text": "Hi, we are offering free rooftop solar assessments for this street today.", "timestamp": "2026-08-28T16:02:13Z", "is_final": True, "chunk_order": 1},
                    ],
                    "response": {
                        "id": "resp-005",
                        "reply_id": "wrong_address",
                        "reply_label": "Wrong address",
                        "responded_at": "2026-08-28T16:02:20Z"
                    }
                }
            ]

            for item in seed_data:
                visit = VisitModel(
                    id=item["id"],
                    device_id=item["device_id"],
                    device_name=item["device_name"],
                    event_type=item["event_type"],
                    timestamp=item["timestamp"],
                    ended_at=item["ended_at"]
                )
                db.add(visit)
                db.flush()

                for c in item["captions"]:
                    chunk = CaptionChunkModel(
                        id=c["id"],
                        visit_id=visit.id,
                        text=c["text"],
                        timestamp=c["timestamp"],
                        is_final=c["is_final"],
                        chunk_order=c["chunk_order"]
                    )
                    db.add(chunk)

                if item["response"]:
                    r = item["response"]
                    resp = ResidentResponseModel(
                        id=r["id"],
                        visit_id=visit.id,
                        reply_id=r["reply_id"],
                        reply_label=r["reply_label"],
                        responded_at=r["responded_at"]
                    )
                    db.add(resp)

            db.commit()
    finally:
        db.close()
