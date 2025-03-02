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
      // Use socket.io to execute the workflow
      const socket = apiClientInstance.getSocket();
      socket?.emit('execute_workflow', {
        workflow_id: method,
        context: params
      });
      
      // Return a promise that resolves when we get a response
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Workflow execution timed out'));
        }, 10000); // 10 second timeout
        
        const resultHandler = (result: any) => {
          clearTimeout(timeout);
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve();
          }
          
          // Remove the listener after receiving the result
          const socket = apiClientInstance.getSocket();
          socket?.off('workflow_result', resultHandler);
        };
        
        const socket = apiClientInstance.getSocket();
        socket?.on('workflow_result', resultHandler);
      });
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      throw error;
    }
  }, [isConnected]);

  const connect = useCallback(async () => {
    try {
      apiClientInstance.connectWebSocket();
      
      // Return a promise that resolves when the socket is connected
      await new Promise<void>((resolve, reject) => {
        const socket = apiClientInstance.getSocket();
        
        if (!socket) {
          reject(new Error('Failed to create socket'));
          return;
        }
        
        if (socket.connected) {
          setIsConnected(true);
          resolve();
          return;
        }
        
        const timeout = setTimeout(() => {
          socket.off('connect');
          reject(new Error('Connection timed out'));
        }, 5000);
        
        socket.once('connect', () => {
          clearTimeout(timeout);
          setIsConnected(true);
          resolve();
        });
        
        socket.once('connect_error', (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      // Initialize the connection
      await new Promise<void>((resolve, reject) => {
        const socket = apiClientInstance.getSocket();
        
        if (!socket) {
          reject(new Error('Socket not available'));
          return;
        }
        
        const timeout = setTimeout(() => {
          socket.off('initialized');
          reject(new Error('Initialization timed out'));
        }, 5000);
        
        socket.once('initialized', (data: {status: string}) => {
          clearTimeout(timeout);
          if (data.status === 'ok') {
            setIsInitialized(true);
            resolve();
          } else {
            reject(new Error('Initialization failed'));
          }
        });
        
        socket.emit('initialize', {
          capabilities: {
            streaming: true,
            tools: true,
            events: true
          }
        });
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      disconnect();
      throw error;
    }
  }, [disconnect]);

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