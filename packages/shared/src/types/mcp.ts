/**
 * MCP types for the MCP Router
 * This is a simplified version during restructuring
 */

import { MCPError } from './errors';

/**
 * Transport interface for message communication
 */
export interface Transport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: Message): Promise<void>;
  onMessage(handler: (msg: Message) => Promise<Response>): void;
  close(): Promise<void>;
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
 * Server information structure
 */
export interface ServerInfo {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
  isConnected: boolean;
}

/**
 * Client information structure
 */
export interface ClientInfo {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
}

/**
 * Tool information structure
 */
export interface ToolInfo {
  id: string;
  name: string;
  description: string;
  [key: string]: any;
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