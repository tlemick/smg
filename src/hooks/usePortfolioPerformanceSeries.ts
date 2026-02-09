import { useCallback, useEffect, useState, useMemo } from 'react';
import { PortfolioPerformanceSeriesResponse } from '@/types';
import { Formatters } from '@/lib/financial';
import { ChartUtils, DateMarker } from '@/lib/chart-utils';
import { ApiClient, ApiError } from '@/lib/api';

interface FormattedLegend {
  you: string;
  sp500: string;
  leader: string;
}

interface ChartConfig {
  yDomain: [number, number];
  dateMarkers: DateMarker[];
  gridYValues: number[];
}

export interface PortfolioPerformanceData {
  date: string;
  dateObj: Date;
  youPct: number | null;
  sp500Pct: number | null;
  leaderPct: number | null;
}

export function usePortfolioPerformanceSeries() {
  const [data, setData] = useState<PortfolioPerformanceSeriesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await ApiClient.get<PortfolioPerformanceSeriesResponse['data']>('/api/user/portfolio/performance-series');
      if (!result.success) throw new Error(result.error || 'Failed to fetch performance series');
      setData(result as PortfolioPerformanceSeriesResponse);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch performance series';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refresh = useCallback(() => fetchData(), [fetchData]);

  // Transform raw points to chart data format
  const points = useMemo<PortfolioPerformanceData[]>(() => {
    if (!data?.data?.points) return [];
    
    return data.data.points.map(p => ({
      date: new Date(p.date).toLocaleDateString(),
      dateObj: new Date(p.date),
      youPct: p.youPct,
      sp500Pct: p.sp500Pct,
      leaderPct: p.leaderPct,
    }));
  }, [data]);

  // Format legend values (last valid values from each series)
  const formatted = useMemo<{ legend: FormattedLegend }>(() => {
    if (points.length === 0) {
      return {
        legend: {
          you: '--',
          sp500: '--',
          leader: '--',
        }
      };
    }

    const youValue = ChartUtils.getLastValidValue(points.map(p => p.youPct));
    const sp500Value = ChartUtils.getLastValidValue(points.map(p => p.sp500Pct));
    const leaderValue = ChartUtils.getLastValidValue(points.map(p => p.leaderPct));

    return {
      legend: {
        you: youValue === null 
          ? '--' 
          : Formatters.percentage(youValue, { showSign: true, multiplier: 1 }),
        sp500: sp500Value === null 
          ? '--' 
          : Formatters.percentage(sp500Value, { showSign: true, multiplier: 1 }),
        leader: leaderValue === null 
          ? '--' 
          : Formatters.percentage(leaderValue, { showSign: true, multiplier: 1 }),
      }
    };
  }, [points]);

  // Calculate chart configuration (y-domain and date markers)
  const chartConfig = useMemo<ChartConfig>(() => {
    if (points.length === 0 || !data?.meta?.startDate) {
      return {
        yDomain: [0, 0],
        dateMarkers: [],
        gridYValues: [],
      };
    }

    // Collect all numeric values for y-domain calculation
    const allValues: number[] = [];
    points.forEach(p => {
      if (p.youPct !== null && Number.isFinite(p.youPct)) allValues.push(p.youPct);
      if (p.sp500Pct !== null && Number.isFinite(p.sp500Pct)) allValues.push(p.sp500Pct);
      if (p.leaderPct !== null && Number.isFinite(p.leaderPct)) allValues.push(p.leaderPct);
    });

    const yDomain = ChartUtils.calculateYDomain(allValues);
    const dateMarkers = ChartUtils.generateDateMarkersFromData(
      points,
      new Date(data.meta.startDate),
      4
    );

    // Horizontal guide lines (skip bottom edge line)
    const [yMin, yMax] = yDomain;
    const range = yMax - yMin;
    const gridYValues =
      range > 0
        ? [
            yMin + range * 0.25,
            yMin + range * 0.5,
            yMin + range * 0.75,
          ]
        : [];

    return {
      yDomain,
      dateMarkers,
      gridYValues,
    };
  }, [points, data?.meta]);

  return {
    data,
    isLoading,
    error,
    refresh,
    points,
    meta: data?.meta,
    formatted,
    chartConfig,
  };
}


