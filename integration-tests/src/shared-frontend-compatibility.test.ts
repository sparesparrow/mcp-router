/**
 * This test suite verifies that the shared package is correctly imported
 * in the frontend without Node.js server dependencies causing issues.
 */
import * as shared from 'shared';

describe('Shared package browser compatibility', () => {
  test('Shared package exports required types and utilities', () => {
    // Verify all required exports are available
    expect(shared.AgentNodeType).toBeDefined();
    expect(shared.MCPError).toBeDefined();
    expect(shared.ErrorCode).toBeDefined();
    
    // Check that the HttpServer stub is available
    // and can be instantiated without Node.js dependencies
    const httpServer = new shared.HttpServer({} as any, {} as any);
    expect(httpServer).toBeDefined();
  });
  
  test('No Node.js server dependencies are pulled in', () => {
    // Ensure the http module isn't directly exported
    expect((shared as any).http).toBeUndefined();
    
    // Ensure express isn't directly exported
    expect((shared as any).express).toBeUndefined();
    
    // Check for absence of Node.js specific HttpServer methods that depend on Express
    const httpServer = new shared.HttpServer({} as any, {} as any);
    expect(httpServer.getServer).toBeDefined();
    expect(typeof httpServer.getServer).toBe('function');
    
    // The real server would return an http.Server, but our stub should return undefined or a mock
    const serverInstance = httpServer.getServer();
    expect(serverInstance).not.toBeInstanceOf(Object);
  });
}); 