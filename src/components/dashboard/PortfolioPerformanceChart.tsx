"use client";

import { useMemo } from 'react';
import { usePortfolioPerformanceSeries } from '@/hooks/usePortfolioPerformanceSeries';
import { useChartColors } from '@/hooks/useChartColors';
import { Formatters } from '@/lib/financial';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis, XAxis, ReferenceLine } from 'recharts';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  colors: {
    you: string;
    benchmark: string;
    leader: string;
  };
}

function CustomTooltip({ active, payload, label, colors }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  // Map dataKey to display name and corresponding color
  const dataMap: Record<string, { label: string; color: string }> = {
    youPct: { label: 'You', color: colors.you },
    sp500Pct: { label: 'S&P 500', color: colors.benchmark },
    leaderPct: { label: 'Leader', color: colors.leader },
  };

  return (
    <div className="bg-neutral/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg px-4 py-3">
      {/* Date header */}
      <div className="text-xs font-medium text-neutral-foreground mb-2 pb-2 border-b border-border/50">
        {label}
      </div>
      
      {/* Data values */}
      <div className="space-y-2">
        {payload.map((entry, index) => {
          const info = dataMap[entry.dataKey];
          if (!info) return null;
          
          const value = entry.value;
          // Backend returns percentage values (e.g., 5.0 = 5%), format directly
          const formattedValue = Formatters.percentage(value, { 
            showSign: true, 
            multiplier: 1 
          });
          
          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full border border-border dark:border-transparent" 
                  style={{ backgroundColor: info.color, opacity: 0.8 }}
                />
                <span className="text-xs text-neutral-foreground/60">{info.label}</span>
              </div>
              <span className="text-xs font-mono font-medium text-neutral-foreground tabular-nums">
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PortfolioPerformanceChart() {
  const { points, formatted, chartConfig, isLoading, error } = usePortfolioPerformanceSeries();
  const { colors: resolvedColors } = useChartColors();
  
  const colors = useMemo(
    () => ({
      you: resolvedColors['chart-1'] || 'hsl(var(--chart-1))',
      benchmark: resolvedColors['chart-6'] || 'hsl(var(--chart-6))',
      leader: resolvedColors['chart-3'] || 'hsl(var(--chart-3))',
      reference: resolvedColors['foreground'] || 'hsl(var(--foreground))',
      label: resolvedColors['muted-foreground'] || 'hsl(var(--muted-foreground))',
    }),
    [resolvedColors]
  );

  return (
    <div>
      {error && (
        <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded p-2">{error}</div>
      )}

      <div className="mb-3 flex flex-col items-end gap-2">
        <div className="flex items-end gap-6">
          {/* Badge 1: You */}
          <div className="flex flex-col items-center">
            <span 
              className="px-2 py-0.5 text-xs rounded-full border bg-transparent font-medium" 
              style={{ borderColor: colors.you, color: colors.you }}
            >
              You
            </span>
            <span className="text-xs mt-1 font-medium text-foreground">{formatted.legend.you}</span>
          </div>

          {/* Badge 2: S&P 500 */}
          <div className="flex flex-col items-center">
            <span 
              className="px-2 py-0.5 text-xs rounded-full border bg-transparent font-medium" 
              style={{ borderColor: colors.benchmark, color: colors.benchmark }}
            >
              S&P 500
            </span>
            <span className="text-xs mt-1 font-medium text-foreground">{formatted.legend.sp500}</span>
          </div>

          {/* Badge 3: Leader */}
          <div className="flex flex-col items-center">
            <span 
              className="px-2 py-0.5 text-xs rounded-full border bg-transparent font-medium" 
              style={{ borderColor: colors.leader, color: colors.leader }}
            >
              Leader
            </span>
            <span className="text-xs mt-1 font-medium text-foreground">{formatted.legend.leader}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 space-y-2">
          <Skeleton className="h-full w-full" />
        </div>
      ) : points.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">No data yet</div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, left: 0, right: 16, bottom: 32 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={chartConfig.yDomain} tickFormatter={(v) => `${v}%`} />
              <Tooltip 
                content={<CustomTooltip colors={colors} />}
                cursor={{
                  stroke: colors.reference,
                  strokeWidth: 2,
                  strokeDasharray: '5 5',
                  opacity: 0.5
                }}
              />
              
              {/* Game start line with date */}
              {chartConfig.dateMarkers.length > 0 && chartConfig.dateMarkers[0].isStart && (
                <ReferenceLine 
                  x={chartConfig.dateMarkers[0].date} 
                  stroke={colors.reference} 
                  strokeDasharray="3 3" 
                  strokeWidth={2}
                  strokeOpacity={0.6}
                  label={{ 
                    value: `Game start: ${chartConfig.dateMarkers[0].label}`, 
                    position: 'insideBottomLeft', 
                    fill: colors.label, 
                    fontSize: 11,
                    offset: -2,
                    dx: 6
                  }} 
                />
              )}
              
              {/* Intermediate date markers */}
              {chartConfig.dateMarkers.slice(1).map((marker, idx) => (
                <ReferenceLine 
                  key={idx}
                  x={marker.date} 
                  stroke={colors.label} 
                  strokeDasharray="2 2" 
                  strokeWidth={1}
                  strokeOpacity={0.3}
                  label={{ 
                    value: marker.label, 
                    position: 'insideBottomLeft', 
                    fill: colors.label, 
                    fontSize: 11,
                    offset: -2,
                    dx: 6
                  }} 
                />
              ))}
              
              <Line 
                type="monotone" 
                dataKey="youPct" 
                stroke={colors.you} 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 5, fill: colors.you, strokeWidth: 2, stroke: '#fff' }}
                name="You" 
              />
              <Line 
                type="monotone" 
                dataKey="sp500Pct" 
                stroke={colors.benchmark} 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 5, fill: colors.benchmark, strokeWidth: 2, stroke: '#fff' }}
                name="S&P 500" 
              />
              <Line 
                type="monotone" 
                dataKey="leaderPct" 
                stroke={colors.leader} 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 5, fill: colors.leader, strokeWidth: 2, stroke: '#fff' }}
                name="Leader" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}


