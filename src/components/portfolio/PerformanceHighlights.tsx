'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { usePortfolioOverview } from '@/hooks/usePortfolioOverview';
import { usePortfolioPerformanceSeries } from '@/hooks/usePortfolioPerformanceSeries';
import { Highlight, Sparkline } from '@/components/ui';
import type { PortfolioAllocation } from '@/types';

function formatPercent(value: number) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatQuantity(value: number) {
  // Show decimals only if it's a fractional share
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
}

function useSessionDataFreshness() {
  const { data: perfData, points } = usePortfolioPerformanceSeries();
  const startDateStr: string | undefined = perfData?.meta?.startDate;
  const startDate = startDateStr ? new Date(startDateStr) : undefined;

  const daysSinceStart = useMemo(() => {
    if (!startDate) return undefined;
    const ms = Date.now() - startDate.getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }, [startDate]);

  const hasEnoughData = (daysSinceStart ?? 0) >= 14 && (points?.length ?? 0) >= 7;

  return { hasEnoughData, daysSinceStart };
}

interface StockItemProps {
  allocation: PortfolioAllocation;
  sparklineData?: number[];
  colorScheme?: 'green' | 'red';
}

interface RankedStockViewerProps {
  allocations: PortfolioAllocation[];
  sparklineDataMap: Record<string, number[]>;
  colorScheme: 'green' | 'red';
}

