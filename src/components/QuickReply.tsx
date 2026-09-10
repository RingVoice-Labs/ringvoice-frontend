import { useState, useCallback } from 'react';
import type { QuickReplyId } from '../types/api';
import { QUICK_REPLY_LABELS } from '../types/api';

interface QuickReplyProps {
  onReply: (replyId: QuickReplyId, customText?: string) => void;
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
  custom: '✏️',
};

const TOAST_DURATION_MS = 3000;

export function QuickReply({ onReply, disabled = false }: QuickReplyProps) {
  const [selected, setSelected] = useState<QuickReplyId | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isTypingCustom, setIsTypingCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const [savedLabel, setSavedLabel] = useState('');

  const handleTap = useCallback(
    (replyId: QuickReplyId) => {
      if (disabled || selected) return;
      
      if (replyId === 'custom') {
        setIsTypingCustom(true);
        return;
      }

      setSelected(replyId);
      setSavedLabel(QUICK_REPLY_LABELS[replyId]);
      setShowToast(true);
      onReply(replyId);
      setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
    },
    [disabled, selected, onReply]
  );

  const handleSaveCustom = useCallback(() => {
    if (!customText.trim()) return;
    setIsTypingCustom(false);
    setSelected('custom');
    setSavedLabel(customText);
    setShowToast(true);
    onReply('custom', customText);
    setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
  }, [customText, onReply]);

  const handleCancelCustom = useCallback(() => {
    setIsTypingCustom(false);
    setCustomText('');
  }, []);

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
          {savedLabel && (
            <span className="text-green-300/70 text-sm ml-auto truncate max-w-[200px]">
              "{savedLabel}"
            </span>
          )}
        </div>
      </div>

      {isTypingCustom ? (
        <div className="flex flex-col gap-3 animate-slide-down">
          <textarea
            autoFocus
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type a custom note for this visit..."
            className="
              w-full h-24 p-3 rounded-xl
              bg-white/5 border border-white/20
              text-rv-text-primary text-base placeholder:text-rv-text-secondary/50
              focus:outline-none focus:ring-2 focus:ring-rv-accent
              resize-none
            "
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancelCustom}
              className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-rv-text-primary font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCustom}
              disabled={!customText.trim()}
              className="flex-1 py-3 rounded-xl bg-rv-accent hover:bg-rv-accent-hover disabled:opacity-50 disabled:hover:bg-rv-accent text-white font-semibold transition-colors"
            >
              Save Note
            </button>
          </div>
        </div>
      ) : (
        /* Reply buttons */
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
          
          {/* Custom Note Button */}
          <button
            onClick={() => handleTap('custom')}
            disabled={disabled || selected !== null}
            className={`
              col-span-2
              flex items-center justify-center gap-2
              rounded-2xl px-4 py-3
              min-h-[56px]
              text-center font-semibold text-base
              border border-dashed transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-rv-accent
              ${(disabled || selected !== null) && selected !== 'custom'
                ? 'bg-white/3 border-white/5 text-rv-text-secondary/40 cursor-not-allowed hidden'
                : selected === 'custom'
                ? 'bg-rv-accent border-rv-accent text-white shadow-lg shadow-rv-accent/30 hidden'
                : 'bg-transparent border-white/20 text-rv-text-secondary hover:bg-white/5 hover:border-white/30 hover:text-rv-text-primary active:scale-[0.98]'
              }
            `}
          >
            <span aria-hidden="true">✏️</span> Add custom note
          </button>
        </div>
      )}
    </section>
  );
}
