/**
 * MCP Backend Service for integrating all MCP services
 */
import { EventEmitter } from 'events';
import { MCPConfig, ConnectionState } from '@mcp-router/shared';
import { ServiceFactory } from './factories/ServiceFactory';
import { AIClient } from './AIClient';
import { AudioClient } from './AudioClient';
import { MCPInfoClient } from './MCPInfoClient';
import { MCPWebSocketClient } from './MCPWebSocketClient';

export class MCPBackendService extends EventEmitter {
  private factory: ServiceFactory;
  private aiClient: AIClient;
  private audioClient: AudioClient;
  private infoClient: MCPInfoClient;
  private wsClient: MCPWebSocketClient;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;

  constructor(config: MCPConfig) {
    super();
    
    this.factory = new ServiceFactory(config);
    this.aiClient = this.factory.createAIClient();
    this.audioClient = this.factory.createAudioClient();
    this.infoClient = this.factory.createMCPInfoClient();
    this.wsClient = this.factory.createWebSocketClient();
    
    // Forward WebSocket events
    this.wsClient.on('connected', () => {
      this.connectionState = ConnectionState.CONNECTED;
      this.emit('connected');
    });
    
    this.wsClient.on('disconnected', () => {
      this.connectionState = ConnectionState.DISCONNECTED;
      this.emit('disconnected');
    });
    
    this.wsClient.on('reconnecting', (attempt) => {
      this.connectionState = ConnectionState.RECONNECTING;
      this.emit('reconnecting', attempt);
    });
    
    this.wsClient.on('error', (error) => {
      this.connectionState = ConnectionState.ERROR;
      this.emit('error', error);
    });
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    if (this.connectionState === ConnectionState.CONNECTED || 
        this.connectionState === ConnectionState.CONNECTING) {
      return;
    }

    this.connectionState = ConnectionState.CONNECTING;
    this.emit('connecting');
    
    try {
      await this.wsClient.connect();
    } catch (error) {
      this.connectionState = ConnectionState.ERROR;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.wsClient.disconnect();
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get information about the MCP services
   */
  async getMCPInfo() {
    return this.infoClient.getInfo();
  }

  /**
   * Get information about the AI service
   */
  async getAIInfo() {
    return this.aiClient.getInfo();
  }

  /**
   * Generate text using the AI service
   */
  async generateText(prompt: string, context: string[] = [], tools: any[] = []) {
    return this.aiClient.generate({
      prompt,
      context,
      tools
    });
  }

  /**
   * Generate text using the AI service with streaming
   * @returns An async generator that yields text chunks
   */
  async streamText(prompt: string, context: string[] = [], tools: any[] = []) {
    return this.aiClient.generateStream({
      prompt,
      context,
      tools
    });
  }

  /**
   * Get information about the Audio service
   */
  async getAudioInfo() {
    return this.audioClient.getInfo();
  }

  /**
   * Get available voices from the Audio service
   */
  async getVoices() {
    return this.audioClient.getVoices();
  }

  /**
   * Synthesize text to speech using the Audio service
   */
  async synthesizeSpeech(text: string, voiceId?: string, settings?: any) {
    return this.audioClient.synthesize({
      text,
      voice_id: voiceId,
      settings
    });
  }

  /**
   * Synthesize text to speech using the Audio service with streaming
   * @returns An async generator that yields audio chunks as base64 strings
   */
  async streamSpeech(text: string, voiceId?: string, settings?: any) {
    return this.audioClient.synthesizeStream({
      text,
      voice_id: voiceId,
      settings
    });
  }

  /**
   * Send an AI request via WebSocket and get the response
   */
  async sendAIRequest(prompt: string, context: string[] = [], tools: any[] = []) {
    await this.ensureConnected();
    
    return this.wsClient.sendAIRequest({
      prompt,
      context,
      tools
    });
  }

  /**
   * Send an AI request via WebSocket with streaming and get a stream of responses
   */
  async streamAIRequest(prompt: string, context: string[] = [], tools: any[] = []) {
    await this.ensureConnected();
    
    return this.wsClient.streamAIRequest({
      prompt,
      context,
      tools
    });
  }

  /**
   * Send an audio request via WebSocket and get the response
   */
  async sendAudioRequest(text: string, voiceId?: string, settings?: any) {
    await this.ensureConnected();
    
    return this.wsClient.sendAudioRequest({
      text,
      voice_id: voiceId,
      settings
    });
  }

  /**
   * Send an audio request via WebSocket with streaming and get a stream of audio chunks
   */
  async streamAudioRequest(text: string, voiceId?: string, settings?: any) {
    await this.ensureConnected();
    
    return this.wsClient.streamAudioRequest({
      text,
      voice_id: voiceId,
      settings
    });
  }

  /**
   * Ensure the WebSocket is connected
   */
  private async ensureConnected(): Promise<void> {
    if (this.connectionState !== ConnectionState.CONNECTED) {
      await this.connect();
    }
  }
} 