function StockItem({ allocation, sparklineData, colorScheme = 'green' }: StockItemProps) {
  const { 
    asset, 
    currentValue, 
    unrealizedPnL,
    unrealizedPnLPercent,
    totalQuantity,
    avgCostBasis,
  } = allocation;
  
  // Color palettes
  const greenColors = ['#191B1F', '#1B4A3A', '#287C5F', '#24966F'];
  const redColors = ['#1F1918', '#4A1B1B', '#7C2828', '#964B4B'];
  const colors = colorScheme === 'green' ? greenColors : redColors;
  const textColor = 'text-white';

  return (
    <div className="space-y-4">
      {/* Logo and Name - Above the card */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-shrink-0 w-14 h-8 bg-black dark:bg-neutral-200 rounded flex items-center justify-center">
          <span className="text-sm font-bold text-white dark:text-neutral-900">{asset.ticker.slice(0, 2)}</span>
        </div>
        <div className="text-lg no-wrap truncate text-neutral-900 dark:text-white">{asset.name}</div>
      </div>

      {/* Info Stack - 4 distinct divs stacked vertically */}
      <div className="flex flex-col gap-0 rounded-lg overflow-hidden">
        {/* Market Value - Darkest */}
        <div className={`p-4 pb-12 ${textColor}`} style={{ backgroundColor: colors[0] }}>
          <div className="text-sm opacity-80 mb-1">Market value of your shares</div>
          <div className="text-2xl font-bold">{formatCurrency(currentValue || 0)}</div>
        </div>

        {/* Sparkline - Darkest (same as market value) */}
        <div className="h-32 pb-8 pt-4" style={{ backgroundColor: colors[0] }}>
          {sparklineData && sparklineData.length > 1 ? (
            <Sparkline 
              data={sparklineData} 
              color={colorScheme}
              showFill={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs text-white opacity-50">Loading...</span>
            </div>
          )}
        </div>

        {/* Quantity */}
        <div className={`p-4 ${textColor}`} style={{ backgroundColor: colors[1] }}>
          <div className="text-sm opacity-80 mb-1">Quantity (Shares)</div>
          <div className="text-2xl font-bold">{formatQuantity(totalQuantity)}</div>
        </div>

        {/* Average Cost Per Share */}
        <div className={`p-4 ${textColor}`} style={{ backgroundColor: colors[2] }}>
          <div className="text-sm opacity-80 mb-1">Average Cost Per Share</div>
          <div className="text-2xl font-bold">{formatCurrency(avgCostBasis)}</div>
        </div>

        {/* Gain/Loss */}
        <div className={`p-4 ${textColor}`} style={{ backgroundColor: colors[3] }}>
          <div className="text-sm opacity-80 mb-1">{unrealizedPnL >= 0 ? 'Gain' : 'Loss'}</div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{formatCurrency(Math.abs(unrealizedPnL))}</div>
            <div className="text-lg opacity-90">
              {unrealizedPnL >= 0 ? '+' : '-'}{Math.abs(unrealizedPnLPercent || 0).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RankedStockViewer({ allocations, sparklineDataMap, colorScheme }: Omit<RankedStockViewerProps, 'title'>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const rankData = [
    { numeral: '1', suffix: 'st' },
    { numeral: '2', suffix: 'nd' },
    { numeral: '3', suffix: 'rd' },
  ];
  
  if (allocations.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-neutral-800 border border-neutral-200 rounded-lg text-neutral-600 dark:text-neutral-300">
        No stock positions yet.
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      {/* Rank Buttons */}
      <div className="flex flex-col gap-4 mt-20">
        {allocations.map((_, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className={`
              font-mono font-light
              transition-all duration-200
              ${selectedIndex === index 
                ? 'text-neutral-900 dark:text-white' 
                : 'text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400'
              }
            `}
          >
            <span className="text-6xl">{rankData[index].numeral}</span>
            <span className="text-sm">{rankData[index].suffix}</span>
          </button>
        ))}
      </div>

      {/* Main Display - Keep all mounted to prevent re-render */}
      <div className="relative w-80">
        {allocations.map((allocation, index) => (
          <div
            key={allocation.asset.ticker}
            className={`${index === selectedIndex ? 'block' : 'hidden'}`}
          >
            <StockItem
              allocation={allocation}
              sparklineData={sparklineDataMap[allocation.asset.ticker]}
              colorScheme={colorScheme}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PerformanceHighlights() {
  const { allocations, hasHoldings, loading } = usePortfolioOverview();
  const { hasEnoughData, daysSinceStart } = useSessionDataFreshness();
  const [sparklineData, setSparklineData] = useState<Record<string, number[]>>({});
  const [sparklineLoading, setSparklineLoading] = useState(false);

  const stockAllocations: PortfolioAllocation[] = useMemo(() => {
    return (allocations || []).filter(a => a.asset?.type === 'STOCK');
  }, [allocations]);

  const sortedByPnL = useMemo(() => {
    return [...stockAllocations].sort((a, b) => (b.unrealizedPnLPercent || 0) - (a.unrealizedPnLPercent || 0));
  }, [stockAllocations]);

  const top = useMemo(() => sortedByPnL.slice(0, 3), [sortedByPnL]);
  const bottom = useMemo(() => [...sortedByPnL].reverse().slice(0, 3), [sortedByPnL]);

  // Create a stable string representation of tickers for useEffect dependency
  const tickersString = useMemo(() => {
    return stockAllocations.map(a => a.asset.ticker).sort().join(',');
  }, [stockAllocations]);

  // Fetch sparkline data for all stocks
  useEffect(() => {
    if (!hasHoldings || stockAllocations.length === 0) {
      return;
    }

    const fetchSparklineData = async () => {
      try {
        setSparklineLoading(true);

        // First, fetch the first purchase date for each stock
        let purchaseDates: Record<string, string> = {};
        
        try {
          const purchaseDatesResponse = await fetch('/api/user/portfolio/first-purchase-dates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tickers: stockAllocations.map(a => a.asset.ticker),
            }),
          });

          if (purchaseDatesResponse.ok) {
            const purchaseDatesData = await purchaseDatesResponse.json();
            if (purchaseDatesData.success && purchaseDatesData.data) {
              purchaseDates = purchaseDatesData.data;
            }
          }
        } catch (err) {
          // Silently fall back to 30 days ago if purchase dates unavailable
        }

        // Build batch chart requests
        const requests = stockAllocations.map(a => ({
          ticker: a.asset.ticker,
          period1: purchaseDates[a.asset.ticker] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          period2: new Date().toISOString(),
        }));

        // Fetch sparkline data in batch
        const response = await fetch('/api/chart/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests }),
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json();
        
        // Build sparkline data map
        const dataMap: Record<string, number[]> = {};
        result.results.forEach((r: any) => {
          if (r.success && r.data) {
            dataMap[r.ticker] = r.data;
          }
        });

        setSparklineData(dataMap);
      } catch (error) {
        // Silently handle errors
      } finally {
        setSparklineLoading(false);
      }
    };

    fetchSparklineData();
  }, [hasHoldings, tickersString, stockAllocations]);

  return (
    <div className="rounded-lg p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-mono text-neutral-900 dark:text-white mb-2">How to manage winners & losers</h2>
        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-prose">
          Let's take a look at your assets that are performing well and those that aren't performing as well. 
          It can be hard to know when to buy, hold, or sell an asset, but we'll give you some general guidance!
        </p>
      </div>

      {!hasHoldings && !loading && (
        <div className="mt-6 p-6 bg-white dark:bg-neutral-800 border border-neutral-200 rounded-lg text-neutral-600 dark:text-neutral-300">
          You don't have any stock holdings yet. Make some trades to see highlights here.
        </div>
      )}

      {hasHoldings && (daysSinceStart !== undefined && daysSinceStart < 14) && (
        <div className="mt-6 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <div className="text-sm text-yellow-800 font-semibold mb-1">Not enough data yet</div>
          <div className="text-sm text-yellow-700">
            It's the first couple of weeks of your game session. Performance guidance improves after two weeks of trading history.
          </div>
        </div>
      )}

      {hasHoldings && (
        <div className="mt-20 space-y-20 flex flex-col items-center">
          {/* Top Performers Section */}
          <div className="flex gap-8 items-start max-w-5xl">
            {/* Left: Ranked Stock Viewer */}
            <RankedStockViewer
              allocations={top}
              sparklineDataMap={sparklineData}
              colorScheme="green"
            />

            {/* Right: Educational Content */}
            <div className="space-y-4 text-neutral-900 dark:text-white leading-relaxed max-w-prose mt-20">
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">Your best performers!</h3>
              <p>
                It's exciting to see your stocks doing well, and now is the perfect time to learn a key investing skill: managing your winners.
              </p>
              <p>
                Instead of just letting them ride, consider <Highlight>trimming your positions</Highlight> by selling a small portion of your best-performing stocks. 
                This strategy accomplishes two important things: it <Highlight>locks in some of your profits</Highlight>, turning a paper gain into a tangible success, 
                and it reduces your risk if the market suddenly turns.
              </p>
              <p>
                You can then use that cash to <Highlight>invest in a new opportunity</Highlight> you've researched, which helps keep your portfolio diversified. 
                Learning to <Highlight>take profits methodically</Highlight> is a crucial habit that helps you make decisions based on a plan rather than letting greed or fear take over.
              </p>
            </div>
          </div>

          {/* Underperformers Section */}
          <div className="flex gap-8 items-start mt-20 max-w-5xl">
            {/* Left: Ranked Stock Viewer */}
            <RankedStockViewer
              allocations={bottom}
              sparklineDataMap={sparklineData}
              colorScheme="red"
            />

            {/* Right: Educational Content */}
            <div className="space-y-4 text-neutral-900 dark:text-white leading-relaxed max-w-prose mt-20">
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">Your biggest losers.</h3>
              <p>
                Dealing with poorly performing stocks is one of the toughest but most valuable lessons in investing.
              </p>
              <p>
                The temptation is to either panic-sell immediately or hold on forever hoping it will bounce back. Instead, pause and <Highlight>critically revisit why you bought the stock</Highlight> in the first place. 
                If your original reasons are still valid and the drop is due to a general market downturn, it can be a powerful lesson in patience.
              </p>
              <p>
                However, if the company has released bad news or you realize your initial thesis was flawed, it is often a <Highlight>disciplined and wise decision to sell</Highlight> and cut your losses.
              </p>
              <p>
                The key lesson isn't about avoiding losses, which are inevitable, but about learning to <Highlight>distinguish between a temporary dip</Highlight> in a good company 
                and a <Highlight>fundamental problem</Highlight> that justifies selling to free up your money for a better opportunity.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default PerformanceHighlights;


