/**
 * Interface for message handlers
 */
import { Message, Response } from '../types/mcp';

export interface IMessageHandler {
  /**
   * Handles a message and returns a response
   */
  handleMessage(message: Message): Promise<Response>;
}
