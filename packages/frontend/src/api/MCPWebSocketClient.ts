/**
 * MCP WebSocket Client for real-time communication
 */
import { EventEmitter } from 'events';
import { WebSocketTransport } from '../transport/WebSocketTransport';
import { 
  AIRequestMessage, 
  AIResponseMessage, 
  AudioRequestMessage, 
  AudioResponseMessage 
} from '@mcp-router/shared';

export interface MCPWebSocketClientConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  responseTimeout?: number;
}

export class MCPWebSocketClient extends EventEmitter {
  private transport: WebSocketTransport;
  private requestMap = new Map<string, { 
    resolve: (value: any) => void, 
    reject: (reason: any) => void,
    timer: NodeJS.Timeout 
  }>();
  private responseTimeout: number;

  constructor(config: MCPWebSocketClientConfig) {
    super();
    this.transport = new WebSocketTransport({
      url: config.url,
      reconnectInterval: config.reconnectInterval,
      maxReconnectAttempts: config.maxReconnectAttempts
    });
    this.responseTimeout = config.responseTimeout || 30000;

    // Forward events from the transport
    this.transport.on('connected', () => this.emit('connected'));
    this.transport.on('disconnected', () => this.emit('disconnected'));
    this.transport.on('reconnecting', (attempt) => this.emit('reconnecting', attempt));
    this.transport.on('error', (error) => this.emit('error', error));
    
    // Handle incoming messages
    this.transport.on('message', (message) => {
      this.handleMessage(message);
    });
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    await this.transport.connect();
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.transport.disconnect();
    // Clear any pending requests
    this.requestMap.forEach(({ reject, timer }) => {
      clearTimeout(timer);
      reject(new Error('Disconnected'));
    });
    this.requestMap.clear();
  }

  /**
   * Send an AI request and get the response
   */
  async sendAIRequest(request: Omit<AIRequestMessage, 'type' | 'id'>): Promise<AIResponseMessage> {
    const message: AIRequestMessage = {
      type: 'ai_request',
      id: this.generateId(),
      ...request
    };

    return this.sendRequest(message);
  }

  /**
   * Send an AI request with streaming and get a stream of responses
   */
  async streamAIRequest(request: Omit<AIRequestMessage, 'type' | 'id' | 'stream'>): Promise<any> {
    const message: AIRequestMessage = {
      type: 'ai_request',
      id: this.generateId(),
      stream: true,
      ...request
    };

    // We need to handle streaming differently - we'll set up an event handler for responses
    // with this ID and return an async generator
    const requestId = message.id as string;
    const messageQueue: string[] = [];
    let done = false;
    let error: Error | null = null;
    let resolveNext: ((value: IteratorResult<string>) => void) | null = null;

    // Set up event handler for this request
    const handler = (response: AIResponseMessage) => {
      if (response.id === requestId) {
        if (response.text) {
          messageQueue.push(response.text);
          if (resolveNext) {
            const next = resolveNext;
            resolveNext = null;
            next({ value: messageQueue.shift()!, done: false });
          }
        }
        if (response.finished) {
          done = true;
          if (resolveNext) {
            const next = resolveNext;
            resolveNext = null;
            if (messageQueue.length > 0) {
              next({ value: messageQueue.shift()!, done: false });
            } else {
              next({ value: undefined, done: true });
            }
          }
          this.removeListener('ai_response', handler);
          this.removeListener('ai_error', errorHandler);
        }
      }
    };

    const errorHandler = (err: Error) => {
      error = err;
      done = true;
      if (resolveNext) {
        const next = resolveNext;
        resolveNext = null;
        next({ value: undefined, done: true });
      }
      this.removeListener('ai_response', handler);
      this.removeListener('ai_error', errorHandler);
    };

    this.on('ai_response', handler);
    this.on('ai_error', errorHandler);

    // Send the request
    try {
      this.transport.send(message);
    } catch (err) {
      this.removeListener('ai_response', handler);
      this.removeListener('ai_error', errorHandler);
      throw err;
    }

    // Return an async generator
    const generator = {
      async *[Symbol.asyncIterator]() {
        while (true) {
          if (error) {
            throw error;
          }
          if (done && messageQueue.length === 0) {
            return;
          }
          if (messageQueue.length > 0) {
            yield messageQueue.shift()!;
          } else {
            await new Promise<void>((resolve) => {
              resolveNext = () => resolve();
            });
          }
        }
      },
      next: async () => {
        if (error) {
          throw error;
        }
        if (done && messageQueue.length === 0) {
          return { value: undefined, done: true };
        }
        if (messageQueue.length > 0) {
          return { value: messageQueue.shift()!, done: false };
        }
        return new Promise<IteratorResult<string>>((resolve) => {
          resolveNext = resolve;
        });
      },
      return: async () => {
        // Clean up when generator is closed
        this.removeListener('ai_response', handler);
        this.removeListener('ai_error', errorHandler);
        return { value: undefined, done: true };
      },
      throw: async (err: any) => {
        // Clean up when generator has error
        this.removeListener('ai_response', handler);
        this.removeListener('ai_error', errorHandler);
        return { value: undefined, done: true };
      }
    };
    
    return generator;
  }

