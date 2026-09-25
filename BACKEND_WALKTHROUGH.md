# RingVoice Backend Implementation Walkthrough

The backend for **RingVoice** has been built inside the repository in the `backend/` directory, implementing the full architecture and API contract specified in the project analysis.

---

## What Was Built

```
ringvoice-frontend/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI application with CORS & lifespan DB init
│   │   ├── config.py                # Environment configuration (ports, tokens, DB path)
│   │   ├── database.py              # SQLite engine, sessionmaker, and seed data initializer
│   │   ├── models.py                # SQLAlchemy models (Visit, CaptionChunk, ResidentResponse)
│   │   ├── schemas.py               # Pydantic schemas strictly matching src/types/api.ts
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── websocket_manager.py # ConnectionManager for active client subscriptions & broadcast
│   │   │   ├── ring_service.py      # Ring webhook HMAC verification & event ingestion
│   │   │   └── stt_service.py       # Speech-to-Text streaming engine with cadence pacing & isFinal logic
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── visits.py            # REST: GET /visits, GET /visits/{id}, POST /visits/{id}/response
│   │       ├── webhooks.py          # REST: POST /webhooks/ring (Ring Doorbell webhook)
│   │       ├── websocket.py         # WS: /ws?deviceId={deviceId}&token={authToken}
│   │       └── dev.py               # REST: POST /api/dev/simulate-ring, POST /api/dev/reset-database
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_backend.py          # Full integration test suite (REST + real-time WebSocket)
│   ├── requirements.txt             # Backend dependencies (fastapi, uvicorn, websockets, sqlalchemy)
│   ├── run.py                       # Standalone launcher: python backend/run.py
│   └── README.md                    # Backend documentation and quickstart guide
├── .env                             # Local config binding frontend to http://localhost:8000
├── .env.example                     # Environment template
├── vite.config.ts                   # Proxy rules routing /visits, /ws, /webhooks to port 8000
└── src/services/
    ├── apiService.ts                # Updated API_URL to use environment variable with localhost fallback
    └── backendWs.ts                 # Updated WS_URL to use environment variable with localhost fallback
```

---

## Key Features & Capabilities

### 1. Real-Time WebSocket Streaming (`/ws`)
- Clients connect via `ws://localhost:8000/ws?deviceId=device-ring-001&token=mock-token`.
- As visitors speak at the door, the server broadcasts:
  1. `ring_event` frame (instant visual banner trigger).
  2. `caption_chunk` frames streamed word-by-word with realistic speech pacing (300ms–400ms).
  3. `session_end` frame when speech concludes.

### 2. Speech-to-Text (STT) Engine with Sentence Segmentation
- Emits partial words/phrases with `isFinal: false` for active appending.
- Emits `isFinal: true` at sentence boundaries (`.`, `?`, `!`) so the frontend creates clean paragraph breaks.
- Saves every chunk in SQLite linked to the visit record.

### 3. REST API & Persistent Database
- `GET /visits?page=1&pageSize=20&eventType=button_press`: Returns paginated history ordered chronologically.
- `GET /visits/{id}`: Returns complete visit record with ordered transcript and logged response.
- `POST /visits/{id}/response`: Logs the resident's response (*"Leaving now"*, *"Leave it at the door"*, *"One moment"*, *"Wrong address"*, or custom note) to SQLite.
- Pre-seeded with 5 realistic demo visits on first run.

### 4. Ring Doorbell Webhook Ingestion (`POST /webhooks/ring`)
- Accepts Ring Doorbell partner webhooks for `button_press` and `motion_detected`.
- Verifies HMAC SHA-256 signatures when `RING_WEBHOOK_SECRET` is configured (bypassed in dev mode).

### 5. Developer & Demo Simulator (`POST /api/dev/simulate-ring`)
- Allows triggering custom visitor speech and events without physical Ring hardware.
- Fully wired into the frontend DevTools Inspector modal.

---

## Verification & Test Results

The backend automated test suite (`backend/tests/test_backend.py`) executes 7 end-to-end integration tests:

| Test Case | Method / Endpoint | Verified Behavior | Status |
|---|---|---|:---:|
| `test_01_health_check` | `GET /health` | Returns service status and healthy state | ✅ PASS |
| `test_02_get_visits_list` | `GET /visits` | Validates paginated list and seed data structure | ✅ PASS |
| `test_03_filter_visits` | `GET /visits?eventType=motion_detected` | Correctly filters by event type | ✅ PASS |
| `test_04_get_single_visit` | `GET /visits/visit-001` | Returns single visit with captions and response | ✅ PASS |
| `test_05_post_response` | `POST /visits/{id}/response` | Saves resident response to SQLite | ✅ PASS |
| `test_06_ring_webhook` | `POST /webhooks/ring` | Ingests webhook and generates visit session | ✅ PASS |
| `test_07_ws_caption_stream` | `WS /ws` + `POST /simulate-ring` | Verifies full sequence: `ring_event` &rarr; `caption_chunk` (word-by-word) &rarr; `session_end` | ✅ PASS |

**Test Execution Command:**
```bash
python backend/tests/test_backend.py
```
**Result:** `Ran 7 tests in 2.890s — OK`

---

## How to Run the Complete Stack

### Step 1: Start the Backend Server
```bash
python backend/run.py
```
- Server URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- WebSocket Endpoint: `ws://localhost:8000/ws`

### Step 2: Start the Frontend (if Node.js is installed)
```bash
npm run dev
```
The React frontend at `http://localhost:5173` will automatically connect to `http://localhost:8000` and `ws://localhost:8000/ws`.
