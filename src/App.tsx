import { useState } from 'react';
import { ResidentScreen } from './screens/ResidentScreen';
import { HistoryScreen } from './screens/HistoryScreen';

type Screen = 'resident' | 'history';

export default function App() {
  const [screen, setScreen] = useState<Screen>('resident');

  return (
    <>
      {/* Screen-level nav is handled via in-component buttons rather than
          a router, keeping Week 1 dependency-free. Swap to react-router
          in Week 3 if the backend integration needs URL-based routing. */}

      {screen === 'resident' && (
        <div className="relative h-screen">
          <ResidentScreen onGoToHistory={() => setScreen('history')} />
        </div>
      )}

      {screen === 'history' && (
        <HistoryScreen onBack={() => setScreen('resident')} />
      )}
    </>
  );
}
