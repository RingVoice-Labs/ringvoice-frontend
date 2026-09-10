import type { RingEvent, CaptionChunk, ResidentResponse, VisitLogEntry } from '../types/api';
import { subscribeMockRingEvent, simulateRingEvent } from '../mock/mockRingEvent';
import { subscribeMockCaptionStream } from '../mock/mockCaptionStream';
import { getMockHistory, logResponseToMockHistory } from '../mock/mockVisitHistory';
import { wsClient } from './backendWs';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';
const API_URL = 'https://api.ringvoice.example.com';
const AUTH_TOKEN = 'mock-token';

export type AppDataStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

export const apiService = {
  subscribeRingEvent(
    onEvent: (event: RingEvent) => void,
    onStatusChange?: (status: AppDataStatus) => void
  ): () => void {
    if (USE_MOCK_DATA) {
      if (onStatusChange) onStatusChange('connected');
      return subscribeMockRingEvent(onEvent);
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
        // Option to disconnect, but might be shared with captions
      };
    }
  },

  simulateRingEvent(callback: (event: RingEvent) => void): void {
    if (USE_MOCK_DATA) {
      simulateRingEvent(callback);
    } else {
      console.warn("simulateRingEvent not available in real backend mode");
    }
  },

  subscribeCaptionStream(
    visitId: string,
    onChunk: (chunk: CaptionChunk) => void,
    onDone: () => void,
    onStatusChange?: (status: AppDataStatus) => void
  ): () => void {
    if (USE_MOCK_DATA) {
      if (onStatusChange) onStatusChange('connected');
      return subscribeMockCaptionStream(visitId, onChunk, onDone);
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
    if (USE_MOCK_DATA) {
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
    if (USE_MOCK_DATA) {
      return Promise.resolve(getMockHistory());
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
      return data.items;
    }
  }
};
