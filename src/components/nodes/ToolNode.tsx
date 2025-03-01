/**
 * ToolNode.tsx
 * Component for rendering Tool nodes in the workflow canvas
 */

import * as React from 'react';
const { memo } = React;
import { Handle, Position, NodeProps } from 'reactflow';

export const ToolNodeComponent = memo(({ data, isConnectable, selected }: NodeProps) => {
  const { 
    label,
    serverName = '',
    toolName = '',
    inputSchema = {},
  } = data;

  return (
    <div className={`tool-node ${selected ? 'selected' : ''}`} style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#86efac',
      border: '1px solid #166534',
      color: '#166534',
      width: '220px',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#166534' }}
      />
      
      <div className="tool-node-header" style={{
        borderBottom: '1px solid #166534',
        paddingBottom: '8px',
        marginBottom: '8px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          backgroundColor: '#166534',
          color: 'white',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          T
        </div>
        <div>{label}</div>
      </div>
      
      <div className="tool-node-content" style={{
        fontSize: '12px',
      }}>
        <div className="tool-node-property" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <strong>Server:</strong>
          <span>{serverName}</span>
        </div>
        
        <div className="tool-node-property" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <strong>Tool:</strong>
          <span>{toolName}</span>
        </div>
        
        {Object.keys(inputSchema).length > 0 && (
          <div className="tool-node-property input-schema" style={{
            marginTop: '8px',
          }}>
            <div><strong>Input Schema:</strong></div>
            <div style={{
              padding: '4px',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '4px',
              fontSize: '10px',
              maxHeight: '60px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: '4px',
            }}>
              {Object.keys(inputSchema).join(', ')}
            </div>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#166534' }}
      />
    </div>
  );
});

export default ToolNodeComponent; 