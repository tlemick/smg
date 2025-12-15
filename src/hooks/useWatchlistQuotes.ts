import { useState, useCallback, useEffect } from 'react';

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
      const response = await fetch(`/api/watchlist/${watchlistId}/quotes`);
      const data = await response.json();
      
      if (data.success) {
        setQuotes(data.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch quotes');
      }
    } catch (err: any) {
      console.error('Failed to fetch quotes:', err);
      setError('Failed to fetch quotes. Please try again.');
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