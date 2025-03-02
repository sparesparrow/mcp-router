/**
 * Factory for creating client instances
 */
import { MCPClientCore } from '../client/MCPClientCore';
import { InMemoryTransport } from '../transport/InMemoryTransport';
import { ConnectionManager } from '../client/ConnectionManager';
import { ResponseHandler } from '../client/ResponseHandler';
import { ClientConfig } from '../types/mcp';
import { Logger } from '../utils/Logger';

export class ClientFactory {
  /**
   * Creates a standard MCP client with in-memory transport
   */
  static createStandardClient(config: ClientConfig, logger?: Logger): MCPClientCore {
    // Create transport and related components
    const transport = new InMemoryTransport(logger);
    const connectionManager = new ConnectionManager(transport, logger);
    const responseHandler = new ResponseHandler(logger);
    
    // Create client logger
    const clientLogger = logger || new Logger('MCPClient');
    
    // Create client
    return new MCPClientCore(
      transport,
      connectionManager,
      responseHandler,
      config,
      clientLogger
    );
  }
}
