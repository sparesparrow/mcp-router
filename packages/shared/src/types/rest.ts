/**
 * Type definitions for REST API endpoints
 */

// Common response types
export interface BaseResponse {
  status: string;
  timestamp: string;
}

// MCP API response types
export interface MCPInfoResponse extends BaseResponse {
  service: string;
  version: string;
  services: {
    ai: {
      status: string;
      version: string;
      endpoints: string[];
    };
    audio: {
      status: string;
      version: string;
      endpoints: string[];
    };
    websocket: {
      status: string;
      version: string;
      endpoints: string[];
    };
  };
}

// AI API types
export interface AIInfoResponse extends BaseResponse {
  model: string;
  capabilities: string[];
  max_tokens: number;
  version: string;
}

export interface AIGenerateRequest {
  prompt: string;
  context?: string[];
  tools?: any[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface AIGenerateResponse extends BaseResponse {
  text: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Audio API types
export interface AudioInfoResponse extends BaseResponse {
  voice_count: number;
  default_voice: string;
  version: string;
}

export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  preview_url?: string;
  settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface VoicesResponse extends BaseResponse {
  voices: Voice[];
}

export interface AudioSynthesizeRequest {
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

// Tools API types
export interface ToolsInfoResponse extends BaseResponse {
  service: string;
  version: string;
  available_tools: {
    id: string;
    name: string;
    description: string;
    endpoint: string;
  }[];
}

export interface CalculatorRequest {
  expression: string;
}

export interface CalculatorResponse extends BaseResponse {
  result: number | string;
}

export interface WebSearchRequest {
  query: string;
  max_results?: number;
}

export interface WebSearchResponse extends BaseResponse {
  results: {
    title: string;
    url: string;
    snippet: string;
  }[];
}

// Workflows API types
export interface WorkflowsInfoResponse extends BaseResponse {
  service: string;
  version: string;
  available_workflows: {
    id: string;
    name: string;
    description: string;
    endpoint: string;
  }[];
}

export interface SequentialThinkingRequest {
  problem: string;
  context?: string[];
  max_steps?: number;
}

export interface SequentialThinkingResponse extends BaseResponse {
  result: string;
  steps: {
    step: number;
    thought: string;
    is_revision?: boolean;
    revises_step?: number;
  }[];
}

export interface ChainOfThoughtRequest {
  problem: string;
  context?: string[];
}

export interface ChainOfThoughtResponse extends BaseResponse {
  result: string;
  chain: string[];
} 