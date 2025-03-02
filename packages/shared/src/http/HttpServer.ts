/**
 * HTTP server implementation
 */
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import { Logger } from '../utils/Logger';
import { RouterApi } from './RouterApi';

export interface ServerConfig {
  port: number;
  host: string;
}

export class HttpServer {
  private app: express.Application;
  private server: http.Server;
  private logger: Logger;
  
  constructor(
    private routerApi: RouterApi,
    private config: ServerConfig,
    logger?: Logger
  ) {
    this.logger = logger || new Logger('HttpServer');
    this.app = express();
    this.server = http.createServer(this.app);
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  /**
   * Sets up Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.logger.debug(`${req.method} ${req.url}`);
      next();
    });
  }
  
  /**
   * Sets up API routes
   */
  private setupRoutes(): void {
    const routes = this.routerApi.createRoutes();
    this.app.use('/api', routes);
    
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Not Found' });
    });
    
    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      this.logger.error(`Error handling request: ${err.message}`);
      res.status(500).json({ error: 'Internal Server Error' });
    });
  }
  
  /**
   * Starts the HTTP server
   */
  async start(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        this.logger.info(`HTTP server listening at http://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }
  
  /**
   * Stops the HTTP server
   */
  async stop(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.server.close((err?: Error) => {
        if (err) {
          this.logger.error(`Error closing HTTP server: ${err.message}`);
          reject(err);
        } else {
          this.logger.info('HTTP server closed');
          resolve();
        }
      });
    });
  }
  
  /**
   * Returns the HTTP server instance
   */
  getServer(): http.Server {
    return this.server;
  }
}
