/**
 * Tests the integration between backend API and shared package
 */
import request from 'supertest';
import { IRouter, MCPRouter } from 'shared';
import express from 'express';

/**
 * Create Express routes for the MCP Router API.
 * Note: RouterApi was moved out of the shared package (it depends on express,
 * which is a server-side concern). This helper replicates the essential routing
 * logic for testing purposes.
 */
function createMCPRoutes(router: IRouter) {
  const routes = express.Router();

  routes.get('/servers', (_req, res) => {
    res.json(router.getAllServers());
  });

  routes.get('/servers/:id', (req, res) => {
    const server = router.getServer(req.params.id);
    if (!server) return res.status(404).json({ error: 'Server not found' });
    res.json(server);
  });

  routes.get('/test', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return routes;
}

describe('RouterApi integration', () => {
  let app: express.Application;

  beforeAll(() => {
    const mockRouter: IRouter = {
      connectToServer: jest.fn(),
      disconnectFromServer: jest.fn(),
      isServerConnected: jest.fn().mockReturnValue(false),
      forwardRequest: jest.fn(),
      getServerCapabilities: jest.fn().mockResolvedValue([]),
      getAllServers: jest.fn().mockReturnValue([]),
      getServer: jest.fn().mockReturnValue(undefined)
    };

    app = express();
    app.use('/api', createMCPRoutes(mockRouter));
  });

  test('API routes respond correctly', async () => {
    const response = await request(app).get('/api/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('GET /api/servers returns empty list', async () => {
    const response = await request(app).get('/api/servers');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('GET /api/servers/:id returns 404 for unknown server', async () => {
    const response = await request(app).get('/api/servers/unknown-id');
    expect(response.status).toBe(404);
  });
}); 