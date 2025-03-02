/**
 * Core server implementation for MCP
 */
import { Message, Response, MCPError } from '../types/mcp';
import { IMessageHandler } from '../interfaces/IMessageHandler';
import { IMessageHandlerRegistry } from '../interfaces/IMessageHandlerRegistry';
import { Logger } from '../utils/Logger';

export class MCPServerCore implements IMessageHandler {
  constructor(
    private handlerRegistry: IMessageHandlerRegistry,
    private logger: Logger
  ) {}
  
  /**
   * Handles an incoming message
   */
  async handleMessage(message: Message): Promise<Response> {
    try {
      this.logger.debug(`Handling message: ${message.method}`);
      
      if (!message.method) {
        throw new MCPError("invalid_request", "Message is missing 'method' property");
      }
      
      const handler = this.handlerRegistry.getHandler(message.method);
      
      if (!handler) {
        throw new MCPError("method_not_found", `Unknown method: ${message.method}`);
      }
      
      return await handler.handle(message);
    } catch (error) {
      this.logger.error(`Error handling message: ${error instanceof Error ? error.message : String(error)}`);
      
      if (error instanceof MCPError) {
        return { id: message.id, success: false, error };
      } else {
        const mcpError = new MCPError(
          "internal_error",
          "Internal server error",
          error instanceof Error ? error.message : String(error)
        );
        return { id: message.id, success: false, error: mcpError };
      }
    }
  }
}
