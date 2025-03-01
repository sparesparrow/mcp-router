/**
 * ConditionNode.tsx
 * Component for rendering Condition nodes in the workflow canvas
 */

import * as React from 'react';
const { memo } = React;
import { Handle, Position, NodeProps } from 'reactflow';

export const ConditionNodeComponent = memo(({ data, isConnectable, selected }: NodeProps) => {
  const { 
    label,
    condition = '',
    trueTargetNodeId = '',
    falseTargetNodeId = '',
  } = data;

  return (
    <div className={`condition-node ${selected ? 'selected' : ''}`} style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#fef3c7',
      border: '1px solid #b45309',
      color: '#b45309',
      width: '220px',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#b45309' }}
      />
      
      <div className="condition-node-header" style={{
        borderBottom: '1px solid #b45309',
        paddingBottom: '8px',
        marginBottom: '8px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          backgroundColor: '#b45309',
          color: 'white',
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          transform: 'rotate(45deg)',
        }}>
          <span style={{ transform: 'rotate(-45deg)' }}>?</span>
        </div>
        <div>{label}</div>
      </div>
      
      <div className="condition-node-content" style={{
        fontSize: '12px',
      }}>
        <div className="condition-node-property condition" style={{
          marginBottom: '8px',
        }}>
          <div><strong>Condition:</strong></div>
          <div style={{
            padding: '4px',
            background: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '4px',
            fontSize: '10px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: '4px',
          }}>
            {condition}
          </div>
        </div>
        
        <div className="condition-node-property" style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '4px',
        }}>
          <div style={{ 
            flex: 1,
            padding: '4px',
            background: 'rgba(74, 222, 128, 0.2)',
            borderRadius: '4px',
            fontSize: '10px',
            textAlign: 'center',
          }}>
            <strong>True</strong>
            <div style={{ fontSize: '9px', marginTop: '2px' }}>
              {trueTargetNodeId ? `→ ${trueTargetNodeId}` : 'Not set'}
            </div>
          </div>
          
          <div style={{ 
            flex: 1,
            padding: '4px',
            background: 'rgba(248, 113, 113, 0.2)',
            borderRadius: '4px',
            fontSize: '10px',
            textAlign: 'center',
          }}>
            <strong>False</strong>
            <div style={{ fontSize: '9px', marginTop: '2px' }}>
              {falseTargetNodeId ? `→ ${falseTargetNodeId}` : 'Not set'}
            </div>
          </div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ 
          background: '#22c55e',
          left: '30%',
        }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ 
          background: '#ef4444',
          left: '70%',
        }}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default ConditionNodeComponent; 