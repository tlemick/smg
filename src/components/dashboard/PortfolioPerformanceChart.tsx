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
    <div className="bg-neutral backdrop-blur-sm border border-border rounded-lg shadow-lg px-4 py-3">
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

interface PortfolioPerformanceChartProps {
  portfolioValue: string;
  totalReturn: string;
  totalReturnColorClass?: string;
}

export function PortfolioPerformanceChart({
  portfolioValue,
  totalReturn,
  totalReturnColorClass,
}: PortfolioPerformanceChartProps) {
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
    <div className="border border-foreground rounded-lg overflow-hidden flex flex-col h-full">
      {error && (
        <div className="text-sm text-destructive border-b border-foreground bg-destructive/10 p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] sm:items-stretch border-b border-foreground">
        {/* Key metrics (left) */}
        <div className="grid grid-cols-1 sm:border-r sm:border-foreground">
          <div className="p-3 border-b border-foreground flex flex-col justify-center">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Portfolio Value
            </div>
            <div className="text-3xl font-semibold tracking-tight text-foreground tabular-nums sm:text-4xl">
              {portfolioValue}
            </div>
          </div>

          <div className="p-3 flex flex-col justify-center">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Total Return
            </div>
            <div
              className={`text-xl font-semibold tracking-tight tabular-nums sm:text-2xl ${
                totalReturnColorClass ?? 'text-foreground'
              }`}
            >
              {totalReturn}
            </div>
          </div>
        </div>

        {/* Legend (right) */}
        <div className="grid grid-rows-3 sm:w-56 border-t border-foreground sm:border-t-0 divide-y divide-foreground">
          <LegendRow label="You" value={formatted.legend.you} color={colors.you} />
          <LegendRow label="S&P 500" value={formatted.legend.sp500} color={colors.benchmark} />
          <LegendRow label="Leader" value={formatted.legend.leader} color={colors.leader} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 min-h-[256px]">
          <Skeleton className="h-full w-full" />
        </div>
      ) : points.length === 0 ? (
        <div className="flex-1 min-h-[256px] flex items-center justify-center text-muted-foreground">No data yet</div>
      ) : (
        <div className="flex-1 min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={chartConfig.yDomain} tickFormatter={(v) => `${v}%`} />

              {/* Horizontal guide lines (no bottom edge line) */}
              {chartConfig.gridYValues.map((y, idx) => (
                <ReferenceLine
                  key={`grid-${idx}`}
                  y={y}
                  stroke={colors.label}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  strokeOpacity={0.18}
                />
              ))}

              <Tooltip 
                content={<CustomTooltip colors={colors} />}
                cursor={{
                  stroke: colors.reference,
                  strokeWidth: 2,
                  strokeDasharray: '5 5',
                  opacity: 0.5
                }}
              />

              {/* Game start label (no visible line) */}
              {chartConfig.dateMarkers.length > 0 && chartConfig.dateMarkers[0].isStart && (
                <ReferenceLine
                  x={chartConfig.dateMarkers[0].date}
                  stroke="transparent"
                  label={{
                    value: `Game start: ${chartConfig.dateMarkers[0].label}`,
                    position: 'insideBottomLeft',
                    fill: colors.label,
                    fontSize: 11,
                    offset: 10,
                    dy: 0,
                    dx: 0,
                  }}
                />
              )}

              {/* Keep intermediate date marker lines */}
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
                    offset: 10,
                    dy: 0,
                    dx: 2,
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

function LegendRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 h-full flex items-center">
      <div className="flex items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color, opacity: 0.85 }}
          />
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <span className="text-xs font-mono font-semibold text-foreground tabular-nums">{value}</span>
      </div>
    </div>
  );
}


