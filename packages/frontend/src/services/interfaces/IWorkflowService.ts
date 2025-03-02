/**
 * Workflow Service Interface
 * Defines the contract for workflow execution and management services.
 */
import { Workflow } from '../../features/workflow-designer/types/agent-types';

export interface WorkflowExecutionResult {
  success: boolean;
  executionId?: string;
  error?: string;
}

export interface IWorkflowService {
  /**
   * Executes a workflow
   * @param method The workflow ID/method to execute
   * @param params The parameters for workflow execution
   * @returns A promise resolving to the execution result
   */
  executeWorkflow(method: string, params: Record<string, unknown>): Promise<WorkflowExecutionResult>;
  
  /**
   * Gets a list of available workflows
   * @returns A promise resolving to a list of workflow IDs
   */
  getAvailableWorkflows(): Promise<string[]>;
  
  /**
   * Saves a workflow
   * @param workflow The workflow to save
   * @returns A promise resolving when save is complete
   */
  saveWorkflow(workflow: Workflow): Promise<void>;
  
  /**
   * Loads a workflow by ID
   * @param id The workflow ID
   * @returns A promise resolving to the loaded workflow
   */
  loadWorkflow(id: string): Promise<Workflow>;
}
