export interface Message {
  id: string;
  method: string;
  params?: any;
}

export interface Response {
  id: string;
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

export interface Transport {
  connect(): Promise<void>;
  send(message: Message): Promise<Response>;
  onMessage(handler: (msg: Message) => void): void;
  close(): Promise<void>;
}

export interface ClientConfig {
  name: string;
  version: string;
  capabilities: string[];
} 