/**
 * Workflow Context
 * Provides workflow execution and management functionality.
 */
import React, { createContext, useContext, useCallback } from 'react';
import { 
  IWorkflowService, 
  WorkflowExecutionResult 
} from '../../services/interfaces/IWorkflowService';
import { Workflow } from '../../features/workflow-designer/types/agent-types';
import { useConnection } from './ConnectionContext';

interface WorkflowContextType {
  executeWorkflow: (method: string, params: Record<string, unknown>) => Promise<WorkflowExecutionResult>;
  getAvailableWorkflows: () => Promise<string[]>;
  saveWorkflow: (workflow: Workflow) => Promise<void>;
  loadWorkflow: (id: string) => Promise<Workflow>;
}

// Create context with a default value
const WorkflowContext = createContext<WorkflowContextType | null>(null);

// Custom hook to use the workflow context
export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

interface WorkflowProviderProps {
  workflowService: IWorkflowService;
  children: React.ReactNode;
}

// Provider component
export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ 
  workflowService, 
  children 
}) => {
  // Get connection status from connection context
  const { isConnected } = useConnection();

  // Execute a workflow
  const executeWorkflow = useCallback(async (
    method: string, 
    params: Record<string, unknown>
  ): Promise<WorkflowExecutionResult> => {
    if (!isConnected) {
      return {
        success: false,
        error: 'Not connected to MCP server'
      };
    }

    try {
      return await workflowService.executeWorkflow(method, params);
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }, [workflowService, isConnected]);

  // Get available workflows
  const getAvailableWorkflows = useCallback(async (): Promise<string[]> => {
    try {
      return await workflowService.getAvailableWorkflows();
    } catch (error) {
      console.error('Failed to get available workflows:', error);
      return [];
    }
  }, [workflowService]);

  // Save a workflow
  const saveWorkflow = useCallback(async (workflow: Workflow): Promise<void> => {
    try {
      await workflowService.saveWorkflow(workflow);
    } catch (error) {
      console.error('Failed to save workflow:', error);
      throw error;
    }
  }, [workflowService]);

  // Load a workflow
  const loadWorkflow = useCallback(async (id: string): Promise<Workflow> => {
    try {
      return await workflowService.loadWorkflow(id);
    } catch (error) {
      console.error(`Failed to load workflow ${id}:`, error);
      throw error;
    }
  }, [workflowService]);

  // Create value object
  const value: WorkflowContextType = {
    executeWorkflow,
    getAvailableWorkflows,
    saveWorkflow,
    loadWorkflow,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};
