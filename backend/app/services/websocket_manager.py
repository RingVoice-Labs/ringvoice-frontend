import json
import logging
from typing import Dict, Set
from fastapi import WebSocket
from ..schemas import RingEvent, CaptionChunk, BackendMessage

logger = logging.getLogger("ringvoice.websocket")

class ConnectionManager:
    def __init__(self):
        # Map deviceId to set of connected WebSockets
        self.active_connections: Set[WebSocket] = set()
        self.device_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, device_id: str):
        await websocket.accept()
        self.active_connections.add(websocket)
        if device_id not in self.device_connections:
            self.device_connections[device_id] = set()
        self.device_connections[device_id].add(websocket)
        logger.info(f"WebSocket client connected for device {device_id}. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket, device_id: str):
        self.active_connections.discard(websocket)
        if device_id in self.device_connections:
            self.device_connections[device_id].discard(websocket)
            if not self.device_connections[device_id]:
                del self.device_connections[device_id]
        logger.info(f"WebSocket client disconnected for device {device_id}. Total active: {len(self.active_connections)}")

    async def broadcast(self, message_dict: dict, device_id: str = None):
        """Broadcast a message dict to all clients, or clients listening to a specific device."""
        targets = self.device_connections.get(device_id, self.active_connections) if device_id else self.active_connections
        disconnected = []
        for connection in list(targets):
            try:
                await connection.send_text(json.dumps(message_dict))
            except Exception as e:
                logger.warning(f"Failed to send to connection: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.active_connections.discard(conn)

    async def broadcast_ring_event(self, event: RingEvent):
        msg = {
            "type": "ring_event",
            "payload": event.model_dump()
        }
        logger.info(f"Broadcasting ring_event: {event.id} ({event.eventType})")
        await self.broadcast(msg)

    async def broadcast_caption_chunk(self, chunk: CaptionChunk):
        msg = {
            "type": "caption_chunk",
            "payload": chunk.model_dump()
        }
        await self.broadcast(msg)

    async def broadcast_session_end(self, visit_id: str, ended_at: str):
        msg = {
            "type": "session_end",
            "payload": {
                "visitId": visit_id,
                "endedAt": ended_at
            }
        }
        logger.info(f"Broadcasting session_end: {visit_id}")
        await self.broadcast(msg)

    async def broadcast_error(self, code: str, message: str):
        msg = {
            "type": "error",
            "payload": {
                "code": code,
                "message": message
            }
        }
        await self.broadcast(msg)

manager = ConnectionManager()
