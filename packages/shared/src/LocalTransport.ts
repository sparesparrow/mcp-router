import { Transport, Message, Response, MCPError } from './types/mcp';

export class LocalTransport implements Transport {
  // The messageHandler simulates the recipient (in this case, our MCPServer)
  private messageHandler: (msg: Message) => Promise<Response> = async (m: Message) => ({
    id: m.id,
    success: false,
    error: new MCPError("no_handler", "No message handler set")
  });

  async connect(): Promise<void> {
    // Simulate async connection setup
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async disconnect(): Promise<void> {
    // Simulate async disconnection
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async send(message: Message): Promise<void> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 50));
    await this.messageHandler(message);
  }

  onMessage(handler: (msg: Message) => Promise<Response>): void {
    // This example does not use an incoming message stream
    // In a real implementation, you might wire up websocket or other event callbacks here
  }

  async close(): Promise<void> {
    // Simulate async cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Allows integration to set the destination message handler
  setMessageHandler(handler: (msg: Message) => Promise<Response>): void {
    this.messageHandler = handler;
  }
} 