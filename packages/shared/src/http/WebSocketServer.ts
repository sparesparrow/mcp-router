/**
 * WebSocket server implementation
 */
import WebSocket from 'ws';
import http from 'http';
import { EventEmitter } from 'events';
import { IRouter } from '../interfaces/IRouter';
import { Logger } from '../utils/Logger';

export class WebSocketServer {
  private wss: WebSocket.Server | null = null;
  private logger: Logger;
  
  constructor(
    private router: IRouter,
    private eventEmitter: EventEmitter,
    logger?: Logger
  ) {
    this.logger = logger || new Logger('WebSocketServer');
    
    // Set up router event forwarding
    this.setupRouterEvents();
  }
  
  /**
   * Initializes the WebSocket server with an HTTP server
   */
  initialize(server: http.Server): void {
    this.logger.debug('Initializing WebSocket server');
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', this.handleConnection.bind(this));
    this.logger.info('WebSocket server initialized');
  }
  
  /**
   * Handles a new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    this.logger.info('WebSocket client connected');
    
    // Send initial server list
    const servers = this.router.getAllServers();
    ws.send(JSON.stringify({
      type: 'servers:list',
      data: servers
    }));
    
    // Set up message handling
    ws.on('message', (message: WebSocket.Data) => {
      this.handleMessage(ws, message);
    });
    
    // Handle disconnection
    ws.on('close', () => {
      this.logger.info('WebSocket client disconnected');
    });
  }
  
  /**
   * Handles a WebSocket message
   */
  private handleMessage(ws: WebSocket, message: WebSocket.Data): void {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'connect') {
        this.handleConnectRequest(ws, data);
      } else if (data.type === 'disconnect') {
        this.handleDisconnectRequest(ws, data);
      } else if (data.type === 'request') {
        this.handleServerRequest(ws, data);
      }
    } catch (error) {
      this.logger.error(`Error handling WebSocket message: ${error instanceof Error ? error.message : String(error)}`);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid message format' }
      }));
    }
  }
  
  /**
   * Handles a server connect request
   */
  private async handleConnectRequest(ws: WebSocket, data: any): Promise<void> {
    const { serverId } = data;
    
    if (!serverId) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Missing serverId parameter' }
      }));
      return;
    }
    
    try {
      await this.router.connectToServer(serverId);
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { 
          message: 'Failed to connect to server',
          details: error instanceof Error ? error.message : String(error)
        }
      }));
    }
  }
  
  /**
   * Handles a server disconnect request
   */
  private async handleDisconnectRequest(ws: WebSocket, data: any): Promise<void> {
    const { serverId } = data;
    
    if (!serverId) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Missing serverId parameter' }
      }));
      return;
    }
    
    try {
      await this.router.disconnectFromServer(serverId);
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { 
          message: 'Failed to disconnect from server',
          details: error instanceof Error ? error.message : String(error)
        }
      }));
    }
  }
  
  /**
   * Handles a server request
   */
  private async handleServerRequest(ws: WebSocket, data: any): Promise<void> {
    const { serverId, request, requestId } = data;
    
    if (!serverId || !request) {
      ws.send(JSON.stringify({
        type: 'error',
        requestId,
        data: { message: 'Invalid request format' }
      }));
      return;
    }
    
    if (!this.router.isServerConnected(serverId)) {
      ws.send(JSON.stringify({
        type: 'error',
        requestId,
        data: { message: 'Server not connected' }
      }));
      return;
    }
    
    try {
      const response = await this.router.forwardRequest(serverId, request);
      
      ws.send(JSON.stringify({
        type: 'response',
        requestId,
        data: response
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        requestId,
        data: { 
          message: 'Request failed',
          details: error instanceof Error ? error.message : String(error)
        }
      }));
    }
  }
  
  /**
   * Sets up router event forwarding to WebSocket clients
   */
  private setupRouterEvents(): void {
    // Forward router events to WebSocket clients
    this.eventEmitter.on('server:connected', (serverId: string) => {
      this.broadcastEvent('server:connected', { serverId });
    });
    
    this.eventEmitter.on('server:disconnected', (serverId: string) => {
      this.broadcastEvent('server:disconnected', { serverId });
    });
    
    this.eventEmitter.on('server:connection-error', (serverId: string, error: any) => {
      this.broadcastEvent('server:connection-error', { 
        serverId, 
        error: error instanceof Error ? error.message : String(error) 
      });
    });
  }
  
  /**
   * Broadcasts an event to all connected WebSocket clients
   */
  private broadcastEvent(eventType: string, data: any): void {
    if (!this.wss) {
      this.logger.debug(`Cannot broadcast ${eventType} event: WebSocket server not initialized`);
      return;
    }
    
    const message = JSON.stringify({
      type: eventType,
      data
    });
    
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
