import type { BackendMessage, DevLogEntry } from '../types/api';

let defaultWsUrl = 'wss://api.ringvoice.example.com/ws';
const DEVICE_ID = 'dev-123';
const AUTH_TOKEN = 'mock-token';

type MessageListener = (msg: BackendMessage) => void;
type StatusListener = (status: 'connecting' | 'connected' | 'error' | 'disconnected') => void;
type DevLogListener = (log: DevLogEntry) => void;

class BackendWsClient {
  private ws: WebSocket | null = null;
  private messageListeners: Set<MessageListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private devLogListeners: Set<DevLogListener> = new Set();
  private status: 'connecting' | 'connected' | 'error' | 'disconnected' = 'disconnected';
  private reconnectTimeout: number | null = null;
  private shouldConnect = false;
  private activeUrl = defaultWsUrl;

  public setEndpointUrl(url: string) {
    this.activeUrl = url;
    if (this.shouldConnect) {
      this.disconnect();
      this.connect();
    }
  }

  public getEndpointUrl(): string {
    return this.activeUrl;
  }

  public connect() {
    this.shouldConnect = true;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.updateStatus('connecting');
    this.emitDevLog('system', 'ws:connecting', { url: `${this.activeUrl}?deviceId=${DEVICE_ID}` });

    try {
      this.ws = new WebSocket(`${this.activeUrl}?deviceId=${DEVICE_ID}&token=${AUTH_TOKEN}`);
      
      this.ws.onopen = () => {
        this.updateStatus('connected');
        this.emitDevLog('system', 'ws:open', { status: 'connected' });
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as BackendMessage;
          this.emitDevLog('inbound', msg.type, msg.payload);
          this.messageListeners.forEach(l => l(msg));
        } catch (err) {
          console.error('[WS] Error parsing message', err);
          this.emitDevLog('system', 'ws:parse_error', { raw: event.data, error: String(err) });
        }
      };

      this.ws.onerror = (err) => {
        console.error('[WS] Error', err);
        this.updateStatus('error');
        this.emitDevLog('system', 'ws:error', { error: 'WebSocket connection error' });
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.emitDevLog('system', 'ws:close', { status: 'disconnected' });
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
      this.emitDevLog('system', 'ws:exception', { error: String(err) });
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

  public addMessageListener(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  public addStatusListener(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public addDevLogListener(listener: DevLogListener): () => void {
    this.devLogListeners.add(listener);
    return () => {
      this.devLogListeners.delete(listener);
    };
  }

  public emitDevLog(direction: 'inbound' | 'outbound' | 'system', topic: string, data: unknown) {
    const entry: DevLogEntry = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      direction,
      topic,
      data,
    };
    this.devLogListeners.forEach(l => l(entry));
  }

  private updateStatus(newStatus: typeof this.status) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach(l => l(newStatus));
    }
  }
}

export const wsClient = new BackendWsClient();
