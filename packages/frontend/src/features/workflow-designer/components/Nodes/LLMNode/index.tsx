/**
 * LLMNode.tsx
 * Component for rendering LLM nodes in the workflow canvas
 */

import React, { useCallback, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { LLMNode as LLMNodeType } from '../../../types/agent-types';

type LLMNodeProps = NodeProps<LLMNodeType>;

// Helper function to check if props are equal for memoization
const arePropsEqual = (prevProps: LLMNodeProps, nextProps: LLMNodeProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.data.label === nextProps.data.label &&
    prevProps.data.data?.model === nextProps.data.data?.model &&
    prevProps.data.data?.temperature === nextProps.data.data?.temperature
  );
};

const LLMNodeComponent: React.FC<LLMNodeProps> = ({ data, selected }) => {
  // Use useCallback for event handlers
  const onLLMNodeClick = useCallback((e: React.MouseEvent) => {
    // Prevent propagation to avoid triggering parent click handlers
    e.stopPropagation();
  }, []);

  return (
    <div 
      className={`llm-node ${selected ? 'selected' : ''}`}
      onClick={onLLMNodeClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555' }}
      />
      <div className="llm-node-content">
        <div className="llm-node-header">LLM: {data.label}</div>
        <div className="llm-node-details">
          <div className="llm-node-model">Model: {data.data?.model || 'Not specified'}</div>
          <div className="llm-node-temp">Temp: {data.data?.temperature || 0.7}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
      />
    </div>
  );
};

// Export with memo for performance
export default memo(LLMNodeComponent, arePropsEqual); 