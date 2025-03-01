# Workflow Designer Components

This directory contains React components for the MCP Router's LLM Agent Workflow Designer.

## Overview

The workflow designer allows users to visually create, edit, and export LLM agent workflows based on Anthropic's agent patterns. These workflows can be used to orchestrate complex interactions between multiple AI models and tools.

## Components

- **WorkflowCanvas.tsx**: Main component that renders the workflow editor canvas
- **MermaidPanel.tsx**: Component for viewing and editing mermaid diagrams
- **nodes/**: Components for rendering different node types in the workflow
  - **LLMNode.tsx**: Component for rendering LLM nodes
  - (More node components to be added)

## Usage

To use the workflow designer, mount the `WorkflowCanvas` component:

```jsx
import WorkflowCanvas from './components/WorkflowCanvas';

const App = () => {
  const initialWorkflow = {
    id: 'example-workflow',
    name: 'Example Workflow',
    nodes: [],
    edges: []
  };
  
  const handleWorkflowChange = (updatedWorkflow) => {
    console.log('Workflow updated:', updatedWorkflow);
    // Save workflow or perform other actions
  };
  
  return (
    <WorkflowCanvas 
      initialWorkflow={initialWorkflow} 
      onWorkflowChange={handleWorkflowChange}
    />
  );
};
```

## Integration with the MCP Router

The workflow designer interfaces with the MCP Router to:

1. **Discover MCP Servers**: Find available MCP servers for tool and resource connections
2. **Fetch Capabilities**: Query server capabilities for available tools and resources
3. **Test Workflows**: Execute workflows against MCP servers
4. **Import/Export**: Save and load workflows in various formats

## Mermaid Integration

The designer includes a mermaid diagram editor that allows users to:

1. **Export workflows**: Convert a visual workflow to a mermaid diagram
2. **Import workflows**: Create a workflow from a mermaid diagram definition
3. **Document workflows**: Generate documentation with embedded diagrams

## Workflow Patterns

The designer supports these agent patterns:

1. **Prompt Chaining**: Sequential LLM processing with validation gates
2. **Routing**: Dynamic classification and specialized handler routing
3. **Parallelization**: Concurrent task processing with aggregation
4. **Orchestrator-Workers**: Coordinated multi-agent task distribution
5. **Evaluator-Optimizer**: Iterative improvement with evaluation feedback
6. **Autonomous Agent**: Independent planning and execution loop

## Development

To extend the designer with new node types:

1. Create a new node component in the `nodes/` directory
2. Register the node type in the `nodeTypes` object in `WorkflowCanvas.tsx`
3. Add the node type to the agent-types.ts file
4. Add support for the node in mermaid-generator.ts and mermaid-parser.ts 