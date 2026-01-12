/**
 * AssetChart Component
 * 
 * Pure presentation component for displaying asset price charts.
 * Supports both line and candlestick chart types with multiple timeframes.
 * 
 * ARCHITECTURE COMPLIANCE:
 * ✅ Pure presentation component (no data fetching)
 * ✅ Uses custom hook (useAssetChartData) for data
 * ✅ Uses Formatters service for all formatting
 * ✅ No inline calculations
 * ✅ No business logic
 * ✅ Proper loading and error states
 * 
 * @example
 * <AssetChart
 *   ticker="AAPL"
 *   currentPrice={150.25}
 *   currency="USD"
 *   assetName="Apple Inc."
 * />
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
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
import { useChartColors } from '@/hooks/useChartColors';
import { useAssetChartData } from '@/hooks/useAssetChartData';
import { ChartDataService } from '@/lib/chart-data-service';
import { Formatters } from '@/lib/financial';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Icon, WaveformIcon, ChartLineIcon } from '@/components/ui/Icon';
import { CandlestickChart } from './CandlestickChart';
import type { ChartDataPoint } from '@/types';

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

type ChartType = 'line' | 'candlestick';

/**
 * Props for line chart tooltip
 */
interface LineChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
  coordinate?: { x: number; y: number };
  formatPrice: (price: number) => string;
}

/**
 * Custom tooltip for line chart
 * Follows UI standards from .cursor/rules/ui.mdc
 * Inverted color scheme: dark in light mode, light in dark mode
 */
