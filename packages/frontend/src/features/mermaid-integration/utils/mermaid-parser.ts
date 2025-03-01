/**
 * mermaid-parser.ts
 * Utility functions for parsing Mermaid diagrams into workflow data
 */

import { AgentNodeType } from '@mcp-router/shared/dist/types/mcp';
import { Workflow, AgentNode, Edge, LLMNode, ToolNode, ResourceNode, RouterNode, ParallelNode, OrchestratorNode, EvaluatorNode, InputNode, OutputNode, ConditionNode } from '../../workflow-designer/types/agent-types';

/**
 * Parse a Mermaid flowchart diagram into a workflow
 * @param mermaidCode The Mermaid flowchart diagram as a string
 * @returns A workflow object
 */
export function parseMermaidToWorkflow(mermaidCode: string): Workflow {
  const nodes: AgentNode[] = [];
  const edges: Edge[] = [];
  
  // Split the mermaid code into lines
  const lines = mermaidCode.split('\n');
  
  // Extract nodes and edges
  lines.forEach(line => {
    line = line.trim();
    
    // Skip empty lines, comments, and flowchart declaration
    if (!line || line.startsWith('%') || line.startsWith('flowchart')) {
      return;
    }
    
    // Check if the line defines a node
    if (line.includes('["') && line.includes('"]')) {
      const nodeMatch = line.match(/\s*(\w+)\["([^"]+)"\](:::(\w+))?/);
      if (nodeMatch) {
        const id = nodeMatch[1];
        const label = nodeMatch[2];
        const styleClass = nodeMatch[4];
        
        // Determine node type from style class
        let type = AgentNodeType.LLM; // Default type
        if (styleClass) {
          switch (styleClass) {
            case 'llm':
              type = AgentNodeType.LLM;
              break;
            case 'tool':
              type = AgentNodeType.TOOL;
              break;
            case 'resource':
              type = AgentNodeType.RESOURCE;
              break;
            case 'router':
              type = AgentNodeType.ROUTER;
              break;
            case 'parallel':
              type = AgentNodeType.PARALLEL;
              break;
            case 'orchestrator':
              type = AgentNodeType.ORCHESTRATOR;
              break;
            case 'evaluator':
              type = AgentNodeType.EVALUATOR;
              break;
            case 'input':
              type = AgentNodeType.INPUT;
              break;
            case 'output':
              type = AgentNodeType.OUTPUT;
              break;
            case 'condition':
              type = AgentNodeType.CONDITION;
              break;
          }
        }
        
        // Create a new node with the appropriate type
        let node: AgentNode;
        
        switch (type) {
          case AgentNodeType.LLM:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                model: 'default-model',
              },
            } as LLMNode;
            break;
          case AgentNodeType.TOOL:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                serverName: '',
                toolName: '',
              },
            } as ToolNode;
            break;
          case AgentNodeType.RESOURCE:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                serverName: '',
                uri: '',
              },
            } as ResourceNode;
            break;
          case AgentNodeType.ROUTER:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                routingField: '',
                routes: [],
              },
            } as RouterNode;
            break;
          case AgentNodeType.PARALLEL:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                mode: 'section',
                targetNodeIds: [],
                aggregationStrategy: 'all',
              },
            } as ParallelNode;
            break;
          case AgentNodeType.ORCHESTRATOR:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                aggregationStrategy: 'sequential',
              },
            } as OrchestratorNode;
            break;
          case AgentNodeType.EVALUATOR:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                evaluationCriteria: [],
              },
            } as EvaluatorNode;
            break;
          case AgentNodeType.INPUT:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {},
            } as InputNode;
            break;
          case AgentNodeType.OUTPUT:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {},
            } as OutputNode;
            break;
          case AgentNodeType.CONDITION:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                condition: '',
                trueTargetNodeId: '',
                falseTargetNodeId: '',
              },
            } as ConditionNode;
            break;
          default:
            throw new Error(`Unknown node type: ${type}`);
        }
        
        nodes.push(node);
      }
    }
    
    // Check if the line defines an edge
    if (line.includes('-->')) {
      const edgeMatch = line.match(/\s*(\w+)\s*-->\s*(\w+)/);
      if (edgeMatch) {
        const source = edgeMatch[1];
        const target = edgeMatch[2];
        
        // Create a new edge
        const edge: Edge = {
          id: `e${source}-${target}`,
          source,
          target,
        };
        
        edges.push(edge);
      }
    }
  });
  
  // Create the workflow
  const workflow: Workflow = {
    id: `workflow-${Date.now()}`,
    name: 'Imported Workflow',
    nodes,
    edges,
  };
  
  return workflow;
}

