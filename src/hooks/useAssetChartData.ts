/**
 * useAssetChartData Hook
 * 
 * Fetches and transforms chart data for a given ticker and timeframe.
 * This hook encapsulates all data fetching, transformation, and calculation logic
 * so that components remain pure presentation.
 * 
 * USAGE:
 * const { data, isLoading, error, metadata } = useAssetChartData(ticker, timeframe);
 * 
 * RETURNS:
 * - data: Transformed chart data points ready for display
 * - isLoading: Loading state
 * - error: Error message (if any)
 * - metadata: Calculated values (price change, y-axis domain, formatted values)
 * 
 * @example
 * function ChartComponent({ ticker }) {
 *   const { data, isLoading, error, metadata } = useAssetChartData(ticker, '1mo');
 *   
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Error message={error} />;
 *   
 *   return <Chart data={data} domain={metadata.yAxisDomain} />;
 * }
 */

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api/api-client';
import { ChartDataService } from '@/lib/chart-data-service';
import { Formatters } from '@/lib/financial';
import type { 
  ChartDataPoint,
  ChartApiResponse 
} from '@/types';

interface ChartMetadata {
  priceChange: number;
  priceChangePercent: number;
  yAxisDomain: [number, number];
  formattedPriceChange: string;
  formattedPriceChangePercent: string;
  isPositive: boolean;
}

interface UseAssetChartDataReturn {
  data: ChartDataPoint[];
  isLoading: boolean;
  error: string | null;
  metadata: ChartMetadata;
  refetch: () => void;
}

/**
 * Hook to fetch and transform asset chart data
 * 
 * @param ticker - Asset ticker symbol
 * @param timeframe - Selected timeframe (e.g., '1mo', '1y')
 * @param currentPrice - Current asset price (for calculations)
 * @returns Chart data, loading state, error, and calculated metadata
 */
export function useAssetChartData(
  ticker: string,
  timeframe: string,
  currentPrice: number = 0
): UseAssetChartDataReturn {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ChartMetadata>({
    priceChange: 0,
    priceChangePercent: 0,
    yAxisDomain: [0, 100],
    formattedPriceChange: '$0.00',
    formattedPriceChangePercent: '0.00%',
    isPositive: true,
  });

  const fetchChartData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get timeframe configuration
      const config = ChartDataService.getTimeframeConfig(timeframe);
      
      // Calculate date range using fixed date arithmetic
      const { startDate, endDate } = ChartDataService.calculateDateRange(timeframe);

      // Fetch data from API
      const response = await ApiClient.post<ChartApiResponse>('/api/chart', {
        ticker,
        period1: startDate.toISOString(),
        period2: endDate.toISOString(),
        interval: config.interval,
      });

      // Check for API errors
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch chart data');
      }

      const rawData = response.data?.quotes || [];
      
      // Transform data using service
      const transformedData = ChartDataService.transformChartData(
        rawData,
        config.interval,
        timeframe
      );

      // Validate transformed data
      if (!ChartDataService.validateChartData(transformedData)) {
        throw new Error('Invalid chart data received');
      }

      setData(transformedData);

      // Calculate metadata
      const priceChange = ChartDataService.calculatePriceChange(
        transformedData,
        currentPrice
      );
      const yAxisDomain = ChartDataService.calculateYAxisDomain(transformedData);
      
      const isPositive = priceChange.change >= 0;

      setMetadata({
        priceChange: priceChange.change,
        priceChangePercent: priceChange.percent,
        yAxisDomain,
        formattedPriceChange: Formatters.currency(Math.abs(priceChange.change)),
        formattedPriceChangePercent: Formatters.percentage(
          priceChange.percent / 100,
          { showSign: true }
        ),
        isPositive,
      });

    } catch (err) {
      console.error('Error fetching chart data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chart data';
      setError(errorMessage);
      
      // Set empty data on error
      setData([]);
      setMetadata({
        priceChange: 0,
        priceChangePercent: 0,
        yAxisDomain: [0, 100],
        formattedPriceChange: '$0.00',
        formattedPriceChangePercent: '0.00%',
        isPositive: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when ticker or timeframe changes
  useEffect(() => {
    if (!ticker) {
      setError('No ticker provided');
      setIsLoading(false);
      return;
    }

    fetchChartData();
  }, [ticker, timeframe, currentPrice]);

  return {
    data,
    isLoading,
    error,
    metadata,
    refetch: fetchChartData,
  };
}
