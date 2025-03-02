/**
 * AI Client for the AI service API
 */
import { 
  AIInfoResponse, 
  AIGenerateRequest, 
  AIGenerateResponse, 
  ServiceConfig 
} from '@mcp-router/shared';
import { HttpClient } from './HttpClient';

export class AIClient {
  private client: HttpClient;

  constructor(config: ServiceConfig) {
    this.client = new HttpClient(config);
  }

  /**
   * Get information about the AI service
   */
  async getInfo(): Promise<AIInfoResponse> {
    return this.client.get<AIInfoResponse>('/info');
  }

  /**
   * Generate text using the AI service
   */
  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    return this.client.post<AIGenerateResponse>('/generate', request);
  }

  /**
   * Generate text using the AI service with streaming
   * @returns An async generator that yields text chunks
   */
  async *generateStream(request: AIGenerateRequest): AsyncGenerator<string> {
    const streamRequest = { ...request, stream: true };
    const url = this.client.getUrl('/generate');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(streamRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                yield parsed.text;
              }
            } catch (error) {
              console.error('Error parsing JSON from stream:', error);
              // Continue processing despite parsing error
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
} 