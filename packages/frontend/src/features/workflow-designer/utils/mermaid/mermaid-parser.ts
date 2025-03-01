/**
 * mermaid-parser.ts
 * Utility for parsing Mermaid diagrams into workflow definitions
 */

import { Workflow, AgentNodeType, AgentNode, Edge } from '../../types/agent-types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parse a Mermaid diagram into a workflow definition
 */
export function parseMermaidToWorkflow(mermaidCode: string): Workflow {
  // Create a new workflow
  const workflow: Workflow = {
    id: `workflow-${uuidv4()}`,
    name: 'Imported Workflow',
    nodes: [],
    edges: [],
  };
  
  // Parse the Mermaid code
  const lines = mermaidCode.split('\n');
  
  // Extract nodes and edges
  const nodeRegex = /^\s*([A-Za-z0-9_]+)\s*\["?([^"]*)"?\]\s*$/;
  const edgeRegex = /^\s*([A-Za-z0-9_]+)\s*-->\s*(?:\|([^|]*)\|\s*)?([A-Za-z0-9_]+)\s*$/;
  const classRegex = /^\s*class\s+([A-Za-z0-9_]+)\s+([A-Za-z0-9_]+)\s*$/;
  
  // Map to store node types
  const nodeTypes: Record<string, AgentNodeType> = {};
  
  // First pass: extract nodes and their types
  lines.forEach(line => {
    // Check for class definitions
    const classMatch = line.match(classRegex);
    if (classMatch) {
      const [_, nodeId, className] = classMatch;
      
      // Map class name to node type
      switch (className.toLowerCase()) {
        case 'llm':
          nodeTypes[nodeId] = AgentNodeType.LLM;
          break;
        case 'tool':
          nodeTypes[nodeId] = AgentNodeType.TOOL;
          break;
        case 'resource':
          nodeTypes[nodeId] = AgentNodeType.RESOURCE;
          break;
        case 'router':
          nodeTypes[nodeId] = AgentNodeType.ROUTER;
          break;
        case 'parallel':
          nodeTypes[nodeId] = AgentNodeType.PARALLEL;
          break;
        case 'orchestrator':
          nodeTypes[nodeId] = AgentNodeType.ORCHESTRATOR;
          break;
        case 'evaluator':
          nodeTypes[nodeId] = AgentNodeType.EVALUATOR;
          break;
        case 'input':
          nodeTypes[nodeId] = AgentNodeType.INPUT;
          break;
        case 'output':
          nodeTypes[nodeId] = AgentNodeType.OUTPUT;
          break;
        case 'condition':
          nodeTypes[nodeId] = AgentNodeType.CONDITION;
          break;
      }
    }
  });
  
  // Second pass: extract nodes
  lines.forEach(line => {
    const nodeMatch = line.match(nodeRegex);
    if (nodeMatch) {
      const [_, id, label] = nodeMatch;
      const nodeType = nodeTypes[id] || AgentNodeType.LLM; // Default to LLM if type not found
      
      // Create a node with a random position
      const node: AgentNode = {
        id: id.replace(/_/g, '-'), // Convert Mermaid IDs back to normal IDs
        type: nodeType,
        label: label || id,
        position: {
          x: Math.random() * 500,
          y: Math.random() * 500,
        },
        data: createDefaultNodeData(nodeType),
      };
      
      workflow.nodes.push(node);
    }
  });
  
  // Third pass: extract edges
  lines.forEach(line => {
    const edgeMatch = line.match(edgeRegex);
    if (edgeMatch) {
      const [_, sourceId, label, targetId] = edgeMatch;
      
      // Create an edge
      const edge: Edge = {
        id: `e-${uuidv4()}`,
        source: sourceId.replace(/_/g, '-'),
        target: targetId.replace(/_/g, '-'),
        label: label || undefined,
      };
      
      workflow.edges.push(edge);
    }
  });
  
  return workflow;
}

/**
 * Create default node data based on node type
 */
function createDefaultNodeData(type: AgentNodeType): any {
  switch (type) {
    case AgentNodeType.LLM:
      return {
        model: '',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: '',
      };
    case AgentNodeType.TOOL:
      return {
        serverName: '',
        toolName: '',
        inputSchema: {},
      };
    case AgentNodeType.RESOURCE:
      return {
        serverName: '',
        uri: '',
        mimeType: '',
      };
    case AgentNodeType.ROUTER:
      return {
        routingField: '',
        routes: {},
        defaultTargetNodeId: '',
      };
    case AgentNodeType.PARALLEL:
      return {
        mode: 'all',
        aggregationStrategy: 'array',
        targetNodeIds: [],
      };
    case AgentNodeType.ORCHESTRATOR:
      return {
        maxWorkers: 5,
        aggregationStrategy: 'array',
        workerTemplate: '',
      };
    case AgentNodeType.EVALUATOR:
      return {
        maxIterations: 3,
        threshold: 0.8,
        evaluationCriteria: '',
        targetNodeId: '',
      };
    case AgentNodeType.INPUT:
      return {
        schema: '',
      };
    case AgentNodeType.OUTPUT:
      return {
        outputTemplate: '',
      };
    case AgentNodeType.CONDITION:
      return {
        condition: '',
        trueTargetNodeId: '',
        falseTargetNodeId: '',
      };
    default:
      return {};
  }
} 