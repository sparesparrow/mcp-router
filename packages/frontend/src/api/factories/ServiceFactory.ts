/**
 * Factory for creating and configuring client services
 */
import { MCPConfig, ServiceType } from '@mcp-router/shared';
import { HttpClient } from '../HttpClient';
import { AIClient } from '../AIClient';
import { AudioClient } from '../AudioClient';
import { MCPInfoClient } from '../MCPInfoClient';
import { MCPWebSocketClient } from '../MCPWebSocketClient';

/**
 * Factory for creating and configuring client services
 */
export class ServiceFactory {
  private config: MCPConfig;
  
  /**
   * Create a new ServiceFactory with the given configuration
   */
  constructor(config: MCPConfig) {
    this.config = config;
  }
  
  /**
   * Create an MCP Info client
   */
  createMCPInfoClient(): MCPInfoClient {
    return new MCPInfoClient({
      baseUrl: `${this.config.baseUrl}/api/mcp`,
    });
  }
  
  /**
   * Create an AI client
   */
  createAIClient(): AIClient {
    const aiConfig = this.config.ai || {
      baseUrl: `${this.config.baseUrl}/api/mcp/ai`,
    };
    
    return new AIClient(aiConfig);
  }
  
  /**
   * Create an Audio client
   */
  createAudioClient(): AudioClient {
    const audioConfig = this.config.audio || {
      baseUrl: `${this.config.baseUrl}/api/mcp/audio`,
    };
    
    return new AudioClient(audioConfig);
  }
  
  /**
   * Create a WebSocket client
   */
  createWebSocketClient(): MCPWebSocketClient {
    return new MCPWebSocketClient({
      url: this.config.websocketUrl || `${this.config.baseUrl.replace(/^http/, 'ws')}/api/mcp/ws`,
      reconnectInterval: this.config.reconnectInterval,
      maxReconnectAttempts: this.config.maxReconnectAttempts,
    });
  }
  
  /**
   * Create an HTTP client for a specific service
   */
  createHttpClient(serviceType: ServiceType): HttpClient {
    switch (serviceType) {
      case ServiceType.AI:
        const aiConfig = this.config.ai || {
          baseUrl: `${this.config.baseUrl}/api/mcp/ai`,
        };
        return new HttpClient(aiConfig);
        
      case ServiceType.AUDIO:
        const audioConfig = this.config.audio || {
          baseUrl: `${this.config.baseUrl}/api/mcp/audio`,
        };
        return new HttpClient(audioConfig);
        
      case ServiceType.TOOLS:
        const toolsConfig = this.config.tools || {
          baseUrl: `${this.config.baseUrl}/api/tools`,
        };
        return new HttpClient(toolsConfig);
        
      case ServiceType.WORKFLOWS:
        const workflowsConfig = this.config.workflows || {
          baseUrl: `${this.config.baseUrl}/api/workflows`,
        };
        return new HttpClient(workflowsConfig);
        
      default:
        return new HttpClient({
          baseUrl: this.config.baseUrl,
        });
    }
  }
} 