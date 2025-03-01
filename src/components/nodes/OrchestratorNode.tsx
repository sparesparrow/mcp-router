/**
 * OrchestratorNode.tsx
 * Component for rendering Orchestrator nodes in the workflow canvas
 */

import * as React from 'react';
const { memo } = React;
import { Handle, Position, NodeProps } from 'reactflow';

export const OrchestratorNodeComponent = memo(({ data, isConnectable, selected }: NodeProps) => {
  const { 
    label,
    maxWorkers = 5,
    aggregationStrategy = 'sequential',
  } = data;

  return (
    <div className={`orchestrator-node ${selected ? 'selected' : ''}`} style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#bfdbfe',
      border: '1px solid #1e40af',
      color: '#1e40af',
      width: '220px',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#1e40af' }}
      />
      
      <div className="orchestrator-node-header" style={{
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
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          <span>O</span>
        </div>
        <div>{label}</div>
      </div>
      
      <div className="orchestrator-node-content" style={{
        fontSize: '12px',
      }}>
        <div className="orchestrator-node-property" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <strong>Max Workers:</strong>
          <span>{maxWorkers}</span>
        </div>
        
        <div className="orchestrator-node-property" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <strong>Aggregation:</strong>
          <span>{aggregationStrategy}</span>
        </div>
        
        <div className="orchestrator-node-property worker-template" style={{
          marginTop: '8px',
        }}>
          <div><strong>Worker Template:</strong></div>
          <div style={{
            padding: '4px',
            background: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '4px',
            fontSize: '10px',
            maxHeight: '60px',
            textAlign: 'center',
            marginTop: '4px',
          }}>
            {data.workerTemplate ? 
              `LLM (${data.workerTemplate.model || 'unspecified'})` : 
              'No worker template'}
          </div>
        </div>
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

export default OrchestratorNodeComponent; 