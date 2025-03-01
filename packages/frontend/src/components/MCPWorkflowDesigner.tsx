import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card } from './ui/Card';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'monospace'
});

// Types
type NodeType = 'input' | 'process' | 'output';

interface Node {
  id: string;
  type: NodeType;
  label: string;
  data?: any;
}

interface Edge {
  from: string;
  to: string;
}

interface ColorTheme {
  input: { fill: string; stroke: string; text: string };
  process: { fill: string; stroke: string; text: string };
  output: { fill: string; stroke: string; text: string };
}

// Icons
const ICONS = {
  ADD: '➕',
  REMOVE: '❌',
  EDIT: '✏️',
  LINK: '🔗',
  COLOR: '🎨',
  SAVE: '💾',
  LAYOUT: '📐',
};

// Color themes
const COLOR_THEMES: Record<string, ColorTheme> = {
  default: {
    input: { fill: '#1a365d', stroke: '#2b4c7e', text: '#ffffff' },
    process: { fill: '#064e3b', stroke: '#047857', text: '#ffffff' },
    output: { fill: '#7c2d12', stroke: '#9a3412', text: '#ffffff' }
  },
  neon: {
    input: { fill: '#2d1b69', stroke: '#6b46c1', text: '#ffffff' },
    process: { fill: '#044736', stroke: '#059669', text: '#ffffff' },
    output: { fill: '#5b21b6', stroke: '#7c3aed', text: '#ffffff' }
  },
  pastel: {
    input: { fill: '#dbeafe', stroke: '#3b82f6', text: '#1e3a8a' },
    process: { fill: '#dcfce7', stroke: '#22c55e', text: '#14532d' },
    output: { fill: '#fef3c7', stroke: '#d97706', text: '#78350f' }
  }
};

