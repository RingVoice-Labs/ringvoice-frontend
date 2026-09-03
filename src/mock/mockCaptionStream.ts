import type { CaptionChunk } from '../types/api';

// ============================================================
// Mock Caption Stream
// ============================================================
// Simulates WebSocket "caption_chunk" messages streaming in as
// a visitor speaks at the doorbell.
//
// SWAPPING IN THE REAL BACKEND (Week 3):
//   Replace `subscribeMockCaptionStream` with a WebSocket or
//   EventSource listener that calls `onChunk` for each
//   "caption_chunk" message and `onDone` when "session_end"
//   arrives.
// ============================================================

/** Realistic caption chunks simulating speech cadence (~200ms apart). */
const MOCK_CAPTION_SCRIPT: Array<{ text: string; isFinal: boolean }> = [
  { text: 'Hi', isFinal: false },
  { text: ', uh, hello?', isFinal: false },
  { text: ' Is anyone home?', isFinal: true },
  { text: "I'm here to deliver", isFinal: false },
  { text: ' a package', isFinal: false },
  { text: ' for this address.', isFinal: true },
  { text: 'It requires', isFinal: false },
  { text: ' a signature,', isFinal: false },
  { text: ' so I need someone', isFinal: false },
  { text: ' to come to the door.', isFinal: true },
  { text: 'Thank you!', isFinal: true },
];

const CHUNK_INTERVAL_MS = 380; // ms between chunks — realistic speech cadence

/**
 * Subscribe to a mock caption stream.
 * Emits one chunk at a time on a timer.
 *
 * @param visitId   The active visit session ID (stamped on each chunk).
 * @param onChunk   Called with each new CaptionChunk.
 * @param onDone    Called when all chunks have been emitted.
 * @returns         Unsubscribe / cancel function — call on unmount or reset.
 */
export function subscribeMockCaptionStream(
  visitId: string,
  onChunk: (chunk: CaptionChunk) => void,
  onDone: () => void
): () => void {
  let index = 0;
  let cancelled = false;

  const tick = () => {
    if (cancelled || index >= MOCK_CAPTION_SCRIPT.length) {
      if (!cancelled) onDone();
      return;
    }

    const script = MOCK_CAPTION_SCRIPT[index];
    const chunk: CaptionChunk = {
      id: `chunk-${visitId}-${index}`,
      text: script.text,
      timestamp: new Date().toISOString(),
      isFinal: script.isFinal,
      visitId,
    };

    onChunk(chunk);
    index++;
    timerId = window.setTimeout(tick, CHUNK_INTERVAL_MS);
  };

  // Start after a short natural delay (visitor walks up and starts talking)
  let timerId = window.setTimeout(tick, 1200);

  return () => {
    cancelled = true;
    clearTimeout(timerId);
  };
}
