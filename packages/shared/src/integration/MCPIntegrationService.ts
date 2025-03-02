/**
 * MCP Integration Service
 *
 * This service demonstrates:
 *  - A basic in-memory (local) Transport implementation
 *  - An MCPServer that handles handshake and tools/list messages
 *  - An MCPClient that connects, sends messages, and processes responses
 */

import { LoggerFactory } from '../utils/LoggerFactory';
import { ServerFactory } from '../factory/ServerFactory';
import { ClientFactory } from '../factory/ClientFactory';
import { TransportFactory } from '../factory/TransportFactory';
import { MCPServerCore } from '../server/MCPServerCore';
import { MCPClientCore } from '../client/MCPClientCore';
import { InMemoryTransport } from '../transport/InMemoryTransport';

export class MCPIntegrationService {
  private logger = LoggerFactory.createLogger('MCPIntegration');
  private server: MCPServerCore | null = null;
  private client: MCPClientCore | null = null;
  private transport: InMemoryTransport | null = null;
  
  /**
   * Initializes the integration service
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing MCP integration service');
      
      // Create server
      this.server = ServerFactory.createStandardServer(this.logger);
      
      // Create transport
      this.transport = TransportFactory.createInMemoryTransport(this.server, this.logger);
      
      // Create client
      this.client = ClientFactory.createStandardClient(
        {
          name: "ExampleClient",
          version: "1.0.0",
          capabilities: ["handshake", "tools/list"]
        },
        this.logger
      );
      
      this.logger.info('MCP integration service initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize MCP integration service: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Runs the integration
   */
  async run(): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }
      
      this.logger.info('Running MCP integration');
      
      // Connect the client
      await this.client.connect();
      
      // List available tools
      const tools = await this.client.listTools();
      this.logger.info('Available tools:', tools);
      
      // Disconnect the client
      await this.client.disconnect();
      
      this.logger.info('MCP integration completed successfully');
    } catch (error) {
      this.logger.error(`MCP integration encountered an error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Runs the integration as a standalone program
   */
  static async main(): Promise<void> {
    const integration = new MCPIntegrationService();
    
    try {
      await integration.initialize();
      await integration.run();
    } catch (error) {
      console.error("Failed to run MCP integration:", error);
      process.exit(1);
    }
  }
}

// Run the integration if this module is executed directly
if (require.main === module) {
  MCPIntegrationService.main().catch((error) => {
    console.error("Failed to run MCP integration:", error);
    process.exit(1);
  });
}
