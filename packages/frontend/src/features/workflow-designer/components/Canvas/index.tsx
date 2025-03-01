/**
 * WorkflowCanvas.tsx
 * Main component for the workflow designer canvas
 */

import React, { useState, useRef, useCallback, useMemo, ReactNode } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge as ReactFlowEdge,
  Node,
  useReactFlow,
  NodeChange,
  EdgeChange,
  NodeTypes,
  ConnectionLineType,
  ConnectionMode,
  XYPosition,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { v4 as uuidv4 } from 'uuid';
import { 
  AgentNode, 
  AgentNodeType, 
  Workflow, 
  NodeBase, 
  LLMNode, 
  ToolNode, 
  ResourceNode, 
  RouterNode, 
  ParallelNode, 
  OrchestratorNode, 
  EvaluatorNode, 
  InputNode, 
  OutputNode, 
  ConditionNode, 
  Edge as WorkflowEdge 
} from '../../types/agent-types';
import LLMNodeComponent from '../Nodes/LLMNode';
import ToolNodeComponent from '../Nodes/ToolNode';
import ResourceNodeComponent from '../Nodes/ResourceNode';
import RouterNodeComponent from '../Nodes/RouterNode';
import ParallelNodeComponent from '../Nodes/ParallelNode';
import OrchestratorNodeComponent from '../Nodes/OrchestratorNode';
import EvaluatorNodeComponent from '../Nodes/EvaluatorNode';
import { InputNodeComponent, OutputNodeComponent } from '../Nodes/InputOutputNodes';
import ConditionNodeComponent from '../Nodes/ConditionNode';
import NodePalette from '../NodePalette';
import PropertiesPanel from '../PropertiesPanel';
import MermaidPanel from '../MermaidPanel';

// Define the node types mapping
const nodeTypes: NodeTypes = {
  [AgentNodeType.LLM]: LLMNodeComponent,
  [AgentNodeType.TOOL]: ToolNodeComponent,
  [AgentNodeType.RESOURCE]: ResourceNodeComponent,
  [AgentNodeType.ROUTER]: RouterNodeComponent,
  [AgentNodeType.PARALLEL]: ParallelNodeComponent,
  [AgentNodeType.ORCHESTRATOR]: OrchestratorNodeComponent,
  [AgentNodeType.EVALUATOR]: EvaluatorNodeComponent,
  [AgentNodeType.INPUT]: InputNodeComponent,
  [AgentNodeType.OUTPUT]: OutputNodeComponent,
  [AgentNodeType.CONDITION]: ConditionNodeComponent,
};

// Define a type that maps our AgentNode to ReactFlow's Node type
type AgentReactFlowNode = Node<AgentNode['data']>;
type AgentReactFlowEdge = ReactFlowEdge<any>;

interface WorkflowCanvasProps {
  initialWorkflow?: Workflow;
  onWorkflowChange?: (workflow: Workflow) => void;
  readOnly?: boolean;
}

/**
 * Main canvas component for the workflow designer
 */