/**
 * Parse a more detailed Mermaid diagram with subgraphs into a workflow
 * @param mermaidCode The Mermaid flowchart diagram as a string
 * @returns A workflow object
 */
export function parseDetailedMermaidToWorkflow(mermaidCode: string): Workflow {
  const nodes: AgentNode[] = [];
  const edges: Edge[] = [];
  
  // Split the mermaid code into lines
  const lines = mermaidCode.split('\n');
  
  // Track subgraph state
  let inSubgraph = false;
  let currentSubgraphId = '';
  let currentSubgraphLabel = '';
  const nodeProperties: Record<string, string[]> = {};
  
  // Extract nodes, edges, and properties
  lines.forEach(line => {
    line = line.trim();
    
    // Skip empty lines, comments, flowchart declaration, and class definitions
    if (!line || 
        line.startsWith('%') || 
        line.startsWith('flowchart') || 
        line.startsWith('classDef')) {
      return;
    }
    
    // Check if the line starts a subgraph
    if (line.startsWith('subgraph')) {
      inSubgraph = true;
      const subgraphMatch = line.match(/subgraph\s+(\w+)\["([^"]+)"\]/);
      if (subgraphMatch) {
        currentSubgraphId = subgraphMatch[1];
        currentSubgraphLabel = subgraphMatch[2];
        nodeProperties[currentSubgraphId] = [];
      }
      return;
    }
    
    // Check if the line ends a subgraph
    if (line === 'end') {
      inSubgraph = false;
      return;
    }
    
    // Check if the line defines a property within a subgraph
    if (inSubgraph && line.includes('["') && line.includes('"]')) {
      const propMatch = line.match(/\s*(\w+)_prop\d+\["([^"]+)"\]/);
      if (propMatch && propMatch[1] === currentSubgraphId) {
        nodeProperties[currentSubgraphId].push(propMatch[2]);
      }
      return;
    }
    
    // Check if the line defines a node
    if (!inSubgraph && line.includes('["') && line.includes('"]')) {
      const nodeMatch = line.match(/\s*(\w+)\["([^"]+)"\](:::(\w+))?/);
      if (nodeMatch) {
        const id = nodeMatch[1];
        const label = nodeMatch[2];
        const styleClass = nodeMatch[4];
        
        // Determine node type from style class
        let type = AgentNodeType.LLM; // Default type
        if (styleClass) {
          switch (styleClass) {
            case 'llm':
              type = AgentNodeType.LLM;
              break;
            case 'tool':
              type = AgentNodeType.TOOL;
              break;
            case 'resource':
              type = AgentNodeType.RESOURCE;
              break;
            case 'router':
              type = AgentNodeType.ROUTER;
              break;
            case 'parallel':
              type = AgentNodeType.PARALLEL;
              break;
            case 'orchestrator':
              type = AgentNodeType.ORCHESTRATOR;
              break;
            case 'evaluator':
              type = AgentNodeType.EVALUATOR;
              break;
            case 'input':
              type = AgentNodeType.INPUT;
              break;
            case 'output':
              type = AgentNodeType.OUTPUT;
              break;
            case 'condition':
              type = AgentNodeType.CONDITION;
              break;
          }
        }
        
        // Create a new node based on type
        let node: AgentNode;
        
        switch (type) {
          case AgentNodeType.LLM:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: parseNodeProperties(type, nodeProperties[id] || []),
            } as LLMNode;
            break;
          case AgentNodeType.TOOL:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                serverName: '',
                toolName: '',
                ...parseNodeProperties(type, nodeProperties[id] || []),
              },
            } as ToolNode;
            break;
          case AgentNodeType.RESOURCE:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                serverName: '',
                uri: '',
                ...parseNodeProperties(type, nodeProperties[id] || []),
              },
            } as ResourceNode;
            break;
          case AgentNodeType.ROUTER:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                routingField: '',
                routes: [],
                ...parseNodeProperties(type, nodeProperties[id] || []),
              },
            } as RouterNode;
            break;
          case AgentNodeType.PARALLEL:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                mode: 'section',
                targetNodeIds: [],
                aggregationStrategy: 'all',
                ...parseNodeProperties(type, nodeProperties[id] || []),
              },
            } as ParallelNode;
            break;
          case AgentNodeType.ORCHESTRATOR:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                aggregationStrategy: 'sequential',
                ...parseNodeProperties(type, nodeProperties[id] || []),
              },
            } as OrchestratorNode;
            break;
          case AgentNodeType.EVALUATOR:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                evaluationCriteria: [],
                ...parseNodeProperties(type, nodeProperties[id] || []),
              },
            } as EvaluatorNode;
            break;
          case AgentNodeType.INPUT:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: parseNodeProperties(type, nodeProperties[id] || []),
            } as InputNode;
            break;
          case AgentNodeType.OUTPUT:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: parseNodeProperties(type, nodeProperties[id] || []),
            } as OutputNode;
            break;
          case AgentNodeType.CONDITION:
            node = {
              id,
              type,
              label,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                condition: '',
                trueTargetNodeId: '',
                falseTargetNodeId: '',
                ...parseNodeProperties(type, nodeProperties[id] || []),
              },
            } as ConditionNode;
            break;
          default:
            throw new Error(`Unknown node type: ${type}`);
        }
        
        nodes.push(node);
      }
    }
    
    // Check if the line defines an edge
    if (line.includes('-->')) {
      const edgeMatch = line.match(/\s*(\w+)\s*-->\s*(\w+)/);
      if (edgeMatch) {
        const source = edgeMatch[1];
        const target = edgeMatch[2];
        
        // Create a new edge
        const edge: Edge = {
          id: `e${source}-${target}`,
          source,
          target,
        };
        
        edges.push(edge);
      }
    }
  });
  
  // Create the workflow
  const workflow: Workflow = {
    id: `workflow-${Date.now()}`,
    name: 'Imported Workflow',
    nodes,
    edges,
  };
  
  return workflow;
}

