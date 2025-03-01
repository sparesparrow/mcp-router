/**
 * ResourceNode.tsx
 * Component for rendering Resource nodes in the workflow canvas
 */

import * as React from 'react';
const { memo } = React;
import { Handle, Position, NodeProps } from 'reactflow';

export const ResourceNodeComponent = memo(({ data, isConnectable, selected }: NodeProps) => {
  const { 
    label,
    serverName = '',
    uri = '',
    mimeType = '',
  } = data;

  return (
    <div className={`resource-node ${selected ? 'selected' : ''}`} style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#fcd34d',
      border: '1px solid #92400e',
      color: '#92400e',
      width: '220px',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#92400e' }}
      />
      
      <div className="resource-node-header" style={{
        borderBottom: '1px solid #92400e',
        paddingBottom: '8px',
        marginBottom: '8px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          backgroundColor: '#92400e',
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
          R
        </div>
        <div>{label}</div>
      </div>
      
      <div className="resource-node-content" style={{
        fontSize: '12px',
      }}>
        <div className="resource-node-property" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <strong>Server:</strong>
          <span>{serverName}</span>
        </div>
        
        <div className="resource-node-property uri" style={{
          marginBottom: '4px',
        }}>
          <div><strong>URI:</strong></div>
          <div style={{
            padding: '4px',
            background: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '4px',
            fontSize: '10px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {uri}
          </div>
        </div>
        
        {mimeType && (
          <div className="resource-node-property" style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}>
            <strong>MIME Type:</strong>
            <span>{mimeType}</span>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#92400e' }}
      />
    </div>
  );
});

export default ResourceNodeComponent; 