// Styled components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  background: ${props => props.active ? 'var(--color-primary)' : 'var(--color-background-secondary)'};
  color: ${props => props.active ? 'white' : 'var(--color-text-primary)'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
  &:hover {
    background: ${props => props.active ? 'var(--color-primary)' : 'var(--color-background-tertiary)'};
  }
`;

const ThemeButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  background: ${props => props.active ? 'var(--color-primary)' : 'var(--color-background-secondary)'};
  color: ${props => props.active ? 'white' : 'var(--color-text-primary)'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
  &:hover {
    background: ${props => props.active ? 'var(--color-primary)' : 'var(--color-background-tertiary)'};
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: var(--color-primary-dark);
  }
`;

const NodeTypeButton = styled.button<{ nodeType: NodeType }>`
  padding: 0.5rem 1rem;
  background: ${props => {
    switch(props.nodeType) {
      case 'input': return '#1a365d';
      case 'process': return '#064e3b';
      case 'output': return '#7c2d12';
      default: return 'var(--color-primary)';
    }
  }};
  color: white;
  border: none;
  border-radius: 4px;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const NodePanelContainer = styled.div`
  padding: 1rem;
  background: var(--color-background-secondary);
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const DiagramContainer = styled.div`
  background: var(--color-background-tertiary);
  padding: 1rem;
  border-radius: 4px;
  min-height: 300px;
  overflow-x: auto;
`;

const ConnectionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const Select = styled.select`
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

const Input = styled.input`
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

const MCPWorkflowDesigner: React.FC = () => {
  // State
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [activeTab, setActiveTab] = useState('designer');
  const [showNodePanel, setShowNodePanel] = useState(false);
  const [colorTheme, setColorTheme] = useState('default');
  const [layout, setLayout] = useState('TB');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [workflowDiagram, setWorkflowDiagram] = useState('');
  const [newProcessName, setNewProcessName] = useState('');
  
  // Example data
  const sampleInputs = [
    { id: 1, value: 'User Query' },
    { id: 2, value: 'System Context' }
  ];
  
  const sampleOutputs = [
    { id: 1, content: 'Response' },
    { id: 2, content: 'Log Entry' }
  ];
  
  // Store for saved nodes
  const [savedNodes, setSavedNodes] = useState({
    inputs: [] as any[],
    processes: [] as any[],
    outputs: [] as any[]
  });
  
  // Generate the Mermaid diagram
  useEffect(() => {
    if (nodes.length === 0) return;
    
    const colors = COLOR_THEMES[colorTheme];
    
    const diagram = `graph ${layout}
      %% Style definitions
      classDef input fill:${colors.input.fill},stroke:${colors.input.stroke},color:${colors.input.text}
      classDef process fill:${colors.process.fill},stroke:${colors.process.stroke},color:${colors.process.text}
      classDef output fill:${colors.output.fill},stroke:${colors.output.stroke},color:${colors.output.text}

      %% Nodes
      ${nodes.map(node => `${node.id}[${node.label}]`).join('\n      ')}

      %% Edges
      ${edges.map(edge => `${edge.from} --> ${edge.to}`).join('\n      ')}

      %% Apply styles
      ${nodes.filter(n => n.type === 'input').map(n => `class ${n.id} input`).join('\n      ')}
      ${nodes.filter(n => n.type === 'process').map(n => `class ${n.id} process`).join('\n      ')}
      ${nodes.filter(n => n.type === 'output').map(n => `class ${n.id} output`).join('\n      ')}`;

    setWorkflowDiagram(diagram);
    
    // Render the diagram
    if (activeTab === 'preview') {
      renderDiagram(diagram);
    }
  }, [nodes, edges, colorTheme, layout, activeTab]);
  
  const renderDiagram = async (diagram: string) => {
    try {
      // Clear previous diagram
      const element = document.getElementById('workflow-preview');
      if (element) {
        element.innerHTML = '';
        
        // Modern mermaid.render returns a Promise with { svg, bindFunctions }
        const { svg, bindFunctions } = await mermaid.render('workflow-preview', diagram, {});
        
        if (svg) {
          element.innerHTML = svg;
          // Bind any interactive elements if the function exists
          if (bindFunctions) {
            bindFunctions(element);
          }
        }
      }
    } catch (error) {
      console.error('Error rendering mermaid diagram:', error);
    }
  };
  
  // Add a new node
  const addNode = (type: NodeType, content: any) => {
    const newId = `node${nodes.length + 1}`;
    const label = typeof content === 'string' 
      ? content 
      : content.value || content.content || 'New Node';
    
    const newNode: Node = {
      id: newId,
      type,
      label,
      data: content
    };
    
    setNodes([...nodes, newNode]);
  };
  
  // Save a node for reuse
  const saveNode = (item: any, type: 'inputs' | 'processes' | 'outputs') => {
    setSavedNodes(prev => ({
      ...prev,
      [type]: [...prev[type], item]
    }));
  };
  
  // Add an edge between nodes
  const addEdge = (fromId: string, toId: string) => {
    // Don't add duplicate edges
    if (edges.some(edge => edge.from === fromId && edge.to === toId)) {
      return;
    }
    
    const newEdge: Edge = { from: fromId, to: toId };
    setEdges([...edges, newEdge]);
  };
  
  // Handle process node creation
  const handleAddProcess = () => {
    if (newProcessName.trim()) {
      addNode('process', newProcessName);
      saveNode(newProcessName, 'processes');
      setNewProcessName('');
    }
  };
  
  return (
    <Container>
      <h2>MCP Workflow Designer</h2>
      
      <TabsContainer>
        <TabButton 
          active={activeTab === 'designer'} 
          onClick={() => setActiveTab('designer')}
        >
          Designer
        </TabButton>
        <TabButton 
          active={activeTab === 'preview'} 
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </TabButton>
      </TabsContainer>
      
      {activeTab === 'designer' && (
        <>
          <Card>
            <ActionsContainer>
              <h3>Workflow Designer</h3>
              <ButtonGroup>
                <ActionButton onClick={() => setLayout(layout === 'TB' ? 'LR' : 'TB')}>
                  {ICONS.LAYOUT} {layout === 'TB' ? 'Top-Down' : 'Left-Right'}
                </ActionButton>
                <ActionButton onClick={() => setShowNodePanel(!showNodePanel)}>
                  {showNodePanel ? 'Hide Panel' : 'Add Nodes'}
                </ActionButton>
              </ButtonGroup>
            </ActionsContainer>
            
            {/* Theme Selection */}
            <div style={{ marginBottom: '1rem' }}>
              <h4>Color Theme</h4>
              <ButtonGroup>
                {Object.keys(COLOR_THEMES).map(theme => (
                  <ThemeButton
                    key={theme}
                    active={colorTheme === theme}
                    onClick={() => setColorTheme(theme)}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </ThemeButton>
                ))}
              </ButtonGroup>
            </div>
            
            {/* Node Panel */}
            {showNodePanel && (
              <NodePanelContainer>
                <h4>Available Inputs</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {savedNodes.inputs.map((input, idx) => (
                    <NodeTypeButton
                      key={`saved-input-${idx}`}
                      nodeType="input"
                      onClick={() => addNode('input', input)}
                    >
                      {input.value || input}
                    </NodeTypeButton>
                  ))}
                  {sampleInputs.map((input, idx) => (
                    <NodeTypeButton
                      key={`input-${idx}`}
                      nodeType="input"
                      onClick={() => {
                        addNode('input', input);
                        saveNode(input, 'inputs');
                      }}
                    >
                      {input.value}
                    </NodeTypeButton>
                  ))}
                </div>
                
                <h4>Available Outputs</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {savedNodes.outputs.map((output, idx) => (
                    <NodeTypeButton
                      key={`saved-output-${idx}`}
                      nodeType="output"
                      onClick={() => addNode('output', output)}
                    >
                      {output.content || output}
                    </NodeTypeButton>
                  ))}
                  {sampleOutputs.map((output, idx) => (
                    <NodeTypeButton
                      key={`output-${idx}`}
                      nodeType="output"
                      onClick={() => {
                        addNode('output', output);
                        saveNode(output, 'outputs');
                      }}
                    >
                      {output.content}
                    </NodeTypeButton>
                  ))}
                </div>
                
                <h4>Add Process Node</h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Input
                    type="text"
                    value={newProcessName}
                    onChange={(e) => setNewProcessName(e.target.value)}
                    placeholder="Process name..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddProcess()}
                  />
                  <ActionButton onClick={handleAddProcess}>
                    Add Process
                  </ActionButton>
                </div>
                
                {savedNodes.processes.length > 0 && (
                  <>
                    <h4>Saved Processes</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                      {savedNodes.processes.map((process, idx) => (
                        <NodeTypeButton
                          key={`saved-process-${idx}`}
                          nodeType="process"
                          onClick={() => addNode('process', process)}
                        >
                          {process}
                        </NodeTypeButton>
                      ))}
                    </div>
                  </>
                )}
              </NodePanelContainer>
            )}
            
            {/* Node Connection */}
            {nodes.length > 1 && (
              <Card>
                <h4>Connect Nodes</h4>
                <ConnectionsContainer>
                  <Select
                    value={selectedNode || ''}
                    onChange={(e) => setSelectedNode(e.target.value)}
                  >
                    <option value="">Select source node...</option>
                    {nodes.map(node => (
                      <option key={`source-${node.id}`} value={node.id}>
                        {node.label} ({node.type})
                      </option>
                    ))}
                  </Select>
                  
                  <Select
                    value=""
                    onChange={(e) => {
                      if (selectedNode && e.target.value) {
                        addEdge(selectedNode, e.target.value);
                        setSelectedNode(null);
                      }
                    }}
                  >
                    <option value="">Select target node...</option>
                    {nodes
                      .filter(node => node.id !== selectedNode)
                      .map(node => (
                        <option key={`target-${node.id}`} value={node.id}>
                          {node.label} ({node.type})
                        </option>
                      ))}
                  </Select>
                </ConnectionsContainer>
              </Card>
            )}
          </Card>
          
          {/* Current Workflow */}
          <Card>
            <h3>Current Workflow</h3>
            <p>{nodes.length} nodes, {edges.length} connections</p>
            <DiagramContainer>
              <pre>{workflowDiagram}</pre>
            </DiagramContainer>
          </Card>
        </>
      )}
      
      {activeTab === 'preview' && (
        <Card>
          <h3>Workflow Preview</h3>
          <DiagramContainer id="workflow-preview">
            {/* Diagram will be rendered here */}
          </DiagramContainer>
        </Card>
      )}
    </Container>
  );
};

export default MCPWorkflowDesigner; 