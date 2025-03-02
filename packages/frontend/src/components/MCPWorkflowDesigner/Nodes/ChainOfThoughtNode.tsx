/**
 * Chain of Thought Node Component
 * 
 * A specialized node type for implementing chain of thought reasoning.
 * Extends the BaseNodeComponent to maintain consistent behavior.
 */
import React, { useState, useCallback } from 'react';
import { NodeProps } from 'reactflow';
import BaseNodeComponent, { BaseNodeData } from './BaseNodeComponent';

// Extend the base node data with chain of thought specific properties
export interface ChainOfThoughtNodeData extends BaseNodeData {
  // Chain of thought specific configuration
  maxThoughts?: number;
  thoughtTemplate?: string;
  requireVerification?: boolean;
  
  // Runtime state
  currentThought?: string;
  thoughtHistory?: string[];
  conclusion?: string;
}

// Props for the Chain of Thought node
export type ChainOfThoughtNodeProps = NodeProps<ChainOfThoughtNodeData>;

/**
 * Chain of Thought Node Component
 * 
 * Implements a node that performs step-by-step reasoning
 * to solve complex problems or make decisions.
 */
export const ChainOfThoughtNode: React.FC<ChainOfThoughtNodeProps> = (props) => {
  const { data } = props;
  
  // Local state for editing configuration
  const [isEditing, setIsEditing] = useState(false);
  const [maxThoughts, setMaxThoughts] = useState(data.maxThoughts || 5);
  const [thoughtTemplate, setThoughtTemplate] = useState(
    data.thoughtTemplate || "Step {{step}}: "
  );
  
  // Toggle edit mode
  const handleToggleEdit = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);
  
  // Save configuration changes
  const handleSaveConfig = useCallback(() => {
    // This would update the node data through a context or callback
    console.log('Saving config:', { maxThoughts, thoughtTemplate });
    setIsEditing(false);
  }, [maxThoughts, thoughtTemplate]);
  
  // Render the thought history if available
  const renderThoughtHistory = () => {
    if (!data.thoughtHistory || data.thoughtHistory.length === 0) {
      return <div className="no-thoughts">No thoughts recorded yet</div>;
    }
    
    return (
      <div className="thought-history">
        {data.thoughtHistory.map((thought, index) => (
          <div key={index} className="thought-item">
            <div className="thought-number">{index + 1}</div>
            <div className="thought-content">{thought}</div>
          </div>
        ))}
        
        {data.conclusion && (
          <div className="thought-conclusion">
            <strong>Conclusion:</strong> {data.conclusion}
          </div>
        )}
      </div>
    );
  };
  
  // Render the configuration form when editing
  const renderConfigForm = () => {
    return (
      <div className="node-config-form">
        <div className="form-group">
          <label htmlFor="maxThoughts">Maximum Thoughts:</label>
          <input
            id="maxThoughts"
            type="number"
            min="1"
            max="20"
            value={maxThoughts}
            onChange={(e) => setMaxThoughts(parseInt(e.target.value, 10))}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="thoughtTemplate">Thought Template:</label>
          <input
            id="thoughtTemplate"
            type="text"
            value={thoughtTemplate}
            onChange={(e) => setThoughtTemplate(e.target.value)}
          />
        </div>
        
        <div className="form-actions">
          <button onClick={handleSaveConfig}>Save</button>
          <button onClick={handleToggleEdit}>Cancel</button>
        </div>
      </div>
    );
  };
  
  // Custom content for the Chain of Thought node
  const customContent = (
    <div className="chain-of-thought-content">
      {isEditing ? renderConfigForm() : (
        <>
          <div className="node-config-summary">
            <div>Max Thoughts: {data.maxThoughts || 5}</div>
            <div>Template: {data.thoughtTemplate || "Step {{step}}: "}</div>
            <button 
              className="edit-config-button" 
              onClick={handleToggleEdit}
            >
              Edit
            </button>
          </div>
          
          {renderThoughtHistory()}
        </>
      )}
    </div>
  );
  
  // Use the BaseNodeComponent to maintain consistent behavior
  return (
    <BaseNodeComponent
      {...props}
      className="chain-of-thought-node"
    >
      {customContent}
    </BaseNodeComponent>
  );
};

export default ChainOfThoughtNode; 