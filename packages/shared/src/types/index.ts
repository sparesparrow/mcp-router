/**
 * Shared types for MCP Router
 */

// Export all message types
export * from './messages';

// Export all REST API types
export * from './rest';

// Common enums
export enum ServiceType {
  AI = 'ai',
  AUDIO = 'audio',
  WEBSOCKET = 'websocket',
  TOOLS = 'tools',
  WORKFLOWS = 'workflows'
}

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Config interfaces
export interface ServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface MCPConfig {
  baseUrl: string;
  websocketUrl: string;
  ai?: ServiceConfig;
  audio?: ServiceConfig;
  tools?: ServiceConfig;
  workflows?: ServiceConfig;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
} 