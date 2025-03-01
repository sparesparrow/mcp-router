/**
 * PropertiesPanel.tsx
 * Component for editing node properties
 */

import React from 'react';
import { Node } from 'reactflow';
import { AgentNode, AgentNodeType } from '../../types/agent-types';

interface PropertiesPanelProps {
  selectedNode: Node<AgentNode> | null;
  onNodeChange: (nodeId: string, data: AgentNode) => void;
  readOnly?: boolean;
}

/**
 * Panel for editing node properties
 */
const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  onNodeChange,
  readOnly = false,
}) => {
  if (!selectedNode) {
    return (
      <div style={{
        width: '300px',
        height: '100%',
        padding: '16px',
        borderLeft: '1px solid #e2e8f0',
        background: 'white',
      }}>
        <p style={{ color: '#64748b', textAlign: 'center', marginTop: '20px' }}>
          Select a node to edit its properties
        </p>
      </div>
    );
  }
  
  const handleChange = (field: string, value: any) => {
    if (readOnly) return;
    
    const updatedData = {
      ...selectedNode.data,
      [field]: value,
    };
    
    onNodeChange(selectedNode.id, updatedData);
  };
  
  const renderFields = () => {
    const nodeType = selectedNode.data.type;
    
    const commonFields = (
      <>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Label
          </label>
          <input
            type="text"
            value={selectedNode.data.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
            }}
            disabled={readOnly}
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Description
          </label>
          <textarea
            value={selectedNode.data.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              minHeight: '80px',
            }}
            disabled={readOnly}
          />
        </div>
      </>
    );
    
    // Render type-specific fields
    switch (nodeType) {
      case AgentNodeType.LLM:
        return (
          <>
            {commonFields}
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Model
              </label>
              <input
                type="text"
                value={selectedNode.data.model || ''}
                onChange={(e) => handleChange('model', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                }}
                disabled={readOnly}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Temperature
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={selectedNode.data.temperature || 0.7}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                }}
                disabled={readOnly}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                System Prompt
              </label>
              <textarea
                value={selectedNode.data.systemPrompt || ''}
                onChange={(e) => handleChange('systemPrompt', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  minHeight: '120px',
                }}
                disabled={readOnly}
              />
            </div>
          </>
        );
        
      // Add cases for other node types as needed
      
      default:
        return commonFields;
    }
  };
  
  return (
    <div style={{
      width: '300px',
      height: '100%',
      padding: '16px',
      borderLeft: '1px solid #e2e8f0',
      background: 'white',
      overflowY: 'auto',
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0',
        padding: '0 0 8px 0',
        borderBottom: '1px solid #e2e8f0',
        fontSize: '16px',
        fontWeight: 'bold',
      }}>
        Node Properties
      </h3>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
          Node Type
        </label>
        <div style={{
          padding: '8px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          color: '#64748b',
        }}>
          {selectedNode.data.type}
        </div>
      </div>
      
      {renderFields()}
    </div>
  );
};

export default PropertiesPanel; 