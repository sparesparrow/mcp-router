import axios, { AxiosResponse, AxiosError } from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Types
export interface SystemContext {
  screenshots: any[];
  clipboard: any[];
  network: any[];
  workflows: any[];
}

export interface WorkflowResponse {
  execution_id: string;
  status: string;
}

export interface WorkflowStatus {
  id: string;
  status: string;
  result?: any;
  error?: string;
}

export interface WorkflowExecution {
  workflow_id: string;
  context: Record<string, unknown>;
}

export interface WorkflowList {
  available_workflows: string[];
  active_workflows: WorkflowStatus[];
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

class APIClient {
  private readonly api: typeof apiClient;
  private socket: Socket | null = null;
  private contextUpdateHandlers: Array<(context: Partial<SystemContext>) => void> = [];

  constructor() {
    this.api = apiClient;

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Socket.IO connection management
  public connectWebSocket(): void {
    if (this.socket) {
      return;
    }

    this.socket = io(API_BASE_URL, {
      path: '/ws',
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    this.socket.on('context_update', (data: Partial<SystemContext>) => {
      this.contextUpdateHandlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in context update handler:', error);
        }
      });
    });
  }

  public disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public onContextUpdate(handler: (context: Partial<SystemContext>) => void): () => void {
    this.contextUpdateHandlers.push(handler);
    return () => {
      this.contextUpdateHandlers = this.contextUpdateHandlers.filter((h) => h !== handler);
    };
  }

  // REST API methods
  public async getCurrentContext(): Promise<SystemContext> {
    try {
      const response: AxiosResponse<SystemContext> = await this.api.get('/api/context');
      return response.data;
    } catch (error) {
      throw error instanceof AxiosError
        ? new Error(error.response?.data?.message || 'Failed to get system context')
        : error;
    }
  }

  public async executeWorkflow(execution: WorkflowExecution): Promise<WorkflowResponse> {
    try {
      const response: AxiosResponse<WorkflowResponse> = await this.api.post('/api/workflows/execute', execution);
      return response.data;
    } catch (error) {
      throw error instanceof AxiosError 
        ? new Error(error.response?.data?.message || 'Failed to execute workflow')
        : error;
    }
  }

  public async getWorkflowStatus(executionId: string): Promise<WorkflowStatus> {
    try {
      const response: AxiosResponse<WorkflowStatus> = await this.api.get(`/api/workflows/${executionId}/status`);
      return response.data;
    } catch (error) {
      throw error instanceof AxiosError
        ? new Error(error.response?.data?.message || 'Failed to get workflow status')
        : error;
    }
  }

  public async listWorkflows(): Promise<WorkflowList> {
    const response = await this.api.get('/api/workflows');
    return response.data;
  }

  public async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      await this.api.delete(`/api/workflows/${workflowId}`);
    } catch (error) {
      throw error instanceof AxiosError
        ? new Error(error.response?.data?.message || 'Failed to delete workflow')
        : error;
    }
  }
}

// Create and export singleton instance
export const apiClientInstance = new APIClient();
export default apiClientInstance; 