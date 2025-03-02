/**
 * Factory for creating properly formatted messages
 */
import { Message } from '../types/mcp';
import { IdGenerator } from '../utils/IdGenerator';

export class MessageFactory {
  /**
   * Creates a generic message with the specified method and parameters
   */
  static createMessage(method: string, params?: any): Message {
    return {
      id: IdGenerator.generateUUID(),
      method,
      params
    };
  }

  /**
   * Creates a handshake message
   */
  static createHandshakeMessage(name: string, version: string, capabilities: string[] = []): Message {
    return this.createMessage('handshake', {
      name,
      version,
      capabilities
    });
  }

  /**
   * Creates a tools/list message
   */
  static createToolsListMessage(): Message {
    return this.createMessage('tools/list');
  }
}
