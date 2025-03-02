/**
 * Base Node Component
 * 
 * Provides common functionality for all node types.
 * Implements Liskov Substitution Principle by ensuring all node types
 * follow the same interface and behavior patterns.
 */
import React, { useCallback, memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';

// We'll use a local implementation since the WorkflowContext doesn't have updateNodeData
interface NodeUpdateFunctions {
  updateNodeData: (nodeId: string, data: any) => void;
}

// Mock implementation for now - this would be replaced with actual context
const useNodeUpdates = (): NodeUpdateFunctions => {
  return {
    updateNodeData: (nodeId: string, data: any) => {
      console.log(`Updating node ${nodeId} with data:`, data);
      // This would be implemented with actual state management
    }
  };
};

export interface BaseNodeData {
  label: string;
  description?: string;
  type: string;
  isSelected?: boolean;
  config?: Record<string, any>;
  width?: number;
  height?: number;
}

export interface BaseNodeProps extends NodeProps<BaseNodeData> {
  children?: React.ReactNode;
  className?: string;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
  resizable?: boolean;
  minWidth?: number;
  minHeight?: number;
}

/**
 * Base component for all node types
 * Provides common behavior and styling
 */
export const BaseNodeComponent: React.FC<BaseNodeProps> = memo(({
  id,
  data,
  selected,
  children,
  className = '',
  showSourceHandle = true,
  showTargetHandle = true,
  resizable = true,
  minWidth = 150,
  minHeight = 50,
}) => {
  const { updateNodeData } = useNodeUpdates();
  
  // Update node size when resized
  const onResize = useCallback((event: any, { width, height }: { width: number; height: number }) => {
    updateNodeData(id, {
      ...data,
      width,
      height,
    });
  }, [id, data, updateNodeData]);

  return (
    <div 
      className={`node-container ${selected ? 'selected' : ''} ${className}`}
      data-testid={`node-${id}`}
    >
      {resizable && (
        <NodeResizer 
          minWidth={minWidth} 
          minHeight={minHeight} 
          onResize={onResize} 
          isVisible={selected}
        />
      )}
      
      {/* Target handle (inputs) */}
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Top}
          id="target"
          className="node-handle node-handle-target"
        />
      )}
      
      {/* Node content */}
      <div className="node-content">
        <div className="node-header">
          <div className="node-type">{data.type}</div>
          <div className="node-label">{data.label}</div>
        </div>
        
        {data.description && (
          <div className="node-description">{data.description}</div>
        )}
        
        {/* Custom content provided by specific node implementations */}
        <div className="node-custom-content">
          {children}
        </div>
      </div>
      
      {/* Source handle (outputs) */}
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="source"
          className="node-handle node-handle-source"
        />
      )}
    </div>
  );
});

BaseNodeComponent.displayName = 'BaseNodeComponent';

export default BaseNodeComponent; 