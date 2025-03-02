/**
 * Connection Service Interface
 * Defines the contract for services that manage connection state.
 */

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

export type ConnectionStatusHandler = (status: ConnectionStatus) => void;

export interface IConnectionService {
  /**
   * Connects to the MCP server
   * @returns A promise that resolves when connection is established
   */
  connect(): Promise<void>;
  
  /**
   * Disconnects from the MCP server
   * @returns A promise that resolves when disconnection is complete
   */
  disconnect(): Promise<void>;
  
  /**
   * Checks if connected to the MCP server
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean;
  
  /**
   * Gets the current connection status
   * @returns The current ConnectionStatus
   */
  getConnectionStatus(): ConnectionStatus;
  
  /**
   * Registers a handler for connection status changes
   * @param handler Function to call when connection status changes
   * @returns Function to unregister the handler
   */
  onStatusChange(handler: ConnectionStatusHandler): () => void;
}
