/**
 * LLMNode.tsx
 * Component for rendering LLM nodes in the workflow canvas
 */

import * as React from 'react';
const { memo } = React;
import { Handle, Position, NodeProps } from 'reactflow';

export const LLMNodeComponent = memo(({ data, isConnectable, selected }: NodeProps) => {
  const { 
    label,
    model = 'claude-3-5-sonnet',
    temperature = 0.7,
    maxTokens,
    systemPrompt = '',
  } = data;

  return (
    <div className={`llm-node ${selected ? 'selected' : ''}`} style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#93c5fd',
      border: '1px solid #1e40af',
      color: '#1e3a8a',
      width: '220px',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#1e40af' }}
      />
      
      <div className="llm-node-header" style={{
        borderBottom: '1px solid #1e40af',
        paddingBottom: '8px',
        marginBottom: '8px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          backgroundColor: '#1e40af',
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
          LLM
        </div>
        <div>{label}</div>
      </div>
      
      <div className="llm-node-content" style={{
        fontSize: '12px',
      }}>
        <div className="llm-node-property" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <strong>Model:</strong>
          <span>{model}</span>
        </div>
        
        <div className="llm-node-property" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <strong>Temperature:</strong>
          <span>{temperature}</span>
        </div>
        
        {maxTokens && (
          <div className="llm-node-property" style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}>
            <strong>Max Tokens:</strong>
            <span>{maxTokens}</span>
          </div>
        )}
        
        {systemPrompt && (
          <div className="llm-node-property system-prompt" style={{
            marginTop: '8px',
          }}>
            <div><strong>System Prompt:</strong></div>
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
              {systemPrompt.length > 100 
                ? `${systemPrompt.substring(0, 100)}...` 
                : systemPrompt
              }
            </div>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#1e40af' }}
      />
    </div>
  );
});

export default LLMNodeComponent; 