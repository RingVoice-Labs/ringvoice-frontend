import { useState, useMemo } from 'react';
import { VisitCard } from '../components/VisitCard';
import { MOCK_VISIT_HISTORY } from '../mock/mockVisitHistory';
import type { RingEventType } from '../types/api';

type FilterTab = 'all' | RingEventType;

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'button_press', label: 'Doorbell' },
  { id: 'motion_detected', label: 'Motion' },
];

interface HistoryScreenProps {
  onBack: () => void;
}

export function HistoryScreen({ onBack }: HistoryScreenProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filtered = useMemo(() => {
    const sorted = [...MOCK_VISIT_HISTORY].sort(
      (a, b) =>
        new Date(b.event.timestamp).getTime() -
        new Date(a.event.timestamp).getTime()
    );
    if (activeTab === 'all') return sorted;
    return sorted.filter((v) => v.event.eventType === activeTab);
  }, [activeTab]);

  return (
    <div className="flex flex-col h-screen bg-rv-bg text-rv-text-primary">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 pt-5 pb-4 flex-shrink-0">
        <button
          onClick={onBack}
          aria-label="Back to live view"
          className="
            w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15
            flex items-center justify-center
            text-rv-text-primary text-lg
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-rv-accent
          "
        >
          ←
        </button>
        <div>
          <h1 className="text-white font-bold text-xl">Visit History</h1>
          <p className="text-rv-text-secondary text-sm">
            {MOCK_VISIT_HISTORY.length} visits recorded
          </p>
        </div>
      </header>

      {/* ── Filter Tabs ─────────────────────────────────────── */}
      <div
        className="px-5 mb-4 flex-shrink-0"
        role="tablist"
        aria-label="Filter visits by type"
      >
        <div className="flex gap-2 bg-rv-surface rounded-xl p-1 border border-white/8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls="visit-list"
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-2 px-3 rounded-lg
                text-sm font-semibold
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-rv-accent
                ${activeTab === tab.id
                  ? 'bg-rv-accent text-white shadow-sm'
                  : 'text-rv-text-secondary hover:text-rv-text-primary'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Visit List ──────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-5 pb-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <span className="text-3xl" aria-hidden="true">🔍</span>
            </div>
            <p className="text-rv-text-secondary text-lg font-medium">
              No visits found
            </p>
            <p className="text-rv-text-secondary/60 text-sm">
              Try a different filter
            </p>
          </div>
        ) : (
          <ol
            id="visit-list"
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="flex flex-col gap-4"
            aria-label="Visit history list"
          >
            {filtered.map((visit) => (
              <li key={visit.id}>
                <VisitCard visit={visit} />
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
