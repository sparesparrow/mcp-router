import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import WebSocket from 'ws';
import { MCPRouter } from './router/MCPRouter';
import { Logger } from './utils/Logger';
import { createRoutes } from './routes';

const logger = new Logger('WebServer');

export class WebServer {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocket.Server;
  private router: MCPRouter;
  
  constructor(router: MCPRouter) {
    this.router = router;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSockets();
  }
  
  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.debug(`${req.method} ${req.url}`);
      next();
    });
  }
  
  private setupRoutes() {
    const routes = createRoutes(this.router);
    this.app.use('/api', routes);
    
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Not Found' });
    });
    
    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error(`Error handling request: ${err.message}`);
      res.status(500).json({ error: 'Internal Server Error' });
    });
  }
  
  private setupWebSockets() {
    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('WebSocket client connected');
      
      // Send initial server list
      const servers = this.router.getAllServers();
      ws.send(JSON.stringify({
        type: 'servers:list',
        data: servers
      }));
      
      // Forward MCP router events to websocket clients
      const eventHandler = (eventType: string, data: any) => {
        ws.send(JSON.stringify({
          type: eventType,
          data
        }));
      };
      
      this.router.on('server:connected', (serverId: string) => {
        eventHandler('server:connected', { serverId });
      });
      
      this.router.on('server:disconnected', (serverId: string) => {
        eventHandler('server:disconnected', { serverId });
      });
      
      this.router.on('server:connection-error', (serverId: string, error: any) => {
        eventHandler('server:connection-error', { 
          serverId, 
          error: error instanceof Error ? error.message : String(error) 
        });
      });
      
      ws.on('message', (message: WebSocket.Data) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'connect') {
            this.router.connectToServer(data.serverId);
          } else if (data.type === 'disconnect') {
            this.router.disconnectFromServer(data.serverId);
          } else if (data.type === 'request') {
            this.handleWebSocketRequest(ws, data);
          }
        } catch (error) {
          logger.error(`Error parsing WebSocket message: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
      
      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        
        // Remove event listeners to prevent memory leaks
        this.router.removeAllListeners('server:connected');
        this.router.removeAllListeners('server:disconnected');
        this.router.removeAllListeners('server:connection-error');
      });
    });
  }
  
  private async handleWebSocketRequest(ws: WebSocket, data: any) {
    if (!data.serverId || !data.request) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid request format' }
      }));
      return;
    }
    
    const { serverId, request, requestId } = data;
    const response = await this.router.forwardRequest(serverId, request);
    
    ws.send(JSON.stringify({
      type: 'response',
      requestId,
      data: response
    }));
  }
  
  async start() {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
    const host = process.env.HOST || '0.0.0.0';
    
    return new Promise<void>((resolve) => {
      this.server.listen(port, host, () => {
        logger.info(`Web server listening at http://${host}:${port}`);
        resolve();
      });
    });
  }
  
  async stop() {
    return new Promise<void>((resolve, reject) => {
      this.server.close((err?: Error) => {
        if (err) {
          logger.error(`Error closing web server: ${err.message}`);
          reject(err);
        } else {
          logger.info('Web server closed');
          resolve();
        }
      });
    });
  }
} 