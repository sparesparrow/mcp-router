import { Transport, Message, Response, ClientConfig, MCPError } from '../types/mcp';

export class MCPClient {
  private isConnected: boolean = false;
  private messageHandlers: Map<string, (response: Response) => void> = new Map();

  constructor(private transport: Transport, private config: ClientConfig) {}

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.transport.connect();
      const handshakeResponse = await this.sendHandshake();
      
      if (handshakeResponse.error) {
        throw new Error(`Handshake failed: ${handshakeResponse.error.message}`);
      }

      this.isConnected = true;
      this.setupMessageHandling();
      console.log("Connected to MCP server:", handshakeResponse.result);
    } catch (error) {
      console.error("Connection failed:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.transport.close();
      this.isConnected = false;
      this.messageHandlers.clear();
    } catch (error) {
      console.error("Disconnection failed:", error);
      throw error;
    }
  }

  async listTools(): Promise<any> {
    if (!this.isConnected) {
      throw new Error("Not connected to MCP server");
    }

    const response = await this.sendRequest("tools/list");
    return response.result;
  }

  private async sendHandshake(): Promise<Response> {
    const message: Message = {
      id: this.generateId(),
      method: "handshake",
      params: {
        name: this.config.name,
        version: this.config.version,
        capabilities: this.config.capabilities
      }
    };

    return await this.transport.send(message);
  }

  private async sendRequest(method: string, params?: any): Promise<Response> {
    const message: Message = {
      id: this.generateId(),
      method,
      params
    };

    return await this.transport.send(message);
  }

  private setupMessageHandling(): void {
    this.transport.onMessage((message: Message) => {
      const handler = this.messageHandlers.get(message.id);
      if (handler) {
        handler(message as Response);
        this.messageHandlers.delete(message.id);
      }
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
} 