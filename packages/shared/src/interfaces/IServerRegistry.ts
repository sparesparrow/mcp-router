/**
 * Interface for server registry
 */
import { ServerInfo } from '../types/mcp';

export interface IServerRegistry {
  /**
   * Registers a server
   */
  registerServer(id: string, server: ServerInfo): void;
  
  /**
   * Gets a server by ID
   */
  getServer(id: string): ServerInfo | undefined;
  
  /**
   * Gets all registered servers
   */
  getAllServers(): ServerInfo[];
  
  /**
   * Removes a server by ID
   */
  removeServer(id: string): boolean;
}
