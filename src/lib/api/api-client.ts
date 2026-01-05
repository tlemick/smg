/**
 * ApiClient Service
 * 
 * Centralized HTTP client for all API communication.
 * Provides consistent error handling, retry logic, and request/response formatting.
 * 
 * USAGE RULES:
 * - All API calls should go through this client
 * - No direct fetch() calls in hooks or components
 * - Consistent error handling across the application
 * 
 * @example
 * // In a hook:
 * const data = await ApiClient.get<PortfolioData>('/api/portfolio/overview');
 * const result = await ApiClient.post<OrderResponse>('/api/trade/market-order', orderData);
 */

import type { ApiResponse } from '@/types';

export interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static readonly DEFAULT_RETRIES = 0; // No retries by default
  private static readonly DEFAULT_RETRY_DELAY = 1000; // 1 second
  
  /**
   * Make an HTTP request with error handling and retries
   */
  private static async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      retries = this.DEFAULT_RETRIES,
      retryDelay = this.DEFAULT_RETRY_DELAY,
      timeout = this.DEFAULT_TIMEOUT,
      ...fetchOptions
    } = options;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    let lastError: Error | null = null;
    
    // Retry loop
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(endpoint, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        });
        
        clearTimeout(timeoutId);
        
        // Parse response
        const data: ApiResponse<T> = await response.json();
        
        // Check for HTTP errors
        if (!response.ok) {
          throw new ApiError(
            data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            data
          );
        }
        
        // Check for application-level errors
        if (!data.success && data.error) {
          throw new ApiError(data.error, response.status, data);
        }
        
        return data;
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort (timeout)
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }
        
        // Don't retry on 4xx errors (client errors)
        if (error instanceof ApiError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }
        
        // If we have retries left, wait and try again
        if (attempt < retries) {
          await this.delay(retryDelay * (attempt + 1)); // Exponential backoff
          continue;
        }
        
        // No more retries, throw the error
        throw error;
      }
    }
    
    // Should never reach here, but TypeScript requires it
    throw lastError || new Error('Request failed');
  }
  
  /**
   * GET request
   */
  static async get<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }
  
  /**
   * POST request
   */
  static async post<T>(
    endpoint: string,
    data: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  /**
   * PUT request
   */
  static async put<T>(
    endpoint: string,
    data: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  /**
   * PATCH request
   */
  static async patch<T>(
    endpoint: string,
    data: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
  
  /**
   * DELETE request
   */
  static async delete<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
  
  /**
   * Utility: Delay for retry logic
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Check if error is an ApiError
   */
  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
  
  /**
   * Extract error message from various error types
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
      return error.message;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'An unknown error occurred';
  }
}
