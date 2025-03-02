import React, { useEffect, useState, useCallback } from 'react';
import { useMCP } from '../contexts/MCPContext';

interface ConnectionStatusProps {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * ConnectionStatus component that displays the current connection status
 * and handles automatic reconnection attempts
 */
const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  autoReconnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
}) => {
  const { isConnected, connect, disconnect } = useMCP();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Function to attempt connection
  const attemptConnection = useCallback(async () => {
    try {
      setIsReconnecting(true);
      await connect();
      setConnectionError(null);
      setReconnectAttempts(0);
    } catch (error) {
      console.error('Connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConnectionError(errorMessage);
      
      if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
        setReconnectAttempts(prev => prev + 1);
      }
    } finally {
      setIsReconnecting(false);
    }
  }, [connect, autoReconnect, reconnectAttempts, maxReconnectAttempts]);

  // Reconnect when disconnected and autoReconnect is enabled
  useEffect(() => {
    if (!isConnected && !isReconnecting && autoReconnect && reconnectAttempts < maxReconnectAttempts) {
      const timer = setTimeout(() => {
        attemptConnection();
      }, reconnectInterval);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, isReconnecting, autoReconnect, reconnectAttempts, maxReconnectAttempts, reconnectInterval, attemptConnection]);

  // Initial connection attempt
  useEffect(() => {
    if (!isConnected && reconnectAttempts === 0) {
      attemptConnection();
    }
  }, [isConnected, reconnectAttempts, attemptConnection]);

  return (
    <div className="connection-status" style={{ marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      {isConnected && (
        <span style={{
          fontSize: '12px',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '9999px',
        }}>
          Connected
        </span>
      )}
      
      {!isConnected && !connectionError && (
        <span style={{
          fontSize: '12px',
          backgroundColor: '#f59e0b',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '9999px',
        }}>
          Connecting...
        </span>
      )}
      
      {connectionError && (
        <>
          <span style={{
            fontSize: '12px',
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '9999px',
          }} title={connectionError}>
            Connection Error
          </span>
          
          {reconnectAttempts >= maxReconnectAttempts && (
            <button 
              onClick={attemptConnection}
              style={{
                fontSize: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry Connection
            </button>
          )}
          
          {reconnectAttempts < maxReconnectAttempts && autoReconnect && (
            <span style={{
              fontSize: '12px',
              color: '#64748b',
            }}>
              Reconnecting... {reconnectAttempts}/{maxReconnectAttempts}
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default ConnectionStatus; 