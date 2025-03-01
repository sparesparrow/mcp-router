/**
 * mermaid-generator.ts
 * Utility functions for generating Mermaid diagrams from workflow data
 */

import { AgentNodeType } from '@mcp-router/shared/dist/types/mcp';
import { Workflow, AgentNode } from '../../workflow-designer/types/agent-types';

/**
 * Generate a Mermaid flowchart diagram from a workflow
 * @param workflow The workflow to generate a diagram for
 * @returns A Mermaid flowchart diagram as a string
 */
export function generateMermaidDiagram(workflow: Workflow): string {
  let mermaidCode = 'flowchart TD\n';
  
  // Add nodes
  workflow.nodes.forEach(node => {
    const nodeStyle = getNodeStyle(node.type);
    mermaidCode += `    ${node.id}["${node.label || node.id}"]${nodeStyle}\n`;
  });
  
  // Add edges
  workflow.edges.forEach(edge => {
    mermaidCode += `    ${edge.source} --> ${edge.target}\n`;
  });
  
  return mermaidCode;
}

/**
 * Get the style for a node based on its type
 * @param nodeType The type of the node
 * @returns A Mermaid style string
 */
function getNodeStyle(nodeType: AgentNodeType): string {
  switch (nodeType) {
    case AgentNodeType.LLM:
      return ':::llm';
    case AgentNodeType.TOOL:
      return ':::tool';
    case AgentNodeType.RESOURCE:
      return ':::resource';
    case AgentNodeType.ROUTER:
      return ':::router';
    case AgentNodeType.PARALLEL:
      return ':::parallel';
    case AgentNodeType.ORCHESTRATOR:
      return ':::orchestrator';
    case AgentNodeType.EVALUATOR:
      return ':::evaluator';
    case AgentNodeType.INPUT:
      return ':::input';
    case AgentNodeType.OUTPUT:
      return ':::output';
    case AgentNodeType.CONDITION:
      return ':::condition';
    default:
      return '';
  }
}

/**
 * Generate a more detailed Mermaid diagram with node properties
 * @param workflow The workflow to generate a diagram for
 * @returns A Mermaid flowchart diagram as a string
 */
export function generateDetailedMermaidDiagram(workflow: Workflow): string {
  let mermaidCode = 'flowchart TD\n';
  
  // Add class definitions
  mermaidCode += '    classDef llm fill:#f9a8d4,stroke:#d53f8c\n';
  mermaidCode += '    classDef tool fill:#93c5fd,stroke:#3b82f6\n';
  mermaidCode += '    classDef resource fill:#a3e635,stroke:#65a30d\n';
  mermaidCode += '    classDef router fill:#fcd34d,stroke:#d97706\n';
  mermaidCode += '    classDef parallel fill:#c4b5fd,stroke:#8b5cf6\n';
  mermaidCode += '    classDef orchestrator fill:#fdba74,stroke:#ea580c\n';
  mermaidCode += '    classDef evaluator fill:#67e8f9,stroke:#06b6d4\n';
  mermaidCode += '    classDef input fill:#86efac,stroke:#10b981\n';
  mermaidCode += '    classDef output fill:#f87171,stroke:#ef4444\n';
  mermaidCode += '    classDef condition fill:#cbd5e1,stroke:#64748b\n';
  
  // Add nodes with subgraphs for properties
  workflow.nodes.forEach(node => {
    const nodeStyle = getNodeStyle(node.type);
    const nodeProperties = getNodeProperties(node);
    
    if (nodeProperties.length > 0) {
      mermaidCode += `    subgraph ${node.id}["${node.label || node.id}"]\n`;
      nodeProperties.forEach((prop, index) => {
        mermaidCode += `        ${node.id}_prop${index}["${prop}"]\n`;
      });
      mermaidCode += `    end\n`;
      mermaidCode += `    ${node.id}${nodeStyle}\n`;
    } else {
      mermaidCode += `    ${node.id}["${node.label || node.id}"]${nodeStyle}\n`;
    }
  });
  
  // Add edges
  workflow.edges.forEach(edge => {
    mermaidCode += `    ${edge.source} --> ${edge.target}\n`;
  });
  
  return mermaidCode;
}

/**
 * Get the properties of a node as an array of strings
 * @param node The node to get properties for
 * @returns An array of property strings
 */
