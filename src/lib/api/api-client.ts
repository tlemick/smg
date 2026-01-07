import { ApiResponse } from '@/types';

/**
 * Request options for API calls
 */
export interface RequestOptions extends RequestInit {
  retry?: boolean;
  maxRetries?: number;
  timeout?: number;
  skipErrorHandling?: boolean;
}

/**
 * Error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Centralized API Client for all HTTP communication
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Type-safe responses
 * - Consistent error handling
 * - Request cancellation support
 */
export class ApiClient {
  private static pendingRequests = new Map<string, Promise<any>>();

  /**
   * Core request method with retry logic and error handling
   */
  private static async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      retry = true,
      maxRetries = 3,
      timeout = 30000,
      skipErrorHandling = false,
      ...fetchOptions
    } = options;

    // Request deduplication - if same request is in flight, return existing promise
    const requestKey = `${fetchOptions.method || 'GET'}-${endpoint}`;
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    const executeRequest = async (attempt: number = 1): Promise<ApiResponse<T>> => {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

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

        // Handle non-OK responses
        if (!response.ok) {
          const errorMessage = data.error || `Request failed with status ${response.status}`;
          
          // Retry on 5xx errors or network issues
          if (retry && attempt < maxRetries && (response.status >= 500 || response.status === 429)) {
            const delay = this.calculateBackoff(attempt);
            await this.sleep(delay);
            return executeRequest(attempt + 1);
          }

          if (!skipErrorHandling) {
            console.error(`API Error [${endpoint}]:`, {
              status: response.status,
              error: errorMessage,
              attempt,
            });
          }

          throw new ApiError(errorMessage, response.status, data);
        }

        return data;
      } catch (error: any) {
        // Handle abort/timeout
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }

        // Handle network errors with retry
        if (retry && attempt < maxRetries && error.name !== 'ApiError') {
          const delay = this.calculateBackoff(attempt);
          await this.sleep(delay);
          return executeRequest(attempt + 1);
        }

        // Re-throw ApiError as-is
        if (error instanceof ApiError) {
          throw error;
        }

        // Wrap other errors
        const errorMessage = error.message || 'An unexpected error occurred';
        if (!skipErrorHandling) {
          console.error(`API Error [${endpoint}]:`, error);
        }
        throw new ApiError(errorMessage);
      }
    };

    // Execute request and manage pending requests map
    const requestPromise = executeRequest().finally(() => {
      this.pendingRequests.delete(requestKey);
    });

    this.pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  /**
   * Calculate exponential backoff delay
   */
  private static calculateBackoff(attempt: number): number {
    const baseDelay = 300; // 300ms
    const maxDelay = 5000; // 5s
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 300;
  }

  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  static async get<T>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
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
    data?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  static async put<T>(
    endpoint: string,
    data?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  static async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  static async delete<T>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Build query string from params object
   */
  static buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)));
        } else {
          searchParams.set(key, String(value));
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Clear all pending requests (useful for cleanup on unmount)
   */
  static clearPendingRequests(): void {
    this.pendingRequests.clear();
  }
}

