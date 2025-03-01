import { Message, Response, MCPError } from '../types/mcp';

export class MCPServer {
  private clients: Map<string, any> = new Map();

  async handleMessage(message: Message): Promise<Response> {
    try {
      switch (message.method) {
        case "handshake":
          return this.handleHandshake(message);
        case "tools/list":
          return this.handleToolsList(message);
        default:
          throw new MCPError("method_not_found", `Unknown method: ${message.method}`);
      }
    } catch (error) {
      if (error instanceof MCPError) {
        return { id: message.id, success: false, error };
      } else {
        const mcpError = new MCPError("internal_error", "Internal server error");
        return { id: message.id, success: false, error: mcpError };
      }
    }
  }

  private async handleHandshake(message: Message): Promise<Response> {
    const { name, version, capabilities } = message.params || {};
    
    if (!name || !version || !capabilities) {
      throw new MCPError("invalid_params", "Missing required handshake parameters");
    }

    // Store client information
    this.clients.set(message.id, { name, version, capabilities });

    return {
      id: message.id,
      success: true,
      result: {
        status: "handshake_ok",
        serverName: "MCPServer",
        version: "1.0.0",
        supportedCapabilities: ["handshake", "tools/list"]
      }
    };
  }

  private async handleToolsList(message: Message): Promise<Response> {
    // Example tools list - in a real implementation, this would be dynamic
    return {
      id: message.id,
      success: true,
      result: {
        tools: [
          {
            id: "screenshot",
            name: "Screenshot Tool",
            description: "Captures screen content"
          },
          {
            id: "clipboard",
            name: "Clipboard Tool",
            description: "Manages clipboard operations"
          }
        ]
      }
    };
  }
} 