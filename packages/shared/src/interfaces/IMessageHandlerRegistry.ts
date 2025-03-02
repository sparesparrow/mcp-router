/**
 * Interface for registering message method handlers
 */
import { Message, Response } from '../types/mcp';

export interface MessageMethodHandler {
  handle(message: Message): Promise<Response>;
}

export interface IMessageHandlerRegistry {
  /**
   * Registers a handler for a specific message method
   */
  registerHandler(method: string, handler: MessageMethodHandler): void;
  
  /**
   * Gets a handler for a specific message method
   */
  getHandler(method: string): MessageMethodHandler | undefined;
}
