import { useState, useEffect, useCallback } from 'react';
import type { RingEvent } from '../types/api';
import { apiService } from '../services/apiService';
import type { AppDataStatus } from '../services/apiService';

// ============================================================
// useRingEvent hook
// ============================================================
// Manages the active ring event state.
// ============================================================

interface UseRingEventReturn {
  /** The currently active ring event, or null if none. */
  event: RingEvent | null;
  /** True while the event banner should be shown. */
  isActive: boolean;
  /** Connection status for the event stream. */
  status: AppDataStatus;
  /** Dismiss the current event (closes banner, keeps event in state). */
  dismiss: () => void;
  /** Dev helper: fire a new simulated ring event manually. */
  simulate: () => void;
}

export function useRingEvent(): UseRingEventReturn {
  const [event, setEvent] = useState<RingEvent | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<AppDataStatus>('idle');

  useEffect(() => {
    const unsubscribe = apiService.subscribeRingEvent(
      (evt) => {
        setEvent(evt);
        setIsActive(true);
      },
      (newStatus) => {
        setStatus(newStatus);
      }
    );
    return unsubscribe;
  }, []);

  const dismiss = useCallback(() => {
    setIsActive(false);
  }, []);

  const simulate = useCallback(() => {
    apiService.simulateRingEvent((evt) => {
      setEvent(evt);
      setIsActive(true);
    });
  }, []);

  return { event, isActive, status, dismiss, simulate };
}
