/**
 * Shared Package Adapter
 * 
 * Provides a clean interface for accessing functionality from the shared package.
 * This adapter decouples the frontend from direct dependencies on the shared package
 * implementation, making it easier to upgrade or change the shared package in the future.
 */

import {
  IMessageHandler,
  ITransport,
  IMessageSender,
  IMessageReceiver,
  IMessageTransport,
  IConnectionManager,
  MCPServerCore,
  MCPClientCore,
  InMemoryTransport,
  TransportFactory,
  ClientFactory,
  ServerFactory
} from '@mcp-router/shared'; // Using the package name

/**
 * Re-export the interfaces and implementations needed by the frontend
 */
export {
  IMessageHandler,
  ITransport,
  IMessageSender,
  IMessageReceiver,
  IMessageTransport,
  IConnectionManager
};

/**
 * Core classes from the shared package
 */
export {
  MCPServerCore,
  MCPClientCore
};

/**
 * Transport implementations from the shared package
 */
export {
  InMemoryTransport
};

/**
 * Factories from the shared package
 */
export {
  TransportFactory,
  ClientFactory,
  ServerFactory
};

/**
 * Creates and configures an InMemoryTransport with optional handler
 * @param handler Optional message handler
 * @returns Configured InMemoryTransport
 */
export function createInMemoryTransport(handler?: IMessageHandler): InMemoryTransport {
  return TransportFactory.createInMemoryTransport(handler);
}

/**
 * Creates a standard MCP client with the given configuration
 * @param config Client configuration
 * @returns Configured MCPClientCore
 */
export function createMCPClient(config: any): MCPClientCore {
  return ClientFactory.createStandardClient(config);
}

/**
 * Creates a standard MCP server
 * @returns Configured MCPServerCore
 */
export function createMCPServer(): MCPServerCore {
  return ServerFactory.createStandardServer();
}
