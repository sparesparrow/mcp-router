import { Message, Response, MCPError } from '../types/mcp';
import { IMessageTransport } from '../interfaces/IMessageTransport';
import { IMessageHandler } from '../interfaces/IMessageHandler';

export class LocalTransport implements IMessageTransport {
  // The messageHandler simulates the recipient
  private messageHandler: IMessageHandler | null = null;

  async connect(): Promise<void> {
    // Simulate async connection setup
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async disconnect(): Promise<void> {
    // Simulate async disconnection
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async sendMessage(message: Message): Promise<void> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (!this.messageHandler) {
      throw new Error("No message handler registered");
    }
    
    await this.messageHandler.handleMessage(message);
  }

  onMessage(handler: IMessageHandler): void {
    // Set the message handler
    this.messageHandler = handler;
  }
} 