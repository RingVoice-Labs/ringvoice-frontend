import { useState, useEffect, useCallback, useRef } from 'react';
import { EventBanner } from '../components/EventBanner';
import { CaptionArea } from '../components/CaptionArea';
import { QuickReply } from '../components/QuickReply';
import { VisitCard } from '../components/VisitCard';
import { useRingEvent } from '../hooks/useRingEvent';
import { useCaptionStream } from '../hooks/useCaptionStream';
import { useDemoMode } from '../hooks/useDemoMode';
import type { QuickReplyId, ResidentResponse, VisitLogEntry, CaptionFontSize } from '../types/api';
import { addVisitToMockHistory, endMockVisit, replaceCaptionsInMockVisit, getMockHistory } from '../mock/mockVisitHistory';
import { apiService } from '../services/apiService';

interface ResidentScreenProps {
  onGoToHistory: () => void;
  onOpenInspector: () => void;
}

export function ResidentScreen({ onGoToHistory, onOpenInspector }: ResidentScreenProps) {
  const { event, isActive, status: eventStatus, dismiss, simulate } = useRingEvent();
  const { chunks, isStreaming, isFinished, status: streamStatus, startStream, reset } = useCaptionStream();
  const [loggedResponse, setLoggedResponse] = useState<ResidentResponse | null>(null);
  const [fontSize, setFontSize] = useState<CaptionFontSize>('large');
  const [recentHistory, setRecentHistory] = useState<VisitLogEntry[]>([]);
  const { demoState, countdown, triggerDemo, dismissDemo } = useDemoMode();

  const savedVisitIdRef = useRef<string | null>(null);

  // Sync recent history list for desktop side panel
  const refreshHistory = useCallback(() => {
    apiService.fetchVisitHistory().then(setRecentHistory).catch(() => setRecentHistory(getMockHistory()));
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Auto-start caption stream when a ring event fires
  useEffect(() => {
    if (event && event.id !== savedVisitIdRef.current) {
      reset();
      setLoggedResponse(null);
      startStream(event.id);

      const newVisit: VisitLogEntry = {
        id: event.id,
        event,
        captions: [],
        response: null,
        endedAt: null,
      };
      addVisitToMockHistory(newVisit);
      savedVisitIdRef.current = event.id;
      refreshHistory();
    }
  }, [event, reset, startStream, refreshHistory]);

  // Sync captions to history when stream finishes
  useEffect(() => {
    if (isFinished && event) {
      replaceCaptionsInMockVisit(event.id, chunks);
      endMockVisit(event.id);
      refreshHistory();
    }
  }, [isFinished, event, chunks, refreshHistory]);

  const handleReply = useCallback(
    async (replyId: QuickReplyId, customText?: string) => {
      if (!event) return;

      const label =
        replyId === 'custom' && customText
          ? customText
          : ({
              leaving_now: 'Leaving now',
              leave_at_door: 'Leave it at the door',
              one_moment: 'One moment please',
              wrong_address: 'Wrong address',
              custom: 'Custom Note',
            } as Record<QuickReplyId, string>)[replyId];

      const response: ResidentResponse = {
        replyId,
        replyLabel: label,
        respondedAt: new Date().toISOString(),
      };

      setLoggedResponse(response);

      try {
        await apiService.submitResponse(event.id, response);
        refreshHistory();
      } catch (err) {
        console.error('Failed to submit response', err);
      }
    },
    [event, refreshHistory]
  );

  const isWaiting = !event && !isActive;

  return (
    <div className="flex flex-col h-screen bg-rv-bg text-rv-text-primary overflow-hidden">

      {/* ── Top Header Navigation ────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0 bg-rv-bg/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rv-accent flex items-center justify-center shadow-lg shadow-rv-accent/30">
            <span className="text-white text-xl" aria-hidden="true">👁</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-xl tracking-tight">
                RingVoice
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-rv-accent/15 text-rv-accent border border-rv-accent/30">
                HoH Live Captions
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Backend Inspector DevTool Button */}
          <button
            onClick={onOpenInspector}
            title="Open Backend DevTools & Payload Inspector"
            className="
              flex items-center gap-1.5
              px-3 py-1.5 rounded-xl
              bg-amber-500/10 border border-amber-500/30
              text-amber-400 text-xs font-bold
              hover:bg-amber-500/20 hover:border-amber-500/50 transition-all
              focus:outline-none focus:ring-2 focus:ring-amber-400
            "
          >
            <span>🛠️ Inspector</span>
          </button>

          {/* Quick Simulate Ring Button */}
          <button
            id="simulate-ring-btn"
            onClick={simulate}
            title="Fire a test doorbell event"
            className="
              px-3 py-1.5 rounded-xl
              bg-white/8 border border-white/10
              text-rv-text-primary text-xs font-bold
              hover:bg-white/15 transition-all
              focus:outline-none focus:ring-2 focus:ring-rv-accent
            "
          >
            🔔 Ring Doorbell
          </button>

          {/* Visit History Navigation */}
          <button
            id="nav-history-btn"
            onClick={onGoToHistory}
            aria-label="View visit history"
            className="
              flex items-center gap-1.5
              px-3.5 py-1.5 rounded-xl
              bg-rv-accent text-white text-xs md:text-sm font-bold
              shadow-md shadow-rv-accent/20
              hover:bg-rv-accent-hover active:scale-[0.98]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-rv-accent
            "
          >
            History <span aria-hidden="true" className="opacity-80">→</span>
          </button>
        </div>
      </header>

      {/* ── Main Responsive Grid Layout ─────────────────────── */}
      <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto lg:px-6 lg:py-4 lg:grid lg:grid-cols-12 lg:gap-6 overflow-hidden">
        
        {/* Left / Main Column (Live Stream & Quick Reply) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-0 overflow-hidden">
          
          {/* Connection Status Banner */}
          <div className="px-5 lg:px-0 pt-2 flex-shrink-0" aria-live="polite">
            {(eventStatus === 'error' || streamStatus === 'error') && (
              <div className="mb-2 p-2.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                <span aria-hidden="true">⚠️</span> Connection error. Retrying real-time stream…
              </div>
            )}
            {(eventStatus === 'connecting' || streamStatus === 'connecting') && (
              <div className="mb-2 p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/50 text-blue-200 text-xs flex items-center gap-2">
                <span className="animate-spin" aria-hidden="true">⏳</span> Connecting to doorbell audio stream…
              </div>
            )}
          </div>

          {/* Event Banner */}
          <div className="px-5 lg:px-0 flex-shrink-0">
            {event && (
              <EventBanner event={event} isActive={isActive} onDismiss={dismiss} />
            )}
            {!isActive && <div className="h-2" />}
          </div>

          {/* Caption Area / Demo CTA */}
          <main className="flex-1 min-h-0 px-5 lg:px-0 py-2 flex flex-col">
            {isWaiting && demoState !== 'idle' ? (
              /* Demo Splash */
              <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4 animate-slide-down bg-rv-surface/40 rounded-3xl border border-white/5 p-6">
                <div className="w-20 h-20 rounded-3xl bg-rv-accent/15 border border-rv-accent/30 flex items-center justify-center shadow-lg shadow-rv-accent/10">
                  <span className="text-4xl animate-ring" aria-hidden="true">🔔</span>
                </div>

                <div className="space-y-2 max-w-sm">
                  <h2 className="text-white font-bold text-2xl">RingVoice Ready</h2>
                  <p className="text-rv-text-secondary text-sm leading-relaxed">
                    Real-time visual captions for your Ring doorbell &mdash; designed for accessibility &amp; peace of mind.
                  </p>
                </div>

                <button
                  onClick={triggerDemo}
                  className="
                    flex items-center gap-3
                    px-8 py-4 rounded-2xl
                    bg-rv-accent hover:bg-rv-accent-hover
                    text-white font-bold text-base
                    shadow-xl shadow-rv-accent/30
                    transition-all duration-200 active:scale-[0.97]
                  "
                >
                  <span aria-hidden="true">▶</span>
                  Watch Live Demo
                </button>

                {demoState === 'countdown' && (
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-rv-text-secondary/70 text-xs font-medium">
                      Auto-starting demo in{' '}
                      <span className="text-rv-accent font-bold tabular-nums">{countdown}s</span>
                    </p>
                    <button
                      onClick={dismissDemo}
                      className="text-rv-text-secondary/50 text-xs underline hover:text-rv-text-secondary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <CaptionArea
                chunks={chunks}
                isStreaming={isStreaming}
                isFinished={isFinished}
                fontSize={fontSize}
                onFontSizeChange={setFontSize}
              />
            )}
          </main>

          {/* Quick Reply Panel */}
          <footer className="px-5 lg:px-0 pt-3 pb-5 flex-shrink-0 border-t border-white/8 bg-rv-bg/80">
            <QuickReply
              onReply={handleReply}
              disabled={loggedResponse !== null || (!event && demoState !== 'idle')}
            />
          </footer>
        </div>

        {/* Right Column: Desktop Side Panel (Recent History Feed) */}
        <aside className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col h-full min-h-0 bg-rv-surface/40 rounded-3xl border border-white/8 p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <span>📋</span> Recent Visits Log
            </h3>
            <button
              onClick={onGoToHistory}
              className="text-rv-accent text-xs font-semibold hover:underline"
            >
              View All ({recentHistory.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {recentHistory.length === 0 ? (
              <div className="text-center py-12 text-rv-text-secondary/60 text-xs">
                No recent visit history yet.
              </div>
            ) : (
              recentHistory.slice(0, 5).map((visit) => (
                <VisitCard key={visit.id} visit={visit} />
              ))
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
