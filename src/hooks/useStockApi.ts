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

export function useStockApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callApi = async <TRequest, TResponse>(
    endpoint: string,
    data: TRequest
  ): Promise<TResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<TResponse> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Request failed');
      }

      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Request failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getQuote = (request: QuoteApiRequest) => 
    callApi<QuoteApiRequest, QuoteApiResponse>('/api/quote', request);

  const getChart = (request: ChartApiRequest) => 
    callApi<ChartApiRequest, ChartApiResponse>('/api/chart', request);

  const search = (request: SearchApiRequest) => 
    callApi<SearchApiRequest, SearchApiResponse>('/api/search', request);

  return {
    loading,
    error,
    getQuote,
    getChart,
    search,
  };
} 