import React from 'react';
import { useMCP } from '../contexts/MCPContext';
import styles from './MCPStatus.module.css';

const MCPStatus: React.FC = () => {
  const { isConnected, isInitialized, connect } = useMCP();

  const handleReconnect = () => {
    connect();
  };

  const getStatusText = () => {
    if (!isConnected) {
      return 'Disconnected';
    }
    if (!isInitialized) {
      return 'Initializing...';
    }
    return 'Connected';
  };

  const getStatusColor = () => {
    if (!isConnected) {
      return 'error';
    }
    if (!isInitialized) {
      return 'warning';
    }
    return 'success';
  };

  return (
    <div className={styles.mcpStatus}>
      <div className={`${styles.statusIndicator} ${styles[getStatusColor()]}`}>
        {getStatusText()}
      </div>
      {!isConnected && (
        <button onClick={handleReconnect} className={styles.reconnectButton}>
          Reconnect
        </button>
      )}
    </div>
  );
};

export default MCPStatus; 