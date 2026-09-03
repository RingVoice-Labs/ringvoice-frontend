import { useEffect } from 'react';
import type { RingEvent } from '../types/api';

interface EventBannerProps {
  event: RingEvent;
  isActive: boolean;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 10_000;

export function EventBanner({ event, isActive, onDismiss }: EventBannerProps) {
  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!isActive) return;
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [isActive, onDismiss]);

  if (!isActive) return null;

  const isButtonPress = event.eventType === 'button_press';

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      id="event-banner"
      className={`
        flex items-center justify-between gap-4
        px-5 py-4 rounded-2xl
        border border-white/10
        shadow-2xl
        animate-slide-down
        ${isButtonPress
          ? 'bg-gradient-to-r from-rv-accent/90 to-blue-500/80'
          : 'bg-gradient-to-r from-amber-500/90 to-orange-500/80'
        }
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="text-3xl flex-shrink-0 animate-ring"
          aria-hidden="true"
        >
          {isButtonPress ? '🔔' : '🚶'}
        </span>
        <div className="min-w-0">
          <p className="text-white font-bold text-xl leading-tight truncate">
            {isButtonPress ? 'Doorbell Pressed' : 'Motion Detected'}
          </p>
          <p className="text-white/80 text-sm font-medium">
            {event.deviceName} &middot;{' '}
            {new Date(event.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <button
        onClick={onDismiss}
        aria-label="Dismiss alert"
        className="
          flex-shrink-0 w-9 h-9 rounded-full
          bg-white/20 hover:bg-white/35
          flex items-center justify-center
          text-white text-lg font-bold
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-white
        "
      >
        ×
      </button>
    </div>
  );
}
