from typing import List, Optional, Literal, Union
from pydantic import BaseModel, Field

# Hardware event types
RingEventType = Literal["button_press", "motion_detected"]

class RingEvent(BaseModel):
    id: str
    eventType: RingEventType
    timestamp: str
    deviceName: str
    deviceId: str

class CaptionChunk(BaseModel):
    id: str
    text: str
    timestamp: str
    isFinal: bool
    visitId: str

QuickReplyId = Literal[
    "leaving_now",
    "leave_at_door",
    "one_moment",
    "wrong_address",
    "custom"
]

class ResidentResponse(BaseModel):
    replyId: QuickReplyId
    replyLabel: str
    respondedAt: str

class VisitLogEntry(BaseModel):
    id: str
    event: RingEvent
    captions: List[CaptionChunk] = []
    response: Optional[ResidentResponse] = None
    endedAt: Optional[str] = None

class VisitListResponse(BaseModel):
    items: List[VisitLogEntry]
    total: int
    page: int

# WebSocket Message Envelopes
class SessionEndPayload(BaseModel):
    visitId: str
    endedAt: str

class ErrorPayload(BaseModel):
    code: str
    message: str

class RingEventMessage(BaseModel):
    type: Literal["ring_event"] = "ring_event"
    payload: RingEvent

class CaptionChunkMessage(BaseModel):
    type: Literal["caption_chunk"] = "caption_chunk"
    payload: CaptionChunk

class SessionEndMessage(BaseModel):
    type: Literal["session_end"] = "session_end"
    payload: SessionEndPayload

class ErrorMessage(BaseModel):
    type: Literal["error"] = "error"
    payload: ErrorPayload

BackendMessage = Union[RingEventMessage, CaptionChunkMessage, SessionEndMessage, ErrorMessage]

# Dev / Simulation Request
class SimulateRingRequest(BaseModel):
    deviceName: Optional[str] = "Front Door"
    deviceId: Optional[str] = "device-ring-001"
    eventType: Optional[RingEventType] = "button_press"
    dialogue: Optional[str] = None
