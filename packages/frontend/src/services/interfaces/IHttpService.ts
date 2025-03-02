/**
 * HTTP Service Interface
 * Defines the contract for HTTP communication services.
 */

export interface IHttpService {
  /**
   * Performs a GET request
   * @param url The endpoint URL
   * @param params Optional query parameters
   * @returns A promise resolving to the response data
   */
  get<T = any>(url: string, params?: Record<string, unknown>): Promise<T>;

  /**
   * Performs a POST request
   * @param url The endpoint URL
   * @param data The request body
   * @returns A promise resolving to the response data
   */
  post<T = any>(url: string, data?: any): Promise<T>;

  /**
   * Performs a PUT request
   * @param url The endpoint URL
   * @param data The request body
   * @returns A promise resolving to the response data
   */
  put<T = any>(url: string, data: any): Promise<T>;

  /**
   * Performs a DELETE request
   * @param url The endpoint URL
   * @returns A promise resolving to the response data
   */
  delete<T = any>(url: string): Promise<T>;
}
