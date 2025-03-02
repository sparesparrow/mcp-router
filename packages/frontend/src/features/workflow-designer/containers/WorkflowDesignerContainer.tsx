/**
 * Workflow Designer Container
 * Main container component for the workflow designer feature.
 * Manages workflow state and provides subcomponents with necessary props.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNotification } from '../../../contexts/services/NotificationContext';
import { useWorkflow } from '../../../contexts/services/WorkflowContext';
import { Workflow } from '../types/agent-types';
import WorkflowHeader from '../components/WorkflowHeader';
import WorkflowCanvas from '../components/Canvas';
import { generateMermaidDiagram } from '../utils/mermaid/mermaid-generator';
import { parseMermaidToWorkflow } from '../utils/mermaid/mermaid-parser';

interface WorkflowDesignerContainerProps {
  initialWorkflow?: Workflow;
  onSave?: (workflow: Workflow) => void;
  readOnly?: boolean;
}

const STORAGE_KEY = 'mcp-workflow-designer-state';

/**
 * WorkflowDesignerContainer manages the state and operations for the workflow designer.
 * It separates concerns from UI components and handles data flow between them.
 */
const WorkflowDesignerContainer: React.FC<WorkflowDesignerContainerProps> = ({
  initialWorkflow,
  onSave,
  readOnly = false,
}) => {
  // Context hooks
  const { success, error: showError } = useNotification();
  const { saveWorkflow } = useWorkflow();

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
      id: `workflow-${uuidv4()}`,
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
  }, [workflow, addToHistory, createNewWorkflow]);

  // Handle workflow changes
  const handleWorkflowChange = useCallback((updatedWorkflow: Workflow) => {
    setWorkflow(updatedWorkflow);
    setSaveStatus('unsaved');
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
  const handleSave = useCallback(async () => {
    if (!workflow) return;
    
    try {
      setSaveStatus('saving');
      
      // Add current state to history
      addToHistory(workflow);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workflow));
      
      // Call external save handler or service
      if (onSave) {
        onSave(workflow);
      } else {
        await saveWorkflow(workflow);
      }
      
      setSaveStatus('saved');
      success('Workflow saved successfully');
    } catch (err) {
      console.error('Failed to save workflow:', err);
      setSaveStatus('unsaved');
      showError('Failed to save workflow. Please try again.');
    }
  }, [workflow, onSave, addToHistory, saveWorkflow, success, showError]);

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
      success('Workflow imported successfully');
    } catch (err) {
      console.error('Failed to import workflow:', err);
      showError('Failed to import workflow. Please check the format and try again.');
    }
  }, [addToHistory, success, showError]);

  return (
    <div className="workflow-designer-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header with workflow info and controls */}
      <WorkflowHeader
        workflowName={workflowName}
        saveStatus={saveStatus}
        onNameChange={handleNameChange}
        onSave={handleSave}
        onNew={createNewWorkflow}
        onUndo={handleUndo}
        canUndo={historyIndex > 0}
        onRedo={handleRedo}
        canRedo={historyIndex < workflowHistory.length - 1}
        onExport={handleExport}
        exportFormat={exportFormat}
        onExportFormatChange={(format) => setExportFormat(format as 'json' | 'mermaid')}
        onImport={handleImport}
        exportModalOpen={showExportModal}
        onExportModalClose={() => setShowExportModal(false)}
        exportedData={exportedData}
        readOnly={readOnly}
      />
      
      {/* Main canvas */}
      {workflow && (
        <WorkflowCanvas
          initialWorkflow={workflow}
          onWorkflowChange={handleWorkflowChange}
          readOnly={readOnly}
        />
      )}
    </div>
  );
};

export default WorkflowDesignerContainer;
