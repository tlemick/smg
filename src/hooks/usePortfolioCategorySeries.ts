import { useCallback, useEffect, useState } from 'react';
import { PortfolioCategorySeriesResponse } from '@/types';
import { ApiClient, ApiError } from '@/lib/api';

export function usePortfolioCategorySeries(initialRange: string = '1m') {
  const [range, setRange] = useState<string>(initialRange);
  const [data, setData] = useState<PortfolioCategorySeriesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (r: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await ApiClient.get<PortfolioCategorySeriesResponse['data']>(
        `/api/user/portfolio/category-series${ApiClient.buildQueryString({ range: r })}`
      );
      if (!result.success) throw new Error(result.error || 'Failed to fetch category series');
      setData(result as PortfolioCategorySeriesResponse);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch category series';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
    isLoading,
    error,
    refresh,
    points: data?.data?.points || [],
  };
}


