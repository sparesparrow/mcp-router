/**
 * NodePalette.tsx
 * Component for displaying available node types that can be dragged onto the canvas
 */

import * as React from 'react';
import { AgentNodeType } from '../types/agent-types';

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string, nodeName: string) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const nodeTypes = [
    { type: AgentNodeType.LLM, name: 'LLM', color: '#93c5fd', icon: 'LLM', description: 'Large Language Model' },
    { type: AgentNodeType.TOOL, name: 'Tool', color: '#86efac', icon: 'T', description: 'External tool or function' },
    { type: AgentNodeType.RESOURCE, name: 'Resource', color: '#fcd34d', icon: 'R', description: 'Data resource' },
    { type: AgentNodeType.ROUTER, name: 'Router', color: '#c4b5fd', icon: 'R', description: 'Route based on conditions' },
    { type: AgentNodeType.PARALLEL, name: 'Parallel', color: '#a7f3d0', icon: '⫴', description: 'Parallel processing' },
    { type: AgentNodeType.ORCHESTRATOR, name: 'Orchestrator', color: '#bfdbfe', icon: 'O', description: 'Coordinate multiple workers' },
    { type: AgentNodeType.EVALUATOR, name: 'Evaluator', color: '#fed7aa', icon: 'E', description: 'Evaluate and improve results' },
    { type: AgentNodeType.INPUT, name: 'Input', color: '#e9d5ff', icon: '▶', description: 'Workflow input' },
    { type: AgentNodeType.OUTPUT, name: 'Output', color: '#fecaca', icon: '⏹', description: 'Workflow output' },
    { type: AgentNodeType.CONDITION, name: 'Condition', color: '#fef3c7', icon: '?', description: 'Conditional branching' },
  ];

  return (
    <div className="node-palette" style={{
      padding: '10px',
      background: 'white',
      borderRight: '1px solid #e2e8f0',
      width: '220px',
      height: '100%',
      overflowY: 'auto',
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0',
        padding: '0 0 8px 0',
        borderBottom: '1px solid #e2e8f0',
        fontSize: '16px',
        fontWeight: 'bold',
      }}>
        Node Palette
      </h3>
      
      <div className="node-palette-items" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {nodeTypes.map((nodeType) => (
          <div
            key={nodeType.type}
            className="node-palette-item"
            draggable
            onDragStart={(event) => onDragStart(event, nodeType.type, nodeType.name)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              background: nodeType.color,
              border: '1px solid rgba(0, 0, 0, 0.1)',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: nodeType.type === AgentNodeType.LLM ? '50%' : '4px',
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
            }}>
              {nodeType.icon}
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{nodeType.name}</div>
              <div style={{ fontSize: '10px' }}>{nodeType.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette; 