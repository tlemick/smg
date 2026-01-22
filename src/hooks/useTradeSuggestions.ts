import { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@/lib/api';
import type { StockSuggestion } from '@/types';

type SuggestionCategory = 'trending' | 'consumer-brands' | 'dividend-aristocrats' | 'penny-stocks';

/**
 * Custom hook for fetching trade suggestions by category
 * 
 * Returns suggestions with loading/error states following architecture patterns
 * 
 * @param category - The type of suggestions to fetch
 * @returns Object with data, isLoading, error, and refresh function
 */
export function useTradeSuggestions(category: SuggestionCategory) {
  const [data, setData] = useState<StockSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await ApiClient.get<StockSuggestion[]>(
        `/api/trade-suggestions/${category}`
      );
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch suggestions');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while fetching suggestions';
      setError(errorMessage);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return { 
    data, 
    isLoading, 
    error, 
    refresh: fetchSuggestions 
  };
}
