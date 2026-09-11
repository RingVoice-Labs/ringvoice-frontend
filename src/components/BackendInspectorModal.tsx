import { useState, useEffect, useRef } from 'react';
import type { DevLogEntry, RingEventType } from '../types/api';
import { wsClient } from '../services/backendWs';
import { apiService } from '../services/apiService';

interface BackendInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackendInspectorModal({ isOpen, onClose }: BackendInspectorModalProps) {
  const [logs, setLogs] = useState<DevLogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'inbound' | 'outbound' | 'system'>('all');
  const [isMock, setIsMock] = useState(apiService.isMockMode());
  const [wsUrl, setWsUrl] = useState(wsClient.getEndpointUrl());
  const [activeTab, setActiveTab] = useState<'terminal' | 'simulator' | 'schemas'>('terminal');

  // Custom Simulator State
  const [simDeviceName, setSimDeviceName] = useState('Front Porch Camera');
  const [simEventType, setSimEventType] = useState<RingEventType>('button_press');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = wsClient.addDevLogListener((entry) => {
      setLogs((prev) => [...prev.slice(-99), entry]); // keep last 100 entries
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((l) => filter === 'all' || l.direction === filter);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleMock = (enableMock: boolean) => {
    setIsMock(enableMock);
    apiService.setMockMode(enableMock);
  };

  const handleApplyWsUrl = () => {
    wsClient.setEndpointUrl(wsUrl);
  };

  const handleRunCustomSimulation = () => {
    apiService.simulateRingEvent();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-slide-down">
      <div className="bg-rv-surface border border-white/15 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-rv-bg/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xl">
              🛠️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-bold text-lg">Backend Inspector & DevTools</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 uppercase">
                  Internal Feedback Tool
                </span>
              </div>
              <p className="text-rv-text-secondary text-xs">
                Inspect raw WebSocket frames, test schemas, and simulate hardware events
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors"
            aria-label="Close Inspector"
          >
            ×
          </button>
        </div>

        {/* Connection Bar & Mode Toggle */}
        <div className="px-6 py-3 bg-white/3 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-rv-text-secondary font-medium">Mode:</span>
              <button
                onClick={() => handleToggleMock(!isMock)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  isMock
                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                    : 'bg-green-500/20 border border-green-500/40 text-green-300'
                }`}
              >
                {isMock ? '⚡ Mock Mode (Active)' : '🌐 Real WebSocket Mode'}
              </button>
            </div>

            {!isMock && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                  className="bg-black/40 border border-white/15 rounded px-2 py-1 text-white font-mono text-xs w-64 focus:outline-none focus:ring-1 focus:ring-rv-accent"
                />
                <button
                  onClick={handleApplyWsUrl}
                  className="px-2 py-1 rounded bg-rv-accent text-white font-semibold hover:bg-rv-accent-hover"
                >
                  Connect
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-rv-text-secondary">
            <span>Logged Events: <strong className="text-white">{logs.length}</strong></span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-3 flex gap-2 border-b border-white/10 bg-rv-surface">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'terminal'
                ? 'border-rv-accent text-rv-accent'
                : 'border-transparent text-rv-text-secondary hover:text-white'
            }`}
          >
            📟 Live Terminal Log ({filteredLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'simulator'
                ? 'border-rv-accent text-rv-accent'
                : 'border-transparent text-rv-text-secondary hover:text-white'
            }`}
          >
            ⚡ Event Generator & Testing
          </button>
          <button
            onClick={() => setActiveTab('schemas')}
            className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'schemas'
                ? 'border-rv-accent text-rv-accent'
                : 'border-transparent text-rv-text-secondary hover:text-white'
            }`}
          >
            📋 Schema & Contract Copy
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-black/30">
          
          {/* TAB 1: Live Terminal Log */}
          {activeTab === 'terminal' && (
            <div className="flex flex-col h-full gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
                  {(['all', 'inbound', 'outbound', 'system'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2.5 py-1 rounded capitalize font-medium ${
                        filter === f ? 'bg-white/15 text-white' : 'text-rv-text-secondary hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setLogs([])}
                  className="text-xs text-rv-text-secondary hover:text-red-400 transition-colors"
                >
                  Clear Log
                </button>
              </div>

              <div className="flex-1 min-h-[320px] bg-black/70 rounded-2xl border border-white/10 p-4 font-mono text-xs overflow-y-auto space-y-2.5 shadow-inner">
                {filteredLogs.length === 0 ? (
                  <div className="text-rv-text-secondary/50 text-center py-12">
                    No WebSocket or API events recorded yet.<br />
                    Fire a doorbell event to see live JSON frames stream in real time.
                  </div>
                ) : (
                  filteredLogs.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/15 transition-colors group"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                              entry.direction === 'inbound'
                                ? 'bg-green-500/20 text-green-300'
                                : entry.direction === 'outbound'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {entry.direction}
                          </span>
                          <span className="text-white font-semibold">{entry.topic}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-rv-text-secondary">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                          <button
                            onClick={() => handleCopy(JSON.stringify(entry.data, null, 2), entry.id)}
                            className="opacity-0 group-hover:opacity-100 text-rv-accent hover:underline text-[10px]"
                          >
                            {copiedId === entry.id ? 'Copied ✓' : 'Copy JSON'}
                          </button>
                        </div>
                      </div>

                      <pre className="text-rv-text-secondary text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(entry.data, null, 2)}
                      </pre>
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          )}

          {/* TAB 2: Event Generator & Testing */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              <div className="bg-rv-surface rounded-2xl p-5 border border-white/10 space-y-4">
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <span>🔔</span> Trigger Hardware Event Simulation
                </h3>
                <p className="text-rv-text-secondary text-sm">
                  Simulates a Ring doorbell button press or motion sensor trigger and starts streaming visitor captions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-rv-text-secondary mb-1">
                      Event Type
                    </label>
                    <select
                      value={simEventType}
                      onChange={(e) => setSimEventType(e.target.value as RingEventType)}
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rv-accent"
                    >
                      <option value="button_press">Doorbell Button Press (🔔)</option>
                      <option value="motion_detected">Motion Detected (🚶)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-rv-text-secondary mb-1">
                      Device Name
                    </label>
                    <input
                      type="text"
                      value={simDeviceName}
                      onChange={(e) => setSimDeviceName(e.target.value)}
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rv-accent"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunCustomSimulation}
                  className="w-full py-3 rounded-xl bg-rv-accent hover:bg-rv-accent-hover text-white font-bold text-base shadow-lg shadow-rv-accent/20 transition-all active:scale-[0.99]"
                >
                  ▶ Fire Test Event & Stream Captions
                </button>
              </div>

              <div className="bg-rv-surface rounded-2xl p-5 border border-white/10 space-y-3">
                <h3 className="text-white font-bold text-base">Backend Verification Guide</h3>
                <ul className="text-rv-text-secondary text-xs space-y-2 list-disc list-inside leading-relaxed">
                  <li>Verify WebSocket messages are delivered with a discriminated <code className="text-rv-accent">type</code> field (<code className="text-white">ring_event</code>, <code className="text-white">caption_chunk</code>, <code className="text-white">session_end</code>).</li>
                  <li>Confirm that <code className="text-rv-accent">isFinal: true</code> on a chunk starts a new sentence paragraph.</li>
                  <li>Confirm <code className="text-rv-accent">POST /visits/{'{visitId}'}/response</code> logs resident responses accurately in database storage.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: Schema & Contract Copy */}
          {activeTab === 'schemas' && (
            <div className="space-y-4">
              <p className="text-rv-text-secondary text-xs">
                Copy canonical TypeScript shapes or sample JSON payloads directly into your backend service code:
              </p>

              {[
                {
                  id: 'sch-ring',
                  title: 'RingEvent Schema',
                  code: `{\n  "id": "evt_9981",\n  "eventType": "button_press",\n  "timestamp": "2026-09-11T12:00:00Z",\n  "deviceName": "Front Door",\n  "deviceId": "dev-123"\n}`,
                },
                {
                  id: 'sch-chunk',
                  title: 'CaptionChunk Schema',
                  code: `{\n  "id": "chk_001",\n  "text": "Hello, I have a package.",\n  "timestamp": "2026-09-11T12:00:05Z",\n  "isFinal": true,\n  "visitId": "evt_9981"\n}`,
                },
                {
                  id: 'sch-post',
                  title: 'POST /visits/{visitId}/response Payload',
                  code: `{\n  "replyId": "leave_at_door",\n  "replyLabel": "Leave it at the door",\n  "respondedAt": "2026-09-11T12:00:10Z"\n}`,
                },
              ].map((sch) => (
                <div key={sch.id} className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-bold text-sm">{sch.title}</h4>
                    <button
                      onClick={() => handleCopy(sch.code, sch.id)}
                      className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold text-rv-accent"
                    >
                      {copiedId === sch.id ? 'Copied ✓' : 'Copy JSON'}
                    </button>
                  </div>
                  <pre className="text-rv-text-secondary font-mono text-xs bg-black/60 p-3 rounded-xl overflow-x-auto">
                    {sch.code}
                  </pre>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-rv-bg/80 flex items-center justify-between text-xs text-rv-text-secondary">
          <span>RingVoice Week 1 DevTools &bull; Share with backend team for integration</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
          >
            Done Inspecting
          </button>
        </div>

      </div>
    </div>
  );
}
