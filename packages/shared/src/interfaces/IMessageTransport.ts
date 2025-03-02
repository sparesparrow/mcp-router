/**
 * Combined transport interface for messaging
 */
import { ITransport } from './ITransport';
import { IMessageSender } from './IMessageSender';
import { IMessageReceiver } from './IMessageReceiver';

export interface IMessageTransport extends ITransport, IMessageSender, IMessageReceiver {
  // This interface combines the functionality of the above interfaces
}
