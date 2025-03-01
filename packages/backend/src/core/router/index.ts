import { EventEmitter } from 'events';
import { ServerRegistration } from '../types/router';
import { Logger } from '../utils/logger';

// Mock implementation of the MCP SDK
class MCPTransport {
  private url: string;
  private eventEmitter: EventEmitter;

  constructor(url: string) {
    this.url = url;
    this.eventEmitter = new EventEmitter();
  }

  async connect(): Promise<void> {
    // Mock implementation
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    // Mock implementation
    return Promise.resolve();
  }

  async send(message: any): Promise<void> {
    // Mock implementation
    return Promise.resolve();
  }

  on(event: string, callback: (data: any) => void): void {
    this.eventEmitter.on(event, callback);
  }

  removeAllListeners(): void {
    this.eventEmitter.removeAllListeners();
  }
}

class MCPServer {
  private transport: MCPTransport;
  
  constructor(transport: MCPTransport) {
    this.transport = transport;
  }

  async connect(): Promise<void> {
    return this.transport.connect();
  }

  async disconnect(): Promise<void> {
    return this.transport.disconnect();
  }

  async request(request: any): Promise<any> {
    // Mock implementation
    return Promise.resolve({ result: 'mock response' });
  }

  async getCapabilities(): Promise<any> {
    // Mock implementation
    return Promise.resolve({
      version: '1.0.0',
      capabilities: ['resources', 'tools']
    });
  }
}

// Transport factory
const Transport = MCPTransport;

const logger = new Logger('MCPRouter');

/**
 * MCP Router class - responsible for managing connections to MCP servers
 * and routing requests to them
 */
export class MCPRouter extends EventEmitter {
  private registry: Map<string, ServerRegistration>;
  private connections: Map<string, MCPServer>;
  
  constructor() {
    super(); // Call EventEmitter constructor
    this.registry = new Map();
    this.connections = new Map();
    logger.info('MCP Router initialized');
  }
  
  /**
   * Register a new server
   * @param server Server registration details
   */
  registerServer(server: ServerRegistration): void {
    this.registry.set(server.id, server);
    logger.info(`Server registered: ${server.name} (${server.id})`);
    this.emit('server:registered', server.id);
  }
  
  /**
   * Unregister a server
   * @param serverId ID of server to unregister
   */
  unregisterServer(serverId: string): void {
    // Disconnect if connected
    if (this.isServerConnected(serverId)) {
      this.disconnectFromServer(serverId);
    }
    
    if (this.registry.delete(serverId)) {
      logger.info(`Server unregistered: ${serverId}`);
      this.emit('server:unregistered', serverId);
    }
  }
  
  /**
   * Get server by ID
   * @param serverId ID of server to retrieve
   */
  getServer(serverId: string): ServerRegistration | undefined {
    return this.registry.get(serverId);
  }
  
  /**
   * Get all registered servers
   */
  getAllServers(): ServerRegistration[] {
    return Array.from(this.registry.values());
  }
  
  /**
   * Get all connected servers
   */
  getConnectedServers(): string[] {
    return Array.from(this.connections.keys());
  }
  
  /**
   * Check if a server is connected
   * @param serverId ID of server to check
   */
  isServerConnected(serverId: string): boolean {
    return this.connections.has(serverId);
  }
  
  /**
   * Connect to all registered servers
   */
  async connectToAllServers(): Promise<void> {
    const servers = this.getAllServers();
    
    for (const server of servers) {
      try {
        await this.connectToServer(server.id);
      } catch (error) {
        logger.error(
          `Failed to connect to server ${server.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }
  
  /**
   * Connect to a server
   * @param serverId ID of server to connect to
   */
  async connectToServer(serverId: string): Promise<void> {
    const server = this.registry.get(serverId);
    
    if (!server) {
      const error = new Error(`Server not found: ${serverId}`);
      logger.error(error.message);
      this.emit('server:connection-error', serverId, error);
      throw error;
    }
    
    if (this.connections.has(serverId)) {
      logger.info(`Already connected to server ${server.name} (${serverId})`);
      return;
    }
    
    try {
      logger.info(`Connecting to server ${server.name} (${server.url})`);
      
      const transport = this.createTransport(server);
      const mcpServer = new MCPServer(transport);
      
      await mcpServer.connect();
      this.connections.set(serverId, mcpServer);
      
      logger.info(`Connected to server ${server.name} (${serverId})`);
      this.emit('server:connected', serverId);
    } catch (error) {
      logger.error(
        `Failed to connect to server ${server.name} (${serverId}): ${error instanceof Error ? error.message : String(error)}`
      );
      this.emit('server:connection-error', serverId, error);
      throw error;
    }
  }
  
  /**
   * Disconnect from a server
   * @param serverId ID of server to disconnect from
   */
  async disconnectFromServer(serverId: string): Promise<void> {
    const mcpServer = this.connections.get(serverId);
    const server = this.registry.get(serverId);
    
    if (!mcpServer) {
      logger.info(`Not connected to server ${serverId}`);
      return;
    }
    
    try {
      await mcpServer.disconnect();
      this.connections.delete(serverId);
      
      const serverName = server ? server.name : serverId;
      logger.info(`Disconnected from server ${serverName} (${serverId})`);
      this.emit('server:disconnected', serverId);
    } catch (error) {
      logger.error(
        `Error disconnecting from server ${serverId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
  
  /**
   * Forward a request to a connected server
   * @param serverId ID of server to forward request to
   * @param request Request to forward
   */
  async forwardRequest(serverId: string, request: any): Promise<any> {
    const mcpServer = this.connections.get(serverId);
    
    if (!mcpServer) {
      const error = `Cannot forward request to server ${serverId}: not connected`;
      logger.error(error);
      throw new Error(error);
    }
    
    try {
      return await mcpServer.request(request);
    } catch (error) {
      logger.error(
        `Error forwarding request to server ${serverId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
  
  /**
   * Get capabilities from a connected server
   * @param serverId ID of server to get capabilities from
   */
  async getServerCapabilities(serverId: string): Promise<any> {
    const mcpServer = this.connections.get(serverId);
    
    if (!mcpServer) {
      const error = `Cannot get capabilities from server ${serverId}: not connected`;
      logger.error(error);
      throw new Error(error);
    }
    
    try {
      return await mcpServer.getCapabilities();
    } catch (error) {
      logger.error(
        `Error getting capabilities from server ${serverId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
  
  /**
   * Create a transport instance for connecting to an MCP server
   * @param server Server registration details
   */
  private createTransport(server: ServerRegistration): Transport {
    // In a real implementation, this would select the transport type based on
    // the server URL or configuration, such as HTTP, WebSocket, etc.
    return new MCPTransport(server.url);
  }
} 