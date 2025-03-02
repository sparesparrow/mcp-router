/**
 * Base Node Component
 * A reusable base component for different node types.
 * Implements common functionality and styling for workflow nodes.
 */
import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { AgentNode } from '../types/agent-types';

// Type for the properties specific to this component
export interface BaseNodeComponentProps extends NodeProps<AgentNode['data']> {
  title: React.ReactNode;
  icon?: React.ReactNode;
  color?: {
    background: string;
    border: string;
    text: string;
  };
  handles?: {
    inputs?: { position?: Position; id?: string; label?: string }[];
    outputs?: { position?: Position; id?: string; label?: string }[];
  };
  children?: React.ReactNode;
}

const defaultColor = {
  background: '#f3f4f6',
  border: '#d1d5db',
  text: '#111827',
};

/**
 * BaseNodeComponent provides a standardized layout and styling for workflow nodes.
 * It can be extended by specific node types to maintain consistency.
 */
export const BaseNodeComponent: React.FC<BaseNodeComponentProps> = ({
  id,
  data,
  selected,
  title,
  icon,
  color = defaultColor,
  handles = { inputs: [{}], outputs: [{}] },
  children,
}) => {
  // Handle node click
  const onNodeClick = useCallback((e: React.MouseEvent) => {
    // Prevent propagation to avoid triggering parent click handlers
    e.stopPropagation();
  }, []);

  return (
    <div
      className={`base-node ${selected ? 'selected' : ''}`}
      onClick={onNodeClick}
      style={{
        padding: '10px',
        borderRadius: '8px',
        background: color.background,
        border: `1px solid ${selected ? '#3b82f6' : color.border}`,
        color: color.text,
        width: '220px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: selected ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
      }}
    >
      {/* Input Handles */}
      {handles.inputs?.map((input, i) => (
        <Handle
          key={`input-${i}`}
          type="target"
          position={input.position || Position.Top}
          id={input.id}
          style={{
            background: color.border,
            borderColor: color.border,
          }}
        />
      ))}

      {/* Node Header */}
      <div
        className="node-header"
        style={{
          borderBottom: `1px solid ${color.border}`,
          paddingBottom: '8px',
          marginBottom: '8px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {icon && (
          <div
            style={{
              backgroundColor: color.border,
              color: color.background,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {icon}
          </div>
        )}
        <div
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
      </div>

      {/* Node Content */}
      <div className="node-content" style={{ fontSize: '12px' }}>
        {children}
      </div>

      {/* Output Handles */}
      {handles.outputs?.map((output, i) => (
        <Handle
          key={`output-${i}`}
          type="source"
          position={output.position || Position.Bottom}
          id={output.id}
          style={{
            background: color.border,
            borderColor: color.border,
          }}
        />
      ))}
    </div>
  );
};

export default BaseNodeComponent;
