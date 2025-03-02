/**
 * Connection Status Component
 * Displays the current connection status and provides connect/disconnect buttons.
 */
import React from 'react';
import { useMCP } from '../contexts/MCPContext';
import { ConnectionState } from '../types/mcp';
import { 
  Box, 
  Typography, 
  CircularProgress 
} from '@mui/material';

const ConnectionStatus: React.FC = () => {
  const { connectionState } = useMCP();

  const getStatusText = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return 'Connected';
      case ConnectionState.CONNECTING:
        return 'Connecting...';
      case ConnectionState.RECONNECTING:
        return 'Reconnecting...';
      case ConnectionState.ERROR:
        return 'Connection Error';
      case ConnectionState.DISCONNECTED:
      default:
        return 'Disconnected';
    }
  };

  const getStatusClass = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return 'status-connected';
      case ConnectionState.CONNECTING:
      case ConnectionState.RECONNECTING:
        return 'status-connecting';
      case ConnectionState.ERROR:
      case ConnectionState.DISCONNECTED:
      default:
        return 'status-disconnected';
    }
  };

  return (
    <div className={`connection-status ${getStatusClass()}`}>
      {getStatusText()}
    </div>
  );
};

export default ConnectionStatus;
