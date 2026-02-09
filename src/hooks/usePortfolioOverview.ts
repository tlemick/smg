import { useState, useEffect, useCallback } from 'react';
import { PortfolioOverviewResponse } from '@/types';
import { ApiClient, ApiError } from '@/lib/api';
import { Formatters } from '@/lib/financial';

export function usePortfolioOverview() {
  const [data, setData] = useState<PortfolioOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchPortfolioData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await ApiClient.get<PortfolioOverviewResponse['data']>('/api/user/portfolio/overview');

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch portfolio data');
      }

      setData(result as PortfolioOverviewResponse);
      setLastFetch(new Date());
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load portfolio data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
    isLoading,
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
    // Formatted display values (components should prefer these)
    formattedTotalPortfolioValue: Formatters.currency(data?.data?.totalPortfolioValue),
    formattedCashBalance: Formatters.currency(data?.data?.cashBalance),
    formattedTotalUnrealizedPnLPercent: Formatters.percentage(
      data?.data?.totalUnrealizedPnLPercent,
      { showSign: true, multiplier: 1 }
    ),
    totalUnrealizedPnLColorClass:
      (data?.data?.totalUnrealizedPnLPercent ?? 0) >= 0
        ? 'text-chart-positive'
        : 'text-chart-negative',
  };
} 