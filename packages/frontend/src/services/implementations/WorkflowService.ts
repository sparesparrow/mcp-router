/**
 * Workflow Service Implementation
 * Manages workflow execution and storage using HTTP and WebSocket services.
 */
import { IWorkflowService, WorkflowExecutionResult } from '../interfaces/IWorkflowService';
import { IHttpService } from '../interfaces/IHttpService';
import { IWebSocketService } from '../interfaces/IWebSocketService';
import { Workflow } from '../../features/workflow-designer/types/agent-types';
import { v4 as uuidv4 } from 'uuid';

export class WorkflowService implements IWorkflowService {
  constructor(
    private httpService: IHttpService,
    private webSocketService: IWebSocketService
  ) {}

  /**
   * Executes a workflow using WebSockets
   */
  async executeWorkflow(method: string, params: Record<string, unknown>): Promise<WorkflowExecutionResult> {
    if (!this.webSocketService.isConnected()) {
      throw new Error('Not connected to MCP server');
    }

    try {
      // Generate a unique execution ID
      const executionId = uuidv4();

      // Return a promise that resolves when we get a response
      const result = await new Promise<WorkflowExecutionResult>((resolve, reject) => {
        // Set a timeout
        const timeout = setTimeout(() => {
          reject(new Error('Workflow execution timed out'));
        }, 30000); // 30 second timeout
        
        // Set up one-time response handler
        const unsubscribe = this.webSocketService.on('workflow_result', (result: any) => {
          // Verify this is the response for our execution
          if (result.execution_id === executionId) {
            clearTimeout(timeout);
            unsubscribe();
            
            if (result.error) {
              resolve({
                success: false,
                executionId,
                error: result.error
              });
            } else {
              resolve({
                success: true,
                executionId
              });
            }
          }
        });
        
        // Send execution request via WebSocket
        this.webSocketService.emit('execute_workflow', {
          execution_id: executionId,
          workflow_id: method,
          context: params
        });
      });
      
      return result;
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Gets available workflows from the server
   */
  async getAvailableWorkflows(): Promise<string[]> {
    try {
      const response = await this.httpService.get<{ available_workflows: string[] }>('/api/workflows');
      return response.available_workflows;
    } catch (error) {
      console.error('Failed to get available workflows:', error);
      return [];
    }
  }

  /**
   * Saves a workflow to the server
   */
  async saveWorkflow(workflow: Workflow): Promise<void> {
    try {
      await this.httpService.post('/api/workflows', workflow);
    } catch (error) {
      console.error('Failed to save workflow:', error);
      throw error;
    }
  }

  /**
   * Loads a workflow from the server
   */
  async loadWorkflow(id: string): Promise<Workflow> {
    try {
      return await this.httpService.get<Workflow>(`/api/workflows/${id}`);
    } catch (error) {
      console.error(`Failed to load workflow ${id}:`, error);
      throw error;
    }
  }
}
