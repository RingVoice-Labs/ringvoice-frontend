import type { BackendMessage } from '../types/api';

const WS_URL = 'wss://api.ringvoice.example.com/ws';
const DEVICE_ID = 'dev-123';
const AUTH_TOKEN = 'mock-token';

type MessageListener = (msg: BackendMessage) => void;
type StatusListener = (status: 'connecting' | 'connected' | 'error' | 'disconnected') => void;

class BackendWsClient {
  private ws: WebSocket | null = null;
  private messageListeners: Set<MessageListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private status: 'connecting' | 'connected' | 'error' | 'disconnected' = 'disconnected';
  private reconnectTimeout: number | null = null;
  private shouldConnect = false;

  public connect() {
    this.shouldConnect = true;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.updateStatus('connecting');
    try {
      this.ws = new WebSocket(`${WS_URL}?deviceId=${DEVICE_ID}&token=${AUTH_TOKEN}`);
      
      this.ws.onopen = () => {
        this.updateStatus('connected');
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as BackendMessage;
          this.messageListeners.forEach(l => l(msg));
        } catch (err) {
          console.error('[WS] Error parsing message', err);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[WS] Error', err);
        this.updateStatus('error');
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (this.status !== 'error') {
            this.updateStatus('disconnected');
        }
        if (this.shouldConnect) {
          this.reconnectTimeout = window.setTimeout(() => this.connect(), 3000);
        }
      };
    } catch (err) {
      console.error('[WS] Error initiating connection', err);
      this.updateStatus('error');
      if (this.shouldConnect) {
        this.reconnectTimeout = window.setTimeout(() => this.connect(), 3000);
      }
    }
  }

  public disconnect() {
    this.shouldConnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus('disconnected');
  }

  public addMessageListener(listener: MessageListener) {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public addStatusListener(listener: StatusListener) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  private updateStatus(newStatus: typeof this.status) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach(l => l(newStatus));
    }
  }
}

export const wsClient = new BackendWsClient();
