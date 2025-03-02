/**
 * RouterNode.tsx
 * Component for rendering Router nodes in the workflow canvas
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { RouterNode } from '../../../types/agent-types';

type RouteType = RouterNode['data']['routes'][0];

const { memo } = React;

export const RouterNodeComponent = memo(({ data, isConnectable, selected }: NodeProps) => {
  const { 
    label,
    routingField = '',
    routes = [],
    defaultTargetNodeId,
  } = data;

  return (
    <div className={`router-node ${selected ? 'selected' : ''}`} style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#c4b5fd',
      border: '1px solid #5b21b6',
      color: '#5b21b6',
      width: '220px',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#5b21b6' }}
      />
      
      <div className="router-node-header" style={{
        borderBottom: '1px solid #5b21b6',
        paddingBottom: '8px',
        marginBottom: '8px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          backgroundColor: '#5b21b6',
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
          <span style={{ transform: 'rotate(-45deg)' }}>R</span>
        </div>
        <div>{label}</div>
      </div>
      
      <div className="router-node-content" style={{
        fontSize: '12px',
      }}>
        <div className="router-node-property" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <strong>Routing Field:</strong>
          <span>{routingField}</span>
        </div>
        
        {routes.length > 0 && (
          <div className="router-node-property routes" style={{
            marginTop: '8px',
          }}>
            <div><strong>Routes ({routes.length}):</strong></div>
            <div style={{
              padding: '4px',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '4px',
              fontSize: '10px',
              maxHeight: '60px',
              overflow: 'auto',
              marginTop: '4px',
            }}>
              {routes.slice(0, 3).map((route: RouteType, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: index < Math.min(routes.length, 3) - 1 ? '1px dashed rgba(0,0,0,0.1)' : 'none',
                  padding: '2px 0',
                }}>
                  <span>{route.condition}</span>
                  <span>→</span>
                </div>
              ))}
              {routes.length > 3 && <div>+ {routes.length - 3} more...</div>}
            </div>
          </div>
        )}
        
        {defaultTargetNodeId && (
          <div className="router-node-property" style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
            marginTop: '4px',
          }}>
            <strong>Default:</strong>
            <span>{defaultTargetNodeId}</span>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#5b21b6' }}
      />
    </div>
  );
});

export default RouterNodeComponent; 