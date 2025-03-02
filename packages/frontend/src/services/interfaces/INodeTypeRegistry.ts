/**
 * Node Type Registry Interface
 * Defines the contract for node type registration services.
 */
import { ReactNode } from 'react';
import { NodeProps } from 'reactflow';
import { AgentNodeType } from '../../features/workflow-designer/types/agent-types';

export type NodeComponent = React.ComponentType<NodeProps>;

export interface INodeTypeRegistry {
  /**
   * Registers a node type with its component
   * @param type The node type
   * @param component The component to render for this node type
   */
  registerNodeType(type: AgentNodeType | string, component: NodeComponent): void;
  
  /**
   * Gets the component for a node type
   * @param type The node type
   * @returns The component for the node type, or undefined if not found
   */
  getNodeComponent(type: AgentNodeType | string): NodeComponent | undefined;
  
  /**
   * Gets all registered node types
   * @returns Array of registered node types
   */
  getAllNodeTypes(): string[];
}
