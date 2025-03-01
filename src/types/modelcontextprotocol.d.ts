declare module '@modelcontextprotocol/sdk' {
  export interface MCPServer {
    id: string;
    name: string;
    url: string;
    metadata?: Record<string, any>;
    
    // Add missing methods
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    request(request: any): Promise<any>;
    getCapabilities(): Promise<any>;
  }

  export interface MCPTransport {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(message: any): Promise<void>;
    on(event: string, callback: (data: any) => void): void;
    removeAllListeners(): void;
  }

  export class MCPServer {
    constructor(transport: MCPTransport);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    request(request: any): Promise<any>;
    getCapabilities(): Promise<any>;
  }

  export class MCPTransport {
    constructor(url: string);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(message: any): Promise<void>;
    on(event: string, callback: (data: any) => void): void;
    removeAllListeners(): void;
  }

  export interface Transport {
    new (url: string): MCPTransport;
  }
}

declare module '@modelcontextprotocol/sdk/client' {
  export * from '@modelcontextprotocol/sdk';
} 