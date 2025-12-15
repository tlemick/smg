"use client";

import { useMemo, useEffect, useState } from 'react';
import { usePortfolioCategorySeries } from '@/hooks/usePortfolioCategorySeries';
import { ResponsiveContainer, BarChart, Bar, Tooltip, Rectangle, YAxis } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TIMEFRAMES = [
  { value: '1w', label: '1w' },
  { value: '1m', label: '1m' },
  { value: '3m', label: '3m' },
  { value: '6m', label: '6m' },
  { value: '1y', label: '1y' },
  { value: 'ytd', label: 'YTD' },
];

/**
 * Get category chart colors from CSS variables
 * This allows colors to adapt to light/dark mode automatically
 */
function useCategoryChartColors() {
  const [colors, setColors] = useState({
    stocks: '#6C8CFF',
    mutualFunds: '#BFC8FF',
    bonds: '#E0E4FF',
    legendText: '#4B5563',
  });

  useEffect(() => {
    const updateColors = () => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      
      setColors({
        stocks: style.getPropertyValue('--chart-stocks').trim() || '#6C8CFF',
        mutualFunds: style.getPropertyValue('--chart-mutual-funds').trim() || '#BFC8FF',
        bonds: style.getPropertyValue('--chart-bonds').trim() || '#E0E4FF',
        legendText: style.getPropertyValue('--chart-legend-text').trim() || '#4B5563',
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

export function PortfolioCategoryChart() {
  const { range, setRange, points, loading, error } = usePortfolioCategorySeries('1m');
  const colors = useCategoryChartColors();

  const data = useMemo(
    () =>
      points.map(p => ({
        date: new Date(p.date).toLocaleDateString(),
        stocks: p.stocks,
        bonds: p.bonds,
        mutualFunds: p.mutualFunds,
      })),
    [points]
  );

  // Auto-zoom the Y domain to the visible range to accentuate small changes
  const yDomain = useMemo<[number, number]>(() => {
    if (data.length === 0) return [0, 0];
    const totals = data.map(d => (d.stocks || 0) + (d.bonds || 0) + (d.mutualFunds || 0));
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    if (!isFinite(min) || !isFinite(max)) return [0, 0];
    const padding = Math.max(1, (max - min) * 0.1);
    return [Math.max(0, min - padding), max + padding];
  }, [data]);

  return (
    <div className="rounded-lg p-4">
      {error && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded p-2">{error}</div>
      )}

      {/* Right-aligned legend and timeframe picker above the chart */}
      <div className="mb-3 flex flex-col items-end gap-2">
        {/* Custom legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: colors.stocks }} />
            <span className="text-xs" style={{ color: colors.legendText }}>Stocks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: colors.mutualFunds }} />
            <span className="text-xs" style={{ color: colors.legendText }}>Mutual Funds</span>
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
            <BarChart data={data} barGap={8} barCategoryGap={24}>
              {/* Hidden Y axis to control domain without rendering visible ticks */}
              <YAxis hide domain={yDomain} />
              <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
              <Bar 
                dataKey="stocks" 
                stackId="a" 
                fill={colors.stocks}
                name="Stocks"
                radius={[999, 999, 999, 999]}
                shape={<Rectangle radius={999} />}
              />
              <Bar 
                dataKey="mutualFunds" 
                stackId="a" 
                fill={colors.mutualFunds}
                name="Mutual Funds"
                radius={[999, 999, 999, 999]}
                shape={<Rectangle radius={999} />}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Timeframe picker */}
      <div className="flex w-full justify-end">
          <Tabs value={range} onValueChange={setRange}>
            <TabsList>
              {TIMEFRAMES.map(tf => (
                <TabsTrigger key={tf.value} value={tf.value}>{tf.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
    </div>
  );
}


