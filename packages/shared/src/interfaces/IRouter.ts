/**
 * Interface for the MCP Router
 */
import { Message, Response, ServerInfo } from '../types/mcp';

export interface IRouter {
  /**
   * Connects to a server by ID
   */
  connectToServer(serverId: string): Promise<void>;
  
  /**
   * Disconnects from a server by ID
   */
  disconnectFromServer(serverId: string): Promise<void>;
  
  /**
   * Checks if a server is connected
   */
  isServerConnected(serverId: string): boolean;
  
  /**
   * Forwards a request to a server
   */
  forwardRequest(serverId: string, request: Message): Promise<Response>;
  
  /**
   * Gets the capabilities of a server
   */
  getServerCapabilities(serverId: string): Promise<string[]>;
  
  /**
   * Gets all registered servers
   */
  getAllServers(): ServerInfo[];
  
  /**
   * Gets a specific server by ID
   */
  getServer(serverId: string): ServerInfo | undefined;
}
