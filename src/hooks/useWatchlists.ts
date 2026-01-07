import { useState, useEffect, useCallback } from 'react';
import { ApiClient, ApiError } from '@/lib/api';
import {
  WatchlistDetailed,
  WatchlistQuoteItem,
  WatchlistUserHolding,
} from '@/types';

interface UseWatchlistsReturn {
  watchlists: WatchlistDetailed[];
  quotes: Record<string, WatchlistQuoteItem[]>;
  holdings: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for fetching watchlists with quotes and user holdings
 * Provides comprehensive watchlist data for dashboard display
 */
export function useWatchlists(): UseWatchlistsReturn {
  const [watchlists, setWatchlists] = useState<WatchlistDetailed[]>([]);
  const [quotes, setQuotes] = useState<Record<string, WatchlistQuoteItem[]>>({});
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlistData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch watchlists with items
      const watchlistsResult = await ApiClient.get<WatchlistDetailed[]>(
        '/api/watchlist' + ApiClient.buildQueryString({ include: 'items' })
      );

      if (!watchlistsResult.success) {
        throw new Error(watchlistsResult.error || 'Failed to fetch watchlists');
      }

      const watchlistsData = watchlistsResult.data || [];
      setWatchlists(watchlistsData);

      // Fetch quotes for each watchlist in parallel
      const quotesPromises = watchlistsData.map(async (watchlist) => {
        if (!watchlist.items || watchlist.items.length === 0) {
          return { watchlistId: watchlist.id, quotes: [] };
        }

        try {
          const quotesResult = await ApiClient.get<WatchlistQuoteItem[]>(
            `/api/watchlist/${watchlist.id}/quotes`
          );
          return {
            watchlistId: watchlist.id,
            quotes: quotesResult.success ? quotesResult.data || [] : [],
          };
        } catch (err) {
          console.error(`Failed to fetch quotes for watchlist ${watchlist.id}:`, err);
          return { watchlistId: watchlist.id, quotes: [] };
        }
      });

      const quotesResults = await Promise.all(quotesPromises);
      const quotesMap: Record<string, WatchlistQuoteItem[]> = {};
      quotesResults.forEach((result) => {
        quotesMap[result.watchlistId] = result.quotes;
      });
      setQuotes(quotesMap);

      // Fetch user holdings from portfolio overview
      try {
        const holdingsResult = await ApiClient.get<any>('/api/user/portfolio/overview');
        if (holdingsResult.success && holdingsResult.data?.allocations) {
          const holdingsMap: Record<string, number> = {};
          holdingsResult.data.allocations.forEach((allocation: any) => {
            holdingsMap[allocation.asset.ticker] = allocation.totalQuantity;
          });
          setHoldings(holdingsMap);
        }
      } catch (err) {
        // Holdings are optional, don't fail if unavailable
        console.log('Holdings not available:', err);
      }
    } catch (err) {
      console.error('Error fetching watchlists:', err);
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load watchlists';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchWatchlistData();
  }, [fetchWatchlistData]);

  const refresh = useCallback(async () => {
    await fetchWatchlistData();
  }, [fetchWatchlistData]);

  return {
    watchlists,
    quotes,
    holdings,
    isLoading,
    error,
    refresh,
  };
}
