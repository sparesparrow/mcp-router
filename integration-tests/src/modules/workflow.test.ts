/**
 * Integration tests for the workflow functionality
 * between frontend components and shared package
 */
import { AgentNodeType } from 'shared';
import { generateMermaidDiagram } from 'frontend/src/features/workflow-designer/utils/mermaid/mermaid-generator';

// Mock workflow for testing
const mockWorkflow = {
  id: 'test-workflow',
  name: 'Test Workflow',
  nodes: [
    {
      id: 'node1',
      type: AgentNodeType.INPUT,
      label: 'Input Node'
    },
    {
      id: 'node2',
      type: AgentNodeType.LLM,
      label: 'LLM Node'
    },
    {
      id: 'node3',
      type: AgentNodeType.OUTPUT,
      label: 'Output Node'
    }
  ],
  edges: [
    {
      id: 'edge1',
      source: 'node1',
      target: 'node2',
      label: 'Process'
    },
    {
      id: 'edge2',
      source: 'node2',
      target: 'node3',
      label: 'Output'
    }
  ]
};

describe('Workflow Integration', () => {
  test('Mermaid generator correctly uses shared types', () => {
    // Generate a mermaid diagram using the shared package's AgentNodeType
    const diagram = generateMermaidDiagram(mockWorkflow);
    
    // Verify diagram was generated correctly
    expect(diagram).toContain('graph TB');
    expect(diagram).toContain('node1["Input Node"]');
    expect(diagram).toContain('node2["LLM Node"]');
    expect(diagram).toContain('node3["Output Node"]');
    
    // Verify correct styling based on AgentNodeType
    expect(diagram).toContain('class node1 input');
    expect(diagram).toContain('class node2 llm');
    expect(diagram).toContain('class node3 output');
  });
}); 