const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  initialWorkflow,
  onWorkflowChange,
  readOnly = false,
}) => {
  // Convert initial workflow to ReactFlow nodes and edges
  const initialNodes = useMemo(() => {
    return initialWorkflow?.nodes.map((node) => ({
      id: node.id,
      type: node.data.type,
      position: node.position,
      data: node.data,
    })) || [];
  }, [initialWorkflow]);
  
  const initialEdges = useMemo(() => {
    return initialWorkflow?.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label,
    })) || [];
  }, [initialWorkflow]);
  
  // States
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AgentReactFlowEdge>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<AgentNode> | null>(null);
  const [showMermaidPanel, setShowMermaidPanel] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<'select' | 'connect'>('select');
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  
  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as Node<AgentNode>);
  }, []);
  
  // Handle node deselection
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);
  
  // Handle node change from properties panel
  const handleNodeDataChange = useCallback((nodeId: string, data: AgentNode) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data,
          };
        }
        return node;
      })
    );
  }, [setNodes]);
  
  // Handle connection between nodes
  const onConnect = useCallback((connection: Connection) => {
    // Create a new edge with a unique ID
    const newEdge: AgentReactFlowEdge = {
      id: `edge-${uuidv4()}`,
      source: connection.source || '',
      target: connection.target || '',
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      label: '',
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    };
    
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);
  
  // Handle node double click (for future functionality)
  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    console.log('Node double clicked:', node);
    // Implement node double click behavior here
  }, []);
  
  // Handle drag over for dropping new nodes
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handle drop for new nodes
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      if (readOnly) return;
      
      const type = event.dataTransfer.getData('application/reactflow/type') as AgentNodeType;
      const nodeName = event.dataTransfer.getData('application/reactflow/name');
      
      if (!type || !reactFlowWrapper.current) return;
      
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      // Create a new node with default data based on type
      const newNode: Node = {
        id: `node-${uuidv4()}`,
        type,
        position,
        data: createDefaultNodeData(type, nodeName),
      };
      
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, readOnly]
  );
  
  // Create default node data based on type
  const createDefaultNodeData = (type: AgentNodeType, label: string): AgentNode => {
    const baseNode: Partial<NodeBase> = {
      id: `node-${uuidv4()}`,
      type,
      label: label || type,
      position: { x: 0, y: 0 }, // This will be overridden by ReactFlow
    };
    
    switch (type) {
      case AgentNodeType.LLM:
        return {
          ...baseNode,
          type: AgentNodeType.LLM,
          data: {
            model: 'claude-3-5-sonnet',
            temperature: 0.7,
            maxTokens: 2000,
            systemPrompt: '',
            promptTemplate: '',
          }
        } as LLMNode;
      case AgentNodeType.TOOL:
        return {
          ...baseNode,
          type: AgentNodeType.TOOL,
          data: {
            serverName: '',
            toolName: '',
            inputSchema: {},
            argumentMapping: {},
          }
        } as ToolNode;
      case AgentNodeType.RESOURCE:
        return {
          ...baseNode,
          type: AgentNodeType.RESOURCE,
          data: {
            serverName: '',
            uri: '',
            mimeType: '',
          }
        } as ResourceNode;
      case AgentNodeType.ROUTER:
        return {
          ...baseNode,
          type: AgentNodeType.ROUTER,
          data: {
            routingField: '',
            routes: [],
            defaultTargetNodeId: '',
          }
        } as RouterNode;
      case AgentNodeType.PARALLEL:
        return {
          ...baseNode,
          type: AgentNodeType.PARALLEL,
          data: {
            mode: 'section',
            targetNodeIds: [],
            aggregationStrategy: 'all',
          }
        } as ParallelNode;
      case AgentNodeType.ORCHESTRATOR:
        return {
          ...baseNode,
          type: AgentNodeType.ORCHESTRATOR,
          data: {
            maxWorkers: 5,
            aggregationStrategy: 'all',
          }
        } as OrchestratorNode;
      case AgentNodeType.EVALUATOR:
        return {
          ...baseNode,
          type: AgentNodeType.EVALUATOR,
          data: {
            evaluationCriteria: [],
            maxIterations: 3,
            threshold: 0.8,
          }
        } as EvaluatorNode;
      case AgentNodeType.INPUT:
        return {
          ...baseNode,
          type: AgentNodeType.INPUT,
          data: {
            inputSchema: {},
          }
        } as InputNode;
      case AgentNodeType.OUTPUT:
        return {
          ...baseNode,
          type: AgentNodeType.OUTPUT,
          data: {
            outputTemplate: '',
          }
        } as OutputNode;
      case AgentNodeType.CONDITION:
        return {
          ...baseNode,
          type: AgentNodeType.CONDITION,
          data: {
            condition: '',
            trueTargetNodeId: '',
            falseTargetNodeId: '',
          }
        } as ConditionNode;
      default:
        return {
          ...baseNode,
          type,
          data: {}
        } as unknown as AgentNode;
    }
  };
  
  // Notify parent of changes
  const notifyChanges = useCallback(() => {
    if (!onWorkflowChange) return;
    
    const currentWorkflow: Workflow = {
      id: initialWorkflow?.id || `workflow-${Date.now()}`,
      name: initialWorkflow?.name || 'Workflow',
      nodes: nodes.map((node) => ({
        id: node.id,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
      })),
    };
    
    onWorkflowChange(currentWorkflow);
  }, [nodes, edges, onWorkflowChange, initialWorkflow]);
  
  // Update parent component when nodes or edges change
  React.useEffect(() => {
    notifyChanges();
  }, [nodes, edges, notifyChanges]);
  
  // Handle drag start for new nodes
  const onDragStart = (event: React.DragEvent, nodeType: AgentNodeType, nodeName: string) => {
    if (readOnly) return;
    
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/name', nodeName);
    event.dataTransfer.effectAllowed = 'move';
  };
  
  // Toggle Mermaid panel
  const toggleMermaidPanel = () => {
    setShowMermaidPanel(!showMermaidPanel);
  };
  
  // Switch between select and connect tools
  const toggleTool = () => {
    setActiveTool(activeTool === 'select' ? 'connect' : 'select');
  };
  
  const getCurrentWorkflow = (): Workflow => {
    return {
      id: initialWorkflow?.id || `workflow-${Date.now()}`,
      name: initialWorkflow?.name || 'Workflow',
      nodes: nodes.map((node) => ({
        id: node.id,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
      })),
    };
  };
  
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Left Sidebar - Node Palette */}
      <NodePalette onDragStart={onDragStart} />
      
      {/* Main Canvas */}
      <div
        ref={reactFlowWrapper}
        style={{ 
          flexGrow: 1, 
          height: '100%', 
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Toolbar */}
        <div style={{
          display: 'flex',
          padding: '8px 16px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          alignItems: 'center',
          gap: '12px',
        }}>
          <button 
            onClick={toggleTool}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #94a3b8',
              background: activeTool === 'select' ? '#3b82f6' : '#f8fafc',
              color: activeTool === 'select' ? 'white' : '#64748b',
              cursor: 'pointer',
            }}
          >
            {activeTool === 'select' ? 'Select Mode' : 'Connect Mode'}
          </button>
          
          <button 
            onClick={toggleMermaidPanel}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #94a3b8',
              background: showMermaidPanel ? '#3b82f6' : '#f8fafc',
              color: showMermaidPanel ? 'white' : '#64748b',
              cursor: 'pointer',
            }}
          >
            {showMermaidPanel ? 'Hide Mermaid' : 'Show Mermaid'}
          </button>
        </div>
        
        {/* Main Content */}
        <div style={{ 
          flexGrow: 1, 
          display: 'flex',
        }}>
          {/* Flow Canvas */}
          <div style={{ 
            flexGrow: 1, 
            height: '100%',
            position: 'relative',
          }}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onNodeDoubleClick={onNodeDoubleClick}
                onPaneClick={onPaneClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                snapToGrid={true}
                snapGrid={[15, 15]}
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                fitView
                attributionPosition="bottom-right"
                proOptions={{ hideAttribution: true }}
                connectionMode={activeTool === 'connect' ? 'loose' as ConnectionMode : 'strict' as ConnectionMode}
                selectNodesOnDrag={activeTool === 'select'}
                elementsSelectable={!readOnly}
                nodesDraggable={!readOnly}
                nodesConnectable={!readOnly}
                edgesUpdatable={!readOnly}
                zoomOnDoubleClick={!readOnly}
              >
                <Controls showInteractive={false} />
                <MiniMap style={{ height: 120 }} zoomable pannable />
                <Background gap={15} size={1} />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
          
          {/* Mermaid Panel (if visible) */}
          {showMermaidPanel && (
            <MermaidPanel 
              workflow={getCurrentWorkflow()} 
              onImport={(workflow) => {
                if (readOnly) return;
                
                setNodes(
                  workflow.nodes.map((node) => ({
                    id: node.id,
                    type: node.data.type,
                    position: node.position,
                    data: node.data,
                  }))
                );
                
                setEdges(
                  workflow.edges.map((edge) => ({
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    sourceHandle: edge.sourceHandle,
                    targetHandle: edge.targetHandle,
                    label: edge.label,
                  }))
                );
              }}
              readOnly={readOnly}
            />
          )}
        </div>
      </div>
      
      {/* Right Sidebar - Properties Panel */}
      <PropertiesPanel 
        selectedNode={selectedNode} 
        onNodeChange={handleNodeDataChange}
        readOnly={readOnly}
      />
    </div>
  );
};

export default WorkflowCanvas; 