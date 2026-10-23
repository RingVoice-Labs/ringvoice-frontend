import datetime
from sqlalchemy import Column, String, Boolean, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class VisitModel(Base):
    __tablename__ = "visits"

    id = Column(String(64), primary_key=True, index=True)
    device_id = Column(String(64), nullable=False, index=True)
    device_name = Column(String(128), nullable=False)
    event_type = Column(String(32), nullable=False)  # 'button_press' | 'motion_detected'
    timestamp = Column(String(64), nullable=False)   # ISO 8601 UTC
    ended_at = Column(String(64), nullable=True)    # ISO 8601 UTC
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    captions = relationship(
        "CaptionChunkModel",
        back_populates="visit",
        cascade="all, delete-orphan",
        order_by="CaptionChunkModel.chunk_order"
    )
    response = relationship(
        "ResidentResponseModel",
        back_populates="visit",
        uselist=False,
        cascade="all, delete-orphan"
    )

class CaptionChunkModel(Base):
    __tablename__ = "caption_chunks"

    id = Column(String(64), primary_key=True, index=True)
    visit_id = Column(String(64), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    timestamp = Column(String(64), nullable=False)
    is_final = Column(Boolean, default=True)
    chunk_order = Column(Integer, default=0)

    visit = relationship("VisitModel", back_populates="captions")

class ResidentResponseModel(Base):
    __tablename__ = "resident_responses"

    id = Column(String(64), primary_key=True, index=True)
    visit_id = Column(String(64), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False, unique=True)
    reply_id = Column(String(32), nullable=False)
    reply_label = Column(String(128), nullable=False)
    responded_at = Column(String(64), nullable=False)

    visit = relationship("VisitModel", back_populates="response")
