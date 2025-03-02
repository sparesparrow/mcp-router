/**
 * Node Registration Utility
 * 
 * Centralizes the registration of all node types for the workflow designer.
 * This follows the Open-Closed Principle by allowing new node types to be
 * added without modifying existing code.
 */
import React from 'react';
import { INodeTypeRegistry, NodeComponent } from '../../services/interfaces/INodeTypeRegistry';
import { AgentNodeType } from '../../features/workflow-designer/types/agent-types';
import { CognitiveNodeType } from '../../services/implementations/NodeTypeRegistry';

// Import node components
import ChainOfThoughtNode from './Nodes/ChainOfThoughtNode';

/**
 * Register all node types with the registry
 * 
 * @param registry The node type registry to register with
 */
export function registerAllNodeTypes(registry: INodeTypeRegistry): void {
  // Register agent nodes (these would be imported from their respective files)
  const agentNodes: Record<AgentNodeType, NodeComponent> = {
    // Example agent nodes - these would be actual implementations
    [AgentNodeType.LLM_AGENT]: () => <div>LLM Agent</div>,
    [AgentNodeType.TOOL_AGENT]: () => <div>Tool Agent</div>,
    [AgentNodeType.ROUTER_AGENT]: () => <div>Router Agent</div>,
  };
  
  // Register cognitive nodes
  const cognitiveNodes: Record<CognitiveNodeType, NodeComponent> = {
    [CognitiveNodeType.CHAIN_OF_THOUGHT]: ChainOfThoughtNode,
    // Other cognitive nodes would be added here as they are implemented
    [CognitiveNodeType.MEMORY_CASCADE]: () => <div>Memory Cascade</div>,
    [CognitiveNodeType.GOAL_DECOMPOSER]: () => <div>Goal Decomposer</div>,
    [CognitiveNodeType.CONTEXT_SHEPHERD]: () => <div>Context Shepherd</div>,
  };
  
  // Register all node types
  registry.registerDefaultNodeTypes(agentNodes);
  
  // Use the new method to register cognitive nodes
  if ('registerCognitiveNodeTypes' in registry) {
    (registry as any).registerCognitiveNodeTypes(cognitiveNodes);
  } else {
    // Fallback for registries that don't have the specialized method
    Object.entries(cognitiveNodes).forEach(([type, component]) => {
      registry.registerNodeType(type, component);
    });
  }
}

/**
 * Create a new node of the specified type
 * 
 * @param type The type of node to create
 * @param id Optional ID for the node (will be generated if not provided)
 * @param position Optional position for the node
 * @returns A node object that can be added to the workflow
 */
export function createNode(
  type: AgentNodeType | CognitiveNodeType,
  id?: string,
  position = { x: 0, y: 0 }
) {
  // Generate a unique ID if not provided
  const nodeId = id || `${type}-${Date.now()}`;
  
  // Create the base node data
  const baseData = {
    id: nodeId,
    type,
    position,
    data: {
      label: getDefaultLabelForType(type),
      type,
    },
  };
  
  // Add type-specific data
  if (type === CognitiveNodeType.CHAIN_OF_THOUGHT) {
    return {
      ...baseData,
      data: {
        ...baseData.data,
        maxThoughts: 5,
        thoughtTemplate: "Step {{step}}: ",
        requireVerification: true,
        thoughtHistory: [],
      },
    };
  }
  
  return baseData;
}

/**
 * Get a default label for a node type
 * 
 * @param type The node type
 * @returns A human-readable label for the node
 */
function getDefaultLabelForType(type: AgentNodeType | CognitiveNodeType): string {
  // Convert enum values to readable labels
  switch (type) {
    case AgentNodeType.LLM_AGENT:
      return 'LLM Agent';
    case AgentNodeType.TOOL_AGENT:
      return 'Tool Agent';
    case AgentNodeType.ROUTER_AGENT:
      return 'Router Agent';
    case CognitiveNodeType.CHAIN_OF_THOUGHT:
      return 'Chain of Thought';
    case CognitiveNodeType.MEMORY_CASCADE:
      return 'Memory Cascade';
    case CognitiveNodeType.GOAL_DECOMPOSER:
      return 'Goal Decomposer';
    case CognitiveNodeType.CONTEXT_SHEPHERD:
      return 'Context Shepherd';
    default:
      return type.toString();
  }
} 