  /**
   * Send an audio request and get the response
   */
  async sendAudioRequest(request: Omit<AudioRequestMessage, 'type' | 'id'>): Promise<AudioResponseMessage> {
    const message: AudioRequestMessage = {
      type: 'audio_request',
      id: this.generateId(),
      ...request
    };

    return this.sendRequest(message);
  }

  /**
   * Send an audio request with streaming and get a stream of audio chunks
   */
  async streamAudioRequest(request: Omit<AudioRequestMessage, 'type' | 'id' | 'stream'>): Promise<any> {
    const message: AudioRequestMessage = {
      type: 'audio_request',
      id: this.generateId(),
      stream: true,
      ...request
    };

    // Similar to streamAIRequest, but handling audio responses
    const requestId = message.id as string;
    const messageQueue: string[] = [];
    let done = false;
    let error: Error | null = null;
    let resolveNext: ((value: IteratorResult<string>) => void) | null = null;

    // Set up event handler for this request
    const handler = (response: AudioResponseMessage) => {
      if (response.id === requestId) {
        if (response.audio_data) {
          messageQueue.push(response.audio_data);
          if (resolveNext) {
            const next = resolveNext;
            resolveNext = null;
            next({ value: messageQueue.shift()!, done: false });
          }
        }
        if (response.finished) {
          done = true;
          if (resolveNext) {
            const next = resolveNext;
            resolveNext = null;
            if (messageQueue.length > 0) {
              next({ value: messageQueue.shift()!, done: false });
            } else {
              next({ value: undefined, done: true });
            }
          }
          this.removeListener('audio_response', handler);
          this.removeListener('audio_error', errorHandler);
        }
      }
    };

    const errorHandler = (err: Error) => {
      error = err;
      done = true;
      if (resolveNext) {
        const next = resolveNext;
        resolveNext = null;
        next({ value: undefined, done: true });
      }
      this.removeListener('audio_response', handler);
      this.removeListener('audio_error', errorHandler);
    };

    this.on('audio_response', handler);
    this.on('audio_error', errorHandler);

    // Send the request
    try {
      this.transport.send(message);
    } catch (err) {
      this.removeListener('audio_response', handler);
      this.removeListener('audio_error', errorHandler);
      throw err;
    }

    // Return an async generator
    const generator = {
      async *[Symbol.asyncIterator]() {
        while (true) {
          if (error) {
            throw error;
          }
          if (done && messageQueue.length === 0) {
            return;
          }
          if (messageQueue.length > 0) {
            yield messageQueue.shift()!;
          } else {
            await new Promise<void>((resolve) => {
              resolveNext = () => resolve();
            });
          }
        }
      },
      next: async () => {
        if (error) {
          throw error;
        }
        if (done && messageQueue.length === 0) {
          return { value: undefined, done: true };
        }
        if (messageQueue.length > 0) {
          return { value: messageQueue.shift()!, done: false };
        }
        return new Promise<IteratorResult<string>>((resolve) => {
          resolveNext = resolve;
        });
      },
      return: async () => {
        // Clean up when generator is closed
        this.removeListener('audio_response', handler);
        this.removeListener('audio_error', errorHandler);
        return { value: undefined, done: true };
      },
      throw: async (err: any) => {
        // Clean up when generator has error
        this.removeListener('audio_response', handler);
        this.removeListener('audio_error', errorHandler);
        return { value: undefined, done: true };
      }
    };
    
    return generator;
  }

  /**
   * Send a request and get a response
   */
  private async sendRequest<T = any>(message: any): Promise<T> {
    if (!message.id) {
      message.id = this.generateId();
    }

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.requestMap.delete(message.id);
        reject(new Error(`Request timeout after ${this.responseTimeout}ms`));
      }, this.responseTimeout);

      this.requestMap.set(message.id, { resolve, reject, timer });

      try {
        this.transport.send(message);
      } catch (error) {
        clearTimeout(timer);
        this.requestMap.delete(message.id);
        reject(error);
      }
    });
  }

  /**
   * Handle an incoming message
   */
  private handleMessage(message: any): void {
    // Check if this is a response to a pending request
    if (message.id && this.requestMap.has(message.id)) {
      const { resolve, reject, timer } = this.requestMap.get(message.id)!;
      clearTimeout(timer);
      this.requestMap.delete(message.id);

      if (message.type.endsWith('_error')) {
        reject(new Error(message.error || 'Unknown error'));
      } else {
        resolve(message);
      }
      return;
    }

    // Otherwise, emit an event based on the message type
    this.emit(message.type, message);
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
} 