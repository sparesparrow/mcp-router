/**
 * WorkflowDesigner.tsx
 * Main application component for the workflow designer
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Workflow } from './types/agent-types';
import WorkflowCanvas from './components/Canvas';
import { generateMermaidDiagram } from './utils/mermaid/mermaid-generator';
import { parseMermaidToWorkflow } from './utils/mermaid/mermaid-parser';

const STORAGE_KEY = 'mcp-workflow-designer-state';

interface WorkflowDesignerProps {
  initialWorkflow?: Workflow;
  onSave?: (workflow: Workflow) => void;
  readOnly?: boolean;
}

/**
 * Main WorkflowDesigner component that manages workflow state and operations
 */
const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  initialWorkflow,
  onSave,
  readOnly = false,
}) => {
  // State
  const [workflow, setWorkflow] = useState<Workflow | undefined>(initialWorkflow);
  const [workflowHistory, setWorkflowHistory] = useState<Workflow[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const [workflowName, setWorkflowName] = useState<string>(initialWorkflow?.name || 'New Workflow');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'mermaid'>('json');
  const [exportedData, setExportedData] = useState<string>('');
  
  // Add a workflow to the history
  const addToHistory = useCallback((workflow: Workflow) => {
    setWorkflowHistory(prev => {
      // If we're not at the end of the history, truncate
      const newHistory = historyIndex >= 0 && historyIndex < prev.length - 1
        ? prev.slice(0, historyIndex + 1)
        : [...prev];
      
      // Add the new workflow if it's different from the latest
      if (
        newHistory.length === 0 ||
        JSON.stringify(newHistory[newHistory.length - 1]) !== JSON.stringify(workflow)
      ) {
        newHistory.push({ ...workflow });
        setHistoryIndex(newHistory.length - 1);
      }
      
      // Keep at most 30 history states
      if (newHistory.length > 30) {
        return newHistory.slice(newHistory.length - 30);
      }
      
      return newHistory;
    });
  }, [historyIndex]);
  
  // Create a new empty workflow
  const createNewWorkflow = useCallback(() => {
    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: 'New Workflow',
      nodes: [],
      edges: [],
    };
    
    setWorkflow(newWorkflow);
    setWorkflowName(newWorkflow.name);
    addToHistory(newWorkflow);
    setSaveStatus('unsaved');
  }, [addToHistory]);
  
  // Initialize workflow if not provided
  useEffect(() => {
    if (!workflow) {
      // Try to load from localStorage
      const savedWorkflow = localStorage.getItem(STORAGE_KEY);
      if (savedWorkflow) {
        try {
          const parsedWorkflow = JSON.parse(savedWorkflow) as Workflow;
          setWorkflow(parsedWorkflow);
          setWorkflowName(parsedWorkflow.name);
          addToHistory(parsedWorkflow);
        } catch (error) {
          console.error('Failed to parse saved workflow:', error);
          createNewWorkflow();
        }
      } else {
        createNewWorkflow();
      }
    } else {
      addToHistory(workflow);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow]); // Add workflow dependency but use eslint-disable to prevent infinite loop
  
  // Handle workflow changes
  const handleWorkflowChange = useCallback((updatedWorkflow: Workflow) => {
    setWorkflow(updatedWorkflow);
    setSaveStatus('unsaved');
    
    // Don't add every single change to history to avoid performance issues
    // We'll add significant changes on certain actions
  }, []);
  
  // Handle workflow name change
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setWorkflowName(newName);
    
    if (workflow) {
      const updatedWorkflow = { ...workflow, name: newName };
      setWorkflow(updatedWorkflow);
      setSaveStatus('unsaved');
    }
  }, [workflow]);
  
  // Save the workflow
  const saveWorkflow = useCallback(() => {
    if (!workflow) return;
    
    setSaveStatus('saving');
    
    // Add current state to history
    addToHistory(workflow);
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workflow));
      
      // Call external onSave handler if provided
      if (onSave) {
        onSave(workflow);
      }
      
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      setSaveStatus('unsaved');
      alert('Failed to save workflow. Please try again.');
    }
  }, [workflow, onSave, addToHistory]);
  
  // Undo the last change
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const previousWorkflow = workflowHistory[historyIndex - 1];
      setWorkflow(previousWorkflow);
      setWorkflowName(previousWorkflow.name);
      setHistoryIndex(historyIndex - 1);
      setSaveStatus('unsaved');
    }
  }, [historyIndex, workflowHistory]);
  
  // Redo the last undone change
  const handleRedo = useCallback(() => {
    if (historyIndex < workflowHistory.length - 1) {
      const nextWorkflow = workflowHistory[historyIndex + 1];
      setWorkflow(nextWorkflow);
      setWorkflowName(nextWorkflow.name);
      setHistoryIndex(historyIndex + 1);
      setSaveStatus('unsaved');
    }
  }, [historyIndex, workflowHistory]);
  
  // Export the workflow
  const handleExport = useCallback(() => {
    if (!workflow) return;
    
    let data = '';
    
    if (exportFormat === 'json') {
      // Export as JSON
      data = JSON.stringify(workflow, null, 2);
    } else {
      // Export as Mermaid diagram
      data = generateMermaidDiagram(workflow);
    }
    
    setExportedData(data);
    setShowExportModal(true);
  }, [workflow, exportFormat]);
  
  // Import a workflow
  const handleImport = useCallback((data: string) => {
    try {
      let importedWorkflow: Workflow;
      
      // Try to parse as JSON first
      try {
        importedWorkflow = JSON.parse(data) as Workflow;
      } catch {
        // If not valid JSON, try to parse as Mermaid
        importedWorkflow = parseMermaidToWorkflow(data);
      }
      
      // Validate basic workflow structure
      if (!importedWorkflow.id || !Array.isArray(importedWorkflow.nodes) || !Array.isArray(importedWorkflow.edges)) {
        throw new Error('Invalid workflow format');
      }
      
      setWorkflow(importedWorkflow);
      setWorkflowName(importedWorkflow.name || 'Imported Workflow');
      addToHistory(importedWorkflow);
      setSaveStatus('unsaved');
    } catch (error) {
      console.error('Failed to import workflow:', error);
      alert('Failed to import workflow. Please check the format and try again.');
    }
  }, [addToHistory]);
  
  // Download the workflow
  const handleDownload = useCallback(() => {
    if (!exportedData) return;
    
    const extension = exportFormat === 'json' ? 'json' : 'md';
    const filename = `${workflow?.name || 'workflow'}.${extension}`;
    const blob = new Blob([exportedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportedData, exportFormat, workflow]);
  
  // Copy to clipboard
  const handleCopy = useCallback(() => {
    if (!exportedData) return;
    
    navigator.clipboard.writeText(exportedData)
      .then(() => {
        alert('Copied to clipboard');
      })
      .catch((error) => {
        console.error('Failed to copy to clipboard:', error);
        alert('Failed to copy to clipboard. Please try again.');
      });
  }, [exportedData]);
  
  return (
    <div className="workflow-designer" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
    }}>
      {/* Header */}
      <header style={{
        padding: '10px 20px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div className="workflow-info" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <input
            type="text"
            value={workflowName}
            onChange={handleNameChange}
            placeholder="Workflow Name"
            disabled={readOnly}
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '5px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              width: '300px',
            }}
          />
          <span style={{
            fontSize: '14px',
            color: saveStatus === 'saved' ? '#10b981' : 
                   saveStatus === 'unsaved' ? '#f59e0b' : '#3b82f6',
            fontStyle: 'italic',
          }}>
            {saveStatus === 'saved' ? 'Saved' : 
             saveStatus === 'unsaved' ? 'Unsaved' : 'Saving...'}
          </span>
        </div>
        
        <div className="workflow-actions" style={{
          display: 'flex',
          gap: '10px',
        }}>
          <button
            onClick={createNewWorkflow}
            disabled={readOnly}
            style={{
              padding: '8px 16px',
              background: '#f8fafc',
              border: '1px solid #94a3b8',
              borderRadius: '4px',
              cursor: readOnly ? 'not-allowed' : 'pointer',
              opacity: readOnly ? 0.6 : 1,
            }}
          >
            New
          </button>
          
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0 || readOnly}
            style={{
              padding: '8px 16px',
              background: '#f8fafc',
              border: '1px solid #94a3b8',
              borderRadius: '4px',
              cursor: (historyIndex <= 0 || readOnly) ? 'not-allowed' : 'pointer',
              opacity: (historyIndex <= 0 || readOnly) ? 0.6 : 1,
            }}
          >
            Undo
          </button>
          
          <button
            onClick={handleRedo}
            disabled={historyIndex >= workflowHistory.length - 1 || readOnly}
            style={{
              padding: '8px 16px',
              background: '#f8fafc',
              border: '1px solid #94a3b8',
              borderRadius: '4px',
              cursor: (historyIndex >= workflowHistory.length - 1 || readOnly) ? 'not-allowed' : 'pointer',
              opacity: (historyIndex >= workflowHistory.length - 1 || readOnly) ? 0.6 : 1,
            }}
          >
            Redo
          </button>
          
          <button
            onClick={saveWorkflow}
            disabled={saveStatus === 'saved' || readOnly}
            style={{
              padding: '8px 16px',
              background: saveStatus === 'saved' ? '#f8fafc' : '#3b82f6',
              color: saveStatus === 'saved' ? '#64748b' : 'white',
              border: '1px solid ' + (saveStatus === 'saved' ? '#94a3b8' : '#2563eb'),
              borderRadius: '4px',
              cursor: (saveStatus === 'saved' || readOnly) ? 'not-allowed' : 'pointer',
              opacity: (saveStatus === 'saved' || readOnly) ? 0.6 : 1,
            }}
          >
            Save
          </button>
          
          <div style={{ width: '1px', background: '#e2e8f0', margin: '0 5px' }} />
          
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'json' | 'mermaid')}
            style={{
              padding: '8px',
              border: '1px solid #94a3b8',
              borderRadius: '4px',
            }}
          >
            <option value="json">JSON</option>
            <option value="mermaid">Mermaid</option>
          </select>
          
          <button
            onClick={handleExport}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: '1px solid #059669',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Export
          </button>
          
          <label
            htmlFor="import-file"
            style={{
              padding: '8px 16px',
              background: '#f8fafc',
              border: '1px solid #94a3b8',
              borderRadius: '4px',
              cursor: readOnly ? 'not-allowed' : 'pointer',
              opacity: readOnly ? 0.6 : 1,
              display: 'inline-block',
            }}
          >
            Import
            <input
              id="import-file"
              type="file"
              accept=".json,.md,.txt"
              onChange={(e) => {
                if (readOnly || !e.target.files?.[0]) return;
                
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                  if (event.target?.result) {
                    handleImport(event.target.result as string);
                  }
                };
                
                reader.readAsText(file);
                e.target.value = ''; // Reset the input
              }}
              disabled={readOnly}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </header>
      
      {/* Main content */}
      <main style={{
        flexGrow: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {workflow && (
          <WorkflowCanvas
            initialWorkflow={workflow}
            onWorkflowChange={handleWorkflowChange}
            readOnly={readOnly}
          />
        )}
      </main>
      
      {/* Export modal */}
      {showExportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0 }}>
                Export {exportFormat === 'json' ? 'JSON' : 'Mermaid Diagram'}
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              padding: '16px',
              overflow: 'auto',
              flexGrow: 1,
            }}>
              <textarea
                value={exportedData}
                readOnly
                style={{
                  width: '100%',
                  height: '300px',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  resize: 'none',
                }}
              />
            </div>
            
            <div style={{
              padding: '16px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}>
              <button
                onClick={handleCopy}
                style={{
                  padding: '8px 16px',
                  background: '#f8fafc',
                  border: '1px solid #94a3b8',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Copy to Clipboard
              </button>
              
              <button
                onClick={handleDownload}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: '1px solid #2563eb',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowDesigner; 