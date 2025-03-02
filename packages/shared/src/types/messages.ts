/**
 * Shared message types for MCP Router communication
 */

// Base message interface
export interface MCPMessage {
  id?: string;
  timestamp?: string;
}

// AI Service Messages
export interface AIRequestMessage extends MCPMessage {
  type: 'ai_request';
  prompt: string;
  context?: string[];
  tools?: any[];
  stream?: boolean;
}

export interface AIResponseMessage extends MCPMessage {
  type: 'ai_response';
  text: string;
  finished: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIErrorMessage extends MCPMessage {
  type: 'ai_error';
  error: string;
  code?: string;
  details?: any;
}

// Audio Service Messages
export interface AudioRequestMessage extends MCPMessage {
  type: 'audio_request';
  text: string;
  voice_id?: string;
  settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  stream?: boolean;
}

export interface AudioResponseMessage extends MCPMessage {
  type: 'audio_response';
  audio_data: string; // base64 encoded audio chunk
  finished: boolean;
  voice_id?: string;
}

export interface AudioErrorMessage extends MCPMessage {
  type: 'audio_error';
  error: string;
  code?: string;
  details?: any;
}

// WebSocket Connection Messages
export interface ConnectMessage extends MCPMessage {
  type: 'connect';
  client_id?: string;
  client_info?: {
    name?: string;
    version?: string;
    capabilities?: string[];
  };
}

export interface ConnectResponseMessage extends MCPMessage {
  type: 'connect_response';
  status: 'success' | 'error';
  server_id: string;
  server_info?: {
    name: string;
    version: string;
    capabilities: string[];
  };
  error?: string;
}

// Info Messages
export interface InfoRequestMessage extends MCPMessage {
  type: 'info_request';
  service?: string;
}

export interface InfoResponseMessage extends MCPMessage {
  type: 'info_response';
  status: string;
  timestamp: string;
  services: {
    [key: string]: {
      status: string;
      version: string;
      endpoints: string[];
    };
  };
}

// Service-specific info responses
export interface AIInfoResponseMessage extends MCPMessage {
  type: 'ai_info_response';
  model: string;
  capabilities: string[];
  max_tokens: number;
  version: string;
}

export interface AudioInfoResponseMessage extends MCPMessage {
  type: 'audio_info_response';
  voice_count: number;
  default_voice: string;
  version: string;
}

// Union type for all message types
export type MCP_Message = 
  | AIRequestMessage
  | AIResponseMessage
  | AIErrorMessage
  | AudioRequestMessage
  | AudioResponseMessage
  | AudioErrorMessage
  | ConnectMessage
  | ConnectResponseMessage
  | InfoRequestMessage
  | InfoResponseMessage
  | AIInfoResponseMessage
  | AudioInfoResponseMessage; 