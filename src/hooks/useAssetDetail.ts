/**
 * useAssetDetail Hook
 * 
 * Centralized hook for fetching comprehensive asset data including:
 * - Asset metadata (ticker, name, type, etc.)
 * - Real-time quote data
 * - User holdings (if authenticated)
 * - Type-specific data (stock/bond/fund metrics)
 * - Asset profile and risk measures
 * 
 * Architecture Compliance:
 * - Components NEVER fetch data directly
 * - This hook manages state and calls API
 * - Returns consistent { data, isLoading, error } pattern
 * - Can be reused across any component needing asset data
 * 
 * @example
 * const { data, isLoading, error, refetch } = useAssetDetail('AAPL');
 */

import { useState, useEffect, useCallback } from 'react';
import { AssetDetailData, AssetDetailApiResponse } from '@/types';

interface UseAssetDetailReturn {
  data: AssetDetailData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAssetDetail(ticker: string): UseAssetDetailReturn {
  const [data, setData] = useState<AssetDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!ticker) {
      setError('No ticker provided');
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchAssetData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/asset-detail/${ticker.toUpperCase()}`);
        
        if (!isMounted) return;

        const result: AssetDetailApiResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch asset data');
        }

        if (isMounted) {
          setData(result.data || null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching asset data:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAssetData();

    return () => {
      isMounted = false;
    };
  }, [ticker, refreshTrigger]);

  return { data, isLoading, error, refetch };
}
