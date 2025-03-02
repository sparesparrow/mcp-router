/**
 * WorkflowCanvas.tsx
 * Main component for the workflow designer canvas
 * Optimized for performance with large workflows
 */

import React, { useState, useRef, useCallback, useMemo, ReactNode, useEffect } from 'react';
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
  useOnViewportChange,
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
  [AgentNodeType.LLM]: React.memo(LLMNodeComponent),
  [AgentNodeType.TOOL]: React.memo(ToolNodeComponent),
  [AgentNodeType.RESOURCE]: React.memo(ResourceNodeComponent),
  [AgentNodeType.ROUTER]: React.memo(RouterNodeComponent),
  [AgentNodeType.PARALLEL]: React.memo(ParallelNodeComponent),
  [AgentNodeType.ORCHESTRATOR]: React.memo(OrchestratorNodeComponent),
  [AgentNodeType.EVALUATOR]: React.memo(EvaluatorNodeComponent),
  [AgentNodeType.INPUT]: React.memo(InputNodeComponent),
  [AgentNodeType.OUTPUT]: React.memo(OutputNodeComponent),
  [AgentNodeType.CONDITION]: React.memo(ConditionNodeComponent),
};

// Define a type that maps our AgentNode to ReactFlow's Node type
type AgentReactFlowNode = Node<AgentNode['data']>;
type AgentReactFlowEdge = ReactFlowEdge<any>;

interface WorkflowCanvasProps {
  initialWorkflow?: Workflow;
  onWorkflowChange?: (workflow: Workflow) => void;
  readOnly?: boolean;
}

// Performance settings
const VIEWPORT_DEBOUNCE_MS = 100;
const BATCH_UPDATE_MS = 50;

// Handle ResizeObserver error globally
const errorHandler = typeof window !== 'undefined' ? (e: ErrorEvent) => {
  if (e.message.includes('ResizeObserver loop limit exceeded') || 
      e.message.includes('ResizeObserver loop completed with undelivered notifications')) {
    // Prevent the error from showing in console
    e.stopImmediatePropagation();
  }
} : null;

if (typeof window !== 'undefined' && errorHandler) {
  window.addEventListener('error', errorHandler);
}

/**
 * Main canvas component for the workflow designer
 */
