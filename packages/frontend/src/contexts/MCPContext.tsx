import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { MCPBackendService } from '../api/MCPBackendService';
import { MCPConfig, ConnectionState } from '@mcp-router/shared';

// Default configuration
const DEFAULT_CONFIG: MCPConfig = {
  baseUrl: 'http://localhost:8000',
  websocketUrl: 'ws://localhost:8000/api/mcp/ws',
  reconnectInterval: 2000,
  maxReconnectAttempts: 10
};

// Context interface
interface MCPContextType {
  service: MCPBackendService | null;
  connectionState: ConnectionState;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  isError: boolean;
}

// Create context with default values
const MCPContext = createContext<MCPContextType>({
  service: null,
  connectionState: ConnectionState.DISCONNECTED,
  connect: async () => {},
  disconnect: () => {},
  isConnected: false,
  isConnecting: false,
  isError: false
});

// Provider props
interface MCPProviderProps {
  children: ReactNode;
  config?: MCPConfig;
}

// Provider component
export const MCPProvider: React.FC<MCPProviderProps> = ({ 
  children, 
  config = DEFAULT_CONFIG 
}) => {
  const [service, setService] = useState<MCPBackendService | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );

  // Create service instance on mount
  useEffect(() => {
    const mcpService = new MCPBackendService(config);
    
    // Set up event listeners
    mcpService.on('connected', () => {
      setConnectionState(ConnectionState.CONNECTED);
    });
    
    mcpService.on('disconnected', () => {
      setConnectionState(ConnectionState.DISCONNECTED);
    });
    
    mcpService.on('connecting', () => {
      setConnectionState(ConnectionState.CONNECTING);
    });
    
    mcpService.on('reconnecting', () => {
      setConnectionState(ConnectionState.RECONNECTING);
    });
    
    mcpService.on('error', () => {
      setConnectionState(ConnectionState.ERROR);
    });
    
    setService(mcpService);
    
    // Clean up on unmount
    return () => {
      if (mcpService) {
        mcpService.disconnect();
        mcpService.removeAllListeners();
      }
    };
  }, [config]);

  // Connect method
  const connect = async () => {
    if (service && connectionState !== ConnectionState.CONNECTED) {
      try {
        await service.connect();
      } catch (error) {
        console.error('Failed to connect to MCP service:', error);
      }
    }
  };

  // Disconnect method
  const disconnect = () => {
    if (service) {
      service.disconnect();
    }
  };

  // Derived state
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = 
    connectionState === ConnectionState.CONNECTING || 
    connectionState === ConnectionState.RECONNECTING;
  const isError = connectionState === ConnectionState.ERROR;

  return (
    <MCPContext.Provider
      value={{
        service,
        connectionState,
        connect,
        disconnect,
        isConnected,
        isConnecting,
        isError
      }}
    >
      {children}
    </MCPContext.Provider>
  );
};

// Custom hook for using the context
export const useMCP = () => useContext(MCPContext);

export default MCPContext; 