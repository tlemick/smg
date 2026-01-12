/**
 * CandlestickChart Component
 * 
 * Displays OHLC (Open, High, Low, Close) data as candlestick chart.
 * Uses custom Recharts shapes since Recharts doesn't have native candlestick support.
 * 
 * ARCHITECTURE COMPLIANCE:
 * - Pure presentation component (no data fetching)
 * - Receives all data via props
 * - No inline calculations or formatting
 * - Uses semantic color tokens
 * 
 * @example
 * <CandlestickChart
 *   data={chartData}
 *   colors={chartColors}
 *   yAxisDomain={[100, 200]}
 *   formatPrice={(price) => `$${price}`}
 * />
 */

'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { ChartDataPoint } from '@/types';

interface CandlestickChartProps {
  data: ChartDataPoint[];
  colors: Record<string, string>;
  yAxisDomain: [number, number];
  currentPrice?: number;
  formatPrice: (price: number) => string;
  formatVolume: (volume: number) => string;
  currency?: string;
}

/**
 * Props for custom candlestick shape
 */
interface CandlestickShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: ChartDataPoint;
  fill: string;
  positive: string;
  negative: string;
  yAxisDomain: [number, number];
}

/**
 * Custom shape for candlestick rendering
 * Draws the candlestick body (open to close) and wicks (high to low)
 * 
 * COORDINATE SYSTEM:
 * - Recharts provides y (pixel position of dataKey value) and height (pixels to baseline)
 * - We must calculate scale based on full Y-axis domain, not just high-low range
 * - scale = height / (high - yAxisDomain[0]) gives pixels per price unit
 */
const CandlestickShape = (props: CandlestickShapeProps) => {
  const { x, y, width, height, payload, positive, negative, yAxisDomain } = props;
  
  if (!payload) return null;
  
  const { open, high, low, close } = payload;
  const isPositive = close >= open;
  const color = isPositive ? positive : negative;
  
  // ✅ CORRECTED: Calculate scale using full Y-axis domain
  // height = pixels from high to baseline (yAxisDomain[0])
  // scale = pixels per price unit across the full chart
  const priceToBaseline = high - yAxisDomain[0];
  const scale = priceToBaseline > 0 ? height / priceToBaseline : 0;
  
  // Calculate Y positions for each price level
  const centerX = x + width / 2;
  const highY = y;  // Provided by Recharts (position of dataKey="high")
  const lowY = y + (high - low) * scale;  // ✅ Now correctly positioned
  const topOfBodyY = y + (high - Math.max(open, close)) * scale;
  const bottomOfBodyY = y + (high - Math.min(open, close)) * scale;
  
  // Body dimensions
  const bodyHeight = Math.abs(close - open) * scale;
  const bodyWidth = width * 0.7;  // 70% of bar width
  const bodyX = centerX - bodyWidth / 2;
  
  return (
    <g>
      {/* Upper wick (high to top of body) */}
      <line
        x1={centerX}
        y1={highY}
        x2={centerX}
        y2={topOfBodyY}
        stroke={color}
        strokeWidth={1}
      />
      
      {/* Body (open to close) */}
      <rect
        x={bodyX}
        y={topOfBodyY}
        width={bodyWidth}
        height={Math.max(bodyHeight, 1)} // Minimum 1px height for doji
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
      
      {/* Lower wick (bottom of body to low) */}
      <line
        x1={centerX}
        y1={bottomOfBodyY}
        x2={centerX}
        y2={lowY}  // ✅ Now stops at low price
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

/**
 * Props for candlestick tooltip
 */
interface CandlestickTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
  coordinate?: { x: number; y: number };
  formatPrice: (price: number) => string;
  formatVolume: (volume: number) => string;
}

/**
 * Custom tooltip for candlestick chart
 * Follows UI standards from .cursor/rules/ui.mdc
 * Inverted color scheme: dark in light mode, light in dark mode
 */
const CandlestickTooltip = ({ active, payload, coordinate, formatPrice, formatVolume }: CandlestickTooltipProps) => {
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
      <div className="space-y-2 mb-2 pb-2 border-b border-border/50">
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
          <span className="text-xs font-mono font-medium text-neutral-foreground tabular-nums">
            {formatPrice(data.close)}
          </span>
        </div>
      </div>
      
      {/* Volume data */}
      <div className="flex justify-between gap-4">
        <span className="text-xs text-neutral-foreground/60">Volume</span>
        <span className="text-xs font-mono font-medium text-neutral-foreground tabular-nums">{formatVolume(data.volume)}</span>
      </div>
    </div>
  );
};

