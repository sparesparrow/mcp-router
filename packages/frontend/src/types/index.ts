/**
 * Types index file
 * Re-exports all types to use as a replacement for @mcp-router/shared
 */

// Export agent types - use named imports to avoid conflicts
import type { AgentNodeType as AgentNodeTypeFromAgent, AgentNode, Edge, Workflow } from './agent';

// Export MCP types - use named imports to avoid conflicts
import type { 
  MCPMessage, 
  MCPError, 
  MCPResponse, 
  Tool, 
  ToolResult, 
  MCPConfig,
  MCPConnectionInfo,
  MCPServerStatus,
  MCPToolMetrics,
  MCPSystemMetrics,
  MCPWorkflowAnalysis,
  MCPCodeAnalysis,
  MCPNetworkInfo
} from './mcp';
import { ConnectionState, AgentNodeType as AgentNodeTypeFromMCP } from './mcp';

// Re-export agent types
export type { AgentNode, Edge, Workflow };
export { AgentNodeTypeFromAgent as AgentNodeType }; // Rename to avoid conflict

// Re-export MCP types
export type { 
  MCPMessage, 
  MCPError, 
  MCPResponse, 
  Tool, 
  ToolResult, 
  MCPConfig,
  MCPConnectionInfo,
  MCPServerStatus,
  MCPToolMetrics,
  MCPSystemMetrics,
  MCPWorkflowAnalysis,
  MCPCodeAnalysis,
  MCPNetworkInfo
};
export { ConnectionState };
// Export AgentNodeType from MCP with an alias if needed
// export { AgentNodeTypeFromMCP as MCPAgentNodeType };

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