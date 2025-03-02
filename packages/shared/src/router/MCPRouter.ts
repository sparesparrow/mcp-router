/**
 * Router for MCP requests
 */
import { EventEmitter } from 'events';
import { Message, Response, ServerInfo } from '../types/mcp';
import { IRouter } from '../interfaces/IRouter';
import { IServerRegistry } from '../interfaces/IServerRegistry';
import { Logger } from '../utils/Logger';
import { MCPClientCore } from '../client/MCPClientCore';
import { InMemoryTransport } from '../transport/InMemoryTransport';
import { ConnectionManager } from '../client/ConnectionManager';
import { ResponseHandler } from '../client/ResponseHandler';
import { ServerRegistry } from '../registry/ServerRegistry';

// Map of server ID to client
type ClientMap = Map<string, MCPClientCore>;

export class MCPRouter extends EventEmitter implements IRouter {
  private clients: ClientMap = new Map();
  private logger: Logger;
  
  constructor(
    private serverRegistry: IServerRegistry = new ServerRegistry(),
    logger?: Logger
  ) {
    super();
    this.logger = logger || new Logger('MCPRouter');
  }

  /**
   * Connects to a server by ID
   */
  async connectToServer(serverId: string): Promise<void> {
    const server = this.serverRegistry.getServer(serverId);
    if (!server) {
      throw new Error(`Server not found: ${serverId}`);
    }

    if (this.clients.has(serverId)) {
      this.logger.debug(`Already connected to server ${serverId}, ignoring connect request`);
      return;
    }

    try {
      this.logger.info(`Connecting to server ${serverId}`);
      
      // Create transport and client
      const transport = new InMemoryTransport(this.logger);
      const connectionManager = new ConnectionManager(transport, this.logger);
      const responseHandler = new ResponseHandler(this.logger);
      
      const client = new MCPClientCore(
        transport,
        connectionManager,
        responseHandler,
        {
          name: "MCPRouter",
          version: "1.0.0",
          capabilities: ["handshake", "tools/list"]
        },
        this.logger
      );

      // Connect the client
      await client.connect();
      
      // Store the client
      this.clients.set(serverId, client);
      
      // Update server status
      if (this.serverRegistry instanceof ServerRegistry) {
        (this.serverRegistry as ServerRegistry).updateConnectionStatus(serverId, true);
      }
      
      // Emit event
      this.emit('server:connected', serverId);
      
      this.logger.info(`Connected to server ${serverId}`);
    } catch (error) {
      this.logger.error(`Failed to connect to server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
      this.emit('server:connection-error', serverId, error);
      throw error;
    }
  }

  /**
   * Disconnects from a server by ID
   */
  async disconnectFromServer(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    if (!client) {
      this.logger.debug(`No connection to server ${serverId}, ignoring disconnect request`);
      return;
    }

    try {
      this.logger.info(`Disconnecting from server ${serverId}`);
      
      // Disconnect the client
      await client.disconnect();
      
      // Remove the client
      this.clients.delete(serverId);
      
      // Update server status
      if (this.serverRegistry instanceof ServerRegistry) {
        (this.serverRegistry as ServerRegistry).updateConnectionStatus(serverId, false);
      }
      
      // Emit event
      this.emit('server:disconnected', serverId);
      
      this.logger.info(`Disconnected from server ${serverId}`);
    } catch (error) {
      this.logger.error(`Failed to disconnect from server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Checks if a server is connected
   */
  isServerConnected(serverId: string): boolean {
    return this.clients.has(serverId);
  }

  /**
   * Forwards a request to a server
   */
  async forwardRequest(serverId: string, request: Message): Promise<Response> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Not connected to server ${serverId}`);
    }

    this.logger.debug(`Forwarding request to server ${serverId}: ${request.method}`);
    
    try {
      // This is a simplified example - a real implementation would need more logic
      // to forward the request through the client to the server
      const response = await client.handleMessage(request);
      return response;
    } catch (error) {
      this.logger.error(`Error forwarding request to server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Gets the capabilities of a server
   */
  async getServerCapabilities(serverId: string): Promise<string[]> {
    const server = this.serverRegistry.getServer(serverId);
    if (!server) {
      throw new Error(`Server not found: ${serverId}`);
    }

    return server.capabilities;
  }

  /**
   * Gets all registered servers
   */
  getAllServers(): ServerInfo[] {
    return this.serverRegistry.getAllServers();
  }

  /**
   * Gets a specific server by ID
   */
  getServer(serverId: string): ServerInfo | undefined {
    return this.serverRegistry.getServer(serverId);
  }
}
