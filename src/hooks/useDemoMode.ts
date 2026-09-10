import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService';

// ============================================================
// useDemoMode
// ============================================================
// Controls the auto-demo countdown shown to judges / first-time
// visitors. After AUTO_DEMO_DELAY_MS, fires a ring event + captions
// automatically so the app is never seen in an empty state.
//
// The user can also tap "Watch demo" to trigger it immediately,
// or "Dismiss" to cancel the countdown.
// ============================================================

const AUTO_DEMO_DELAY_MS = 4_000;  // 4 s after load before auto-trigger
const TICK_MS = 1_000;

export type DemoState = 'countdown' | 'running' | 'idle';

interface UseDemoModeReturn {
  demoState: DemoState;
  countdown: number;        // seconds left before auto-fire
  triggerDemo: () => void;  // fire immediately
  dismissDemo: () => void;  // cancel countdown
}

export function useDemoMode(): UseDemoModeReturn {
  const totalTicks = Math.floor(AUTO_DEMO_DELAY_MS / TICK_MS);
  const [demoState, setDemoState] = useState<DemoState>('countdown');
  const [countdown, setCountdown] = useState(totalTicks);
  const intervalRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const fire = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDemoState('running');
    apiService.simulateRingEvent();
  }, []);

  const dismissDemo = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDemoState('idle');
  }, []);

  // Countdown tick
  useEffect(() => {
    if (demoState !== 'countdown') return;

    intervalRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fire();
          return 0;
        }
        return prev - 1;
      });
    }, TICK_MS);

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [demoState, fire]);

  return { demoState, countdown, triggerDemo: fire, dismissDemo };
}
