/**
 * MermaidPanel.tsx
 * Component for displaying and editing Mermaid diagrams
 */

import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Workflow } from '../../types/agent-types';
import { generateMermaidDiagram } from '../../utils/mermaid/mermaid-generator';
import { parseMermaidToWorkflow } from '../../utils/mermaid/mermaid-parser';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  logLevel: 'error',
});

interface MermaidPanelProps {
  workflow: Workflow;
  onImport: (workflow: Workflow) => void;
  readOnly?: boolean;
}

/**
 * Panel for displaying and editing Mermaid diagrams
 */
const MermaidPanel: React.FC<MermaidPanelProps> = ({
  workflow,
  onImport,
  readOnly = false,
}) => {
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const diagramRef = useRef<HTMLDivElement>(null);
  
  // Generate Mermaid code from workflow
  useEffect(() => {
    if (!editMode) {
      try {
        const code = generateMermaidDiagram(workflow);
        // Ensure we have a valid diagram structure even if empty
        if (!code.trim() || !code.includes('graph')) {
          // Provide default structure if the generated code is empty or invalid
          setMermaidCode(`graph TB
    start["Start"]
    end["End"]
    start --> end
    
    class start input
    class end output`);
        } else {
          setMermaidCode(code);
        }
      } catch (error) {
        console.error('Error generating Mermaid diagram:', error);
        // Set a fallback diagram
        setMermaidCode(`graph TB
    error["Error Generating Diagram"]
    
    class error input`);
      }
    }
  }, [workflow, editMode]);
  
  // Render Mermaid diagram
  useEffect(() => {
    if (diagramRef.current && !editMode) {
      try {
        diagramRef.current.innerHTML = '';
        
        // Validate that we have a valid Mermaid diagram
        if (!mermaidCode.trim()) {
          diagramRef.current.innerHTML = '<div style="color: red;">Empty diagram code</div>';
          return;
        }
        
        mermaid.render('mermaid-diagram', mermaidCode).then((result) => {
          if (diagramRef.current) {
            diagramRef.current.innerHTML = result.svg;
          }
        }).catch((error) => {
          console.error('Mermaid rendering error:', error);
          if (diagramRef.current) {
            diagramRef.current.innerHTML = `<div style="color: red;">Error rendering diagram: ${error.message}</div>`;
          }
        });
      } catch (error) {
        console.error('Failed to render Mermaid diagram:', error);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = `<div style="color: red;">Error rendering diagram: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
        }
      }
    }
  }, [mermaidCode, editMode]);
  
  // Handle code change
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMermaidCode(e.target.value);
  };
  
  // Handle import
  const handleImport = () => {
    try {
      const importedWorkflow = parseMermaidToWorkflow(mermaidCode);
      onImport(importedWorkflow);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to import Mermaid diagram:', error);
      alert('Failed to import Mermaid diagram. Please check the syntax and try again.');
    }
  };
  
  return (
    <div style={{
      width: '300px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid #e2e8f0',
      background: 'white',
    }}>
      <div style={{
        padding: '10px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          Mermaid Diagram
        </h3>
        
        {!readOnly && (
          <div>
            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                padding: '4px 8px',
                background: editMode ? '#3b82f6' : '#f8fafc',
                color: editMode ? 'white' : '#64748b',
                border: '1px solid #94a3b8',
                borderRadius: '4px',
                marginRight: '8px',
                cursor: 'pointer',
              }}
            >
              {editMode ? 'View' : 'Edit'}
            </button>
            
            {editMode && (
              <button
                onClick={handleImport}
                style={{
                  padding: '4px 8px',
                  background: '#10b981',
                  color: 'white',
                  border: '1px solid #059669',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Import
              </button>
            )}
          </div>
        )}
      </div>
      
      <div style={{ flexGrow: 1, overflow: 'auto', padding: '10px' }}>
        {editMode ? (
          <textarea
            value={mermaidCode}
            onChange={handleCodeChange}
            style={{
              width: '100%',
              height: '100%',
              fontFamily: 'monospace',
              border: '1px solid #e2e8f0',
              padding: '8px',
              resize: 'none',
            }}
            readOnly={readOnly}
          />
        ) : (
          <div
            ref={diagramRef}
            style={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MermaidPanel; 