import { useCallback, useEffect, useState } from 'react';
import { PortfolioCategorySeriesResponse } from '@/types';

export function usePortfolioCategorySeries(initialRange: string = '1m') {
  const [range, setRange] = useState<string>(initialRange);
  const [data, setData] = useState<PortfolioCategorySeriesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (r: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/user/portfolio/category-series?range=${encodeURIComponent(r)}`);
      const json: PortfolioCategorySeriesResponse = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch category series');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch category series');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [fetchData, range]);

  const refresh = useCallback(() => fetchData(range), [fetchData, range]);

  return {
    range,
    setRange,
    data,
    loading,
    error,
    refresh,
    points: data?.data?.points || [],
  };
}


