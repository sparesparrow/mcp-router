/**
 * MCP types for the MCP Router
 * This is a simplified version during restructuring
 */

import { MCPError } from './errors';

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
  close?(): Promise<void>;
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

// Re-export the MCPError class
export { MCPError }; 