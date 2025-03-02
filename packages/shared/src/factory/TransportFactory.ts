/**
 * Factory for creating transport instances
 */
import { InMemoryTransport } from '../transport/InMemoryTransport';
import { IMessageTransport } from '../interfaces/IMessageTransport';
import { IMessageHandler } from '../interfaces/IMessageHandler';
import { Logger } from '../utils/Logger';

export class TransportFactory {
  /**
   * Creates an in-memory transport with a message handler
   */
  static createInMemoryTransport(handler?: IMessageHandler, logger?: Logger): InMemoryTransport {
    const transport = new InMemoryTransport(logger);
    
    if (handler) {
      transport.onMessage(handler);
    }
    
    return transport;
  }
}
