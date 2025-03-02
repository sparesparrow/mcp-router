/**
 * HTTP Service Interface
 * 
 * Provides methods for making HTTP requests to APIs.
 * This service abstracts the underlying HTTP client implementation,
 * allowing for easy substitution and testing.
 */

/**
 * Configuration options for HTTP requests
 */
export interface HttpRequestOptions {
  /** Custom headers to include with the request */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to include credentials for cross-origin requests */
  withCredentials?: boolean;
}

/**
 * HTTP Service Interface
 * Provides methods for making HTTP requests.
 */
export interface IHttpService {
  /**
   * Performs a GET request to the specified URL
   * 
   * @template T - The expected response data type
   * @param url - The URL to request (can be relative to the base URL)
   * @param options - Optional request configuration
   * @returns A promise that resolves to the response data
   * @throws AppError if the request fails
   * 
   * @example
   * ```typescript
   * const data = await httpService.get<UserData>('/api/users/1');
   * ```
   */
  get<T>(url: string, options?: HttpRequestOptions): Promise<T>;

  /**
   * Performs a POST request to the specified URL with the provided data
   * 
   * @template T - The expected response data type
   * @param url - The URL to request (can be relative to the base URL)
   * @param data - The data to send in the request body
   * @param options - Optional request configuration
   * @returns A promise that resolves to the response data
   * @throws AppError if the request fails
   * 
   * @example
   * ```typescript
   * const result = await httpService.post<ApiResponse>('/api/users', { name: 'John' });
   * ```
   */
  post<T>(url: string, data: any, options?: HttpRequestOptions): Promise<T>;

  /**
   * Performs a PUT request to the specified URL with the provided data
   * 
   * @template T - The expected response data type
   * @param url - The URL to request (can be relative to the base URL)
   * @param data - The data to send in the request body
   * @param options - Optional request configuration
   * @returns A promise that resolves to the response data
   * @throws AppError if the request fails
   */
  put<T>(url: string, data: any, options?: HttpRequestOptions): Promise<T>;

  /**
   * Performs a DELETE request to the specified URL
   * 
   * @template T - The expected response data type
   * @param url - The URL to request (can be relative to the base URL)
   * @param options - Optional request configuration
   * @returns A promise that resolves to the response data
   * @throws AppError if the request fails
   */
  delete<T>(url: string, options?: HttpRequestOptions): Promise<T>;
}
