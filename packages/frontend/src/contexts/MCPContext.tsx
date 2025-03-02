import React, { createContext, useCallback, useContext, useState } from 'react';
import { apiClientInstance, SystemContext } from '../api/client';

interface MCPContextType {
  isConnected: boolean;
  isInitialized: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  executeWorkflow: (method: string, params: Record<string, unknown>) => Promise<void>;
}

const MCPContext = createContext<MCPContextType | null>(null);

export const useMCP = () => {
  const context = useContext(MCPContext);
  if (!context) {
    throw new Error('useMCP must be used within an MCPProvider');
  }
  return context;
};

interface MCPProviderProps {
  children: React.ReactNode;
}

export const MCPProvider: React.FC<MCPProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Define disconnect first so we can use it in connect
  const disconnect = useCallback(() => {
    apiClientInstance.disconnectWebSocket();
    setIsConnected(false);
    setIsInitialized(false);
  }, []);

  const executeWorkflow = useCallback(async (method: string, params: Record<string, unknown>) => {
    if (!isConnected) {
      throw new Error('Not connected to MCP server');
    }

    try {
      await apiClientInstance.executeWorkflow({
        workflow_id: method,
        context: params
      });
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      throw error;
    }
  }, [isConnected]);

  const connect = useCallback(async () => {
    try {
      apiClientInstance.connectWebSocket();
      setIsConnected(true);

      // Initialize the connection
      await executeWorkflow('initialize', {
        capabilities: {
          streaming: true,
          tools: true,
          events: true
        }
      });

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to connect:', error);
      disconnect();
      throw error;
    }
  }, [disconnect, executeWorkflow]);

  return (
    <MCPContext.Provider
      value={{
        isConnected,
        isInitialized,
        connect,
        disconnect,
        executeWorkflow
      }}
    >
      {children}
    </MCPContext.Provider>
  );
}; 