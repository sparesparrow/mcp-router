/**
 * Main entry point for the MCP Router shared package
 */

// Export interfaces
export * from './interfaces/IMessageHandler';
export * from './interfaces/ITransport';
export * from './interfaces/IMessageSender';
export * from './interfaces/IMessageReceiver';
export * from './interfaces/IMessageTransport';
export * from './interfaces/IConnectionManager';
export * from './interfaces/IMessageHandlerRegistry';
export * from './interfaces/IServerRegistry';
export * from './interfaces/IRouter';

// Export types
export * from './types/mcp';
export * from './types/errors';

// Export core components
export * from './server/MCPServerCore';
export * from './client/MCPClientCore';
export * from './transport/InMemoryTransport';
export * from './router/MCPRouter';

// Export factories
export * from './factory/TransportFactory';
export * from './factory/ServerFactory';
export * from './factory/ClientFactory';

// Export HTTP components
export * from './http/HttpServer';
export * from './http/RouterApi';
export * from './http/WebSocketServer';

// Export handlers
export * from './handlers/MessageHandlerRegistry';
export * from './handlers/HandshakeHandler';
export * from './handlers/ToolsListHandler';

// Export registries
export * from './registry/ClientRegistry';
export * from './registry/ServerRegistry';
export * from './registry/ToolsRegistry';

// Export utils
export * from './utils/IdGenerator';
export * from './utils/Logger';
export * from './utils/LoggerFactory';

// Export integration
export * from './integration/MCPIntegrationService';
