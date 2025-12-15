"use client";

import { useMemo, useEffect, useState } from 'react';
import { usePortfolioPerformanceSeries } from '@/hooks/usePortfolioPerformanceSeries';
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis, XAxis, ReferenceLine } from 'recharts';

/**
 * Get chart colors from CSS variables
 * This allows colors to adapt to light/dark mode automatically
 */
function useChartColors() {
  const [colors, setColors] = useState({
    user: '#6C8CFF',
    benchmark: '#1E1B22',
    leader: '#22C55E',
    reference: '#1F2937',
    label: '#000000',
  });

  useEffect(() => {
    const updateColors = () => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      
      setColors({
        user: style.getPropertyValue('--chart-user').trim() || '#6C8CFF',
        benchmark: style.getPropertyValue('--chart-benchmark').trim() || '#1E1B22',
        leader: style.getPropertyValue('--chart-leader').trim() || '#22C55E',
        reference: style.getPropertyValue('--chart-reference').trim() || '#1F2937',
        label: style.getPropertyValue('--chart-label').trim() || '#000000',
      });
    };

    // Initial update
    updateColors();

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateColors();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return colors;
}

export function PortfolioPerformanceChart() {
  const { points, loading, error } = usePortfolioPerformanceSeries();
  const colors = useChartColors();

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
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded p-2">{error}</div>
      )}

      <div className="mb-3 flex flex-col items-end gap-2">
        <div className="flex items-end gap-6">
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 text-xs rounded-full text-white dark:text-black bg-blue-500 dark:bg-blue-400">You</span>
            <span className="text-[11px] mt-1 font-medium text-black dark:text-white">{lastValues.youLabel}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 text-xs rounded-full text-white dark:text-black bg-black dark:bg-gray-100">S&P 500</span>
            <span className="text-[11px] mt-1 font-medium text-black dark:text-white">{lastValues.spLabel}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 text-xs rounded-full text-white dark:text-black bg-emerald-500 dark:bg-green-400">Leader</span>
            <span className="text-[11px] mt-1 font-medium text-black dark:text-white">{lastValues.leaderLabel}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-400">Loading…</div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400">No data yet</div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, left: 0, right: 0, bottom: 12 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={yDomain} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)}%`} />
              <ReferenceLine x={data[0].date} stroke={colors.reference} strokeDasharray="3 3" label={{ value: 'Game start', position: 'insideBottomLeft', fill: colors.label, fontSize: 12 }} />
              <Line type="monotone" dataKey="youPct" stroke={colors.user} strokeWidth={2} dot={false} name="You" />
              <Line type="monotone" dataKey="sp500Pct" stroke={colors.benchmark} strokeWidth={2} dot={false} name="S&P 500" />
              <Line type="monotone" dataKey="leaderPct" stroke={colors.leader} strokeWidth={2} dot={false} name="Leader" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}


