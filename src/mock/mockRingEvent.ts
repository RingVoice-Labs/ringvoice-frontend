import type { RingEvent } from '../types/api';

// ============================================================
// Mock Ring Event
// ============================================================
// Simulates a WebSocket "ring_event" message arriving from
// the backend.
//
// SWAPPING IN THE REAL BACKEND (Week 3):
//   Replace the body of `subscribeMockRingEvent` with a
//   WebSocket / SSE listener that calls `callback` whenever
//   a message of type "ring_event" arrives.
// ============================================================

const MOCK_EVENT: RingEvent = {
  id: 'evt-mock-001',
  eventType: 'button_press',
  timestamp: new Date().toISOString(),
  deviceName: 'Front Door',
  deviceId: 'device-ring-001',
};

const MOCK_MOTION_EVENT: RingEvent = {
  id: 'evt-mock-002',
  eventType: 'motion_detected',
  timestamp: new Date().toISOString(),
  deviceName: 'Front Door',
  deviceId: 'device-ring-001',
};

let _useMotion = false;

/**
 * Subscribe to a mock ring event feed.
 * Fires the callback immediately (simulating auto-play on page load),
 * then returns an unsubscribe function.
 *
 * @param callback  Called with each RingEvent as it arrives.
 * @returns         Unsubscribe function — call this on component unmount.
 */
// Registry of subscribers — fires whenever a ring event is emitted
const _ringSubscribers = new Set<(event: RingEvent) => void>();

export function subscribeMockRingEvent(
  callback: (event: RingEvent) => void
): () => void {
  _ringSubscribers.add(callback);
  return () => _ringSubscribers.delete(callback);
}

/** Internal: fire an event to all current subscribers. */
function _emitRingEvent(event: RingEvent) {
  _ringSubscribers.forEach((cb) => cb(event));
}

/**
 * Fire a fresh ring event on demand (for the demo / simulate button).
 * Alternates between button_press and motion_detected each call.
 */
export function simulateRingEvent(callback?: (event: RingEvent) => void): void {
  _useMotion = !_useMotion;
  const base = _useMotion ? MOCK_MOTION_EVENT : MOCK_EVENT;
  const event: RingEvent = {
    ...base,
    id: `evt-mock-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  _emitRingEvent(event);
  callback?.(event);
}
