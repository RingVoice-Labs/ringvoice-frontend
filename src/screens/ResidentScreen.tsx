import { useEffect, useCallback, useState } from 'react';
import { EventBanner } from '../components/EventBanner';
import { CaptionArea } from '../components/CaptionArea';
import { QuickReply } from '../components/QuickReply';
import { useRingEvent } from '../hooks/useRingEvent';
import { useCaptionStream } from '../hooks/useCaptionStream';
import type { QuickReplyId, ResidentResponse } from '../types/api';

const IS_DEV = import.meta.env.DEV;

interface ResidentScreenProps {
  onGoToHistory: () => void;
}

export function ResidentScreen({ onGoToHistory }: ResidentScreenProps) {
  const { event, isActive, dismiss, simulate } = useRingEvent();
  const { chunks, isStreaming, startStream, reset } = useCaptionStream();
  const [loggedResponse, setLoggedResponse] = useState<ResidentResponse | null>(null);

  // Auto-start caption stream when a ring event fires
  useEffect(() => {
    if (event) {
      reset();
      setLoggedResponse(null);
      startStream(event.id);
    }
  }, [event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReply = useCallback(
    (replyId: QuickReplyId) => {
      const response: ResidentResponse = {
        replyId,
        replyLabel: {
          leaving_now: 'Leaving now',
          leave_at_door: 'Leave it at the door',
          one_moment: 'One moment please',
          wrong_address: 'Wrong address',
        }[replyId],
        respondedAt: new Date().toISOString(),
      };
      setLoggedResponse(response);
      // Week 3: POST /visits/{event.id}/response with `response`
      console.info('[RingVoice] Logged response:', response);
    },
    []
  );

  const handleSimulate = useCallback(() => {
    simulate();
  }, [simulate]);

  return (
    <div className="flex flex-col h-screen bg-rv-bg text-rv-text-primary overflow-hidden">

      {/* ── App Header ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rv-accent flex items-center justify-center shadow-lg shadow-rv-accent/30">
            <span className="text-white text-lg" aria-hidden="true">👁</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            RingVoice
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Dev simulate button — hidden in production */}
          {IS_DEV && (
            <button
              id="simulate-ring-btn"
              onClick={handleSimulate}
              title="Dev: Simulate a ring event"
              className="
                px-3 py-1.5 rounded-lg
                bg-amber-500/10 border border-amber-500/30
                text-amber-400 text-xs font-bold uppercase tracking-wide
                hover:bg-amber-500/20 hover:border-amber-500/50 transition-all
                focus:outline-none focus:ring-2 focus:ring-amber-400
              "
            >
              🔔 Simulate
            </button>
          )}

          {/* History nav link */}
          <button
            id="nav-history-btn"
            onClick={onGoToHistory}
            aria-label="View visit history"
            className="
              flex items-center gap-1.5
              px-3.5 py-1.5 rounded-lg
              bg-rv-surface border border-white/10
              text-rv-text-primary text-sm font-semibold
              shadow-sm shadow-black/20
              hover:bg-white/10 hover:border-white/20 hover:text-white
              active:scale-[0.98]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-rv-accent
            "
          >
            History <span aria-hidden="true" className="opacity-70 group-hover:opacity-100">→</span>
          </button>
        </div>
      </header>

      {/* ── Event Banner ────────────────────────────────────── */}
      <div className="px-5 flex-shrink-0">
        {event && (
          <EventBanner
            event={event}
            isActive={isActive}
            onDismiss={dismiss}
          />
        )}
        {/* Spacer when no banner */}
        {!isActive && <div className="h-2" />}
      </div>

      {/* ── Caption Area (flex-grows to fill space) ─────────── */}
      <main className="flex-1 min-h-0 px-5 py-3 flex flex-col">
        <CaptionArea chunks={chunks} isStreaming={isStreaming} />
      </main>

      {/* ── Quick Reply Panel (pinned to bottom) ─────────────── */}
      <footer className="px-5 pt-3 pb-6 flex-shrink-0 border-t border-white/8 bg-rv-bg/80 backdrop-blur-sm">
        <QuickReply
          onReply={handleReply}
          disabled={loggedResponse !== null}
        />
      </footer>
    </div>
  );
}
