import express, { Request, Response, NextFunction, Router } from 'express';
import { MCPRouter } from './router/MCPRouter';
import { Logger } from './utils/Logger';
import path from 'path';

const logger = new Logger('Routes');

export function createRoutes(router: MCPRouter): Router {
  const routes = express.Router();
  
  // Get all servers
  routes.get('/servers', (req: Request, res: Response) => {
    const servers = router.getAllServers();
    res.json(servers);
  });
  
  // Get server by ID
  routes.get('/servers/:id', (req: Request, res: Response) => {
    const serverId = req.params.id;
    const server = router.getServer(serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    res.json(server);
  });
  
  // Connect to server
  routes.post('/servers/:id/connect', async (req: Request, res: Response) => {
    const serverId = req.params.id;
    
    try {
      await router.connectToServer(serverId);
      res.json({ status: 'connected' });
    } catch (error) {
      logger.error(`Failed to connect to server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
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
      await router.disconnectFromServer(serverId);
      res.json({ status: 'disconnected' });
    } catch (error) {
      logger.error(`Failed to disconnect from server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
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
    
    if (!router.isServerConnected(serverId)) {
      return res.status(400).json({ error: 'Server not connected' });
    }
    
    try {
      const response = await router.forwardRequest(serverId, request);
      res.json(response);
    } catch (error) {
      logger.error(`Error forwarding request to server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ 
        error: 'Request failed',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get server capabilities
  routes.get('/servers/:id/capabilities', async (req: Request, res: Response) => {
    const serverId = req.params.id;
    
    if (!router.isServerConnected(serverId)) {
      return res.status(400).json({ error: 'Server not connected' });
    }
    
    try {
      const capabilities = await router.getServerCapabilities(serverId);
      res.json(capabilities);
    } catch (error) {
      logger.error(`Error getting capabilities from server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ 
        error: 'Failed to get capabilities',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Workflow Designer page
  routes.get('/workflow-designer', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, '../../public/workflow-designer.html'));
  });
  
  return routes;
} 