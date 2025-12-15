import { useState, useEffect, useCallback } from 'react';
import { PortfolioOverviewResponse } from '@/types';

export function usePortfolioOverview() {
  const [data, setData] = useState<PortfolioOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchPortfolioData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/portfolio/overview');
      const result: PortfolioOverviewResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch portfolio data');
      }

      setData(result);
      setLastFetch(new Date());
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  const isStale = useCallback((maxAgeMinutes: number = 5) => {
    if (!lastFetch) return true;
    const now = new Date();
    const diffMinutes = (now.getTime() - lastFetch.getTime()) / (1000 * 60);
    return diffMinutes > maxAgeMinutes;
  }, [lastFetch]);

  return {
    data,
    loading,
    error,
    refresh,
    lastFetch,
    isStale,
    // Helper getters
    totalPortfolioValue: data?.data?.totalPortfolioValue || 0,
    cashBalance: data?.data?.cashBalance || 0,
    totalInvestedValue: data?.data?.totalInvestedValue || 0,
    totalUnrealizedPnLPercent: data?.data?.totalUnrealizedPnLPercent || 0,
    allocations: data?.data?.allocations || [],
    portfolioBreakdown: data?.data?.portfolioBreakdown || [],
    hasHoldings: (data?.data?.allocations?.length || 0) > 0,
  };
} 