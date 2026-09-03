# RingVoice — API Contract

**Version:** Week 1 (2026-09-03)  
**Frontend:** React + Vite + TypeScript  
**Status:** Draft — pending backend teammate review before Week 3 integration

---

> [!IMPORTANT]
> **Share this document with your backend teammate** before Week 3 integration.
> The TypeScript shapes in `src/types/api.ts` are the canonical source of truth.
> This document is the human-readable summary.

---

## Overview

The frontend consumes two kinds of data:

| Channel | Purpose |
|---|---|
| **Real-time connection** (WebSocket or SSE) | Ring events + streaming caption chunks |
| **REST API** | Visit history (GET) and logged resident responses (POST) |

---

## Real-Time Connection

### Recommended: WebSocket

```
wss://api.ringvoice.example.com/ws?deviceId={deviceId}&token={authToken}
```

All messages are JSON with a discriminated `type` field:

```ts
type BackendMessage =
  | { type: 'ring_event';   payload: RingEvent }
  | { type: 'caption_chunk'; payload: CaptionChunk }
  | { type: 'session_end';  payload: { visitId: string; endedAt: string } }
  | { type: 'error';        payload: { code: string; message: string } };
```

### Alternative: Server-Sent Events (SSE)

If WebSocket is not feasible, SSE is an acceptable fallback.  
The frontend hook swap is minimal — just replace `new WebSocket(...)` with `new EventSource(...)`.

---

## Data Shapes

### `RingEvent`

Emitted when a visitor presses the doorbell button or triggers motion.

```ts
interface RingEvent {
  id: string;           // UUID — stable identifier for this event
  eventType: 'button_press' | 'motion_detected';
  timestamp: string;    // ISO-8601 UTC, e.g. "2026-09-03T14:05:12Z"
  deviceName: string;   // Human-readable, e.g. "Front Door"
  deviceId: string;     // Internal device identifier
}
```

**Open question for backend:** Does the backend send `deviceName` (human-readable) or only `deviceId`? The frontend needs a display label without an extra lookup round-trip.

---

### `CaptionChunk`

Streamed in real-time as the visitor speaks. Multiple chunks form one visit's transcript.

```ts
interface CaptionChunk {
  id: string;           // UUID — stable per chunk (for React keys / dedup)
  text: string;         // Transcribed text — may be a partial word mid-sentence
  timestamp: string;    // ISO-8601 UTC
  isFinal: boolean;     // true = end of a complete sentence/utterance
  visitId: string;      // Links this chunk to its parent RingEvent/visit
}
```

**Critical field — `isFinal`:** The frontend uses this to decide whether to *append* or *start a new line* in the caption display. Please confirm this field will be present on every chunk.

> **Append logic:**
> - `isFinal: false` → append `text` to the current line
> - `isFinal: true` → append `text` to current line, then start a new paragraph

---

### `ResidentResponse`

A logged note the resident taps after reading captions.

> [!WARNING]
> **This is NOT sent to the visitor's speaker.** Ring's API does not support
> injecting custom audio into the device stream. This is a log entry only.

```ts
type QuickReplyId =
  | 'leaving_now'
  | 'leave_at_door'
  | 'one_moment'
  | 'wrong_address';

interface ResidentResponse {
  replyId: QuickReplyId;
  replyLabel: string;       // Denormalized label for easy rendering
  respondedAt: string;      // ISO-8601 UTC
}
```

**REST endpoint (Week 3):**
```
POST /visits/{visitId}/response
Content-Type: application/json
Authorization: Bearer {token}

Body: ResidentResponse
```

---

### `VisitLogEntry`

A complete visit record, returned from the history API.

```ts
interface VisitLogEntry {
  id: string;               // UUID — visit session identifier
  event: RingEvent;         // The triggering event
  captions: CaptionChunk[]; // Full ordered transcript
  response: ResidentResponse | null;
  endedAt: string | null;   // ISO-8601 UTC — null if session still active
}
```

**REST endpoint (Week 3):**
```
GET /visits
Authorization: Bearer {token}
Query params: ?page=1&pageSize=20&eventType=button_press|motion_detected

Response: { items: VisitLogEntry[]; total: number; page: number }
```

---

## Open Questions

| # | Question | Impact |
|---|---|---|
| 1 | WebSocket or SSE? | Determines hook implementation in Week 3 |
| 2 | Does `deviceName` come from backend, or just `deviceId`? | Frontend display logic |
| 3 | Confirm `CaptionChunk.isFinal` field exists | Caption line-break rendering |
| 4 | Is the history API paginated? | Frontend list loading strategy |
| 5 | Auth: JWT token? Device ID header? Cookie? | Auth integration approach |
| 6 | Can a visit have multiple caption streams (e.g., visitor leaves and returns)? | Session state logic |

---

## Frontend Swap Points (Week 3 Checklist)

When the real backend is ready, these are the **only files** that need to change:

| File | What changes |
|---|---|
| `src/mock/mockRingEvent.ts` | Replace `subscribeMockRingEvent` body with WebSocket listener |
| `src/mock/mockCaptionStream.ts` | Replace `subscribeMockCaptionStream` body with WebSocket/SSE listener |
| `src/screens/ResidentScreen.tsx` | Uncomment `POST /visits/{id}/response` call in `handleReply` |
| `src/screens/HistoryScreen.tsx` | Replace `MOCK_VISIT_HISTORY` with `fetch('/visits')` call |

All component files, hooks, and types remain unchanged.
