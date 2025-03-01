/**
 * Simplified agent types for the MCP Router
 * This is a temporary file during restructuring
 */

// Import from local mcp.ts file
import { AgentNodeType } from './mcp';

// Basic agent configuration
export interface SimpleAgentConfig {
  id: string;
  name: string;
  description?: string;
  type: AgentNodeType;
  capabilities?: string[];
  metadata?: Record<string, any>;
}

// Basic message structure
export interface SimpleAgentMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Basic response structure
export interface SimpleAgentResponse {
  id: string;
  requestId: string;
  agentId: string;
  content: string;
  timestamp: number;
  status: 'success' | 'error' | 'pending';
  metadata?: Record<string, any>;
}

// Basic registry interface
export interface SimpleAgentRegistry {
  registerAgent: (config: SimpleAgentConfig) => Promise<void>;
  unregisterAgent: (agentId: string) => Promise<void>;
  getAgent: (agentId: string) => Promise<SimpleAgentConfig | null>;
  listAgents: () => Promise<SimpleAgentConfig[]>;
}

// Export temporary simplified types
export {
  SimpleAgentConfig,
  SimpleAgentMessage,
  SimpleAgentResponse,
  SimpleAgentRegistry
}; 