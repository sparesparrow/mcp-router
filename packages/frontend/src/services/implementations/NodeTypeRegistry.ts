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
import { memoize } from '../../utils/PerformanceOptimizations';

// Define additional node types
export enum CognitiveNodeType {
  CHAIN_OF_THOUGHT = 'chain-of-thought',
  MEMORY_CASCADE = 'memory-cascade',
  GOAL_DECOMPOSER = 'goal-decomposer',
  CONTEXT_SHEPHERD = 'context-shepherd',
}

export class NodeTypeRegistry implements INodeTypeRegistry {
  private nodeTypes: Map<string, NodeComponent> = new Map();
  
  /**
   * Memoized version of getNodeTypesRecord to avoid regenerating the 
   * record object when the nodeTypes map hasn't changed
   */
  private getMemoizedNodeTypesRecord = memoize(
    () => this.generateNodeTypesRecord(),
    () => {
      // Use the number of items and sorted keys as the cache key
      const nodeTypeKeys = Array.from(this.nodeTypes.keys()).sort().join(',');
      return `${this.nodeTypes.size}:${nodeTypeKeys}`;
    }
  );

  /**
   * Registers a node type with its component
   */
  registerNodeType(type: AgentNodeType | CognitiveNodeType | string, component: NodeComponent): void {
    this.nodeTypes.set(type, component);
  }

  /**
   * Gets the component for a node type
   */
  getNodeComponent(type: AgentNodeType | CognitiveNodeType | string): NodeComponent | undefined {
    return this.nodeTypes.get(type);
  }

  /**
   * Gets all registered node types
   */
  getAllNodeTypes(): string[] {
    return Array.from(this.nodeTypes.keys());
  }

  /**
   * Generates a record of node types to components
   * (This is the internal implementation used by the memoized version)
   */
  private generateNodeTypesRecord(): Record<string, NodeComponent> {
    const record: Record<string, NodeComponent> = {};
    
    this.nodeTypes.forEach((component, type) => {
      record[type] = component;
    });
    
    return record;
  }

  /**
   * Gets all node types as a record for ReactFlow
   * Uses memoization to improve performance for repeated calls
   */
  getNodeTypesRecord(): Record<string, NodeComponent> {
    return this.getMemoizedNodeTypesRecord();
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
  
  /**
   * Registers cognitive node types
   * @param components Record of cognitive node type to component mappings
   */
  registerCognitiveNodeTypes(components: Record<CognitiveNodeType, NodeComponent>): void {
    Object.entries(components).forEach(([type, component]) => {
      this.registerNodeType(type, component);
    });
  }
}
