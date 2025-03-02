/**
 * agent-types.ts
 * TypeScript definitions for agent workflow components
 */

import { z } from 'zod';

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
 * Base Node Interface
 */
export interface NodeBase {
  id: string;
  type: AgentNodeType;
  label: string;
  description?: string;
  position: {
    x: number;
    y: number;
  };
  data?: Record<string, any>;
}

/**
 * LLM Node - Represents an LLM agent that performs reasoning
 */
export interface LLMNode extends NodeBase {
  type: AgentNodeType.LLM;
  data: {
    model: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    promptTemplate?: string;
  };
}

/**
 * Tool Node - Represents an MCP tool that can be executed
 */
export interface ToolNode extends NodeBase {
  type: AgentNodeType.TOOL;
  data: {
    serverName: string;
    toolName: string;
    inputSchema?: Record<string, any>;  // JSON Schema
    argumentMapping?: Record<string, string>;  // Maps workflow variables to tool inputs
  };
}

/**
 * Resource Node - Represents an MCP resource that can be accessed
 */
export interface ResourceNode extends NodeBase {
  type: AgentNodeType.RESOURCE;
  data: {
    serverName: string;
    uri: string;
    mimeType?: string;
  };
}

/**
 * Router Node - Implements the routing pattern
 */
export interface RouterNode extends NodeBase {
  type: AgentNodeType.ROUTER;
  data: {
    routingField: string;
    routes: Array<{
      condition: string;
      targetNodeId: string;
    }>;
    defaultTargetNodeId?: string;
  };
}

/**
 * Parallel Node - Implements the parallelization pattern
 */
export interface ParallelNode extends NodeBase {
  type: AgentNodeType.PARALLEL;
  data: {
    mode: 'section' | 'voting';
    targetNodeIds: string[];
    aggregationStrategy: 'all' | 'any' | 'majority' | 'custom';
    customAggregation?: string;  // JavaScript function as string
  };
}

/**
 * Orchestrator Node - Implements the orchestrator-workers pattern
 */
export interface OrchestratorNode extends NodeBase {
  type: AgentNodeType.ORCHESTRATOR;
  data: {
    workerTemplate?: LLMNode;
    maxWorkers?: number;
    aggregationStrategy: string;
  };
}

/**
 * Evaluator Node - Implements the evaluator-optimizer pattern
 */
export interface EvaluatorNode extends NodeBase {
  type: AgentNodeType.EVALUATOR;
  data: {
    evaluationCriteria: string[];
    maxIterations?: number;
    threshold?: number;
  };
}

/**
 * Input/Output Nodes
 */
export interface InputNode extends NodeBase {
  type: AgentNodeType.INPUT;
  data: {
    inputSchema?: Record<string, any>;  // JSON Schema
  };
}

export interface OutputNode extends NodeBase {
  type: AgentNodeType.OUTPUT;
  data: {
    outputTemplate?: string;
  };
}

/**
 * Condition Node - For branching logic
 */
export interface ConditionNode extends NodeBase {
  type: AgentNodeType.CONDITION;
  data: {
    condition: string;
    trueTargetNodeId: string;
    falseTargetNodeId: string;
  };
}

/**
 * Union type for all node types
 */
export type AgentNode = 
  | LLMNode 
  | ToolNode 
  | ResourceNode 
  | RouterNode 
  | ParallelNode 
  | OrchestratorNode 
  | EvaluatorNode 
  | InputNode 
  | OutputNode 
  | ConditionNode;

/**
 * Edge connecting nodes
 */
export interface Edge {
  id: string;
  source: string;  // Source node ID
  target: string;  // Target node ID
  sourceHandle?: string | null;  // Source handle ID
  targetHandle?: string | null;  // Target handle ID
  label?: string;
  animated?: boolean;
  style?: Record<string, any>;
  data?: Record<string, any>;
}

/**
 * Complete workflow definition
 */
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: AgentNode[];
  edges: Edge[];
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Pattern template - Predefined workflows for common patterns
 */
export interface PatternTemplate {
  id: string;
  name: string;
  description: string;
  type: 'prompt-chaining' | 'routing' | 'parallelization' | 'orchestrator-workers' | 'evaluator-optimizer' | 'custom';
  workflow: Workflow;
}

/**
 * MCP Server connection for tools and resources
 */
export interface MCPServerConnection {
  id: string;
  name: string;
  serverType: string;
  endpoint?: string;
  capabilities?: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
  };
}

/**
 * Mermaid diagram generation
 */
export interface MermaidOptions {
  theme?: 'default' | 'forest' | 'dark' | 'neutral';
  direction?: 'TB' | 'TD' | 'BT' | 'RL' | 'LR';
  nodeFormatting?: Record<AgentNodeType, string>;
  edgeFormatting?: Record<string, string>;
  includeNodeData?: boolean;
}

export interface MermaidConversion {
  workflowToMermaid: (workflow: Workflow, options?: MermaidOptions) => string;
  mermaidToWorkflow: (mermaidCode: string) => Workflow;
}

/**
 * Zod schemas for validation
 */
export const NodeBaseSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(AgentNodeType),
  label: z.string(),
  description: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.any()).optional(),
});

export const LLMNodeSchema = NodeBaseSchema.extend({
  type: z.literal(AgentNodeType.LLM),
  data: z.object({
    model: z.string(),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    systemPrompt: z.string().optional(),
    promptTemplate: z.string().optional(),
  }),
});

export const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  animated: z.boolean().optional(),
  style: z.record(z.any()).optional(),
  data: z.record(z.any()).optional(),
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(NodeBaseSchema),
  edges: z.array(EdgeSchema),
  variables: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
}); 