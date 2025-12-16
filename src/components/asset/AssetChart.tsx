'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { AssetTopActions } from '@/components/asset';
import { getZIndexClass } from '@/lib/z-index';

interface AssetChartProps {
  ticker: string;
  currentPrice: number;
  currency: string;
  assetName?: string;
  overlayActions?: {
    asset: { id: number; ticker: string; name: string; allowFractionalShares: boolean };
    authenticated: boolean;
    hasHoldings: boolean;
  };
}

interface ChartData {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: string | null;
}

// Transform data for Recharts
interface ChartDataPoint {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  formattedDate: string;
}

export function AssetChart({ ticker, currentPrice, currency, assetName, overlayActions }: AssetChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [transformedData, setTransformedData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('1mo');

  const timeframes = [
    { value: '1d', label: '1D', interval: '15m' },
    { value: '5d', label: '5D', interval: '1h' },
    { value: '1mo', label: '1M', interval: '1d' },
    { value: '3mo', label: '3M', interval: '1d' },
    { value: '6mo', label: '6M', interval: '1d' },
    { value: '1y', label: '1Y', interval: '1d' },
    { value: '5y', label: '5Y', interval: '1d' },
  ];

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setChartLoading(true);
        setError(null);

        // Calculate date range based on timeframe
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeframe) {
          case '1d':
            startDate.setDate(endDate.getDate() - 1);
            break;
          case '5d':
            startDate.setDate(endDate.getDate() - 5);
            break;
          case '1mo':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
          case '3mo':
            startDate.setMonth(endDate.getMonth() - 3);
            break;
          case '6mo':
            startDate.setMonth(endDate.getMonth() - 6);
            break;
          case '1y':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
          case '5y':
            startDate.setFullYear(endDate.getFullYear() - 5);
            break;
        }

        // Get the appropriate interval for this timeframe
        const selectedTimeframe = timeframes.find(tf => tf.value === timeframe);
        const interval = selectedTimeframe?.interval || '1d';

        const response = await fetch('/api/chart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticker,
            period1: startDate.toISOString(),
            period2: endDate.toISOString(),
            interval,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch chart data');
        }

        const rawData = result.data.quotes || [];
        setChartData(rawData);
        
        // Store metadata for display
        // const metadata = result.meta || {};

        // Transform data for Recharts
        const transformed = rawData
          .filter((item: ChartData) => 
            item.close !== null && 
            item.open !== null && 
            item.high !== null && 
            item.low !== null
          )
          .map((item: ChartData) => {
            const date = new Date(item.date);
            return {
              date: date.toISOString().split('T')[0], // YYYY-MM-DD format
              timestamp: date.getTime(),
              open: item.open || 0,
              high: item.high || 0,
              low: item.low || 0,
              close: item.close || 0,
              volume: item.volume ? parseInt(item.volume) : 0,
              originalDate: date, // Keep original date for processing
            };
          })
          // For daily data (1d interval), deduplicate by date and use the latest data point for each day
          .reduce((acc: any[], current: any) => {
            if (interval === '1d' && (timeframe === '1mo' || timeframe === '3mo' || timeframe === '6mo' || timeframe === '1y' || timeframe === '5y')) {
              const existingIndex = acc.findIndex(item => item.date === current.date);
              if (existingIndex !== -1) {
                // If we already have data for this date, use the one with the latest timestamp (most recent data)
                if (current.timestamp > acc[existingIndex].timestamp) {
                  acc[existingIndex] = current;
                }
              } else {
                acc.push(current);
              }
            } else {
              acc.push(current);
            }
            return acc;
          }, [])
          // Now add formatted date after deduplication
          .map((item: any) => ({
            ...item,
            formattedDate: interval.includes('m') || interval.includes('h')
              ? `${item.originalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\n${item.originalDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
              : timeframe === '1d' 
                ? item.originalDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : item.originalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          }))
          // Sort by timestamp to ensure correct order
          .sort((a: any, b: any) => a.timestamp - b.timestamp);

        setTransformedData(transformed);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart');
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [ticker, timeframe]);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }, [currency]);

  const formatVolume = useCallback((volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toString();
  }, []);

  const priceChangeData = useMemo(() => {
    if (transformedData.length < 2) return { change: 0, percent: 0 };
    
    const firstPrice = transformedData[0]?.close || 0;
    const lastPrice = transformedData[transformedData.length - 1]?.close || currentPrice;
    const change = lastPrice - firstPrice;
    const percent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;
    
    return { change, percent };
  }, [transformedData, currentPrice]);

  const { change, percent } = priceChangeData;
  const isPositive = change >= 0;

  // Calculate price range for better Y-axis scaling
  const yAxisDomain = useMemo(() => {
    if (transformedData.length === 0) return [0, 100];
    
    const prices = transformedData.map(d => [d.high, d.low]).flat();
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    return [
      minPrice - priceRange * 0.1, // 10% padding below
      maxPrice + priceRange * 0.1  // 10% padding above
    ];
  }, [transformedData]);

  // Custom tooltip component pinned to top, following x-position
  const CustomTooltip = ({ active, payload, coordinate }: any) => {
    if (!active || !payload?.length || !coordinate) return null;
    const data = payload[0].payload;
    return (
      <div className="absolute left-0 top-0 w-full h-0" style={{ pointerEvents: 'none' }}>
        <div
          className="absolute top-0 -translate-x-1/2"
          style={{ left: coordinate.x }}
        >
          {/* Date on the left side of the vertical line */}
          <div className="absolute top-0 -left-2 -translate-x-full bg-popover text-popover-foreground text-xs rounded px-2 py-1 shadow-sm whitespace-nowrap border border-border">
            {data.formattedDate}
          </div>
          {/* Price on the right side of the vertical line */}
          <div className="absolute top-0 left-2 bg-popover text-popover-foreground text-xs font-medium rounded px-2 py-1 shadow-sm border border-border">
            {formatPrice(data.close)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg pl-6 pr-6 pt-6 pb-0 border border-border">
      {/* Static Header - Never Re-renders */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold !leading-none">{assetName || 'Asset'}</h4>
            <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded-md mb-4 leading-none border border-border">{ticker}</span>
          </div>
          <h1 className="text-2xl font-semibold">{formatPrice(currentPrice)}</h1>
        </div>
        {/* Static Timeframe Buttons - Always Interactive */}
        <div className="flex items-start gap-3">
          <div className="flex space-x-1">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                disabled={chartLoading}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  tf.value === timeframe
                    ? 'bg-primary text-primary-foreground'
                    : chartLoading 
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

       {/* Chart Area - Only This Section Updates */}
       <div className="relative">
         {chartLoading && (
           <div className={`absolute inset-0 bg-background/70 ${getZIndexClass('overlay')} flex items-center justify-center`}>
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
           </div>
         )}
         
         {error ? (
           <div className="h-80 flex items-center justify-center">
             <div className="text-center">
               <p className="text-destructive mb-2">Failed to load chart data</p>
               <p className="text-sm text-muted-foreground mb-3">{error}</p>
               <button 
                 onClick={() => setTimeframe(timeframe)} // Trigger refetch
                 className="text-sm text-foreground hover:text-primary underline"
               >
                 Try again
               </button>
             </div>
           </div>
         ) : transformedData.length === 0 && !chartLoading ? (
           <div className="h-80 flex items-center justify-center">
             <p className="text-muted-foreground">No chart data available for {ticker}</p>
           </div>
         ) : (
           <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart 
                 data={transformedData} 
                 margin={{ 
                   top: 5, 
                   right: 5, 
                   left: 5, 
                   bottom: 15
                 }}
               >
              <defs>
                <linearGradient id={`priceGradient-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "hsl(var(--chart-positive))" : "hsl(var(--chart-negative))"} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={isPositive ? "hsl(var(--chart-positive))" : "hsl(var(--chart-negative))"} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
               
               <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
               
               <XAxis 
                 dataKey="formattedDate"
                 axisLine={false}
                 tickLine={false}
                 tick={{ 
                   fontSize: 11, 
                   textAnchor: 'middle',
                   fill: 'hsl(var(--muted-foreground))'
                 }}
                 interval={
                   transformedData.length > 20 ? Math.floor(transformedData.length / 8) : 
                   transformedData.length > 10 ? Math.floor(transformedData.length / 6) : 
                   'preserveStartEnd'
                 }
                 angle={0}
                 height={40}
               />
               
               <YAxis
                 yAxisId="price"
                 domain={yAxisDomain}
                 axisLine={false}
                 tickLine={false}
                 tick={{ 
                   fontSize: 12,
                   fill: 'hsl(var(--muted-foreground))'
                 }}
                 tickFormatter={(value) => formatPrice(value)}
                 width={80}
               />
               
               <YAxis
                 yAxisId="volume"
                 orientation="right"
                 axisLine={false}
                 tickLine={false}
                 tick={{ 
                   fontSize: 12,
                   fill: 'hsl(var(--muted-foreground))'
                 }}
                 tickFormatter={(value) => formatVolume(value)}
                 width={60}
               />
               
               <Tooltip content={<CustomTooltip />} />
               
               {/* Current price reference line */}
               <ReferenceLine 
                 yAxisId="price"
                 y={currentPrice} 
                 className="stroke-muted-foreground" 
                 strokeDasharray="2 2" 
                 label={{  }}
               />
               
               {/* Volume bars */}
               <Bar
                 yAxisId="volume"
                 dataKey="volume"
                 className="fill-muted"
                 opacity={0.6}
                 name="Volume"
               />
               
               {/* Price line */}
               <Line
                 yAxisId="price"
                 type="monotone"
                 dataKey="close"
                 className="stroke-foreground"
                 strokeWidth={2}
                 dot={false}
                 fill={`url(#priceGradient-${ticker})`}
                 name="Price"
               />
             </ComposedChart>
           </ResponsiveContainer>
           </div>
         )}
       </div>

       {/* Static Action Buttons - Separate Area Below Chart */}
       {overlayActions && (
         <div className="">
           <AssetTopActions
             asset={overlayActions.asset}
             authenticated={overlayActions.authenticated}
             hasHoldings={overlayActions.hasHoldings}
           />
         </div>
       )}
    </div>
  );
} 