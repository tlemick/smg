import { useState, useCallback, useEffect } from 'react';
import { ApiClient, ApiError } from '@/lib/api';

interface Asset {
  id: number;
  ticker: string;
  name: string;
  type: string;
}

interface QuoteData {
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  currency: string;
  marketState: string;
  isCached: boolean;
  cacheAge: number;
}

interface WatchlistQuote {
  watchlistItemId: string;
  asset: Asset;
  quote: QuoteData | null;
  error: string | null;
}

interface UseWatchlistQuotesReturn {
  quotes: WatchlistQuote[];
  lastUpdate: Date;
  isRefreshing: boolean;
  error: string | null;
  refreshQuotes: () => Promise<void>;
}

/**
 * Custom hook for managing watchlist quotes with manual refresh
 * Provides optimized batch fetching and user-controlled updates
 */
export function useWatchlistQuotes(watchlistId: string): UseWatchlistQuotesReturn {
  const [quotes, setQuotes] = useState<WatchlistQuote[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (!watchlistId) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const result = await ApiClient.get<WatchlistQuote[]>(`/api/watchlist/${watchlistId}/quotes`);
      
      if (result.success && result.data) {
        setQuotes(result.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch quotes');
      }
    } catch (err: any) {
      console.error('Failed to fetch quotes:', err);
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch quotes. Please try again.';
      setError(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  }, [watchlistId]);

  // Initial fetch when watchlistId changes
  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Manual refresh function
  const refreshQuotes = useCallback(async () => {
    await fetchQuotes();
  }, [fetchQuotes]);

  return {
    quotes,
    lastUpdate,
    isRefreshing,
    error,
    refreshQuotes,
  };
} 