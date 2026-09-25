import asyncio
import json
import os
import sys
import threading
import time
import unittest
import urllib.request
import urllib.error

# Ensure backend root is on sys.path
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(TEST_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import uvicorn
import websockets
from app.main import app
from app.config import settings

TEST_PORT = 8899
BASE_URL = f"http://127.0.0.1:{TEST_PORT}"
WS_URL = f"ws://127.0.0.1:{TEST_PORT}/ws"

class ServerThread(threading.Thread):
    def __init__(self):
        super().__init__(daemon=True)
        config = uvicorn.Config(app, host="127.0.0.1", port=TEST_PORT, log_level="warning")
        self.server = uvicorn.Server(config)

    def run(self):
        self.server.run()

    def stop(self):
        self.server.should_exit = True

def http_get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {settings.AUTH_TOKEN}"})
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

def http_post(path, data):
    url = f"{BASE_URL}{path}"
    payload = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.AUTH_TOKEN}"
        },
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

class TestRingVoiceBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server_thread = ServerThread()
        cls.server_thread.start()
        # Wait for server to boot
        for _ in range(20):
            try:
                status, _ = http_get("/health")
                if status == 200:
                    break
            except Exception:
                time.sleep(0.2)
        else:
            raise RuntimeError("Test server failed to start")

    @classmethod
    def tearDownClass(cls):
        cls.server_thread.stop()

    def test_01_health_check(self):
        status, data = http_get("/health")
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "ok")

    def test_02_get_visits_list(self):
        status, data = http_get("/visits?page=1&pageSize=10")
        self.assertEqual(status, 200)
        self.assertIn("items", data)
        self.assertIn("total", data)
        self.assertGreaterEqual(data["total"], 5)
        self.assertEqual(data["page"], 1)

        # Check first visit structure
        v = data["items"][0]
        self.assertIn("id", v)
        self.assertIn("event", v)
        self.assertIn("captions", v)
        self.assertIn("response", v)

    def test_03_filter_visits_by_event_type(self):
        status, data = http_get("/visits?eventType=motion_detected")
        self.assertEqual(status, 200)
        for item in data["items"]:
            self.assertEqual(item["event"]["eventType"], "motion_detected")

    def test_04_get_single_visit(self):
        status, data = http_get("/visits/visit-001")
        self.assertEqual(status, 200)
        self.assertEqual(data["id"], "visit-001")
        self.assertEqual(data["event"]["deviceName"], "Front Door")
        self.assertIsNotNone(data["response"])
        self.assertEqual(data["response"]["replyId"], "leaving_now")

    def test_05_post_resident_response(self):
        # Log response for visit-003
        payload = {
            "replyId": "leave_at_door",
            "replyLabel": "Leave it at the door",
            "respondedAt": "2026-09-22T15:00:00Z"
        }
        status, data = http_post("/visits/visit-003/response", payload)
        self.assertEqual(status, 200)
        self.assertEqual(data["id"], "visit-003")
        self.assertIsNotNone(data["response"])
        self.assertEqual(data["response"]["replyId"], "leave_at_door")

    def test_06_post_ring_webhook(self):
        payload = {
            "event": "button_press",
            "device_id": "device-ring-001",
            "device_name": "Front Door",
            "dialogue": "Hello, this is a test webhook."
        }
        status, data = http_post("/webhooks/ring", payload)
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "accepted")
        self.assertIn("visitId", data)
        self.assertEqual(data["event"]["eventType"], "button_press")

    def test_07_websocket_live_caption_streaming(self):
        async def run_ws_test():
            uri = f"{WS_URL}?deviceId=device-ring-001&token={settings.AUTH_TOKEN}"
            received_messages = []
            
            async with websockets.connect(uri) as ws:
                # Trigger simulated ring with short dialogue
                test_dialogue = "Test caption. Delivery arrived."
                sim_payload = {
                    "deviceName": "Test Porch",
                    "deviceId": "device-ring-001",
                    "eventType": "button_press",
                    "dialogue": test_dialogue
                }
                
                # Make HTTP post to trigger simulation
                status, sim_data = http_post("/api/dev/simulate-ring", sim_payload)
                self.assertEqual(status, 200)
                visit_id = sim_data["visitId"]

                # Collect incoming WebSocket frames
                start_time = time.time()
                while time.time() - start_time < 8.0:
                    try:
                        raw = await asyncio.wait_for(ws.recv(), timeout=2.0)
                        msg = json.loads(raw)
                        received_messages.append(msg)
                        if msg.get("type") == "session_end":
                            break
                    except asyncio.TimeoutError:
                        break

            # Validate received frames
            types = [m.get("type") for m in received_messages]
            self.assertIn("ring_event", types)
            self.assertIn("caption_chunk", types)
            self.assertIn("session_end", types)

            # Validate caption chunks for this specific visit
            chunks = [
                m["payload"] for m in received_messages
                if m.get("type") == "caption_chunk" and m.get("payload", {}).get("visitId") == visit_id
            ]
            self.assertGreater(len(chunks), 0)
            for c in chunks:
                self.assertIn("text", c)
                self.assertIn("isFinal", c)
                self.assertEqual(c["visitId"], visit_id)

        asyncio.run(run_ws_test())

if __name__ == "__main__":
    unittest.main(verbosity=2)
