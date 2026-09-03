import { useState, useEffect, useCallback } from 'react';
import type { RingEvent } from '../types/api';
import {
  subscribeMockRingEvent,
  simulateRingEvent,
} from '../mock/mockRingEvent';

// ============================================================
// useRingEvent hook
// ============================================================
// Manages the active ring event state.
//
// SWAPPING IN THE REAL BACKEND (Week 3):
//   In the useEffect, replace subscribeMockRingEvent() with
//   your WebSocket/SSE message handler. The hook API and return
//   shape stay exactly the same.
// ============================================================

interface UseRingEventReturn {
  /** The currently active ring event, or null if none. */
  event: RingEvent | null;
  /** True while the event banner should be shown. */
  isActive: boolean;
  /** Dismiss the current event (closes banner, keeps event in state). */
  dismiss: () => void;
  /** Dev helper: fire a new simulated ring event manually. */
  simulate: () => void;
}

export function useRingEvent(): UseRingEventReturn {
  const [event, setEvent] = useState<RingEvent | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Auto-play: fires one mock event on mount
    const unsubscribe = subscribeMockRingEvent((evt) => {
      setEvent(evt);
      setIsActive(true);
    });
    return unsubscribe;
  }, []);

  const dismiss = useCallback(() => {
    setIsActive(false);
  }, []);

  const simulate = useCallback(() => {
    simulateRingEvent((evt) => {
      setEvent(evt);
      setIsActive(true);
    });
  }, []);

  return { event, isActive, dismiss, simulate };
}
