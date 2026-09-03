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
export function subscribeMockRingEvent(
  callback: (event: RingEvent) => void
): () => void {
  const event: RingEvent = {
    ...(_useMotion ? MOCK_MOTION_EVENT : MOCK_EVENT),
    id: `evt-mock-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  const timerId = setTimeout(() => {
    callback(event);
  }, 800); // slight delay to let the UI mount first

  return () => clearTimeout(timerId);
}

/**
 * Fire a fresh ring event on demand (for the "Simulate Ring" dev button).
 * Alternates between button_press and motion_detected each call.
 */
export function simulateRingEvent(callback: (event: RingEvent) => void): void {
  _useMotion = !_useMotion;
  const base = _useMotion ? MOCK_MOTION_EVENT : MOCK_EVENT;
  callback({
    ...base,
    id: `evt-mock-${Date.now()}`,
    timestamp: new Date().toISOString(),
  });
}
