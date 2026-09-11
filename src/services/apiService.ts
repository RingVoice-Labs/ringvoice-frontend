import type { RingEvent, CaptionChunk, ResidentResponse, VisitLogEntry } from '../types/api';
import { subscribeMockRingEvent, simulateRingEvent } from '../mock/mockRingEvent';
import { subscribeMockCaptionStream } from '../mock/mockCaptionStream';
import { getMockHistory, logResponseToMockHistory } from '../mock/mockVisitHistory';
import { wsClient } from './backendWs';

let isMockMode = import.meta.env.VITE_USE_MOCK_DATA !== 'false';
const API_URL = 'https://api.ringvoice.example.com';
const AUTH_TOKEN = 'mock-token';

export type AppDataStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

export const apiService = {
  isMockMode(): boolean {
    return isMockMode;
  },

  setMockMode(enable: boolean) {
    isMockMode = enable;
    wsClient.emitDevLog('system', 'mode:changed', { isMockMode });
  },

  subscribeRingEvent(
    onEvent: (event: RingEvent) => void,
    onStatusChange?: (status: AppDataStatus) => void
  ): () => void {
    if (isMockMode) {
      if (onStatusChange) onStatusChange('connected');
      return subscribeMockRingEvent((evt) => {
        wsClient.emitDevLog('inbound', 'ring_event (mock)', evt);
        onEvent(evt);
      });
    } else {
      wsClient.connect();
      let statusCleanup = () => {};
      if (onStatusChange) {
        statusCleanup = wsClient.addStatusListener(onStatusChange);
      }
      
      const msgCleanup = wsClient.addMessageListener((msg) => {
        if (msg.type === 'ring_event') {
          onEvent(msg.payload);
        }
      });

      return () => {
        statusCleanup();
        msgCleanup();
      };
    }
  },

  simulateRingEvent(): void {
    wsClient.emitDevLog('outbound', 'simulate_ring', { timestamp: new Date().toISOString() });
    if (isMockMode) {
      simulateRingEvent();
    } else {
      console.warn('simulateRingEvent triggered in real mode');
    }
  },

  subscribeCaptionStream(
    visitId: string,
    onChunk: (chunk: CaptionChunk) => void,
    onDone: () => void,
    onStatusChange?: (status: AppDataStatus) => void
  ): () => void {
    if (isMockMode) {
      if (onStatusChange) onStatusChange('connected');
      return subscribeMockCaptionStream(
        visitId,
        (chunk) => {
          wsClient.emitDevLog('inbound', 'caption_chunk (mock)', chunk);
          onChunk(chunk);
        },
        () => {
          wsClient.emitDevLog('inbound', 'session_end (mock)', { visitId, endedAt: new Date().toISOString() });
          onDone();
        }
      );
    } else {
      wsClient.connect();
      let statusCleanup = () => {};
      if (onStatusChange) {
        statusCleanup = wsClient.addStatusListener(onStatusChange);
      }

      const msgCleanup = wsClient.addMessageListener((msg) => {
        if (msg.type === 'caption_chunk' && msg.payload.visitId === visitId) {
          onChunk(msg.payload);
        } else if (msg.type === 'session_end' && msg.payload.visitId === visitId) {
          onDone();
        }
      });

      return () => {
        statusCleanup();
        msgCleanup();
      };
    }
  },

  async submitResponse(visitId: string, response: ResidentResponse): Promise<void> {
    wsClient.emitDevLog('outbound', `POST /visits/${visitId}/response`, response);
    if (isMockMode) {
      logResponseToMockHistory(visitId, response);
      return Promise.resolve();
    } else {
      const res = await fetch(`${API_URL}/visits/${visitId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify(response)
      });
      if (!res.ok) {
        throw new Error(`Failed to submit response: ${res.statusText}`);
      }
    }
  },

  async fetchVisitHistory(): Promise<VisitLogEntry[]> {
    wsClient.emitDevLog('outbound', 'GET /visits', { query: '?page=1&pageSize=20' });
    if (isMockMode) {
      const history = getMockHistory();
      wsClient.emitDevLog('inbound', '200 OK (GET /visits)', { total: history.length });
      return Promise.resolve(history);
    } else {
      const res = await fetch(`${API_URL}/visits`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch history: ${res.statusText}`);
      }
      const data = await res.json();
      wsClient.emitDevLog('inbound', '200 OK (GET /visits)', data);
      return data.items;
    }
  }
};
