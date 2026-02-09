import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClient, ApiError } from '@/lib/api';
import { usePortfolioOverview } from '@/hooks/usePortfolioOverview';
import type { PortfolioAllocation } from '@/types';

type PurchaseDatesMap = Record<string, string>;

// API route response structure (what /api/chart/batch returns)
type BatchChartApiResponse = {
  success: boolean;
  results: Array<{
    ticker: string;
    success: boolean;
    data?: number[];
    firstPrice?: number;
    lastPrice?: number;
    priceChangePercent?: number;
    error?: string;
  }>;
  error?: string;
};

export interface SparklineMetadata {
  data: number[];
  priceChangePercent?: number;
  firstPrice?: number;
  lastPrice?: number;
}

export interface PortfolioHighlightsData {
  topEarners: PortfolioAllocation[];
  topWorstPerformers: PortfolioAllocation[];
  sparklineDataByTicker: Record<string, SparklineMetadata>;
  hasHoldings: boolean;
}

export function usePortfolioHighlights() {
  const { allocations, isLoading: isPortfolioLoading, hasHoldings } = usePortfolioOverview();

  const [sparklineDataByTicker, setSparklineDataByTicker] = useState<Record<string, SparklineMetadata>>({});
  const [isSparklineLoading, setIsSparklineLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topEarners = useMemo(() => {
    if (!allocations) return [];
    return allocations
      .filter((a) => a.asset?.type === 'STOCK')
      .sort((a, b) => (b.unrealizedPnLPercent || 0) - (a.unrealizedPnLPercent || 0))
      .slice(0, 3);
  }, [allocations]);

  const topWorstPerformers = useMemo(() => {
    if (!allocations) return [];
    return allocations
      .filter((a) => a.asset?.type === 'STOCK')
      .sort((a, b) => (a.unrealizedPnLPercent || 0) - (b.unrealizedPnLPercent || 0))
      .slice(0, 3);
  }, [allocations]);

  // Stable string representation for effect deps
  const tickersString = useMemo(() => {
    const allTickers = [...topEarners, ...topWorstPerformers].map((a) => a.asset.ticker).sort();
    return Array.from(new Set(allTickers)).join(',');
  }, [topEarners, topWorstPerformers]);

  const fetchSparklines = useCallback(async () => {
    // This function should only be called when we have holdings
    // The useEffect guards against premature calls
    
    try {
      setIsSparklineLoading(true);
      setError(null);

      const allAllocations = [...topEarners, ...topWorstPerformers];
      const uniqueTickers = Array.from(new Set(allAllocations.map((a) => a.asset.ticker)));

      // Prefer per-ticker first purchase date; fallback to 30d
      let purchaseDates: PurchaseDatesMap = {};
      try {
        const purchaseDatesResp = await ApiClient.post<PurchaseDatesMap>(
          '/api/user/portfolio/first-purchase-dates',
          { tickers: uniqueTickers },
          // This endpoint is optional; silence console noise on failure
          { skipErrorHandling: true, retry: false }
        );
        if (purchaseDatesResp.success && purchaseDatesResp.data) {
          purchaseDates = purchaseDatesResp.data;
        }
      } catch (err) {
        // Fall back silently if purchase dates unavailable
      }

      const fallbackPeriod1 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const nowIso = new Date().toISOString();

      const requests = uniqueTickers.map((ticker) => ({
        ticker,
        period1: purchaseDates[ticker] || fallbackPeriod1,
        period2: nowIso,
      }));

      // ApiClient returns { success, data: <API response> }
      const batchResp = await ApiClient.post<BatchChartApiResponse>('/api/chart/batch', { requests });
      
      if (!batchResp) {
        throw new ApiError('No response from server');
      }
      
      if (!batchResp.success) {
        throw new ApiError(batchResp.error || 'API request failed');
      }
      
      if (!batchResp.data) {
        throw new ApiError('API response missing data field');
      }

      // batchResp.data is the API response: { success, results }
      const apiData = batchResp.data;
      
      if (!apiData.success) {
        throw new ApiError(apiData.error || 'Batch chart request failed');
      }

      const nextMap: Record<string, SparklineMetadata> = {};
      apiData.results.forEach((r) => {
        if (r.success && r.data) {
          nextMap[r.ticker] = {
            data: r.data,
            priceChangePercent: r.priceChangePercent,
            firstPrice: r.firstPrice,
            lastPrice: r.lastPrice,
          };
        }
      });

      setSparklineDataByTicker(nextMap);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load sparklines';
      setError(msg);
    } finally {
      setIsSparklineLoading(false);
    }
  }, [hasHoldings, topEarners, topWorstPerformers]);

  useEffect(() => {
    // Only fetch when we have holdings and tickers
    if (!hasHoldings || tickersString === '') {
      return;
    }
    
    fetchSparklines();
  }, [hasHoldings, tickersString, fetchSparklines]);

  const data = useMemo<PortfolioHighlightsData>(
    () => ({
      topEarners,
      topWorstPerformers,
      sparklineDataByTicker,
      hasHoldings,
    }),
    [topEarners, topWorstPerformers, sparklineDataByTicker, hasHoldings]
  );

  return {
    data,
    isLoading: isPortfolioLoading || isSparklineLoading,
    error,
    isPortfolioLoading,
    isSparklineLoading,
  };
}