const LineChartTooltip = ({ active, payload, coordinate, formatPrice }: LineChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const isPositive = data.close >= data.open;
  
  return (
    <div className="bg-neutral/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg px-4 py-3">
      {/* Date header */}
      <div className="text-xs font-medium text-neutral-foreground mb-2 pb-2 border-b border-border/50">
        {data.formattedDate}
      </div>
      
      {/* OHLC data */}
      <div className="space-y-2">
        <div className="flex justify-between gap-4">
          <span className="text-xs text-neutral-foreground/60">Open</span>
          <span className="text-xs font-mono font-medium text-neutral-foreground tabular-nums">{formatPrice(data.open)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-xs text-neutral-foreground/60">High</span>
          <span className="text-xs font-mono font-medium text-neutral-foreground tabular-nums">{formatPrice(data.high)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-xs text-neutral-foreground/60">Low</span>
          <span className="text-xs font-mono font-medium text-neutral-foreground tabular-nums">{formatPrice(data.low)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-xs text-neutral-foreground/60">Close</span>
          <span className={`text-xs font-mono font-medium tabular-nums ${
            isPositive 
              ? 'text-rose-400 dark:text-rose-800' 
              : 'text-emerald-400 dark:text-emerald-800'
          }`}>
            {formatPrice(data.close)}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * AssetChart Component
 */
export function AssetChart({ 
  ticker, 
  currentPrice, 
  currency, 
  assetName, 
  overlayActions 
}: AssetChartProps) {
  // UI-only state
  const [timeframe, setTimeframe] = useState('1mo');
  const [chartType, setChartType] = useState<ChartType>('line');
  
  // Fetch chart data via hook
  const { data, isLoading, error, metadata } = useAssetChartData(
    ticker, 
    timeframe,
    currentPrice
  );
  
  // Get chart colors from existing hook
  const { colors: resolvedColors, mounted: colorsLoaded } = useChartColors();
  
  // Get timeframes configuration
  const timeframes = ChartDataService.TIMEFRAMES;
  
  // Memoize chart colors
  const chartColors = useMemo(() => ({
    positive: resolvedColors['chart-3'] || 'hsl(var(--chart-3))',
    negative: resolvedColors['chart-5'] || 'hsl(var(--chart-5))',
    foreground: resolvedColors['foreground'] || 'hsl(var(--foreground))',
    muted: resolvedColors['muted'] || 'hsl(var(--muted))',
    mutedForeground: resolvedColors['muted-foreground'] || 'hsl(var(--muted-foreground))',
    border: resolvedColors['border'] || 'hsl(var(--border))',
  }), [resolvedColors]);
  
  // Formatting functions (using Formatters service)
  const formatPrice = useCallback((price: number) => {
    return Formatters.currency(price, { currency, decimals: 2 });
  }, [currency]);
  
  const formatVolume = useCallback((volume: number) => {
    return Formatters.volume(volume);
  }, []);
  
  // Gradient ID for line chart
  const gradientId = `priceGradient-${ticker}`;
  const isPositive = metadata.isPositive;
  
  return (
    <div className="bg-muted/20 text-card-foreground border border-border p-4 rounded-xl">
      {/* Header with Chart Type Toggle and Timeframe Buttons */}
      <div className="flex items-center justify-between gap-4 pb-4">
        {/* Left: Chart Type Toggle */}
        <div className="flex bg-background rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setChartType('line')}
            disabled={isLoading}
            className={chartType === 'line' ? 'bg-muted hover:bg-muted' : ''}
          >
            <Icon icon={ChartLineIcon} size="sm" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setChartType('candlestick')}
            disabled={isLoading}
            className={chartType === 'candlestick' ? 'bg-muted hover:bg-muted' : ''}
          >
            <Icon icon={WaveformIcon} size="sm" />
          </Button>
        </div>
        
        {/* Right: Timeframe Buttons */}
        <div className="flex space-x-1 bg-background p-1 rounded-lg">
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              disabled={isLoading}
              variant="ghost"
              size="sm"
              className={tf.value === timeframe ? 'bg-muted hover:bg-muted' : ''}
            >
              {tf.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative rounded-lg">
        {isLoading ? (
          <div className="h-80">
            <Skeleton className="h-full w-full" />
          </div>
        ) : error ? (
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
        ) : data.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">No chart data available for {ticker}</p>
          </div>
        ) : chartType === 'candlestick' ? (
          // Candlestick Chart
          <CandlestickChart
            data={data}
            colors={chartColors}
            yAxisDomain={metadata.yAxisDomain}
            currentPrice={currentPrice}
            formatPrice={formatPrice}
            formatVolume={formatVolume}
            currency={currency}
          />
        ) : (
          // Line Chart
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={data} 
                margin={{ 
                  top: 5, 
                  right: 5, 
                  left: 5, 
                  bottom: 15
                }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={isPositive ? chartColors.positive : chartColors.negative} 
                      stopOpacity={0.8}
                    />
                    <stop 
                      offset="95%" 
                      stopColor={isPositive ? chartColors.positive : chartColors.negative} 
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} />
                
                <XAxis 
                  dataKey="formattedDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fontSize: 11, 
                    textAnchor: 'middle',
                    fill: chartColors.mutedForeground
                  }}
                  interval={
                    data.length > 20 ? Math.floor(data.length / 8) : 
                    data.length > 10 ? Math.floor(data.length / 6) : 
                    'preserveStartEnd'
                  }
                  angle={0}
                  height={40}
                />
                
                <YAxis
                  yAxisId="price"
                  domain={metadata.yAxisDomain}
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fontSize: 12,
                    fill: chartColors.mutedForeground
                  }}
                  tickFormatter={formatPrice}
                  width={60}
                />
                
                <YAxis
                  yAxisId="volume"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fontSize: 12,
                    fill: chartColors.mutedForeground
                  }}
                  tickFormatter={formatVolume}
                  width={60}
                />
                
                <Tooltip 
                  content={<LineChartTooltip formatPrice={formatPrice} />}
                  cursor={{
                    stroke: chartColors.foreground,
                    strokeWidth: 2,
                    strokeDasharray: '5 5',
                    opacity: 1
                  }}
                />
                
                {/* Current price reference line */}
                <ReferenceLine 
                  yAxisId="price"
                  y={currentPrice} 
                  stroke={chartColors.foreground}
                  strokeDasharray="2 2" 
                  label={{ }}
                />
                
                {/* Volume bars */}
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill={chartColors.muted}
                  opacity={0.6}
                  name="Volume"
                />
                
                {/* Price line */}
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke={chartColors.foreground}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: chartColors.foreground,
                    stroke: chartColors.muted,
                    strokeWidth: 3
                  }}
                  fill={`url(#${gradientId})`}
                  name="Price"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Action Buttons Below Chart */}
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
