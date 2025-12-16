"use client";

import { useMemo } from 'react';
import { usePortfolioPerformanceSeries } from '@/hooks/usePortfolioPerformanceSeries';
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis, XAxis, ReferenceLine } from 'recharts';

export function PortfolioPerformanceChart() {
  const { points, loading, error } = usePortfolioPerformanceSeries();
  const colors = useMemo(
    () => ({
      you: 'hsl(var(--chart-1))',
      benchmark: 'hsl(var(--chart-6))',
      leader: 'hsl(var(--chart-3))',
      reference: 'hsl(var(--border))',
      label: 'hsl(var(--muted-foreground))',
    }),
    []
  );

  const data = useMemo(() => points.map(p => ({
    date: new Date(p.date).toLocaleDateString(),
    youPct: p.youPct,
    sp500Pct: p.sp500Pct,
    leaderPct: p.leaderPct,
  })), [points]);

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
    <div className="rounded-lg p-4">
      {error && (
        <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded p-2">{error}</div>
      )}

      <div className="mb-3 flex flex-col items-end gap-2">
        <div className="flex items-end gap-6">
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 text-xs rounded-full text-primary-foreground" style={{ backgroundColor: colors.you }}>You</span>
            <span className="text-[11px] mt-1 font-medium text-foreground">{lastValues.youLabel}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 text-xs rounded-full text-background" style={{ backgroundColor: colors.benchmark }}>S&P 500</span>
            <span className="text-[11px] mt-1 font-medium text-foreground">{lastValues.spLabel}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 text-xs rounded-full text-background" style={{ backgroundColor: colors.leader }}>Leader</span>
            <span className="text-[11px] mt-1 font-medium text-foreground">{lastValues.leaderLabel}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">Loading…</div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">No data yet</div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, left: 0, right: 0, bottom: 12 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={yDomain} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)}%`} />
              <ReferenceLine x={data[0].date} stroke={colors.reference} strokeDasharray="3 3" label={{ value: 'Game start', position: 'insideBottomLeft', fill: colors.label, fontSize: 12 }} />
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


