import { useState } from 'react';
import { ResidentScreen } from './screens/ResidentScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { BackendInspectorModal } from './components/BackendInspectorModal';

type Screen = 'resident' | 'history';

export default function App() {
  const [screen, setScreen] = useState<Screen>('resident');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  return (
    <div className="min-h-screen bg-rv-bg text-rv-text-primary selection:bg-rv-accent selection:text-white">
      
      {/* ── Internal Review Viewport Mode Toolbar ───────────── */}
      <div className="bg-black/90 border-b border-white/10 px-4 py-1.5 flex items-center justify-between text-xs text-rv-text-secondary z-40 relative">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rv-accent animate-pulse" />
          <span className="font-semibold text-white">RingVoice Feedback Build</span>
          <span className="hidden sm:inline-block text-rv-text-secondary/60">| Web &amp; Mobile Responsive Ready</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Viewport Frame Toggle */}
          <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg">
            <button
              onClick={() => setIsMobileFrame(false)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                !isMobileFrame ? 'bg-rv-accent text-white' : 'text-rv-text-secondary hover:text-white'
              }`}
            >
              💻 Desktop View
            </button>
            <button
              onClick={() => setIsMobileFrame(true)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                isMobileFrame ? 'bg-rv-accent text-white' : 'text-rv-text-secondary hover:text-white'
              }`}
            >
              📱 Mobile Frame
            </button>
          </div>

          {/* Inspector Launcher */}
          <button
            onClick={() => setIsInspectorOpen(true)}
            className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-bold transition-all text-[11px]"
          >
            🛠️ DevTools &amp; API Contract
          </button>
        </div>
      </div>

      {/* ── Viewport Container ───────────────────────────────── */}
      <div className={isMobileFrame ? 'flex justify-center items-center py-6 min-h-[calc(100vh-36px)] bg-black/60' : 'h-[calc(100vh-36px)]'}>
        <div
          className={
            isMobileFrame
              ? 'w-full max-w-[410px] h-[840px] rounded-[44px] border-[10px] border-neutral-800 shadow-2xl overflow-hidden relative bg-rv-bg ring-1 ring-white/20'
              : 'w-full h-full relative'
          }
        >
          {screen === 'resident' && (
            <div className="relative h-full">
              <ResidentScreen
                onGoToHistory={() => setScreen('history')}
                onOpenInspector={() => setIsInspectorOpen(true)}
              />
            </div>
          )}

          {screen === 'history' && (
            <HistoryScreen onBack={() => setScreen('resident')} />
          )}
        </div>
      </div>

      {/* ── Backend DevTools Inspector Modal ─────────────────── */}
      <BackendInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
    </div>
  );
}

