/**
 * Registry for message method handlers
 */
import { IMessageHandlerRegistry, MessageMethodHandler } from '../interfaces/IMessageHandlerRegistry';

export class MessageHandlerRegistry implements IMessageHandlerRegistry {
  private handlers: Map<string, MessageMethodHandler> = new Map();
  
  /**
   * Registers a handler for a specific message method
   */
  registerHandler(method: string, handler: MessageMethodHandler): void {
    this.handlers.set(method, handler);
  }
  
  /**
   * Gets a handler for a specific message method
   */
  getHandler(method: string): MessageMethodHandler | undefined {
    return this.handlers.get(method);
  }
}
