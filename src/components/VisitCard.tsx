import { useState } from 'react';
import type { VisitLogEntry } from '../types/api';

interface VisitCardProps {
  visit: VisitLogEntry;
}

const EVENT_LABELS = {
  button_press: { label: 'Doorbell', icon: '🔔', color: 'text-rv-accent bg-rv-accent/15 border-rv-accent/30' },
  motion_detected: { label: 'Motion', icon: '🚶', color: 'text-amber-400 bg-amber-400/15 border-amber-400/30' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function VisitCard({ visit }: VisitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { event, captions, response } = visit;
  const meta = EVENT_LABELS[event.eventType];

  const fullTranscript = captions.map((c) => c.text).join('').trim();
  const hasTranscript = fullTranscript.length > 0;
  const isLong = fullTranscript.length > 120;
  const displayText =
    isLong && !expanded ? fullTranscript.slice(0, 120) + '…' : fullTranscript;

  return (
    <article
      className="
        bg-rv-surface rounded-2xl border border-white/8
        p-5 flex flex-col gap-3
        hover:border-white/15 transition-colors duration-200
      "
      aria-label={`Visit on ${formatDate(event.timestamp)} at ${formatTime(event.timestamp)}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`
              inline-flex items-center gap-1.5
              text-xs font-bold uppercase tracking-wide
              px-2.5 py-1 rounded-full border
              ${meta.color}
            `}
          >
            <span aria-hidden="true">{meta.icon}</span>
            {meta.label}
          </span>
          <span className="text-rv-text-secondary text-sm">
            {event.deviceName}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-rv-text-primary text-sm font-semibold">
            {formatTime(event.timestamp)}
          </p>
          <p className="text-rv-text-secondary text-xs">
            {formatDate(event.timestamp)}
          </p>
        </div>
      </div>

      {/* Transcript */}
      {hasTranscript ? (
        <div>
          <p className="text-rv-text-primary text-base leading-relaxed">
            "{displayText}"
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="
                text-rv-accent text-sm font-semibold mt-1
                hover:text-blue-400 transition-colors
                focus:outline-none focus:underline
              "
              aria-expanded={expanded}
            >
              {expanded ? 'Show less' : 'Show full transcript'}
            </button>
          )}
        </div>
      ) : (
        <p className="text-rv-text-secondary/60 text-sm italic">
          No speech detected
        </p>
      )}

      {/* Logged response chip */}
      {response ? (
        <div className="flex items-center gap-2">
          <span className="text-green-400 text-xs font-bold uppercase tracking-wide">
            Logged:
          </span>
          <span className="
            text-xs font-semibold
            bg-green-500/15 text-green-300 border border-green-500/30
            px-2.5 py-1 rounded-full
          ">
            {response.replyLabel}
          </span>
        </div>
      ) : (
        <p className="text-rv-text-secondary/50 text-xs italic">
          No response logged
        </p>
      )}
    </article>
  );
}
