/**
 * Manages connection state for a client
 */
import { IConnectionManager } from '../interfaces/IConnectionManager';
import { ITransport } from '../interfaces/ITransport';
import { Logger } from '../utils/Logger';

export class ConnectionManager implements IConnectionManager {
  private connected: boolean = false;
  private logger: Logger;
  
  constructor(
    private transport: ITransport,
    logger?: Logger
  ) {
    this.logger = logger || new Logger('ConnectionManager');
  }

  /**
   * Connects to the transport
   */
  async connect(): Promise<void> {
    if (this.connected) {
      this.logger.debug('Already connected, ignoring connect request');
      return;
    }

    try {
      this.logger.debug('Connecting to transport');
      await this.transport.connect();
      this.connected = true;
      this.logger.info('Connected to transport');
    } catch (error) {
      this.logger.error(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Disconnects from the transport
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      this.logger.debug('Not connected, ignoring disconnect request');
      return;
    }

    try {
      this.logger.debug('Disconnecting from transport');
      await this.transport.disconnect();
      this.connected = false;
      this.logger.info('Disconnected from transport');
    } catch (error) {
      this.logger.error(`Disconnection failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Returns the current connection state
   */
  isConnected(): boolean {
    return this.connected;
  }
}
