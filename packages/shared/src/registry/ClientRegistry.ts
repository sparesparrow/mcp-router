/**
 * Registry for client information
 */
import { ClientInfo } from '../types/mcp';

export class ClientRegistry {
  private clients: Map<string, ClientInfo> = new Map();
  
  /**
   * Registers a client
   */
  registerClient(id: string, info: ClientInfo): void {
    this.clients.set(id, info);
  }
  
  /**
   * Gets a client by ID
   */
  getClient(id: string): ClientInfo | undefined {
    return this.clients.get(id);
  }
  
  /**
   * Gets all registered clients
   */
  getAllClients(): ClientInfo[] {
    return Array.from(this.clients.values());
  }
  
  /**
   * Removes a client by ID
   */
  removeClient(id: string): boolean {
    return this.clients.delete(id);
  }
}