/**
 * Parse node properties from strings into a data object
 * @param nodeType The type of the node
 * @param properties An array of property strings
 * @returns A data object for the node
 */
function parseNodeProperties(nodeType: AgentNodeType, properties: string[]): Record<string, any> {
  const data: Record<string, any> = {};
  
  properties.forEach(prop => {
    const [key, value] = prop.split(': ');
    
    if (!key || !value) {
      return;
    }
    
    switch (nodeType) {
      case AgentNodeType.LLM:
        if (key === 'Model') data.model = value;
        if (key === 'Temperature') data.temperature = parseFloat(value);
        if (key === 'Max Tokens') data.maxTokens = parseInt(value, 10);
        break;
      case AgentNodeType.TOOL:
        if (key === 'Server') data.serverName = value;
        if (key === 'Tool') data.toolName = value;
        break;
      case AgentNodeType.RESOURCE:
        if (key === 'Server') data.serverName = value;
        if (key === 'URI') data.uri = value;
        if (key === 'MIME Type') data.mimeType = value;
        break;
      case AgentNodeType.ROUTER:
        if (key === 'Routing Field') data.routingField = value;
        if (key === 'Default') data.defaultTargetNodeId = value;
        break;
      case AgentNodeType.PARALLEL:
        if (key === 'Mode') data.mode = value as any;
        if (key === 'Aggregation') data.aggregationStrategy = value as any;
        break;
      case AgentNodeType.ORCHESTRATOR:
        if (key === 'Max Workers') data.maxWorkers = parseInt(value, 10);
        if (key === 'Aggregation') data.aggregationStrategy = value;
        break;
      case AgentNodeType.EVALUATOR:
        if (key === 'Max Iterations') data.maxIterations = parseInt(value, 10);
        if (key === 'Threshold') data.threshold = parseFloat(value);
        break;
      case AgentNodeType.CONDITION:
        if (key === 'True') data.trueTargetNodeId = value;
        if (key === 'False') data.falseTargetNodeId = value;
        break;
    }
  });
  
  return data;
}