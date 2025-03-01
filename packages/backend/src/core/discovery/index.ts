import { ServerRegistration } from '../types/router';
import { Logger } from '../utils/logger';
import fetch from 'node-fetch';
import * as os from 'os';

const logger = new Logger('Discovery');

/**
 * Base interface for server discovery services
 */
export interface DiscoveryService {
  /**
   * Discover available MCP servers
   * @returns Promise resolving to array of server registrations
   */
  discoverServers(): Promise<ServerRegistration[]>;
  
  /**
   * Start discovery service
   */
  start(): Promise<void>;
  
  /**
   * Stop discovery service
   */
  stop(): Promise<void>;
}

/**
 * Discovery service for MCP servers running in Podman containers
 */
export class PodmanDiscoveryService implements DiscoveryService {
  private podmanUrl: string;
  private isRunning: boolean;
  private pollingInterval: NodeJS.Timeout | null;
  private onServerDiscovered: (server: ServerRegistration) => void;
  
  /**
   * Create a new Podman discovery service
   * @param onServerDiscovered Callback function when a server is discovered
   * @param pollIntervalMs How often to poll for servers (in milliseconds)
   * @param podmanUrl URL for the Podman API
   */
  constructor(
    onServerDiscovered: (server: ServerRegistration) => void,
    private pollIntervalMs: number = 30000,
    podmanUrl?: string
  ) {
    this.onServerDiscovered = onServerDiscovered;
    this.isRunning = false;
    this.pollingInterval = null;
    this.podmanUrl = podmanUrl || this.getDefaultPodmanUrl();
  }
  
  /**
   * Start discovery service polling
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    
    // Immediate initial discovery
    try {
      await this.discoverServers();
    } catch (error) {
      logger.error(`Initial discovery failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Set up polling interval
    this.pollingInterval = setInterval(async () => {
      try {
        await this.discoverServers();
      } catch (error) {
        logger.error(`Discovery polling failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, this.pollIntervalMs);
    
    logger.info(`Podman discovery service started (polling every ${this.pollIntervalMs}ms)`);
  }
  
  /**
   * Stop discovery service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.isRunning = false;
    logger.info('Podman discovery service stopped');
  }
  
  /**
   * Discover MCP servers in Podman containers
   */
  async discoverServers(): Promise<ServerRegistration[]> {
    const discoveredServers: ServerRegistration[] = [];
    
    try {
      // Get list of containers
      const response = await fetch(`${this.podmanUrl}/containers/json?all=true`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch containers: ${response.statusText}`);
      }
      
      const containers = await response.json() as any[];
      
      // Find containers with MCP label
      const mcpContainers = containers.filter(container => {
        const labels = container.Labels || {};
        return labels['mcp.server'] === 'true';
      });
      
      for (const container of mcpContainers) {
        try {
          const serverRegistration = this.createServerRegistration(container);
          discoveredServers.push(serverRegistration);
          this.onServerDiscovered(serverRegistration);
        } catch (error) {
          logger.error(
            `Error creating server registration for container ${container.Id}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    } catch (error) {
      logger.error(`Error discovering servers: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
    
    return discoveredServers;
  }
  
  /**
   * Create a server registration from a container
   */
  private createServerRegistration(container: any): ServerRegistration {
    const labels = container.Labels || {};
    const name = labels['mcp.name'] || container.Names[0].replace(/^\//, '');
    const port = parseInt(labels['mcp.port'] || '8080', 10);
    const protocol = labels['mcp.protocol'] || 'http';
    
    // Get container IP - this is simplified, you might need more complex logic
    // depending on networking setup
    let host;
    
    if (container.NetworkSettings && container.NetworkSettings.IPAddress) {
      host = container.NetworkSettings.IPAddress;
    } else {
      // Fallback to localhost if container IP not available
      host = 'localhost';
    }
    
    const url = `${protocol}://${host}:${port}`;
    
    return {
      id: container.Id.substring(0, 12),
      name,
      url,
      metadata: {
        type: 'podman',
        containerId: container.Id,
        labels
      }
    };
  }
  
  /**
   * Get default Podman socket URL based on OS
   */
  private getDefaultPodmanUrl(): string {
    const platform = os.platform();
    
    if (platform === 'linux') {
      return 'http://d/v4.0.0'; // Podman socket is typically unix:///run/podman/podman.sock
    } else if (platform === 'darwin' || platform === 'win32') {
      return 'http://localhost:8080/v4.0.0'; // Default for Podman Machine
    }
    
    return 'http://localhost:8080/v4.0.0'; // Default fallback
  }
} 