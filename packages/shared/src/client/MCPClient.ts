import { Transport, Message, Response, ClientConfig, MCPError } from '../types/mcp';

export class MCPClient {
  private isConnected: boolean = false;
  private messageHandlers: Map<string, (response: Response) => void> = new Map();
  private pendingRequests: Map<string, { resolve: (value: Response) => void, reject: (reason: any) => void }> = new Map();

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
      this.pendingRequests.clear();
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

    return this.sendAndWaitForResponse(message);
  }

  private async sendRequest(method: string, params?: any): Promise<Response> {
    const message: Message = {
      id: this.generateId(),
      method,
      params
    };

    return this.sendAndWaitForResponse(message);
  }

  private async sendAndWaitForResponse(message: Message): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(message.id, { resolve, reject });
      this.transport.send(message).catch(err => {
        this.pendingRequests.delete(message.id);
        reject(err);
      });
    });
  }

  private setupMessageHandling(): void {
    this.transport.onMessage(async (message: Message): Promise<Response> => {
      const response = message as unknown as Response;
      const pendingRequest = this.pendingRequests.get(response.id);
      if (pendingRequest) {
        pendingRequest.resolve(response);
        this.pendingRequests.delete(response.id);
      }
      
      const handler = this.messageHandlers.get(response.id);
      if (handler) {
        handler(response);
        this.messageHandlers.delete(response.id);
      }
      
      // Return a response since the interface requires it
      return {
        id: message.id,
        success: true,
        result: { status: 'message_received' }
      };
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
} 