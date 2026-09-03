import { useState, useCallback } from 'react';
import type { QuickReplyId } from '../types/api';
import { QUICK_REPLY_LABELS } from '../types/api';

interface QuickReplyProps {
  onReply: (replyId: QuickReplyId) => void;
  /** Disable after one reply per visit */
  disabled?: boolean;
}

const REPLY_ORDER: QuickReplyId[] = [
  'leaving_now',
  'leave_at_door',
  'one_moment',
  'wrong_address',
];

const REPLY_ICONS: Record<QuickReplyId, string> = {
  leaving_now: '🚶',
  leave_at_door: '📦',
  one_moment: '⏳',
  wrong_address: '❌',
};

const TOAST_DURATION_MS = 3000;

export function QuickReply({ onReply, disabled = false }: QuickReplyProps) {
  const [selected, setSelected] = useState<QuickReplyId | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleTap = useCallback(
    (replyId: QuickReplyId) => {
      if (disabled || selected) return;
      setSelected(replyId);
      setShowToast(true);
      onReply(replyId);
      setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
    },
    [disabled, selected, onReply]
  );

  return (
    <section
      aria-labelledby="quick-reply-heading"
      className="px-2 pb-safe"
    >
      {/* Section label — makes the log-only nature unmistakably clear */}
      <div className="flex items-center justify-between mb-3">
        <h2
          id="quick-reply-heading"
          className="text-rv-text-secondary text-sm font-semibold uppercase tracking-widest"
        >
          Log a Response
        </h2>
        <span className="text-rv-text-secondary/60 text-xs italic font-medium">
          Not heard by visitor
        </span>
      </div>

      {/* Toast confirmation */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`
          overflow-hidden transition-all duration-300
          ${showToast ? 'max-h-12 mb-3 opacity-100' : 'max-h-0 mb-0 opacity-0'}
        `}
      >
        <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/40 rounded-xl px-4 py-2.5">
          <span className="text-green-400 text-base">✓</span>
          <span className="text-green-300 text-sm font-semibold">
            Saved to visit log
          </span>
          {selected && (
            <span className="text-green-300/70 text-sm ml-auto">
              "{QUICK_REPLY_LABELS[selected]}"
            </span>
          )}
        </div>
      </div>

      {/* Reply buttons */}
      <div
        className="grid grid-cols-2 gap-3"
        role="group"
        aria-label="Quick reply options"
      >
        {REPLY_ORDER.map((replyId) => {
          const isSelected = selected === replyId;
          const isDisabled = disabled || (selected !== null && !isSelected);

          return (
            <button
              key={replyId}
              id={`reply-btn-${replyId}`}
              onClick={() => handleTap(replyId)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              className={`
                flex items-center gap-3
                rounded-2xl px-4 py-4
                min-h-[64px]
                text-left font-semibold text-base
                border transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-rv-accent focus:ring-offset-2 focus:ring-offset-rv-bg
                ${isSelected
                  ? 'bg-rv-accent border-rv-accent text-white shadow-lg shadow-rv-accent/30 scale-[0.98]'
                  : isDisabled
                    ? 'bg-white/3 border-white/5 text-rv-text-secondary/40 cursor-not-allowed'
                    : 'bg-rv-surface border-white/10 text-rv-text-primary hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]'
                }
              `}
            >
              <span className="text-xl flex-shrink-0" aria-hidden="true">
                {REPLY_ICONS[replyId]}
              </span>
              <span className="leading-tight">
                {QUICK_REPLY_LABELS[replyId]}
              </span>
              {isSelected && (
                <span className="ml-auto text-white/90" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
