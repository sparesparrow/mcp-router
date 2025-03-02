/**
 * Interface for receiving messages
 */
import { IMessageHandler } from './IMessageHandler';

export interface IMessageReceiver {
  /**
   * Sets up a handler for incoming messages
   */
  onMessage(handler: IMessageHandler): void;
}