const WorkflowCanvasInner: React.FC<WorkflowCanvasProps> = ({
  initialWorkflow,
  onWorkflowChange,
  readOnly = false,
}) => {
  // Convert initial workflow to ReactFlow nodes and edges
  const initialNodes = useMemo(() => {
    return initialWorkflow?.nodes.map((node) => ({
      id: node.id,
      type: node.type,
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
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    })) || [];
  }, [initialWorkflow]);
  
  // States
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AgentReactFlowEdge>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<AgentNode> | null>(null);
  const [showMermaidPanel, setShowMermaidPanel] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<'select' | 'connect'>('select');
  const [error, setError] = useState<string | null>(null);
  const [isViewportChanging, setIsViewportChanging] = useState<boolean>(false);
  const [visibleArea, setVisibleArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const changesBatchRef = useRef<{ nodes: NodeChange[], edges: EdgeChange[] }>({
    nodes: [],
    edges: [],
  });
  
  // Setup error handling and cleanup
  useEffect(() => {
    // Local error handler for component-specific errors
    const handleComponentError = (error: Error) => {
      console.error('Workflow Canvas Error:', error);
      setError(error.message);
    };

    // Cleanup function to remove global error handler when component unmounts
    return () => {
      if (typeof window !== 'undefined' && errorHandler) {
        window.removeEventListener('error', errorHandler);
      }
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Optimize viewport changes to reduce render load
  useOnViewportChange({
    onStart: () => setIsViewportChanging(true),
    onEnd: () => {
      // Use debouncing to avoid excessive updates
      setTimeout(() => {
        setIsViewportChanging(false);
        updateVisibleArea();
      }, VIEWPORT_DEBOUNCE_MS);
    },
  });
  
  // Update visible area for culling nodes outside viewport
  const updateVisibleArea = useCallback(() => {
    if (reactFlowInstance) {
      const { x, y, zoom } = reactFlowInstance.getViewport();
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      
      if (bounds) {
        setVisibleArea({
          x: -x / zoom,
          y: -y / zoom,
          width: bounds.width / zoom,
          height: bounds.height / zoom,
        });
      }
    }
  }, [reactFlowInstance]);
  
  // Effect for updating visible area on resize
  useEffect(() => {
    const handleResize = () => {
      updateVisibleArea();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateVisibleArea]);
  
  // Batch node/edge changes for better performance with many nodes
  const batchChanges = useCallback((changes: { nodes?: NodeChange[], edges?: EdgeChange[] }) => {
    if (changes.nodes) {
      changesBatchRef.current.nodes.push(...changes.nodes);
    }
    
    if (changes.edges) {
      changesBatchRef.current.edges.push(...changes.edges);
    }
    
    if (!updateTimeoutRef.current) {
      updateTimeoutRef.current = setTimeout(() => {
        if (changesBatchRef.current.nodes.length > 0) {
          setNodes(nodes => applyNodeChanges(changesBatchRef.current.nodes, nodes));
        }
        
        if (changesBatchRef.current.edges.length > 0) {
          setEdges(edges => applyEdgeChanges(changesBatchRef.current.edges, edges));
        }
        
        // Reset batch
        changesBatchRef.current = { nodes: [], edges: [] };
        updateTimeoutRef.current = null;
      }, BATCH_UPDATE_MS);
    }
  }, [setNodes, setEdges]);
  
  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as Node<AgentNode>);
  }, []);
  
  // Handle node deselection
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);
  
  // Handle node change from properties panel with memo
  const handleNodeDataChange = useCallback((nodeId: string, updatedData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...updatedData
            },
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
  const createDefaultNodeData = useCallback((type: AgentNodeType, label: string): AgentNode => {
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
  }, []);
  
  // Initial load of workflow
  useEffect(() => {
    if (!initialWorkflow) return;
    
    // Clear existing nodes and edges
    setNodes([]);
    setEdges([]);
    
    // Convert workflow nodes to ReactFlow nodes
    const rfNodes = initialWorkflow.nodes.map((node) => {
      // Create a properly typed nodeData object
      const nodeData = node.data || {};
      
      // Add the type to the data for easy access
      (nodeData as any).type = node.type;
      
      // Ensure node data has a label field
      if (!('label' in nodeData)) {
        (nodeData as any).label = node.label || node.type;
      }
      
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        data: nodeData,
      };
    });
    
    // Convert workflow edges to ReactFlow edges
    const rfEdges = initialWorkflow.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label || '',
      animated: edge.animated,
      style: edge.style,
    }));
    
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [initialWorkflow, setNodes, setEdges]);
  
  // Notify parent of changes
  const notifyChanges = useCallback(() => {
    if (!onWorkflowChange) return;
    
    const currentWorkflow: Workflow = {
      id: initialWorkflow?.id || `workflow-${Date.now()}`,
      name: initialWorkflow?.name || 'Workflow',
      nodes: nodes.map((node) => {
        // Make a copy of the node data to avoid modifying the original
        const nodeData = {...node.data} as any;
        
        // Ensure the node has a type property
        const type = node.type as AgentNodeType;
        
        // Ensure the node has a label
        const label = nodeData.label || type;
        
        return {
          id: node.id,
          type: type,
          label: label,
          position: node.position,
          data: nodeData,
        };
      }) as AgentNode[],
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: (edge.label as string) || '',
      })),
    };
    
    onWorkflowChange(currentWorkflow);
  }, [nodes, edges, onWorkflowChange, initialWorkflow]);
  
  // Update parent component when nodes or edges change
  useEffect(() => {
    notifyChanges();
  }, [nodes, edges, notifyChanges]);
  
  // Handle drag start for new nodes
  const onDragStart = (event: React.DragEvent, nodeType: string, nodeName: string) => {
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
  
  // Get current workflow state
  const getCurrentWorkflow = useCallback((): Workflow => {
    return {
      id: initialWorkflow?.id || `workflow-${Date.now()}`,
      name: initialWorkflow?.name || 'Workflow',
      nodes: nodes.map((node) => {
        // Make a copy of the node data to avoid modifying the original
        const nodeData = {...node.data} as any;
        
        // Ensure the node has a type property
        const type = node.type as AgentNodeType;
        
        // Ensure the node has a label
        const label = nodeData.label || type;
        
        return {
          id: node.id,
          type: type,
          label: label,
          position: node.position,
          data: nodeData,
        };
      }) as AgentNode[],
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: (edge.label as string) || '',
      })),
    };
  }, [nodes, edges, initialWorkflow]);
  
  // This is now wrapped inside the ReactFlowProvider
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
        
        {/* Error display */}
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            borderBottom: '1px solid #fecaca',
          }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Error occurred:</p>
            <p style={{ margin: 0 }}>{error}</p>
            <button 
              onClick={() => setError(null)}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                border: 'none',
                backgroundColor: '#b91c1c',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
        )}
        
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
              // Handle potential errors during render
              onError={(error) => {
                console.error('ReactFlow error:', error);
                setError(`ReactFlow error: ${typeof error === 'object' && error !== null && 'message' in error 
                  ? (error as { message: string }).message 
                  : String(error)}`);
              }}
            >
              <Controls showInteractive={false} />
              <MiniMap style={{ height: 120 }} zoomable pannable />
              <Background gap={15} size={1} />
            </ReactFlow>
          </div>
          
          {/* Mermaid Panel (if visible) */}
          {showMermaidPanel && (
            <MermaidPanel 
              workflow={getCurrentWorkflow()} 
              onImport={(workflow) => {
                if (readOnly) return;
                
                try {
                  setNodes(
                    workflow.nodes.map((node) => ({
                      id: node.id,
                      type: node.type,
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
                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : 'Unknown import error';
                  setError(`Failed to import workflow: ${errorMessage}`);
                }
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

// Wrap component with React.memo for better performance
const MemoizedWorkflowCanvasInner = React.memo(WorkflowCanvasInner);

/**
 * Wrapper component that provides ReactFlow context
 */
const WorkflowCanvas: React.FC<WorkflowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <MemoizedWorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
};

export default React.memo(WorkflowCanvas); 