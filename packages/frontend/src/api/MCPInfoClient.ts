/**
 * MCP Info Client for the MCP Router API
 */
import { MCPInfoResponse, ServiceConfig } from '@mcp-router/shared';
import { HttpClient } from './HttpClient';

export class MCPInfoClient {
  private client: HttpClient;

  constructor(config: ServiceConfig) {
    this.client = new HttpClient(config);
  }

  /**
   * Get information about available MCP services
   */
  async getInfo(): Promise<MCPInfoResponse> {
    return this.client.get<MCPInfoResponse>('/info');
  }
} 