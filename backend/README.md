# 🎙 RingVoice Backend Service

Production-ready backend for **RingVoice: Live Doorbell Captions for Deaf & Hard-of-Hearing Residents**.

Provides:
1. **Real-time WebSocket Streaming** (`/ws`) for instant doorbell alerts, word-by-word streaming speech captions, and session completion events.
2. **REST API** (`/visits`, `/visits/{id}/response`) for paginated history retrieval and resident response logging.
3. **Ring Webhook Ingestion** (`/webhooks/ring`) with HMAC SHA-256 signature verification.
4. **Speech-to-Text Engine** with realistic human speech pacing, word chunking, and sentence segmentation (`isFinal` boundary detection).
5. **Local Persistent Storage** using SQLite and SQLAlchemy.

---

## 🚀 Quick Start

### 1. Run the Backend

```bash
# From the repository root:
python backend/run.py
```

The server starts on `http://localhost:8000`:
- **Interactive OpenAPI Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Docs (ReDoc):** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Real-Time WebSocket:** `ws://localhost:8000/ws?deviceId=device-ring-001&token=mock-token`

---

## 📡 API Contract Reference

### Real-Time WebSocket (`ws://localhost:8000/ws`)

Connect with query parameters:
```
ws://localhost:8000/ws?deviceId={deviceId}&token={authToken}
```

#### Inbound Messages (Server &rarr; Client):

- **Doorbell Alert:**
  ```json
  {
    "type": "ring_event",
    "payload": {
      "id": "visit-abc12345",
      "eventType": "button_press",
      "timestamp": "2026-09-22T14:00:00Z",
      "deviceName": "Front Door",
      "deviceId": "device-ring-001"
    }
  }
  ```

- **Live Caption Chunk:**
  ```json
  {
    "type": "caption_chunk",
    "payload": {
      "id": "c-12345-1",
      "text": "Hi, is anyone home?",
      "timestamp": "2026-09-22T14:00:02Z",
      "isFinal": true,
      "visitId": "visit-abc12345"
    }
  }
  ```

- **Session End:**
  ```json
  {
    "type": "session_end",
    "payload": {
      "visitId": "visit-abc12345",
      "endedAt": "2026-09-22T14:00:15Z"
    }
  }
  ```

---

### REST API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/visits?page=1&pageSize=20&eventType=button_press` | Paginated list of historical visits |
| `GET` | `/visits/{visit_id}` | Detailed visit entry |
| `POST` | `/visits/{visit_id}/response` | Log resident quick reply or custom note |
| `POST` | `/webhooks/ring` | Ingest Ring Doorbell webhook triggers |
| `POST` | `/api/dev/simulate-ring` | Developer simulator endpoint to fire a test ring & caption stream |
| `POST` | `/api/dev/reset-database` | Reset database to clean initial seed data |
| `GET` | `/health` | Server health check |

---

## 🧪 Testing with cURL / PowerShell

Trigger a simulated doorbell ring with custom speech:
```bash
curl -X POST http://localhost:8000/api/dev/simulate-ring \
  -H "Content-Type: application/json" \
  -d '{"deviceName":"Front Door","eventType":"button_press","dialogue":"Hello! Amazon delivery here with two packages."}'
```
