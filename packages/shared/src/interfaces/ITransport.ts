/**
 * Base transport interface for connection functionality
 */
export interface ITransport {
  /**
   * Establishes a connection
   */
  connect(): Promise<void>;
  
  /**
   * Closes a connection
   */
  disconnect(): Promise<void>;
}
