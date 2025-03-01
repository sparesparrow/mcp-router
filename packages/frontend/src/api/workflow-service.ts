/**
 * workflow-service.ts
 * Service for interacting with the workflow API endpoints
 */

import { apiClient } from './client';
import { Workflow } from '../features/workflow-designer/types/agent-types';

export interface WorkflowExecutionRequest {
  workflowId: string;
  context?: Record<string, any>;
}

export interface WorkflowExecutionResponse {
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface WorkflowStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface WorkflowListResponse {
  workflows: WorkflowSummary[];
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service for interacting with workflow API endpoints
 */
export class WorkflowService {
  /**
   * Get a list of all workflows
   */
  async getWorkflows(): Promise<WorkflowSummary[]> {
    try {
      const response = await apiClient.get('/api/workflows');
      return response.data.workflows;
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(id: string): Promise<Workflow> {
    try {
      const response = await apiClient.get(`/api/workflows/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflow: Workflow): Promise<Workflow> {
    try {
      const response = await apiClient.post('/api/workflows', workflow);
      return response.data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(id: string, workflow: Workflow): Promise<Workflow> {
    try {
      const response = await apiClient.put(`/api/workflows/${id}`, workflow);
      return response.data;
    } catch (error) {
      console.error(`Error updating workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/workflows/${id}`);
    } catch (error) {
      console.error(`Error deleting workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(request: WorkflowExecutionRequest): Promise<WorkflowExecutionResponse> {
    try {
      const response = await apiClient.post('/api/workflows/execute', request);
      return response.data;
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  }

  /**
   * Get the status of a workflow execution
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowStatus> {
    try {
      const response = await apiClient.get(`/api/workflows/executions/${executionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching execution status for ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Validate a workflow
   */
  async validateWorkflow(workflow: Workflow): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const response = await apiClient.post('/api/workflows/validate', workflow);
      return response.data;
    } catch (error) {
      console.error('Error validating workflow:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
export default workflowService; 