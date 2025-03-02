/**
 * Mock implementation of @mcp-router/shared
 * This file is used by the build system to provide mock implementations
 * of the shared package's exports that are needed by the frontend.
 */

// Agent Node Types
export enum AgentNodeType {
  LLM = 'llm',
  TOOL = 'tool',
  RESOURCE = 'resource',
  ROUTER = 'router',
  PARALLEL = 'parallel',
  ORCHESTRATOR = 'orchestrator',
  EVALUATOR = 'evaluator',
  INPUT = 'input',
  OUTPUT = 'output',
  CONDITION = 'condition',
}

// Connection States
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// Service Types
export enum ServiceType {
  AI = 'ai',
  AUDIO = 'audio',
  WEBSOCKET = 'websocket',
  TOOLS = 'tools',
  WORKFLOWS = 'workflows'
}

// Basic Interfaces
export interface MCPConfig {
  baseUrl: string;
  websocketUrl: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  ai?: ServiceConfig;
  audio?: ServiceConfig;
  tools?: ServiceConfig;
  workflows?: ServiceConfig;
}

export interface ServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface MCPInfoResponse {
  version: string;
  status: string;
  server_info: {
    name: string;
    uptime: number;
    services: string[];
  };
}

// AI Service Interfaces
export interface AIInfoResponse {
  version: string;
  models: string[];
  capabilities: string[];
}

export interface AIGenerateRequest {
  model: string;
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  stop_sequences?: string[];
  [key: string]: any;
}

export interface AIGenerateResponse {
  id: string;
  text: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface Violation {
  principle: string;
  message: string;
  location?: {
    line: number;
    column: number;
  };
  code?: string;
}

export interface Message {
  id: string;
  method?: string;
  params?: any;
  [key: string]: any;
}

export interface Response {
  id: string;
  success: boolean;
  result?: any;
  error?: MCPError;
}

export class MCPError extends Error {
  code: string;
  
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'MCPError';
  }
}

// Mock interfaces needed by SharedPackageAdapter
export interface IMessageHandler {
  handleMessage(message: Message): Promise<Response>;
}

export interface ITransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export interface IMessageSender {
  send(message: Message): Promise<void>;
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

// Mock classes needed by SharedPackageAdapter
export class MCPServerCore implements IMessageHandler {
  async handleMessage(message: Message): Promise<Response> {
    return { id: message.id, success: true };
  }
}

export class MCPClientCore implements IMessageHandler {
  async handleMessage(message: Message): Promise<Response> {
    return { id: message.id, success: true };
  }
}

export class InMemoryTransport implements IMessageTransport {
  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}
  isConnected(): boolean { return true; }
  async send(message: Message): Promise<void> {}
  onMessage(handler: IMessageHandler): void {}
}

// Mock factories
export class TransportFactory {
  static createInMemoryTransport(handler?: IMessageHandler): InMemoryTransport {
    return new InMemoryTransport();
  }
}

export class ClientFactory {
  static createStandardClient(config: any): MCPClientCore {
    return new MCPClientCore();
  }
}

export class ServerFactory {
  static createStandardServer(): MCPServerCore {
    return new MCPServerCore();
  }
}

// Re-export other types that might be needed
export * from '../types/agent';
export * from '../types/mcp'; 