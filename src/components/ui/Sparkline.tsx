import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: 'green' | 'red' | 'neutral';
  className?: string;
  showFill?: boolean;
}

/**
 * Sparkline component - a small, simplified chart for showing trends
 * Used to visualize price movement over time in a compact space
 */
export function Sparkline({
  data,
  color = 'neutral',
  className = '',
  showFill = true
}: SparklineProps) {
  // Transform data into format needed by Recharts
  const chartData = data.map((value, index) => ({
    index,
    value,
  }));

  // Determine if trend is positive or negative
  const isPositive = data.length >= 2 && data[data.length - 1] >= data[0];
  
  // Color mapping
  const colorMap = {
    green: '#10B981',
    red: '#EF4444',
    neutral: '#6B7280',
  };

  // Use provided color, or auto-determine based on trend if neutral
  const strokeColor = color === 'neutral' 
    ? (isPositive ? colorMap.green : colorMap.red)
    : colorMap[color];

  // Calculate domain with slight padding for better visualization
  const min = Math.min(...data);
  const max = Math.max(...data);
  const padding = (max - min) * 0.1 || 1;
  const yDomain: [number, number] = [min - padding, max + padding];

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center w-full h-full ${className}`}>
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: -1, right: -1, bottom: -1, left: -1 }}>
          <defs>
            <linearGradient id={`sparklineGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <YAxis hide domain={yDomain} />
          
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2.5}
            fill={showFill ? `url(#sparklineGradient-${color})` : 'none'}
            fillOpacity={showFill ? 1 : 0}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Sparkline;

