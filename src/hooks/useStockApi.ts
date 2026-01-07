import { useState } from 'react';
import { 
  QuoteApiRequest, 
  QuoteApiResponse, 
  ChartApiRequest, 
  ChartApiResponse, 
  SearchApiRequest, 
  SearchApiResponse,
  ApiResponse 
} from '@/types';
import { ApiClient, ApiError } from '@/lib/api';

export function useStockApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callApi = async <TRequest, TResponse>(
    endpoint: string,
    data: TRequest
  ): Promise<TResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ApiClient.post<TResponse>(endpoint, data);

      if (!result.success) {
        throw new Error(result.error || 'Request failed');
      }

      if (result.data) {
        return result.data;
      } else {
        throw new Error('No data returned from API');
      }
    } catch (err: any) {
      const errorMessage = err instanceof ApiError ? err.message : 'An error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getQuote = (request: QuoteApiRequest) => 
    callApi<QuoteApiRequest, QuoteApiResponse>('/api/quote', request);

  const getChart = (request: ChartApiRequest) => 
    callApi<ChartApiRequest, ChartApiResponse>('/api/chart', request);

  const search = (request: SearchApiRequest) => 
    callApi<SearchApiRequest, SearchApiResponse>('/api/search', request);

  return {
    isLoading,
    error,
    getQuote,
    getChart,
    search,
  };
} 