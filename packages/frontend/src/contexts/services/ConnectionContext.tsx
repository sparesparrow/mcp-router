/**
 * Connection Context
 * Provides connection state and methods to connect/disconnect.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IConnectionService, ConnectionStatus } from '../../services/interfaces/IConnectionService';

interface ConnectionContextType {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

// Create context with a default value
const ConnectionContext = createContext<ConnectionContextType | null>(null);

// Custom hook to use the connection context
export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};

interface ConnectionProviderProps {
  connectionService: IConnectionService;
  children: React.ReactNode;
}

// Provider component
export const ConnectionProvider: React.FC<ConnectionProviderProps> = ({ 
  connectionService, 
  children 
}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    connectionService.getConnectionStatus()
  );

  // Keep track of the connection status
  useEffect(() => {
    const unsubscribe = connectionService.onStatusChange((status) => {
      setConnectionStatus(status);
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, [connectionService]);

  // Connect to the server
  const connect = useCallback(async () => {
    try {
      await connectionService.connect();
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }, [connectionService]);

  // Disconnect from the server
  const disconnect = useCallback(async () => {
    try {
      await connectionService.disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      throw error;
    }
  }, [connectionService]);

  // Determine if connected
  const isConnected = connectionStatus === ConnectionStatus.CONNECTED;

  // Create value object
  const value: ConnectionContextType = {
    connectionStatus,
    isConnected,
    connect,
    disconnect,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};
