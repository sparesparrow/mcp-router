/**
 * Shared Package Adapter
 * 
 * Provides a clean interface for accessing functionality from the shared package.
 * This adapter decouples the frontend from direct dependencies on the shared package
 * implementation, making it easier to upgrade or change the shared package in the future.
 */

import {
  MCPServerCore,
  MCPClientCore,
  InMemoryTransport,
  TransportFactory,
  ClientFactory,
  ServerFactory
} from '@mcp-router/shared'; // Using the package name

// Define interfaces locally to avoid dependency on shared package
export interface IMessageHandler {
  handleMessage(message: any): Promise<any>;
}

export interface ITransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export interface IMessageSender {
  send(message: any): Promise<void>;
}

export interface IMessageReceiver {
  onMessage(handler: IMessageHandler): void;
}

export interface IMessageTransport extends ITransport, IMessageSender, IMessageReceiver {
  // Combined interface
}

export interface IConnectionManager {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  onConnect(callback: () => void): void;
  onDisconnect(callback: () => void): void;
}

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
