/**
 * WebSocket Transport implementation
 */
import { ConnectionState } from '@mcp-router/shared';
import { EventEmitter } from 'events';

export interface WebSocketTransportConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
  timeout?: number;
}

export class WebSocketTransport extends EventEmitter {
  private ws: WebSocket | null = null;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private config: Required<WebSocketTransportConfig>;
  private closedIntentionally = false;

  constructor(config: WebSocketTransportConfig) {
    super();
    this.config = {
      reconnectInterval: 1000,
      maxReconnectAttempts: 10,
      pingInterval: 30000,
      timeout: 10000,
      ...config
    };
  }

  /**
   * Get the current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    if (this.state === ConnectionState.CONNECTED || 
        this.state === ConnectionState.CONNECTING) {
      return;
    }

    this.closedIntentionally = false;
    this.state = ConnectionState.CONNECTING;
    this.emit('connecting');

    return new Promise<void>((resolve, reject) => {
      // Set a connection timeout
      const timeoutId = setTimeout(() => {
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }
        this.state = ConnectionState.ERROR;
        reject(new Error(`Connection timeout after ${this.config.timeout}ms`));
        this.emit('error', new Error(`Connection timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);

      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          clearTimeout(timeoutId);
          this.state = ConnectionState.CONNECTED;
          this.reconnectAttempts = 0;
          this.startPingTimer();
          this.emit('connected');
          resolve();
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeoutId);
          this.cleanup();

          if (!this.closedIntentionally) {
            this.attemptReconnect();
          } else {
            this.state = ConnectionState.DISCONNECTED;
            this.emit('disconnected');
          }
        };

        this.ws.onerror = (event) => {
          clearTimeout(timeoutId);
          const error = new Error('WebSocket error');
          if (this.state === ConnectionState.CONNECTING) {
            reject(error);
          }
          this.emit('error', error);
          this.state = ConnectionState.ERROR;
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.emit('message', message);
          } catch (error) {
            this.emit('error', new Error(`Failed to parse message: ${error}`));
          }
        };
      } catch (error) {
        clearTimeout(timeoutId);
        this.state = ConnectionState.ERROR;
        reject(error);
        this.emit('error', error);
        this.attemptReconnect();
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.closedIntentionally = true;
    this.cleanup();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.state = ConnectionState.DISCONNECTED;
    this.emit('disconnected');
  }

  /**
   * Send a message to the WebSocket server
   */
  send(message: any): void {
    if (this.state !== ConnectionState.CONNECTED || !this.ws) {
      throw new Error('Not connected');
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Clean up timers and state
   */
  private cleanup(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start the ping timer
   */
  private startPingTimer(): void {
    this.stopPingTimer();
    
    this.pingTimer = setInterval(() => {
      if (this.state === ConnectionState.CONNECTED && this.ws) {
        // Send a ping message
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          this.emit('error', new Error(`Failed to send ping: ${error}`));
          this.cleanup();
          this.attemptReconnect();
        }
      }
    }, this.config.pingInterval);
  }

  /**
   * Stop the ping timer
   */
  private stopPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.closedIntentionally) {
      return;
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.state = ConnectionState.ERROR;
      this.emit('error', new Error('Max reconnect attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    this.state = ConnectionState.RECONNECTING;
    this.emit('reconnecting', this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        // Error will be emitted by connect
      });
    }, this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1));
  }
} 