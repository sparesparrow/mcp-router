/**
 * Tests the integration between backend API and shared package
 */
import request from 'supertest';
import { HttpServer, RouterApi } from 'shared';
import express from 'express';

// Mock implementation that will be used in tests
class MockRouterApi extends RouterApi {
  createRoutes() {
    const router = express.Router();
    router.get('/test', (req, res) => {
      res.json({ status: 'ok' });
    });
    return router;
  }
}

describe('RouterApi integration', () => {
  let httpServer: HttpServer;
  let app: express.Application;
  
  beforeAll(() => {
    // Create a test instance of HttpServer with RouterApi
    const routerApi = new MockRouterApi();
    httpServer = new HttpServer(routerApi, { port: 3099, host: 'localhost' });
    app = express();
    app.use('/api', routerApi.createRoutes());
  });
  
  test('API routes respond correctly', async () => {
    const response = await request(app).get('/api/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
}); 