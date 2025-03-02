/**
 * Registry for server information
 */
import { ServerInfo } from '../types/mcp';
import { IServerRegistry } from '../interfaces/IServerRegistry';

export class ServerRegistry implements IServerRegistry {
  private servers: Map<string, ServerInfo> = new Map();
  
  /**
   * Registers a server
   */
  registerServer(id: string, info: ServerInfo): void {
    this.servers.set(id, info);
  }
  
  /**
   * Gets a server by ID
   */
  getServer(id: string): ServerInfo | undefined {
    return this.servers.get(id);
  }
  
  /**
   * Gets all registered servers
   */
  getAllServers(): ServerInfo[] {
    return Array.from(this.servers.values());
  }
  
  /**
   * Removes a server by ID
   */
  removeServer(id: string): boolean {
    return this.servers.delete(id);
  }
  
  /**
   * Updates a server's connection status
   */
  updateConnectionStatus(id: string, isConnected: boolean): boolean {
    const server = this.servers.get(id);
    if (server) {
      server.isConnected = isConnected;
      this.servers.set(id, server);
      return true;
    }
    return false;
  }
}