/**
 * CandlestickChart Component
 * Pure presentation - all data comes from props
 */
export function CandlestickChart({
  data,
  colors,
  yAxisDomain,
  currentPrice,
  formatPrice,
  formatVolume,
  currency = 'USD',
}: CandlestickChartProps) {
  
  // Prepare data with candlestick range for Recharts
  const candlestickData = useMemo(() => {
    return data.map(point => ({
      ...point,
      // Recharts needs a range for bars
      candlestickRange: [
        Math.min(point.open, point.close),
        Math.max(point.open, point.close)
      ],
      // Store full range for wick calculation
      fullRange: [point.low, point.high],
    }));
  }, [data]);
  
  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-muted-foreground">No chart data available</p>
      </div>
    );
  }
  
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={candlestickData}
          margin={{ 
            top: 5, 
            right: 5, 
            left: 5, 
            bottom: 15
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          
          {/* X-Axis */}
          <XAxis 
            dataKey="formattedDate"
            axisLine={false}
            tickLine={false}
            tick={{ 
              fontSize: 11, 
              textAnchor: 'middle',
              fill: colors.mutedForeground
            }}
            interval={
              data.length > 20 ? Math.floor(data.length / 8) : 
              data.length > 10 ? Math.floor(data.length / 6) : 
              'preserveStartEnd'
            }
            angle={0}
            height={40}
          />
          
          {/* Y-Axis for Price */}
          <YAxis
            yAxisId="price"
            domain={yAxisDomain}
            axisLine={false}
            tickLine={false}
            tick={{ 
              fontSize: 12,
              fill: colors.mutedForeground
            }}
            tickFormatter={formatPrice}
            width={80}
          />
          
          {/* Y-Axis for Volume */}
          <YAxis
            yAxisId="volume"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ 
              fontSize: 12,
              fill: colors.mutedForeground
            }}
            tickFormatter={formatVolume}
            width={60}
          />
          
          {/* Tooltip */}
          <Tooltip 
            content={<CandlestickTooltip formatPrice={formatPrice} formatVolume={formatVolume} />} 
            cursor={{ 
              stroke: colors.foreground, 
              strokeWidth: 2, 
              strokeDasharray: '5 5',
              opacity: 0.5
            }}
          />
          
          {/* Current price reference line */}
          {currentPrice && (
            <ReferenceLine 
              yAxisId="price"
              y={currentPrice} 
              stroke={colors.mutedForeground}
              strokeDasharray="2 2" 
            />
          )}
          
          {/* Volume area (background) */}
          <Area
            yAxisId="volume"
            dataKey="volume"
            fill={colors.muted}
            stroke="none"
            opacity={0.3}
            name="Volume"
            isAnimationActive={false}
          />
          
          {/* Candlesticks using custom shape */}
          <Bar
            yAxisId="price"
            dataKey="high"
            shape={(props: any) => (
              <CandlestickShape
                {...props}
                positive={colors.positive}
                negative={colors.negative}
                yAxisDomain={yAxisDomain}
              />
            )}
            isAnimationActive={false}
          >
            {data.map((entry, index) => {
              const isPositive = entry.close >= entry.open;
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={isPositive ? colors.positive : colors.negative}
                />
              );
            })}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
