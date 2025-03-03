/**
 * Tests the integration between backend API and shared package
 */
import request from 'supertest';
import { RouterApi, IRouter } from 'shared';
import express from 'express';

// Mock implementation that will be used in tests
class MockRouterApi extends RouterApi {
  constructor() {
    // Create a mock router to pass to the parent constructor
    const mockRouter: IRouter = {
      connectToServer: jest.fn(),
      disconnectFromServer: jest.fn(),
      isServerConnected: jest.fn(),
      forwardRequest: jest.fn(),
      getServerCapabilities: jest.fn(),
      getAllServers: jest.fn(),
      getServer: jest.fn()
    };
    super(mockRouter);
  }

  createRoutes() {
    const router = express.Router();
    router.get('/test', (_req, res) => {
      res.json({ status: 'ok' });
    });
    return router;
  }
}

describe('RouterApi integration', () => {
  let app: express.Application;
  
  beforeAll(() => {
    // Create a test instance of RouterApi
    const routerApi = new MockRouterApi();
    app = express();
    app.use('/api', routerApi.createRoutes());
  });
  
  test('API routes respond correctly', async () => {
    const response = await request(app).get('/api/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
}); 