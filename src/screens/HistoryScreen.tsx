import { useState, useMemo, useEffect } from 'react';
import { VisitCard } from '../components/VisitCard';
import { apiService } from '../services/apiService';
import type { RingEventType, VisitLogEntry } from '../types/api';

type FilterTab = 'all' | RingEventType;

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All Events' },
  { id: 'button_press', label: 'Doorbell 🔔' },
  { id: 'motion_detected', label: 'Motion 🚶' },
];

interface HistoryScreenProps {
  onBack: () => void;
}

export function HistoryScreen({ onBack }: HistoryScreenProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<VisitLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    apiService.fetchVisitHistory()
      .then(data => {
        if (mounted) {
          setHistory(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          console.error(err);
          setError('Failed to load visit history.');
          setIsLoading(false);
        }
      });

    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    let result = [...history].sort(
      (a, b) =>
        new Date(b.event.timestamp).getTime() -
        new Date(a.event.timestamp).getTime()
    );

    if (activeTab !== 'all') {
      result = result.filter((v) => v.event.eventType === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((v) => {
        const transcript = v.captions.map((c) => c.text).join(' ').toLowerCase();
        const device = v.event.deviceName.toLowerCase();
        const responseLabel = v.response?.replyLabel.toLowerCase() || '';
        return transcript.includes(q) || device.includes(q) || responseLabel.includes(q);
      });
    }

    return result;
  }, [activeTab, searchQuery, history]);

  return (
    <div className="flex flex-col h-screen bg-rv-bg text-rv-text-primary">
      <div className="w-full max-w-6xl mx-auto flex flex-col h-full">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="Back to live view"
              className="
                w-10 h-10 rounded-xl bg-white/8 hover:bg-white/15
                flex items-center justify-center
                text-rv-text-primary text-xl font-bold
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-rv-accent
              "
            >
              ←
            </button>
            <div>
              <h1 className="text-white font-bold text-2xl tracking-tight">Visit History</h1>
              <p className="text-rv-text-secondary text-sm">
                {filtered.length} of {history.length} visit logs
              </p>
            </div>
          </div>
        </header>

        {/* ── Search & Filter Controls ───────────────────────── */}
        <div className="px-5 mb-5 flex flex-col sm:flex-row gap-3 flex-shrink-0">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rv-text-secondary text-base">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transcript, device, or responses..."
              className="
                w-full pl-10 pr-4 py-2.5 rounded-xl
                bg-rv-surface border border-white/10
                text-rv-text-primary text-sm placeholder:text-rv-text-secondary/50
                focus:outline-none focus:ring-2 focus:ring-rv-accent
                transition-all
              "
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-rv-text-secondary hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div
            role="tablist"
            aria-label="Filter visits by type"
            className="flex gap-1.5 bg-rv-surface rounded-xl p-1 border border-white/8 flex-shrink-0"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls="visit-list"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-2 px-3 rounded-lg
                  text-xs md:text-sm font-semibold whitespace-nowrap
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

        {/* ── Visit List Grid ─────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-5 pb-8" aria-live="polite">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
              <span className="animate-spin text-3xl" aria-hidden="true">⏳</span>
              <p className="text-rv-text-secondary text-lg font-medium">Loading history...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
              <span className="text-3xl" aria-hidden="true">⚠️</span>
              <p className="text-red-400 text-lg font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-rv-surface rounded-lg text-sm hover:bg-white/10"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <span className="text-3xl" aria-hidden="true">🔍</span>
              </div>
              <div>
                <p className="text-rv-text-secondary text-lg font-medium">
                  No matching visits found
                </p>
                <p className="text-rv-text-secondary/60 text-sm mt-1">
                  Try clearing your search query or switching tabs
                </p>
              </div>
            </div>
          ) : (
            <ol
              id="visit-list"
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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
    </div>
  );
}
