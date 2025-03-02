/**
 * Types index file
 * Re-exports all types to use as a replacement for @mcp-router/shared
 */

// Export agent types
export * from './agent';

// Export MCP types
export * from './mcp';

// Add service types
export enum ServiceType {
  AI = 'ai',
  AUDIO = 'audio',
  WEBSOCKET = 'websocket',
  TOOLS = 'tools',
  WORKFLOWS = 'workflows'
}

// Add service config
export interface ServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

// Mock other needed types
export interface MCPInfoResponse {
  version: string;
  status: string;
  server_info: {
    name: string;
    uptime: number;
    services: string[];
  };
}

export interface Violation {
  principle: string;
  message: string;
  location?: {
    line: number;
    column: number;
  };
  code?: string;
} 