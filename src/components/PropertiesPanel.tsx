/**
 * PropertiesPanel.tsx
 * Component for editing properties of selected nodes
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Node } from 'reactflow';
import { 
  AgentNode, 
  AgentNodeType, 
  LLMNode, 
  ToolNode, 
  ResourceNode, 
  RouterNode,
  ParallelNode,
  OrchestratorNode,
  EvaluatorNode,
  InputNode,
  OutputNode,
  ConditionNode
} from '../types/agent-types';

interface PropertiesPanelProps {
  selectedNode: Node<AgentNode> | null;
  onNodeChange: (nodeId: string, data: AgentNode) => void;
  readOnly?: boolean;
}

/**
 * Properties panel for editing node properties
 */
const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  onNodeChange,
  readOnly = false,
}) => {
  const [nodeData, setNodeData] = useState<AgentNode | null>(null);
  
  // Update local state when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setNodeData(selectedNode.data);
    } else {
      setNodeData(null);
    }
  }, [selectedNode]);
  
  // Update parent component when data changes
  const handleDataChange = useCallback(() => {
    if (selectedNode && nodeData) {
      onNodeChange(selectedNode.id, nodeData);
    }
  }, [selectedNode, nodeData, onNodeChange]);
  
  // Handle text input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, field: string) => {
    if (!nodeData) return;
    
    setNodeData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        [field]: e.target.value,
      };
    });
  }, [nodeData]);
  
  // Handle checkbox changes
  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (!nodeData) return;
    
    setNodeData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        [field]: e.target.checked,
      };
    });
  }, [nodeData]);
  
  // Handle blur event to propagate changes upward
  const handleBlur = useCallback(() => {
    handleDataChange();
  }, [handleDataChange]);
  
  // Render form based on node type
  const renderForm = () => {
    if (!nodeData || !selectedNode) return null;
    
    // Common fields for all node types
    const commonFields = (
      <>
        <div className="form-group">
          <label>Label</label>
          <input
            type="text"
            value={nodeData.label || ''}
            onChange={(e) => handleInputChange(e, 'label')}
            onBlur={handleBlur}
            disabled={readOnly}
            placeholder="Node Label"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
            }}
          />
        </div>
      </>
    );
    
    // Render fields specific to each node type
    switch (nodeData.type) {
      case AgentNodeType.LLM:
        return (
          <>
            {commonFields}
            <div className="form-group">
              <label>Provider</label>
              <input
                type="text"
                value={(nodeData as LLMNode).provider || ''}
                onChange={(e) => handleInputChange(e, 'provider')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="e.g., OpenAI, Anthropic"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                value={(nodeData as LLMNode).model || ''}
                onChange={(e) => handleInputChange(e, 'model')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="e.g., gpt-4, claude-3"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
            <div className="form-group">
              <label>Prompt Template</label>
              <textarea
                value={(nodeData as LLMNode).promptTemplate || ''}
                onChange={(e) => handleInputChange(e, 'promptTemplate')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="Enter prompt template"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                  minHeight: '120px',
                  resize: 'vertical',
                }}
              />
            </div>
          </>
        );
        
      case AgentNodeType.TOOL:
        return (
          <>
            {commonFields}
            <div className="form-group">
              <label>Server</label>
              <input
                type="text"
                value={(nodeData as ToolNode).serverName || ''}
                onChange={(e) => handleInputChange(e, 'serverName')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="Server name"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
            <div className="form-group">
              <label>Tool</label>
              <input
                type="text"
                value={(nodeData as ToolNode).toolName || ''}
                onChange={(e) => handleInputChange(e, 'toolName')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="Tool name"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
            <div className="form-group">
              <label>Input Schema</label>
              <textarea
                value={(nodeData as ToolNode).inputSchema || ''}
                onChange={(e) => handleInputChange(e, 'inputSchema')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="JSON Schema"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                  minHeight: '120px',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </>
        );
        
      case AgentNodeType.RESOURCE:
        return (
          <>
            {commonFields}
            <div className="form-group">
              <label>Server</label>
              <input
                type="text"
                value={(nodeData as ResourceNode).serverName || ''}
                onChange={(e) => handleInputChange(e, 'serverName')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="Server name"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
            <div className="form-group">
              <label>URI</label>
              <input
                type="text"
                value={(nodeData as ResourceNode).uri || ''}
                onChange={(e) => handleInputChange(e, 'uri')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="Resource URI"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
            <div className="form-group">
              <label>MIME Type</label>
              <input
                type="text"
                value={(nodeData as ResourceNode).mimeType || ''}
                onChange={(e) => handleInputChange(e, 'mimeType')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="e.g., application/json"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
          </>
        );
        
      case AgentNodeType.ROUTER:
        return (
          <>
            {commonFields}
            <div className="form-group">
              <label>Routing Field</label>
              <input
                type="text"
                value={(nodeData as RouterNode).routingField || ''}
                onChange={(e) => handleInputChange(e, 'routingField')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="Field to route on"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
            <div className="form-group">
              <label>Routes (JSON)</label>
              <textarea
                value={(nodeData as RouterNode).routes ? JSON.stringify((nodeData as RouterNode).routes, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const routes = JSON.parse(e.target.value);
                    setNodeData(prev => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        routes,
                      } as RouterNode;
                    });
                  } catch (error) {
                    // Don't update if invalid JSON
                    console.error('Invalid JSON:', error);
                  }
                }}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder='{"value1": "nodeId1", "value2": "nodeId2"}'
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                  minHeight: '120px',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                }}
              />
            </div>
            <div className="form-group">
              <label>Default Target Node ID</label>
              <input
                type="text"
                value={(nodeData as RouterNode).defaultTargetNodeId || ''}
                onChange={(e) => handleInputChange(e, 'defaultTargetNodeId')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="Node ID for default route"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
          </>
        );
        
      case AgentNodeType.PARALLEL:
        return (
          <>
            {commonFields}
            <div className="form-group">
              <label>Mode</label>
              <select
                value={(nodeData as ParallelNode).mode || 'all'}
                onChange={(e) => handleInputChange(e, 'mode')}
                onBlur={handleBlur}
                disabled={readOnly}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <option value="all">All</option>
                <option value="race">Race</option>
              </select>
            </div>
            <div className="form-group">
              <label>Aggregation Strategy</label>
              <select
                value={(nodeData as ParallelNode).aggregationStrategy || 'array'}
                onChange={(e) => handleInputChange(e, 'aggregationStrategy')}
                onBlur={handleBlur}
                disabled={readOnly}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <option value="array">Array</option>
                <option value="object">Object</option>
                <option value="concat">Concatenate</option>
              </select>
            </div>
            <div className="form-group">
              <label>Target Nodes (comma-separated)</label>
              <input
                type="text"
                value={(nodeData as ParallelNode).targetNodeIds?.join(',') || ''}
                onChange={(e) => {
                  const nodeIds = e.target.value.split(',').map(id => id.trim()).filter(Boolean);
                  setNodeData(prev => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      targetNodeIds: nodeIds,
                    } as ParallelNode;
                  });
                }}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="node1,node2,node3"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
          </>
        );
        
      case AgentNodeType.ORCHESTRATOR:
        return (
          <>
            {commonFields}
            <div className="form-group">
              <label>Max Workers</label>
              <input
                type="number"
                value={(nodeData as OrchestratorNode).maxWorkers || 5}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setNodeData(prev => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      maxWorkers: isNaN(value) ? 5 : value,
                    } as OrchestratorNode;
                  });
                }}
                onBlur={handleBlur}
                disabled={readOnly}
                min={1}
                max={100}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
            <div className="form-group">
              <label>Aggregation Strategy</label>
              <select
                value={(nodeData as OrchestratorNode).aggregationStrategy || 'array'}
                onChange={(e) => handleInputChange(e, 'aggregationStrategy')}
                onBlur={handleBlur}
                disabled={readOnly}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <option value="array">Array</option>
                <option value="object">Object</option>
                <option value="concat">Concatenate</option>
              </select>
            </div>
            <div className="form-group">
              <label>Worker Template</label>
              <textarea
                value={(nodeData as OrchestratorNode).workerTemplate || ''}
                onChange={(e) => handleInputChange(e, 'workerTemplate')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="Worker template JSON or format string"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                  minHeight: '120px',
                  resize: 'vertical',
                }}
              />
            </div>
          </>
        );
        
      case AgentNodeType.EVALUATOR:
        return (
          <>
            {commonFields}
            <div className="form-group">
              <label>Max Iterations</label>
              <input
                type="number"
                value={(nodeData as EvaluatorNode).maxIterations || 3}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setNodeData(prev => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      maxIterations: isNaN(value) ? 3 : value,
                    } as EvaluatorNode;
                  });
                }}
                onBlur={handleBlur}
                disabled={readOnly}
                min={1}
                max={100}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
            <div className="form-group">
              <label>Threshold</label>
              <input
                type="number"
                value={(nodeData as EvaluatorNode).threshold || 0.8}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setNodeData(prev => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      threshold: isNaN(value) ? 0.8 : value,
                    } as EvaluatorNode;
                  });
                }}
                onBlur={handleBlur}
                disabled={readOnly}
                min={0}
                max={1}
                step={0.01}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
            <div className="form-group">
              <label>Evaluation Criteria</label>
              <textarea
                value={(nodeData as EvaluatorNode).evaluationCriteria || ''}
                onChange={(e) => handleInputChange(e, 'evaluationCriteria')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="Criteria for evaluation"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                  minHeight: '120px',
                  resize: 'vertical',
                }}
              />
            </div>
            <div className="form-group">
              <label>Target Node ID</label>
              <input
                type="text"
                value={(nodeData as EvaluatorNode).targetNodeId || ''}
                onChange={(e) => handleInputChange(e, 'targetNodeId')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="Node ID to iterate on"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
          </>
        );
        
      case AgentNodeType.INPUT:
        return (
          <>
            {commonFields}
            <div className="form-group">
              <label>Schema</label>
              <textarea
                value={(nodeData as InputNode).schema || ''}
                onChange={(e) => handleInputChange(e, 'schema')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="JSON Schema for input"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                  minHeight: '120px',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </>
        );
        
      case AgentNodeType.OUTPUT:
        return (
          <>
            {commonFields}
            <div className="form-group">
              <label>Output Template</label>
              <textarea
                value={(nodeData as OutputNode).outputTemplate || ''}
                onChange={(e) => handleInputChange(e, 'outputTemplate')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="Template for formatting output"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                  minHeight: '120px',
                  resize: 'vertical',
                }}
              />
            </div>
          </>
        );
        
      case AgentNodeType.CONDITION:
        return (
          <>
            {commonFields}
            <div className="form-group">
              <label>Condition</label>
              <textarea
                value={(nodeData as ConditionNode).condition || ''}
                onChange={(e) => handleInputChange(e, 'condition')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="Condition expression"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                  minHeight: '120px',
                  resize: 'vertical',
                }}
              />
            </div>
            <div className="form-group">
              <label>True Target Node ID</label>
              <input
                type="text"
                value={(nodeData as ConditionNode).trueTargetNodeId || ''}
                onChange={(e) => handleInputChange(e, 'trueTargetNodeId')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="Node ID for true condition"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
            <div className="form-group">
              <label>False Target Node ID</label>
              <input
                type="text"
                value={(nodeData as ConditionNode).falseTargetNodeId || ''}
                onChange={(e) => handleInputChange(e, 'falseTargetNodeId')}
                onBlur={handleBlur}
                disabled={readOnly}
                placeholder="Node ID for false condition"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>
          </>
        );
        
      default:
        return commonFields;
    }
  };
  
  if (!selectedNode || !nodeData) {
    return (
      <div className="properties-panel" style={{
        width: '300px',
        height: '100%',
        padding: '16px',
        borderLeft: '1px solid #e2e8f0',
        background: '#f8fafc',
        overflow: 'auto',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: '#94a3b8',
          fontSize: '14px',
          textAlign: 'center',
        }}>
          <p>Select a node to edit its properties</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="properties-panel" style={{
      width: '300px',
      height: '100%',
      padding: '16px',
      borderLeft: '1px solid #e2e8f0',
      background: '#f8fafc',
      overflow: 'auto',
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1e293b',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '8px',
      }}>
        {nodeData.type} Properties
      </h3>
      
      <div className="properties-form" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {renderForm()}
      </div>
    </div>
  );
};

export default PropertiesPanel; 