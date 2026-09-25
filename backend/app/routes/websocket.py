import json
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from ..config import settings
from ..services.websocket_manager import manager

logger = logging.getLogger("ringvoice.ws_route")
router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    deviceId: Optional[str] = Query("device-ring-001"),
    token: Optional[str] = Query(None)
):
    """
    Real-time WebSocket connection for RingVoice clients.
    Streams ring alerts, word-by-word caption chunks, and session completion frames.
    URL format: ws://localhost:8000/ws?deviceId={deviceId}&token={authToken}
    """
    # Verify token if configured
    if settings.AUTH_TOKEN and token and token != settings.AUTH_TOKEN:
        logger.warning(f"Rejected WebSocket connection: invalid token '{token}'")
        await websocket.close(code=4003, reason="Forbidden")
        return

    await manager.connect(websocket, deviceId)
    try:
        while True:
            raw_data = await websocket.receive_text()
            # Handle incoming ping / messages from client if any
            try:
                data = json.loads(raw_data)
                msg_type = data.get("type")
                if msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, deviceId)
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        manager.disconnect(websocket, deviceId)
