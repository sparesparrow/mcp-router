/**
 * Handler for handshake messages
 */
import { Message, Response, MCPError } from '../types/mcp';
import { MessageMethodHandler } from '../interfaces/IMessageHandlerRegistry';
import { ClientRegistry } from '../registry/ClientRegistry';

export class HandshakeHandler implements MessageMethodHandler {
  constructor(
    private clientRegistry: ClientRegistry,
    private serverName: string = "MCPServer",
    private serverVersion: string = "1.0.0",
    private supportedCapabilities: string[] = ["handshake", "tools/list"]
  ) {}
  
  /**
   * Handles a handshake message
   */
  async handle(message: Message): Promise<Response> {
    const { name, version, capabilities } = message.params || {};
    
    if (!name || !version || !capabilities) {
      throw new MCPError("invalid_params", "Missing required handshake parameters");
    }

    // Store client information
    this.clientRegistry.registerClient(message.id, {
      id: message.id,
      name,
      version,
      capabilities
    });

    return {
      id: message.id,
      success: true,
      result: {
        status: "handshake_ok",
        serverName: this.serverName,
        version: this.serverVersion,
        supportedCapabilities: this.supportedCapabilities
      }
    };
  }
}
