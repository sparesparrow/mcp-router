/**
 * HTTP Service Implementation
 * Provides HTTP communication functionality using Axios.
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { IHttpService } from '../interfaces/IHttpService';

export class HttpService implements IHttpService {
  private readonly api: AxiosInstance;

  constructor(baseURL: string = process.env.REACT_APP_API_URL || 'http://localhost:8000') {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Performs a GET request
   */
  async get<T = any>(url: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.get(url, { params });
      return response.data;
    } catch (error) {
      console.error(`GET request failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Performs a POST request
   */
  async post<T = any>(url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.post(url, data);
      return response.data;
    } catch (error) {
      console.error(`POST request failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Performs a PUT request
   */
  async put<T = any>(url: string, data: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.put(url, data);
      return response.data;
    } catch (error) {
      console.error(`PUT request failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Performs a DELETE request
   */
  async delete<T = any>(url: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.delete(url);
      return response.data;
    } catch (error) {
      console.error(`DELETE request failed for ${url}:`, error);
      throw error;
    }
  }
}
