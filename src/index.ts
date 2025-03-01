import { MCPRouter } from './core/router';
import { WebServer } from './web/server';
import { PodmanDiscoveryService } from './core/discovery';
import { ServerRegistration, RouterConfig } from './types/router';
import { Logger } from './utils/logger';
import config from 'config';

// Initialize logger
const logger = new Logger('App');

/**
 * Main application function
 */
async function main(): Promise<void> {
  try {
    logger.info('Starting MCP Router');
    
    // Create the MCP Router
    const router = new MCPRouter();
    
    // Load pre-configured servers from config
    const routerConfig = config.get<RouterConfig>('router');
    
    if (routerConfig.servers && routerConfig.servers.length > 0) {
      logger.info(`Loading ${routerConfig.servers.length} pre-configured servers from config`);
      
      for (const serverConfig of routerConfig.servers) {
        router.registerServer(serverConfig);
      }
    }
    
    // Initialize discovery service if enabled
    if (routerConfig.discovery?.enabled) {
      logger.info('Initializing discovery service');
      
      const discoveryService = new PodmanDiscoveryService(
        (server: ServerRegistration) => {
          router.registerServer(server);
        },
        routerConfig.discovery.pollInterval || 30000
      );
      
      await discoveryService.start();
    }
    
    // Create and start the web server
    const webServer = new WebServer(router);
    await webServer.start();
    
    // Connect to all servers
    logger.info('Connecting to all servers...');
    await router.connectToAllServers();
    logger.info('Connected to all available servers');
    
    // Handle shutdown signals
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down...');
      await webServer.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down...');
      await webServer.stop();
      process.exit(0);
    });
    
    logger.info('MCP Router started successfully');
  } catch (error) {
    logger.error(`Error starting MCP Router: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Start the application
main(); 