import type { CaptionChunk } from '../types/api';

interface CaptionAreaProps {
  chunks: CaptionChunk[];
  isStreaming: boolean;
}

export function CaptionArea({ chunks, isStreaming }: CaptionAreaProps) {
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

  return (
    <section
      className="flex-1 flex flex-col min-h-0 px-2"
      aria-labelledby="caption-heading"
    >
      <div className="flex items-center gap-3 mb-4">
        <h2
          id="caption-heading"
          className="text-rv-text-secondary text-sm font-semibold uppercase tracking-widest"
        >
          Live Captions
        </h2>
        {isStreaming && (
          <span
            aria-label="Caption stream active"
            className="flex items-center gap-1.5"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">LIVE</span>
          </span>
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
          p-6 md:p-8
          flex flex-col justify-end gap-3
        "
      >
        {!hasContent && !partial && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-8">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <span className="text-3xl" aria-hidden="true">👂</span>
            </div>
            <p className="text-rv-text-secondary text-xl font-medium">
              {isStreaming
                ? 'Listening for visitor…'
                : 'Waiting for visitor to speak…'}
            </p>
            <p className="text-rv-text-secondary/60 text-sm max-w-xs">
              Captions will appear here as the visitor speaks
            </p>
          </div>
        )}

        {/* Completed sentences */}
        {sentences.map((sentence, i) => (
          <p
            key={i}
            className={`
              text-rv-caption font-semibold leading-snug
              transition-opacity duration-300
              ${i === sentences.length - 1 && !partial
                ? 'text-rv-text-primary opacity-100'
                : 'text-rv-text-primary/70 opacity-70 text-2xl'
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
            className="text-rv-caption font-semibold leading-snug text-rv-text-primary"
          >
            {partial}
            <span
              className="inline-block w-0.5 h-8 bg-rv-accent ml-1 align-middle animate-blink"
              aria-hidden="true"
            />
          </p>
        )}
      </div>
    </section>
  );
}
