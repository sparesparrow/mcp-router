/**
 * mermaid-generator.ts
 * Utility for generating Mermaid diagrams from workflow definitions
 */

import { Workflow, AgentNodeType } from '../../types/agent-types';

interface MermaidOptions {
  direction?: 'TB' | 'BT' | 'RL' | 'LR';
  theme?: 'default' | 'forest' | 'dark' | 'neutral';
  includeNodeData?: boolean;
}

/**
 * Generate a Mermaid diagram from a workflow definition
 */
export function generateMermaidDiagram(workflow: Workflow, options: MermaidOptions = {}): string {
  const { 
    direction = 'TB',
    theme = 'default',
    includeNodeData = false
  } = options;
  
  // Start the diagram
  let diagram = `%%{init: {'theme':'${theme}'}}%%\ngraph ${direction}\n`;
  
  // Add style classes
  diagram += `  %% Node styles\n`;
  diagram += `  classDef llm fill:#93c5fd,stroke:#3b82f6,color:#1e3a8a\n`;
  diagram += `  classDef tool fill:#86efac,stroke:#22c55e,color:#14532d\n`;
  diagram += `  classDef resource fill:#fcd34d,stroke:#f59e0b,color:#78350f\n`;
  diagram += `  classDef router fill:#c4b5fd,stroke:#8b5cf6,color:#4c1d95\n`;
  diagram += `  classDef parallel fill:#a7f3d0,stroke:#10b981,color:#064e3b\n`;
  diagram += `  classDef orchestrator fill:#bfdbfe,stroke:#3b82f6,color:#1e3a8a\n`;
  diagram += `  classDef evaluator fill:#fed7aa,stroke:#f97316,color:#7c2d12\n`;
  diagram += `  classDef input fill:#e9d5ff,stroke:#a855f7,color:#581c87\n`;
  diagram += `  classDef output fill:#fecaca,stroke:#ef4444,color:#7f1d1d\n`;
  diagram += `  classDef condition fill:#fef3c7,stroke:#eab308,color:#713f12\n\n`;
  
  // Add nodes
  diagram += `  %% Nodes\n`;
  workflow.nodes.forEach(node => {
    const nodeId = node.id.replace(/-/g, '_'); // Mermaid doesn't like hyphens in IDs
    let nodeLabel = node.label || node.id;
    
    // Add node data if requested
    if (includeNodeData && node.data) {
      const nodeData = node.data as Record<string, any>;
      const dataStr = Object.entries(nodeData)
        .filter(([key, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => {
          if (typeof value === 'object') {
            return `${key}: {...}`;
          }
          return `${key}: ${String(value).substring(0, 20)}${String(value).length > 20 ? '...' : ''}`;
        })
        .join('<br/>');
        
      if (dataStr) {
        nodeLabel += `<br/>${dataStr}`;
      }
    }
    
    diagram += `  ${nodeId}["${nodeLabel}"]\n`;
  });
  
  // Add edges
  diagram += `\n  %% Edges\n`;
  workflow.edges.forEach(edge => {
    const sourceId = edge.source.replace(/-/g, '_');
    const targetId = edge.target.replace(/-/g, '_');
    const label = edge.label ? `|${edge.label}|` : '';
    
    diagram += `  ${sourceId} -->`;
    if (label) {
      diagram += ` ${label}`;
    }
    diagram += ` ${targetId}\n`;
  });
  
  // Apply styles
  diagram += `\n  %% Apply styles\n`;
  workflow.nodes.forEach(node => {
    const nodeId = node.id.replace(/-/g, '_');
    const nodeType = node.type;
    
    if (nodeType) {
      let styleClass = '';
      switch (nodeType) {
        case AgentNodeType.LLM:
          styleClass = 'llm';
          break;
        case AgentNodeType.TOOL:
          styleClass = 'tool';
          break;
        case AgentNodeType.RESOURCE:
          styleClass = 'resource';
          break;
        case AgentNodeType.ROUTER:
          styleClass = 'router';
          break;
        case AgentNodeType.PARALLEL:
          styleClass = 'parallel';
          break;
        case AgentNodeType.ORCHESTRATOR:
          styleClass = 'orchestrator';
          break;
        case AgentNodeType.EVALUATOR:
          styleClass = 'evaluator';
          break;
        case AgentNodeType.INPUT:
          styleClass = 'input';
          break;
        case AgentNodeType.OUTPUT:
          styleClass = 'output';
          break;
        case AgentNodeType.CONDITION:
          styleClass = 'condition';
          break;
      }
      
      if (styleClass) {
        diagram += `  class ${nodeId} ${styleClass}\n`;
      }
    }
  });
  
  return diagram;
} 