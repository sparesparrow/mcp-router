/**
 * WebSocket Service Interface
 * Defines the contract for WebSocket communication services.
 */

export type EventHandler = (data: any) => void;
export type UnsubscribeFunction = () => void;

export interface IWebSocketService {
  /**
   * Connects to the WebSocket server
   * @returns A promise that resolves when connection is established
   */
  connect(): Promise<void>;

  /**
   * Disconnects from the WebSocket server
   * @returns A promise that resolves when disconnection is complete
   */
  disconnect(): Promise<void>;

  /**
   * Emits an event to the server
   * @param event The event name
   * @param data The event data
   */
  emit(event: string, data: any): void;

  /**
   * Registers a handler for a specific event
   * @param event The event name
   * @param handler The event handler function
   * @returns A function to unsubscribe the handler
   */
  on(event: string, handler: EventHandler): UnsubscribeFunction;

  /**
   * Removes a handler for a specific event
   * @param event The event name
   * @param handler The event handler function to remove
   */
  off(event: string, handler: EventHandler): void;

  /**
   * Checks if the socket is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean;
}
