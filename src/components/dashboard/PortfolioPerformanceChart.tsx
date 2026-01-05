"use client";

import { useMemo } from 'react';
import { usePortfolioPerformanceSeries } from '@/hooks/usePortfolioPerformanceSeries';
import { useChartColors } from '@/hooks/useChartColors';
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
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg px-4 py-3">
      {/* Date header */}
      <div className="text-xs font-medium text-foreground mb-2 pb-2 border-b border-border/50">
        {label}
      </div>
      
      {/* Data values */}
      <div className="space-y-2">
        {payload.map((entry, index) => {
          const info = dataMap[entry.dataKey];
          if (!info) return null;
          
          const value = entry.value;
          const formattedValue = `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
          
          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: info.color, opacity: 0.8 }}
                />
                <span className="text-xs text-muted-foreground">{info.label}</span>
              </div>
              <span className="text-xs font-mono font-medium text-foreground tabular-nums">
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
  const { points, meta, loading, error } = usePortfolioPerformanceSeries();
  const { colors: resolvedColors, mounted } = useChartColors();
  
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

  const data = useMemo(() => points.map(p => ({
    date: new Date(p.date).toLocaleDateString(),
    dateObj: new Date(p.date),
    youPct: p.youPct,
    sp500Pct: p.sp500Pct,
    leaderPct: p.leaderPct,
  })), [points]);

  const dateMarkers = useMemo(() => {
    if (!meta?.startDate || data.length === 0) return [];
    const start = new Date(meta.startDate);
    const end = data[data.length - 1]?.dateObj || new Date();
    const markers = [];
    
    // Add start date marker
    markers.push({
      date: start.toLocaleDateString(),
      label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      isStart: true,
    });
    
    // Calculate intermediate markers (roughly 4-5 markers across the timeline)
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const numMarkers = Math.min(4, Math.max(2, Math.floor(daysDiff / 14))); // One every ~2 weeks, max 4
    const interval = daysDiff / (numMarkers + 1);
    
    for (let i = 1; i <= numMarkers; i++) {
      const markerDate = new Date(start.getTime() + (interval * i * 24 * 60 * 60 * 1000));
      markers.push({
        date: markerDate.toLocaleDateString(),
        label: markerDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isStart: false,
      });
    }
    
    return markers;
  }, [meta, data]);

  const lastValues = useMemo(() => {
    const lastNonNull = (arr: Array<number | null>) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        const v = arr[i];
        if (v !== null && Number.isFinite(v)) return v as number;
      }
      return null as number | null;
    };
    const you = lastNonNull(points.map(p => p.youPct ?? null));
    const sp = lastNonNull(points.map(p => p.sp500Pct ?? null));
    const leader = lastNonNull(points.map(p => p.leaderPct ?? null));
    const fmt = (v: number | null) => (v === null ? '--' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`);
    return { youLabel: fmt(you), spLabel: fmt(sp), leaderLabel: fmt(leader) };
  }, [points]);

  const yDomain = useMemo<[number, number]>(() => {
    if (data.length === 0) return [0, 0];
    const vals: number[] = [];
    data.forEach(d => {
      if (d.youPct !== null) vals.push(d.youPct);
      if (d.sp500Pct !== null) vals.push(d.sp500Pct);
      if (d.leaderPct !== null) vals.push(d.leaderPct);
    });
    if (vals.length === 0) return [-5, 5];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max(1, (max - min) * 0.1);
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }, [data]);

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
            <span className="text-xs mt-1 font-medium text-foreground">{lastValues.youLabel}</span>
          </div>

          {/* Badge 2: S&P 500 */}
          <div className="flex flex-col items-center">
            <span 
              className="px-2 py-0.5 text-xs rounded-full border bg-transparent font-medium" 
              style={{ borderColor: colors.benchmark, color: colors.benchmark }}
            >
              S&P 500
            </span>
            <span className="text-xs mt-1 font-medium text-foreground">{lastValues.spLabel}</span>
          </div>

          {/* Badge 3: Leader */}
          <div className="flex flex-col items-center">
            <span 
              className="px-2 py-0.5 text-xs rounded-full border bg-transparent font-medium" 
              style={{ borderColor: colors.leader, color: colors.leader }}
            >
              Leader
            </span>
            <span className="text-xs mt-1 font-medium text-foreground">{lastValues.leaderLabel}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 space-y-2">
          <Skeleton className="h-full w-full" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">No data yet</div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, left: 0, right: 16, bottom: 32 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={yDomain} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<CustomTooltip colors={colors} />} />
              
              {/* Game start line with date */}
              {dateMarkers.length > 0 && dateMarkers[0].isStart && (
                <ReferenceLine 
                  x={dateMarkers[0].date} 
                  stroke={colors.reference} 
                  strokeDasharray="3 3" 
                  strokeWidth={2}
                  strokeOpacity={0.6}
                  label={{ 
                    value: `Game start: ${dateMarkers[0].label}`, 
                    position: 'insideBottomLeft', 
                    fill: colors.label, 
                    fontSize: 11,
                    offset: -2,
                    dx: 6
                  }} 
                />
              )}
              
              {/* Intermediate date markers */}
              {dateMarkers.slice(1).map((marker, idx) => (
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
              
              <Line type="monotone" dataKey="youPct" stroke={colors.you} strokeWidth={2} dot={false} name="You" />
              <Line type="monotone" dataKey="sp500Pct" stroke={colors.benchmark} strokeWidth={2} dot={false} name="S&P 500" />
              <Line type="monotone" dataKey="leaderPct" stroke={colors.leader} strokeWidth={2} dot={false} name="Leader" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}


