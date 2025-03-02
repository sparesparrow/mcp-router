/**
 * Handles response routing and pending request management
 */
import { Message, Response } from '../types/mcp';
import { Logger } from '../utils/Logger';

type ResponseResolver = {
  resolve: (value: Response) => void;
  reject: (reason: any) => void;
  timeout?: NodeJS.Timeout;
};

export class ResponseHandler {
  private pendingRequests: Map<string, ResponseResolver> = new Map();
  private logger: Logger;
  private defaultTimeout: number = 30000; // 30 seconds
  
  constructor(logger?: Logger) {
    this.logger = logger || new Logger('ResponseHandler');
  }

  /**
   * Registers a pending request with its resolver functions
   */
  registerRequest(
    id: string,
    resolve: (value: Response) => void,
    reject: (reason: any) => void,
    timeoutMs?: number
  ): void {
    // If we already have a pending request with this ID, reject it first
    if (this.pendingRequests.has(id)) {
      this.logger.warn(`Overwriting existing request with ID: ${id}`);
      const existing = this.pendingRequests.get(id);
      if (existing && existing.timeout) {
        clearTimeout(existing.timeout);
      }
      existing?.reject(new Error('Request superseded by newer request with same ID'));
    }

    let timeout: NodeJS.Timeout | undefined;
    
    // Set up timeout if specified or if default timeout is positive
    const timeoutDuration = timeoutMs !== undefined ? timeoutMs : this.defaultTimeout;
    
    if (timeoutDuration > 0) {
      timeout = setTimeout(() => {
        const resolver = this.pendingRequests.get(id);
        if (resolver) {
          this.logger.warn(`Request with ID ${id} timed out after ${timeoutDuration}ms`);
          this.pendingRequests.delete(id);
          reject(new Error(`Request timed out after ${timeoutDuration}ms`));
        }
      }, timeoutDuration);
    }

    this.pendingRequests.set(id, { resolve, reject, timeout });
    this.logger.debug(`Registered request with ID: ${id}`);
  }

  /**
   * Handles a response by routing it to the corresponding resolver
   */
  handleResponse(response: Response): boolean {
    const resolver = this.pendingRequests.get(response.id);
    
    if (!resolver) {
      this.logger.warn(`Received response for unknown request ID: ${response.id}`);
      return false;
    }

    // Clear any timeout
    if (resolver.timeout) {
      clearTimeout(resolver.timeout);
    }

    // Call the appropriate resolver
    if (response.success) {
      resolver.resolve(response);
    } else {
      resolver.reject(response.error || new Error('Request failed with no error details'));
    }

    // Remove the request from pending
    this.pendingRequests.delete(response.id);
    this.logger.debug(`Handled response for request ID: ${response.id}`);
    
    return true;
  }

  /**
   * Cancels all pending requests with an error
   */
  cancelAllRequests(reason: string): void {
    this.logger.info(`Cancelling all pending requests: ${reason}`);
    
    for (const [id, resolver] of this.pendingRequests.entries()) {
      if (resolver.timeout) {
        clearTimeout(resolver.timeout);
      }
      resolver.reject(new Error(`Request cancelled: ${reason}`));
      this.pendingRequests.delete(id);
    }
  }

  /**
   * Returns the number of pending requests
   */
  getPendingRequestCount(): number {
    return this.pendingRequests.size;
  }
}
