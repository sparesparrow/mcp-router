/**
 * EvaluatorNode.tsx
 * Component for rendering Evaluator nodes in the workflow canvas
 */

import * as React from 'react';
const { memo } = React;
import { Handle, Position, NodeProps } from 'reactflow';

export const EvaluatorNodeComponent = memo(({ data, isConnectable, selected }: NodeProps) => {
  const { 
    label,
    evaluationCriteria = [],
    maxIterations = 3,
    threshold = 0.8,
  } = data;

  return (
    <div className={`evaluator-node ${selected ? 'selected' : ''}`} style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#fed7aa',
      border: '1px solid #9a3412',
      color: '#9a3412',
      width: '220px',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#9a3412' }}
      />
      
      <div className="evaluator-node-header" style={{
        borderBottom: '1px solid #9a3412',
        paddingBottom: '8px',
        marginBottom: '8px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          backgroundColor: '#9a3412',
          color: 'white',
          width: '24px',
          height: '24px',
          borderRadius: '12px 12px 12px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          <span>E</span>
        </div>
        <div>{label}</div>
      </div>
      
      <div className="evaluator-node-content" style={{
        fontSize: '12px',
      }}>
        <div className="evaluator-node-property" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <strong>Max Iterations:</strong>
          <span>{maxIterations}</span>
        </div>
        
        <div className="evaluator-node-property" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <strong>Threshold:</strong>
          <span>{threshold}</span>
        </div>
        
        {evaluationCriteria.length > 0 && (
          <div className="evaluator-node-property criteria" style={{
            marginTop: '8px',
          }}>
            <div><strong>Criteria ({evaluationCriteria.length}):</strong></div>
            <div style={{
              padding: '4px',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '4px',
              fontSize: '10px',
              maxHeight: '60px',
              overflow: 'auto',
              marginTop: '4px',
            }}>
              {evaluationCriteria.slice(0, 3).map((criterion, index) => (
                <div key={index} style={{
                  padding: '2px 0',
                  borderBottom: index < Math.min(evaluationCriteria.length, 3) - 1 ? '1px dashed rgba(0,0,0,0.1)' : 'none',
                }}>
                  • {criterion}
                </div>
              ))}
              {evaluationCriteria.length > 3 && <div>+ {evaluationCriteria.length - 3} more...</div>}
            </div>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#9a3412' }}
      />
    </div>
  );
});

export default EvaluatorNodeComponent; 