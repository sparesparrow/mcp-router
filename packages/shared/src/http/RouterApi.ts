/**
 * API routes for the MCP Router
 */
import express, { Request, Response, NextFunction, Router } from 'express';
import { IRouter } from '../interfaces/IRouter';
import { Logger } from '../utils/Logger';
import path from 'path';

export class RouterApi {
  private logger: Logger;
  
  constructor(
    private router: IRouter,
    logger?: Logger
  ) {
    this.logger = logger || new Logger('RouterApi');
  }

  /**
   * Creates the Express router with all routes
   */
  createRoutes(): Router {
    const routes = express.Router();
    
    // Get all servers
    routes.get('/servers', (req: Request, res: Response) => {
      const servers = this.router.getAllServers();
      res.json(servers);
    });
    
    // Get server by ID
    routes.get('/servers/:id', (req: Request, res: Response) => {
      const serverId = req.params.id;
      const server = this.router.getServer(serverId);
      
      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }
      
      res.json(server);
    });
    
    // Connect to server
    routes.post('/servers/:id/connect', async (req: Request, res: Response) => {
      const serverId = req.params.id;
      
      try {
        await this.router.connectToServer(serverId);
        res.json({ status: 'connected' });
      } catch (error) {
        this.logger.error(`Failed to connect to server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).json({ 
          error: 'Connection failed',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    // Disconnect from server
    routes.post('/servers/:id/disconnect', async (req: Request, res: Response) => {
      const serverId = req.params.id;
      
      try {
        await this.router.disconnectFromServer(serverId);
        res.json({ status: 'disconnected' });
      } catch (error) {
        this.logger.error(`Failed to disconnect from server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).json({ 
          error: 'Disconnection failed',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    // Forward request to server
    routes.post('/servers/:id/request', async (req: Request, res: Response) => {
      const serverId = req.params.id;
      const request = req.body;
      
      if (!this.router.isServerConnected(serverId)) {
        return res.status(400).json({ error: 'Server not connected' });
      }
      
      try {
        const response = await this.router.forwardRequest(serverId, request);
        res.json(response);
      } catch (error) {
        this.logger.error(`Error forwarding request to server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).json({ 
          error: 'Request failed',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    // Get server capabilities
    routes.get('/servers/:id/capabilities', async (req: Request, res: Response) => {
      const serverId = req.params.id;
      
      if (!this.router.isServerConnected(serverId)) {
        return res.status(400).json({ error: 'Server not connected' });
      }
      
      try {
        const capabilities = await this.router.getServerCapabilities(serverId);
        res.json(capabilities);
      } catch (error) {
        this.logger.error(`Error getting capabilities from server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).json({ 
          error: 'Failed to get capabilities',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    return routes;
  }
}
