/**
 * Interface for sending messages
 */
import { Message } from '../types/mcp';

export interface IMessageSender {
  /**
   * Sends a message
   */
  sendMessage(message: Message): Promise<void>;
}
