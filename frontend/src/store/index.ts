import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SystemContext, WorkflowStatus, apiClientInstance as apiClient } from '../api/client';

interface AppState {
  // Context data
  context: SystemContext;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  initializeApp: () => Promise<void>;
  updateContext: (update: Partial<SystemContext>) => void;
  executeWorkflow: (workflowId: string, context: Record<string, any>) => Promise<string>;
  deleteWorkflow: (workflowId: string) => Promise<void>;
  refreshContext: () => Promise<void>;
  clearError: () => void;
}

const initialContext: SystemContext = {
  screenshots: [],
  clipboard: [],
  network: [],
  workflows: [],
};

export const useStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      context: initialContext,
      isLoading: false,
      error: null,

      // Actions
      initializeApp: async () => {
        set({ isLoading: true, error: null });
        try {
          // Connect WebSocket
          apiClient.connectWebSocket();

          // Register context update handler
          apiClient.onContextUpdate((update) => {
            get().updateContext(update);
          });

          // Fetch initial context
          const context = await apiClient.getCurrentContext();
          set({ context, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error : new Error('Failed to initialize app'),
            isLoading: false,
          });
        }
      },

      updateContext: (update) => {
        set((state) => ({
          context: {
            ...state.context,
            ...update,
          },
        }));
      },

      executeWorkflow: async (workflowId: string, context: Record<string, any>) => {
        try {
          set({ isLoading: true, error: null });
          const result = await apiClient.executeWorkflow({
            workflow_id: workflowId,
            context,
          });
          
          // Refresh context after workflow execution
          const updatedContext = await apiClient.getCurrentContext();
          set({ context: updatedContext, isLoading: false });
          
          return result.execution_id;
        } catch (error) {
          set({
            error: error instanceof Error ? error : new Error('Failed to execute workflow'),
            isLoading: false,
          });
          throw error;
        }
      },

      deleteWorkflow: async (workflowId: string) => {
        try {
          set({ isLoading: true, error: null });
          await apiClient.deleteWorkflow(workflowId);
          
          // Refresh context after deletion
          const updatedContext = await apiClient.getCurrentContext();
          set({ context: updatedContext, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error : new Error('Failed to delete workflow'),
            isLoading: false,
          });
          throw error;
        }
      },

      refreshContext: async () => {
        try {
          set({ isLoading: true, error: null });
          const context = await apiClient.getCurrentContext();
          set({ context, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error : new Error('Failed to refresh context'),
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'app-store',
    }
  )
); 