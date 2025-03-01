/**
 * InputOutputNodes.tsx
 * Components for rendering Input and Output nodes in the workflow canvas
 */

import * as React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
const { memo } = React;

export const InputNodeComponent = memo(({ data, isConnectable, selected }: NodeProps) => {
  const { 
    label,
    inputSchema = {},
  } = data;

  return (
    <div className={`input-node ${selected ? 'selected' : ''}`} style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#e9d5ff',
      border: '1px solid #6b21a8',
      color: '#6b21a8',
      width: '220px',
    }}>
      <div className="input-node-header" style={{
        borderBottom: '1px solid #6b21a8',
        paddingBottom: '8px',
        marginBottom: '8px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          backgroundColor: '#6b21a8',
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
          <span>▶</span>
        </div>
        <div>{label}</div>
      </div>
      
      <div className="input-node-content" style={{
        fontSize: '12px',
      }}>
        {Object.keys(inputSchema).length > 0 && (
          <div className="input-node-property schema" style={{
            marginTop: '4px',
          }}>
            <div><strong>Schema:</strong></div>
            <div style={{
              padding: '4px',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '4px',
              fontSize: '10px',
              maxHeight: '60px',
              overflow: 'auto',
              marginTop: '4px',
            }}>
              {Object.keys(inputSchema).map((key, index) => (
                <div key={key} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '2px 0',
                  borderBottom: index < Object.keys(inputSchema).length - 1 ? '1px dashed rgba(0,0,0,0.1)' : 'none',
                }}>
                  <span>{key}</span>
                  <span>{inputSchema[key]?.type || 'any'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#6b21a8' }}
      />
    </div>
  );
});

export const OutputNodeComponent = memo(({ data, isConnectable, selected }: NodeProps) => {
  const { 
    label,
    outputTemplate = '',
  } = data;

  return (
    <div className={`output-node ${selected ? 'selected' : ''}`} style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#fecaca',
      border: '1px solid #991b1b',
      color: '#991b1b',
      width: '220px',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#991b1b' }}
      />
      
      <div className="output-node-header" style={{
        borderBottom: '1px solid #991b1b',
        paddingBottom: '8px',
        marginBottom: '8px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          backgroundColor: '#991b1b',
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
          <span>⏹</span>
        </div>
        <div>{label}</div>
      </div>
      
      <div className="output-node-content" style={{
        fontSize: '12px',
      }}>
        {outputTemplate && (
          <div className="output-node-property template" style={{
            marginTop: '4px',
          }}>
            <div><strong>Template:</strong></div>
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
              {outputTemplate.length > 100 
                ? `${outputTemplate.substring(0, 100)}...` 
                : outputTemplate
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default {
  InputNodeComponent,
  OutputNodeComponent
}; 