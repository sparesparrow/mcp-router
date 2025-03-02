/**
 * Node Type Context
 * Provides access to node type registry.
 */
import React, { createContext, useContext, useMemo } from 'react';
import { NodeProps } from 'reactflow';
import { INodeTypeRegistry, NodeComponent } from '../../services/interfaces/INodeTypeRegistry';
import { AgentNodeType } from '../../features/workflow-designer/types/agent-types';

interface NodeTypeContextType {
  registerNodeType: (type: AgentNodeType | string, component: NodeComponent) => void;
  getNodeComponent: (type: AgentNodeType | string) => NodeComponent | undefined;
  getAllNodeTypes: () => string[];
  getNodeTypesRecord: () => Record<string, NodeComponent>;
}

// Create context with a default value
const NodeTypeContext = createContext<NodeTypeContextType | null>(null);

// Custom hook to use the node type context
export const useNodeTypes = () => {
  const context = useContext(NodeTypeContext);
  if (!context) {
    throw new Error('useNodeTypes must be used within a NodeTypeProvider');
  }
  return context;
};

interface NodeTypeProviderProps {
  nodeTypeRegistry: INodeTypeRegistry;
  children: React.ReactNode;
}

// Provider component
export const NodeTypeProvider: React.FC<NodeTypeProviderProps> = ({ 
  nodeTypeRegistry, 
  children 
}) => {
  // Create methods that pass through to the registry
  const registerNodeType = (type: AgentNodeType | string, component: NodeComponent) => {
    nodeTypeRegistry.registerNodeType(type, component);
  };

  const getNodeComponent = (type: AgentNodeType | string) => {
    return nodeTypeRegistry.getNodeComponent(type);
  };

  const getAllNodeTypes = () => {
    return nodeTypeRegistry.getAllNodeTypes();
  };

  // Get a record of all node types for ReactFlow
  const getNodeTypesRecord = () => {
    const record: Record<string, NodeComponent> = {};
    
    getAllNodeTypes().forEach(type => {
      const component = getNodeComponent(type);
      if (component) {
        record[type] = component;
      }
    });
    
    return record;
  };

  // Create value object
  const value: NodeTypeContextType = {
    registerNodeType,
    getNodeComponent,
    getAllNodeTypes,
    getNodeTypesRecord,
  };

  return (
    <NodeTypeContext.Provider value={value}>
      {children}
    </NodeTypeContext.Provider>
  );
};
