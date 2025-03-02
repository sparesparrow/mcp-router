/**
 * WebSocket Service Implementation
 * Provides WebSocket communication functionality using Socket.IO.
 */
import { io, Socket } from 'socket.io-client';
import { 
  IWebSocketService, 
  EventHandler, 
  UnsubscribeFunction 
} from '../interfaces/IWebSocketService';

export class WebSocketService implements IWebSocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private url: string;
  private options: any;

  constructor(url: string = process.env.REACT_APP_API_URL || 'http://localhost:3001', options: any = {}) {
    this.url = url;
    this.options = {
      path: '/ws',
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      ...options
    };
  }

  /**
   * Connects to the WebSocket server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('Socket is already connected');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        console.log('Connecting to WebSocket server at:', this.url);
        this.socket = io(this.url, this.options);

        // Setup event handlers
        this.socket.on('connect', () => {
          console.log('Connected to WebSocket server');
          resolve();
        });

        this.socket.on('connect_error', (error: Error) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('Disconnected from WebSocket server:', reason);
        });

        // Forward all events to registered handlers
        this.socket.onAny((event, ...args) => {
          const handlers = this.eventHandlers.get(event);
          if (handlers) {
            handlers.forEach(handler => {
              try {
                handler(args.length === 1 ? args[0] : args);
              } catch (error) {
                console.error(`Error in handler for event ${event}:`, error);
              }
            });
          }
        });
      } catch (error) {
        console.error('Failed to initialize WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnects from the WebSocket server
   */
  async disconnect(): Promise<void> {
    if (!this.socket) {
      return;
    }

    return new Promise<void>((resolve) => {
      this.socket?.once('disconnect', () => {
        this.socket = null;
        resolve();
      });

      this.socket?.disconnect();
    });
  }

  /**
   * Emits an event to the server
   */
  emit(event: string, data: any): void {
    if (!this.socket) {
      console.error('Cannot emit event: socket not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Registers a handler for a specific event
   */
  on(event: string, handler: EventHandler): UnsubscribeFunction {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Removes a handler for a specific event
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Checks if the socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Gets the raw socket instance
   * @returns The Socket.IO socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}