function getNodeProperties(node: AgentNode): string[] {
  const properties: string[] = [];
  
  if (!node.data) {
    return properties;
  }
  
  switch (node.type) {
    case AgentNodeType.LLM:
      if (node.data.model) properties.push(`Model: ${node.data.model}`);
      if (node.data.temperature) properties.push(`Temperature: ${node.data.temperature}`);
      if (node.data.maxTokens) properties.push(`Max Tokens: ${node.data.maxTokens}`);
      break;
    case AgentNodeType.TOOL:
      if (node.data.serverName) properties.push(`Server: ${node.data.serverName}`);
      if (node.data.toolName) properties.push(`Tool: ${node.data.toolName}`);
      break;
    case AgentNodeType.RESOURCE:
      if (node.data.serverName) properties.push(`Server: ${node.data.serverName}`);
      if (node.data.uri) properties.push(`URI: ${node.data.uri}`);
      if (node.data.mimeType) properties.push(`MIME Type: ${node.data.mimeType}`);
      break;
    case AgentNodeType.ROUTER:
      if (node.data.routingField) properties.push(`Routing Field: ${node.data.routingField}`);
      if (node.data.routes) properties.push(`Routes: ${node.data.routes.length}`);
      if (node.data.defaultTargetNodeId) properties.push(`Default: ${node.data.defaultTargetNodeId}`);
      break;
    case AgentNodeType.PARALLEL:
      if (node.data.mode) properties.push(`Mode: ${node.data.mode}`);
      if (node.data.aggregationStrategy) properties.push(`Aggregation: ${node.data.aggregationStrategy}`);
      if (node.data.targetNodeIds) properties.push(`Targets: ${node.data.targetNodeIds.length}`);
      break;
    case AgentNodeType.ORCHESTRATOR:
      if (node.data.maxWorkers) properties.push(`Max Workers: ${node.data.maxWorkers}`);
      if (node.data.aggregationStrategy) properties.push(`Aggregation: ${node.data.aggregationStrategy}`);
      if (node.data.workerTemplate) properties.push(`Has Worker Template`);
      break;
    case AgentNodeType.EVALUATOR:
      if (node.data.maxIterations) properties.push(`Max Iterations: ${node.data.maxIterations}`);
      if (node.data.threshold) properties.push(`Threshold: ${node.data.threshold}`);
      if (node.data.evaluationCriteria) properties.push(`Has Evaluation Criteria`);
      break;
    case AgentNodeType.INPUT:
      if (node.data.inputSchema) properties.push(`Has Schema`);
      break;
    case AgentNodeType.OUTPUT:
      if (node.data.outputTemplate) properties.push(`Has Template`);
      break;
    case AgentNodeType.CONDITION:
      if (node.data.condition) properties.push(`Has Condition`);
      if (node.data.trueTargetNodeId) properties.push(`True: ${node.data.trueTargetNodeId}`);
      if (node.data.falseTargetNodeId) properties.push(`False: ${node.data.falseTargetNodeId}`);
      break;
  }
  
  return properties;
}

/**
 * Format mermaid diagram for display
 * @param mermaidCode The mermaid diagram code
 * @returns HTML with mermaid styling
 */
export function formatMermaidForDisplay(mermaidCode: string): string {
  return `<div class="mermaid">
${mermaidCode}
</div>`;
}

/**
 * Add click handlers to mermaid diagram
 * @param mermaidCode The mermaid diagram code
 * @param callback JavaScript callback function name
 * @returns Updated mermaid diagram code
 */
export function addMermaidClickHandlers(mermaidCode: string, callback: string): string {
  // Extract node IDs from the mermaid code
  const nodeIdRegex = /\s*([A-Za-z0-9_]+)(?:[>\[\]\(\)\{\}\/\\]+)?\["/g;
  let match;
  let nodeIds: string[] = [];
  let updatedCode = mermaidCode;
  
  // Create a fresh regex for each search
  const regex = new RegExp(nodeIdRegex);
  while ((match = regex.exec(mermaidCode)) !== null) {
    nodeIds.push(match[1]);
  }
  
  // Add click handler for each node
  nodeIds.forEach(nodeId => {
    // Skip data nodes
    if (nodeId.endsWith('Data') || nodeId.includes('_')) return;
    
    updatedCode += `    click ${nodeId} ${callback} "Open ${nodeId}"\n`;
  });
  
  return updatedCode;
}

/**
 * Extract nodes from a mermaid diagram
 * @param mermaidCode The mermaid diagram code
 * @returns Array of node IDs
 */
export function extractNodesFromMermaid(mermaidCode: string): string[] {
  const nodeIdRegex = /\s*([A-Za-z0-9_]+)(?:[>\[\]\(\)\{\}\/\\]+)?\["/g;
  let match;
  let nodeIds: string[] = [];
  
  // Create a fresh regex for each search
  const regex = new RegExp(nodeIdRegex);
  while ((match = regex.exec(mermaidCode)) !== null) {
    const nodeId = match[1];
    // Skip data nodes
    if (!nodeId.endsWith('Data') && !nodeId.includes('_')) {
      nodeIds.push(nodeId);
    }
  }
  
  return nodeIds;
}

/**
 * Generate a simple workflow preview
 * @param workflow The workflow to preview
 * @returns Simple mermaid diagram for preview
 */
export function generateWorkflowPreview(workflow: Workflow): string {
  // Create a simplified version with just nodes and connections
  let previewCode = 'flowchart LR\n';
  
  // Add a limited number of nodes (max 5)
  const previewNodes = workflow.nodes.slice(0, 5);
  previewNodes.forEach(node => {
    previewCode += `    ${node.id}["${node.label}"]\n`;
  });
  
  // Add edges between preview nodes
  workflow.edges.forEach(edge => {
    if (
      previewNodes.some(n => n.id === edge.source) &&
      previewNodes.some(n => n.id === edge.target)
    ) {
      previewCode += `    ${edge.source} --> ${edge.target}\n`;
    }
  });
  
  // Add indication if there are more nodes
  if (workflow.nodes.length > 5) {
    previewCode += `    more[["+ ${workflow.nodes.length - 5} more nodes"]]\n`;
  }
  
  return previewCode;
} 