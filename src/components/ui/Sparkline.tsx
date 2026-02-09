import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, ReferenceLine, Label } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: 'positive' | 'negative' | 'neutral';
  className?: string;
  showFill?: boolean;
  referenceLine?: number; // Cost basis or other reference value
  referenceLineLabel?: string;
}

/**
 * Sparkline component - a small, simplified chart for showing trends
 * Used to visualize price movement over time in a compact space
 * 
 * Optional referenceLine prop shows a horizontal dashed line (e.g., cost basis)
 * This helps visualize performance relative to entry price
 */
export function Sparkline({
  data,
  color = 'neutral',
  className = '',
  showFill = false,
  referenceLine,
  referenceLineLabel
}: SparklineProps) {
  // Transform data into format needed by Recharts
  const chartData = data.map((value, index) => ({
    index,
    value,
  }));

  // Determine if trend is positive or negative
  const isPositive = data.length >= 2 && data[data.length - 1] >= data[0];
  
  // Use semantic colors from UI system (CSS variables)
  const getStrokeColor = () => {
    if (color === 'positive') {
      return 'hsl(var(--chart-positive))';
    }
    if (color === 'negative') {
      return 'hsl(var(--chart-negative))';
    }
    // Neutral: auto-determine based on trend
    return isPositive 
      ? 'hsl(var(--chart-positive))' 
      : 'hsl(var(--chart-negative))';
  };

  const strokeColor = getStrokeColor();

  // Calculate domain with slight padding for better visualization
  // Include referenceLine in domain calculation if provided
  const allValues = referenceLine !== undefined ? [...data, referenceLine] : data;
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const padding = (max - min) * 0.15 || 1; // Slightly more padding for reference line
  const yDomain: [number, number] = [min - padding, max + padding];

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center w-full h-full ${className}`}>
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }

  // Calculate approximate pixel positions for labels
  // We'll position them at the start (left) of the chart area
  const chartHeight = 100; // percentage
  const referenceLinePosition = referenceLine !== undefined
    ? ((yDomain[1] - referenceLine) / (yDomain[1] - yDomain[0])) * 100
    : 50;
  
  // Find the first data point's position for the price line
  const firstValuePosition = data.length > 0
    ? ((yDomain[1] - data[0]) / (yDomain[1] - yDomain[0])) * 100
    : 20;

  return (
    <div className={`w-full h-full relative ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 38 }}>
          <YAxis hide domain={yDomain} />
          
          {/* Reference line (e.g., cost basis) */}
          {referenceLine !== undefined && (
            <ReferenceLine
              y={referenceLine}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              strokeOpacity={0.6}
            />
          )}
          
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2.5}
            fill="none"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Labels positioned at the start of lines */}
      {referenceLine !== undefined && (
        <div 
          className="absolute left-0 px-1 py-0.5 rounded text-[9px] font-medium bg-muted/80 text-muted-foreground border border-muted-foreground/30"
          style={{ top: `${Math.max(5, Math.min(85, referenceLinePosition))}%`, transform: 'translateY(-50%)' }}
        >
          COST
        </div>
      )}
      
      <div 
        className="absolute left-0 px-1 py-0.5 rounded text-[9px] font-medium border"
        style={{ 
          top: `${Math.max(5, Math.min(85, firstValuePosition))}%`, 
          transform: 'translateY(-50%)',
          backgroundColor: strokeColor === 'hsl(var(--chart-positive))' ? 'hsl(var(--chart-positive) / 0.15)' : 'hsl(var(--chart-negative) / 0.15)',
          color: strokeColor,
          borderColor: strokeColor
        }}
      >
        PRICE
      </div>
    </div>
  );
}

export default Sparkline;

