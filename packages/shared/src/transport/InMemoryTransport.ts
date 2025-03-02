/**
 * In-memory transport implementation
 */
import { Message, Response, MCPError } from '../types/mcp';
import { IMessageTransport } from '../interfaces/IMessageTransport';
import { IMessageHandler } from '../interfaces/IMessageHandler';
import { Logger } from '../utils/Logger';

export class InMemoryTransport implements IMessageTransport {
  private messageHandler: IMessageHandler | null = null;
  private logger: Logger;
  
  constructor(logger?: Logger) {
    this.logger = logger || new Logger('InMemoryTransport');
  }

  /**
   * Simulates connecting to a remote endpoint
   */
  async connect(): Promise<void> {
    this.logger.debug('Connecting to in-memory transport');
    // Simulate async connection setup
    await new Promise(resolve => setTimeout(resolve, 100));
    this.logger.debug('Connected to in-memory transport');
  }

  /**
   * Simulates disconnecting from a remote endpoint
   */
  async disconnect(): Promise<void> {
    this.logger.debug('Disconnecting from in-memory transport');
    // Simulate async disconnection
    await new Promise(resolve => setTimeout(resolve, 100));
    this.logger.debug('Disconnected from in-memory transport');
  }

  /**
   * Sends a message to the registered message handler
   */
  async sendMessage(message: Message): Promise<void> {
    this.logger.debug(`Sending message: ${message.method || 'unknown'}`);
    
    if (!this.messageHandler) {
      throw new Error("No message handler registered");
    }
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 50));
    await this.messageHandler.handleMessage(message);
  }

  /**
   * Registers a handler for incoming messages
   */
  onMessage(handler: IMessageHandler): void {
    this.logger.debug('Registering message handler');
    this.messageHandler = handler;
  }
}
