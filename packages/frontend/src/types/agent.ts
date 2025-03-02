/**
 * Agent type definitions for the frontend
 * This is a temporary solution until the shared package is properly integrated
 */

// Agent Node Types - define locally instead of importing from @mcp-router/shared
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

// Base node interface
export interface AgentNode {
  id: string;
  type: AgentNodeType;
  label: string;
  data?: Record<string, any>;
  position?: { x: number; y: number };
}

// Connection between nodes
export interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

// Complete workflow definition
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: AgentNode[];
  edges: Edge[];
  version?: string;
  created?: string;
  updated?: string;
  author?: string;
} 