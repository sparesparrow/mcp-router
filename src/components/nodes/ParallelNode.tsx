/**
 * ParallelNode.tsx
 * Component for rendering Parallel nodes in the workflow canvas
 */

import * as React from 'react';
const { memo } = React;
import { Handle, Position, NodeProps } from 'reactflow';

export const ParallelNodeComponent = memo(({ data, isConnectable, selected }: NodeProps) => {
  const { 
    label,
    mode = 'section',
    targetNodeIds = [],
    aggregationStrategy = 'all',
  } = data;

  return (
    <div className={`parallel-node ${selected ? 'selected' : ''}`} style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#a7f3d0',
      border: '1px solid #065f46',
      color: '#065f46',
      width: '220px',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#065f46' }}
      />
      
      <div className="parallel-node-header" style={{
        borderBottom: '1px solid #065f46',
        paddingBottom: '8px',
        marginBottom: '8px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          backgroundColor: '#065f46',
          color: 'white',
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          <span>⫴</span>
        </div>
        <div>{label}</div>
      </div>
      
      <div className="parallel-node-content" style={{
        fontSize: '12px',
      }}>
        <div className="parallel-node-property" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <strong>Mode:</strong>
          <span>{mode}</span>
        </div>
        
        <div className="parallel-node-property" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <strong>Aggregation:</strong>
          <span>{aggregationStrategy}</span>
        </div>
        
        {targetNodeIds.length > 0 && (
          <div className="parallel-node-property targets" style={{
            marginTop: '8px',
          }}>
            <div><strong>Target Nodes ({targetNodeIds.length}):</strong></div>
            <div style={{
              padding: '4px',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '4px',
              fontSize: '10px',
              maxHeight: '60px',
              overflow: 'auto',
              marginTop: '4px',
            }}>
              {targetNodeIds.slice(0, 3).map((id, index) => (
                <div key={index} style={{
                  padding: '2px 0',
                  borderBottom: index < Math.min(targetNodeIds.length, 3) - 1 ? '1px dashed rgba(0,0,0,0.1)' : 'none',
                }}>
                  {id}
                </div>
              ))}
              {targetNodeIds.length > 3 && <div>+ {targetNodeIds.length - 3} more...</div>}
            </div>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#065f46' }}
      />
    </div>
  );
});

export default ParallelNodeComponent; 