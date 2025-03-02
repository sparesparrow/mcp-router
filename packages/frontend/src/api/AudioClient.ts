/**
 * Audio Client for the Audio service API
 */
import { 
  AudioInfoResponse, 
  AudioSynthesizeRequest, 
  VoicesResponse, 
  ServiceConfig 
} from '@mcp-router/shared';
import { HttpClient } from './HttpClient';

export class AudioClient {
  private client: HttpClient;

  constructor(config: ServiceConfig) {
    this.client = new HttpClient(config);
  }

  /**
   * Get information about the Audio service
   */
  async getInfo(): Promise<AudioInfoResponse> {
    return this.client.get<AudioInfoResponse>('/info');
  }

  /**
   * Get available voices from the Audio service
   */
  async getVoices(): Promise<VoicesResponse> {
    return this.client.get<VoicesResponse>('/voices');
  }

  /**
   * Synthesize text to speech using the Audio service
   * Returns a Blob containing the audio data
   */
  async synthesize(request: AudioSynthesizeRequest): Promise<Blob> {
    const url = `${this.client.getUrl('/synthesize')}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    return await response.blob();
  }

  /**
   * Synthesize text to speech using the Audio service with streaming
   * @returns An async generator that yields audio chunks as base64 strings
   */
  async *synthesizeStream(request: AudioSynthesizeRequest): AsyncGenerator<string> {
    const streamRequest = { ...request, stream: true };
    const url = `${this.client.getUrl('/synthesize')}`;

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
              if (parsed.audio_data) {
                yield parsed.audio_data;
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