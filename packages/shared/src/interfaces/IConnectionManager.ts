/**
 * Interface for managing connections
 */
export interface IConnectionManager {
  /**
   * Establishes a connection
   */
  connect(): Promise<void>;
  
  /**
   * Closes a connection
   */
  disconnect(): Promise<void>;
  
  /**
   * Returns the current connection state
   */
  isConnected(): boolean;
}
