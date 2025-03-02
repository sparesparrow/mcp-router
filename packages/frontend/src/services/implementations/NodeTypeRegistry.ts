/**
 * Node Type Registry Implementation
 * Manages registration of node types and their components.
 */
import { ReactNode } from 'react';
import { NodeProps } from 'reactflow';
import { 
  INodeTypeRegistry, 
  NodeComponent 
} from '../interfaces/INodeTypeRegistry';
import { AgentNodeType } from '../../features/workflow-designer/types/agent-types';

export class NodeTypeRegistry implements INodeTypeRegistry {
  private nodeTypes: Map<string, NodeComponent> = new Map();

  /**
   * Registers a node type with its component
   */
  registerNodeType(type: AgentNodeType | string, component: NodeComponent): void {
    this.nodeTypes.set(type, component);
  }

  /**
   * Gets the component for a node type
   */
  getNodeComponent(type: AgentNodeType | string): NodeComponent | undefined {
    return this.nodeTypes.get(type);
  }

  /**
   * Gets all registered node types
   */
  getAllNodeTypes(): string[] {
    return Array.from(this.nodeTypes.keys());
  }

  /**
   * Gets all node types as a record for ReactFlow
   */
  getNodeTypesRecord(): Record<string, NodeComponent> {
    const record: Record<string, NodeComponent> = {};
    
    this.nodeTypes.forEach((component, type) => {
      record[type] = component;
    });
    
    return record;
  }

  /**
   * Registers default node types
   * @param components Record of node type to component mappings
   */
  registerDefaultNodeTypes(components: Record<AgentNodeType, NodeComponent>): void {
    Object.entries(components).forEach(([type, component]) => {
      this.registerNodeType(type, component);
    });
  }
}
