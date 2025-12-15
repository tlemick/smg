import { useCallback, useEffect, useState } from 'react';
import { PortfolioPerformanceSeriesResponse } from '@/types';

export function usePortfolioPerformanceSeries() {
  const [data, setData] = useState<PortfolioPerformanceSeriesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/user/portfolio/performance-series');
      const json: PortfolioPerformanceSeriesResponse = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch performance series');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance series');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refresh = useCallback(() => fetchData(), [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    points: data?.data?.points || [],
    meta: data?.meta,
  };
}


