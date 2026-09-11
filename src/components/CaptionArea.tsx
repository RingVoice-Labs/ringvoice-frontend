import type { CaptionChunk, CaptionFontSize } from '../types/api';

interface CaptionAreaProps {
  chunks: CaptionChunk[];
  isStreaming: boolean;
  isFinished: boolean;
  fontSize?: CaptionFontSize;
  onFontSizeChange?: (size: CaptionFontSize) => void;
}

const FONT_SIZE_CLASSES: Record<CaptionFontSize, { active: string; inactive: string }> = {
  normal: {
    active: 'text-2xl md:text-3xl font-bold leading-tight',
    inactive: 'text-lg md:text-xl font-medium leading-relaxed',
  },
  large: {
    active: 'text-3xl md:text-4xl font-extrabold leading-snug',
    inactive: 'text-xl md:text-2xl font-semibold leading-relaxed',
  },
  xl: {
    active: 'text-4xl md:text-5xl font-black leading-tight tracking-tight',
    inactive: 'text-2xl md:text-3xl font-bold leading-relaxed',
  },
};

export function CaptionArea({
  chunks,
  isStreaming,
  isFinished,
  fontSize = 'large',
  onFontSizeChange,
}: CaptionAreaProps) {
  const hasContent = chunks.length > 0;

  // Group chunks into sentences (split on isFinal boundaries)
  const sentences: string[] = [];
  let current = '';
  for (const chunk of chunks) {
    current += chunk.text;
    if (chunk.isFinal) {
      sentences.push(current.trim());
      current = '';
    }
  }
  // Any in-progress partial chunk
  const partial = current;
  const classes = FONT_SIZE_CLASSES[fontSize];

  return (
    <section
      className="flex-1 flex flex-col min-h-0 px-2"
      aria-labelledby="caption-heading"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <h2
            id="caption-heading"
            className="text-rv-text-secondary text-xs md:text-sm font-semibold uppercase tracking-widest"
          >
            Live Captions
          </h2>
          {isStreaming && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-bold tracking-wide">LIVE</span>

              {/* Visual Soundwave meter */}
              <div className="flex items-end gap-0.5 h-3 ml-1" title="Audio detect active">
                <span className="w-0.5 bg-green-400 animate-bounce h-2" style={{ animationDelay: '0.1s' }} />
                <span className="w-0.5 bg-green-400 animate-bounce h-3" style={{ animationDelay: '0.25s' }} />
                <span className="w-0.5 bg-green-400 animate-bounce h-1.5" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>

        {/* HoH Font Size Controller */}
        {onFontSizeChange && (
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => onFontSizeChange('normal')}
              title="Normal Font Size (24px)"
              aria-label="Set normal font size"
              className={`px-2 py-0.5 text-xs font-bold rounded ${
                fontSize === 'normal'
                  ? 'bg-rv-accent text-white shadow-xs'
                  : 'text-rv-text-secondary hover:text-white'
              }`}
            >
              A
            </button>
            <button
              onClick={() => onFontSizeChange('large')}
              title="Large Font Size (36px)"
              aria-label="Set large font size"
              className={`px-2 py-0.5 text-sm font-bold rounded ${
                fontSize === 'large'
                  ? 'bg-rv-accent text-white shadow-xs'
                  : 'text-rv-text-secondary hover:text-white'
              }`}
            >
              A+
            </button>
            <button
              onClick={() => onFontSizeChange('xl')}
              title="Extra Large Font Size (48px - HoH Accessible)"
              aria-label="Set extra large font size"
              className={`px-2 py-0.5 text-base font-black rounded ${
                fontSize === 'xl'
                  ? 'bg-rv-accent text-white shadow-xs'
                  : 'text-rv-text-secondary hover:text-white'
              }`}
            >
              A++
            </button>
          </div>
        )}
      </div>

      {/* ARIA live region — screen readers announce new caption content */}
      <div
        id="caption-live"
        role="log"
        aria-live="polite"
        aria-label="Live visitor captions"
        aria-atomic="false"
        aria-relevant="additions"
        className="
          flex-1 min-h-0 overflow-y-auto
          rounded-2xl
          bg-rv-surface border border-white/8
          p-5 md:p-8
          flex flex-col justify-end gap-3
          shadow-inner shadow-black/40
        "
      >
        {!hasContent && !partial && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-rv-accent/10 border border-rv-accent/20 flex items-center justify-center">
              <span className="text-3xl animate-pulse" aria-hidden="true">👂</span>
            </div>
            <p className="text-rv-text-secondary text-lg md:text-xl font-medium">
              {isStreaming
                ? 'Listening for visitor…'
                : 'Waiting for visitor to speak…'}
            </p>
            <p className="text-rv-text-secondary/60 text-sm max-w-xs leading-relaxed">
              Captions will stream here in real-time as speech is detected
            </p>
          </div>
        )}

        {/* Completed sentences */}
        {sentences.map((sentence, i) => (
          <p
            key={i}
            className={`
              transition-all duration-300
              ${i === sentences.length - 1 && !partial
                ? `text-rv-text-primary ${classes.active}`
                : `text-rv-text-primary/70 ${classes.inactive}`
              }
            `}
          >
            {sentence}
          </p>
        ))}

        {/* Current partial / in-progress chunk */}
        {partial && (
          <p
            aria-live="polite"
            className={`text-rv-text-primary ${classes.active}`}
          >
            {partial}
            <span
              className="inline-block w-1 h-8 bg-rv-accent ml-1 align-middle animate-blink rounded-full"
              aria-hidden="true"
            />
          </p>
        )}

        {/* Conversation Ended State */}
        {isFinished && hasContent && (
          <div className="mt-2 flex flex-col items-center justify-center opacity-80 animate-slide-down">
            <div className="w-full h-px bg-white/10 mb-3" />
            <p className="text-rv-text-secondary text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Conversation Session Complete
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
