export interface MCPMessage {
  id: string;
  method: string;
  params: Record<string, any>;
}

export interface MCPError {
  code: string;
  message: string;
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export interface Tool {
  name: string;
  description: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
}

export interface ToolResult {
  id: string;
  timestamp: string;
  result: any;
}

export interface MCPConfig {
  serverUrl: string;
  apiKey: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface MCPConnectionInfo {
  id: string;
  connected_at: string;
  client_info: {
    user_agent: string;
    client_version: string;
    api_key: string;
  };
  messages_sent: number;
  messages_received: number;
  errors: number;
}

export interface MCPServerStatus {
  status: 'healthy' | 'degraded' | 'error';
  metrics: {
    tools: {
      [key: string]: {
        calls: number;
        successes: number;
        failures: number;
        avg_duration: number;
        last_execution: string | null;
        error_distribution: Record<string, number>;
      };
    };
    connections: {
      active_connections: number;
      connections: MCPConnectionInfo[];
    };
  };
  server_time: string;
}

export interface MCPToolMetrics {
  calls: number;
  successes: number;
  failures: number;
  total_duration: number;
  avg_duration: number;
  last_execution: string | null;
  error_counts: Record<string, number>;
}

export interface MCPSystemMetrics {
  cpu: {
    percent: number;
    count: number;
    frequency?: {
      current: number;
      min: number;
      max: number;
    };
  };
  memory: {
    total: number;
    available: number;
    percent: number;
    used: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  network: {
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
    error_in: number;
    error_out: number;
  };
}

export interface MCPWorkflowAnalysis {
  workflow_id: string;
  analysis_time: string;
  patterns: string[];
  bottlenecks: string[];
  recommendations: string[];
  metrics?: {
    execution_count: number;
    average_duration: number;
    success_rate: number;
    error_distribution: Record<string, number>;
    performance_metrics: {
      cpu_usage: number;
      memory_usage: number;
      io_operations: number;
    };
  };
}

export interface MCPCodeAnalysis {
  file_path: string;
  analysis_time: string;
  metrics: {
    solid?: {
      solid_score: number;
      [key: string]: any;
    };
    complexity?: {
      complexity: number;
      [key: string]: any;
    };
    security?: {
      security_score: number;
      [key: string]: any;
    };
  };
  issues: string[];
  recommendations: string[];
}

export interface MCPNetworkInfo {
  timestamp: string;
  interfaces: Array<{
    name: string;
    addresses: string[];
    status: 'up' | 'down';
    speed: number;
  }>;
  connections?: Array<{
    local_address: string;
    remote_address: string | null;
    status: string;
    pid: number;
  }>;
  stats?: {
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
    error_in: number;
    error_out: number;
    drop_in: number;
    drop_out: number;
  };
} 