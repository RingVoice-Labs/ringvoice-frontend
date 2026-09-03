// ============================================================
// RingVoice — API Contract Types
// ============================================================
// This file is the single source of truth for the data shapes
// exchanged between the frontend and the backend.
//
// Share this file (or API_CONTRACT.md) with your backend
// teammate before Week 3 integration.
// ============================================================

// ------ Ring Events -----------------------------------------------

/** The type of hardware event that triggered this visit session. */
export type RingEventType = 'button_press' | 'motion_detected';

/**
 * A ring event emitted by the backend when a visitor triggers
 * the doorbell or motion sensor.
 *
 * Delivery: WebSocket message  |  type: "ring_event"
 */
export interface RingEvent {
  /** Unique identifier for this event (UUID). */
  id: string;
  /** What triggered the event. */
  eventType: RingEventType;
  /** ISO-8601 UTC timestamp of when the event occurred. */
  timestamp: string;
  /** Human-readable device name (e.g. "Front Door"). */
  deviceName: string;
  /** Internal device identifier. */
  deviceId: string;
}

// ------ Caption Stream --------------------------------------------

/**
 * A single chunk of a live caption, streamed in real-time as the
 * visitor speaks.
 *
 * Delivery: WebSocket message  |  type: "caption_chunk"
 *
 * NOTE: Chunks should be appended to form the full transcript.
 * When isFinal=true, the current sentence is complete — begin
 * a new paragraph on the next chunk.
 */
export interface CaptionChunk {
  /** Stable UUID for this chunk (for React keys / dedup). */
  id: string;
  /** The transcribed text for this chunk. May be a partial word. */
  text: string;
  /** ISO-8601 UTC timestamp when this chunk was emitted. */
  timestamp: string;
  /**
   * True when this chunk ends a complete sentence/utterance.
   * False for intermediate partial chunks.
   * Frontend uses this to decide append vs. new-line logic.
   */
  isFinal: boolean;
  /** The visit session this chunk belongs to. */
  visitId: string;
}

// ------ Resident Responses ----------------------------------------

/** The four pre-defined quick replies available to the resident. */
export type QuickReplyId =
  | 'leaving_now'
  | 'leave_at_door'
  | 'one_moment'
  | 'wrong_address';

/** Display labels for each quick reply. */
export const QUICK_REPLY_LABELS: Record<QuickReplyId, string> = {
  leaving_now: 'Leaving now',
  leave_at_door: 'Leave it at the door',
  one_moment: 'One moment please',
  wrong_address: 'Wrong address',
};

/**
 * A resident response that is LOGGED to the visit record.
 *
 * IMPORTANT: This is NOT transmitted to the visitor via audio.
 * Ring's API does not support sending custom audio to the device.
 * This is purely a log entry for the resident's own records.
 *
 * Delivery: POST /visits/{visitId}/response
 */
export interface ResidentResponse {
  /** Which quick reply was selected. */
  replyId: QuickReplyId;
  /** Display label (denormalized for easy log rendering). */
  replyLabel: string;
  /** ISO-8601 UTC timestamp when the resident tapped the reply. */
  respondedAt: string;
}

// ------ Visit Log ------------------------------------------------

/**
 * A complete record of a single visit session — stored after the
 * session ends.
 *
 * Delivery: GET /visits  (list)  |  GET /visits/{id}  (detail)
 */
export interface VisitLogEntry {
  /** Unique visit session identifier (UUID). */
  id: string;
  /** The ring event that opened this session. */
  event: RingEvent;
  /** The full ordered list of caption chunks for this visit. */
  captions: CaptionChunk[];
  /** The resident's logged response, if any. */
  response: ResidentResponse | null;
  /** ISO-8601 UTC timestamp when the visit session ended. */
  endedAt: string | null;
}

// ------ WebSocket / SSE Message Envelope --------------------------

/**
 * Union of all message types the frontend receives from the backend
 * over the real-time connection (WebSocket or SSE).
 *
 * Discriminated by the `type` field.
 */
export type BackendMessage =
  | { type: 'ring_event'; payload: RingEvent }
  | { type: 'caption_chunk'; payload: CaptionChunk }
  | { type: 'session_end'; payload: { visitId: string; endedAt: string } }
  | { type: 'error'; payload: { code: string; message: string } };
