/**
 * useWatchlistStatus Hook
 * 
 * Fetches watchlist status for a specific asset ticker.
 * Shows how many watchlists contain this asset.
 * 
 * Architecture Compliance:
 * - Extracted from AssetHeader component (components shouldn't fetch data)
 * - Returns consistent { data, isLoading, error } pattern
 * - Reusable across any component needing watchlist status
 * 
 * @example
 * const { inWatchlists, totalWatchlists, isLoading } = useWatchlistStatus('AAPL', true);
 */

import { useState, useEffect } from 'react';

interface WatchlistStatusData {
  inWatchlists: number;
  totalWatchlists: number;
}

interface UseWatchlistStatusReturn {
  inWatchlists: number;
  totalWatchlists: number;
  isLoading: boolean;
  error: string | null;
}

export function useWatchlistStatus(
  ticker: string,
  authenticated: boolean
): UseWatchlistStatusReturn {
  const [data, setData] = useState<WatchlistStatusData>({
    inWatchlists: 0,
    totalWatchlists: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't fetch if not authenticated
    if (!authenticated || !ticker) {
      setData({ inWatchlists: 0, totalWatchlists: 0 });
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchWatchlistStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/user/watchlists/for-asset/${ticker.toUpperCase()}`
        );
        
        if (!isMounted) return;

        const result = await response.json();

        if (result.success && result.data) {
          const containingWatchlists = result.data.watchlists.filter(
            (w: any) => w.containsAsset
          );
          
          if (isMounted) {
            setData({
              inWatchlists: containingWatchlists.length,
              totalWatchlists: result.data.watchlists.length,
            });
          }
        } else {
          if (isMounted) {
            setError(result.error || 'Failed to fetch watchlist status');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching watchlist status:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchWatchlistStatus();

    return () => {
      isMounted = false;
    };
  }, [ticker, authenticated]);

  return {
    inWatchlists: data.inWatchlists,
    totalWatchlists: data.totalWatchlists,
    isLoading,
    error,
  };
}
