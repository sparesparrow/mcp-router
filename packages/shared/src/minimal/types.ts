/**
 * Minimal types for the MCP Router
 * This is a temporary file during restructuring
 */

/**
 * MCP Error class for standardized error handling
 */
export class MCPError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Common error codes
 */
export enum ErrorCode {
  INTERNAL_ERROR = 'internal_error',
  INVALID_PARAMS = 'invalid_params',
  METHOD_NOT_FOUND = 'method_not_found',
  NO_HANDLER = 'no_handler',
  CONNECTION_ERROR = 'connection_error',
  TIMEOUT = 'timeout',
  UNAUTHORIZED = 'unauthorized',
  NOT_FOUND = 'not_found',
  VALIDATION_ERROR = 'validation_error'
}

/**
 * Agent Node Types
 */
export enum AgentNodeType {
  LLM = 'llm',
  TOOL = 'tool',
  RESOURCE = 'resource',
  ROUTER = 'router',
  PARALLEL = 'parallel',
  ORCHESTRATOR = 'orchestrator',
  EVALUATOR = 'evaluator',
  INPUT = 'input',
  OUTPUT = 'output',
  CONDITION = 'condition',
}

/**
 * Basic message structure
 */
export interface Message {
  id: string;
  method?: string;
  params?: any;
  [key: string]: any;
}

/**
 * Basic response structure
 */
export interface Response {
  id: string;
  success: boolean;
  result?: any;
  error?: MCPError;
}

/**
 * Transport interface for communication
 */
export interface Transport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: Message): Promise<void>;
  onMessage(handler: (msg: Message) => Promise<Response>): void;
}

/**
 * Client configuration
 */
export interface ClientConfig {
  name: string;
  version: string;
  capabilities?: string[];
  [key: string]: any;
}

/**
 * Basic agent configuration
 */
export interface SimpleAgentConfig {
  id: string;
  name: string;
  description?: string;
  type: AgentNodeType;
  capabilities?: string[];
  metadata?: Record<string, any>;
}

/**
 * Basic message structure
 */
export interface SimpleAgentMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Basic response structure
 */
export interface SimpleAgentResponse {
  id: string;
  requestId: string;
  agentId: string;
  content: string;
  timestamp: number;
  status: 'success' | 'error' | 'pending';
  metadata?: Record<string, any>;
}

/**
 * Basic registry interface
 */
export interface SimpleAgentRegistry {
  registerAgent: (config: SimpleAgentConfig) => Promise<void>;
  unregisterAgent: (agentId: string) => Promise<void>;
  getAgent: (agentId: string) => Promise<SimpleAgentConfig | null>;
  listAgents: () => Promise<SimpleAgentConfig[]>;
} 