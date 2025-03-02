/**
 * Connection Service Implementation
 * Manages connection to the MCP server using the WebSocket service.
 */
import { 
  IConnectionService, 
  ConnectionStatus, 
  ConnectionStatusHandler 
} from '../interfaces/IConnectionService';
import { IWebSocketService } from '../interfaces/IWebSocketService';
import { AppError, ErrorCode, handleError } from '../../utils/ErrorHandler';

export class ConnectionService implements IConnectionService {
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private statusListeners: Set<ConnectionStatusHandler> = new Set();
  private readonly context = 'ConnectionService';
  
  constructor(private webSocketService: IWebSocketService) {}

  /**
   * Connects to the MCP server
   */
  async connect(): Promise<void> {
    if (this.status === ConnectionStatus.CONNECTED) {
      return;
    }

    try {
      this.updateStatus(ConnectionStatus.CONNECTING);
      
      // Connect WebSocket
      await this.webSocketService.connect();
      
      // Initialize connection with capabilities
      await this.initializeConnection();
      
      this.updateStatus(ConnectionStatus.CONNECTED);
    } catch (error) {
      this.updateStatus(ConnectionStatus.ERROR);
      
      // Convert to standard AppError
      const connectionError = new AppError(
        error instanceof Error ? error.message : 'Failed to connect to MCP server',
        ErrorCode.CONNECTION_ERROR,
        error
      );
      
      handleError(connectionError, this.context);
      throw connectionError;
    }
  }

  /**
   * Disconnects from the MCP server
   */
  async disconnect(): Promise<void> {
    if (this.status === ConnectionStatus.DISCONNECTED) {
      return;
    }

    try {
      await this.webSocketService.disconnect();
      this.updateStatus(ConnectionStatus.DISCONNECTED);
    } catch (error) {
      // Convert to standard AppError
      const disconnectionError = new AppError(
        error instanceof Error ? error.message : 'Failed to disconnect from MCP server',
        ErrorCode.CONNECTION_ERROR,
        error
      );
      
      handleError(disconnectionError, this.context);
      throw disconnectionError;
    }
  }

  /**
   * Checks if connected to the MCP server
   */
  isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }

  /**
   * Gets the current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Registers a handler for connection status changes
   */
  onStatusChange(handler: ConnectionStatusHandler): () => void {
    this.statusListeners.add(handler);
    
    // Call handler immediately with current status
    handler(this.status);
    
    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(handler);
    };
  }

  /**
   * Updates the connection status and notifies listeners
   */
  private updateStatus(newStatus: ConnectionStatus): void {
    if (this.status === newStatus) {
      return;
    }
    
    this.status = newStatus;
    
    // Notify all listeners
    this.statusListeners.forEach(listener => {
      try {
        listener(newStatus);
      } catch (error) {
        console.error('Error in connection status listener:', error);
      }
    });
  }

  /**
   * Initializes the connection with the server
   */
  private async initializeConnection(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Register one-time event handler for initialization response
      const unsubscribe = this.webSocketService.on('initialized', (data: { status: string }) => {
        unsubscribe(); // Remove the event listener
        
        if (data.status === 'ok') {
          resolve();
        } else {
          reject(new AppError(
            'Server initialization failed',
            ErrorCode.CONNECTION_ERROR,
            data
          ));
        }
      });
      
      // Set a timeout for initialization
      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new AppError(
          'Server initialization timed out',
          ErrorCode.CONNECTION_ERROR
        ));
      }, 5000);
      
      // Send initialization data
      this.webSocketService.emit('initialize', {
        capabilities: {
          streaming: true,
          tools: true,
          events: true
        }
      });
    });
  }
}
