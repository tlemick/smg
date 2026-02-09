'use client';

import { useMemo, useState } from 'react';
import { usePortfolioHighlights, SparklineMetadata } from '@/hooks/usePortfolioHighlights';
import { Button } from '@/components/ui/button';
import { Sparkline } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { Formatters } from '@/lib/financial';
import { Cheers, MaskSad } from '@phosphor-icons/react';
import type { PortfolioAllocation } from '@/types';

interface HoldingRowProps {
  allocation: PortfolioAllocation;
  sparklineMetadata?: SparklineMetadata;
  colorScheme: 'positive' | 'negative';
}

function HoldingRow({ allocation, sparklineMetadata, colorScheme }: HoldingRowProps) {
  const { asset, unrealizedPnL, unrealizedPnLPercent, avgCostBasis } = allocation;
  const color = colorScheme === 'positive' ? 'text-chart-positive' : 'text-chart-negative';
  
  // Price change color (different from P&L color)
  const priceChangeColor = (sparklineMetadata?.priceChangePercent ?? 0) >= 0 
    ? 'text-chart-positive' 
    : 'text-chart-negative';
  
  return (
    <div className="space-y-2 p-3">
      {/* Logo + Name */}
      <div className="flex items-center gap-2">
        {asset.logoUrl ? (
          <img src={asset.logoUrl} alt={asset.ticker} className="w-8 h-8 rounded" />
        ) : (
          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
            <span className="text-xs font-mono">{asset.ticker.slice(0, 2)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-mono font-medium">{asset.ticker}</div>
          <div className="text-xs text-muted-foreground truncate">{asset.name}</div>
        </div>
      </div>
      
      {/* Sparkline with cost basis reference line */}
      {sparklineMetadata?.data && sparklineMetadata.data.length > 1 ? (
        <div className="h-12">
          <Sparkline 
            data={sparklineMetadata.data}
            color={colorScheme}
            referenceLine={avgCostBasis} // Show cost basis as reference
            referenceLineLabel="Your Cost"
          />
        </div>
      ) : (
        <div className="h-12 flex items-center justify-center bg-muted/30 rounded">
          <span className="text-xs text-muted-foreground">Loading chart...</span>
        </div>
      )}
      
      {/* Two metrics: Your P&L and Market Price Change */}
      <div className="space-y-1">
        {/* Your unrealized P&L */}
        <div className={`flex justify-between text-sm font-mono ${color}`}>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Your Gain</span>
          <div className="flex items-center gap-2">
            <span>{Formatters.percentage(unrealizedPnLPercent, { showSign: true, multiplier: 1 })}</span>
            <span>{Formatters.currency(unrealizedPnL)}</span>
          </div>
        </div>
        
        {/* Market price change over sparkline period */}
        {sparklineMetadata?.priceChangePercent !== undefined && (
          <div className={`flex justify-between text-xs font-mono ${priceChangeColor}`}>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Price Change</span>
            <span>
              {Formatters.percentage(sparklineMetadata.priceChangePercent, { showSign: true, multiplier: 1 })}
              <span className="text-[10px] text-muted-foreground ml-1">(since first buy)</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function HoldingRowSkeleton() {
  return (
    <div className="space-y-2 p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-8 h-8 rounded" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function PortfolioHighlightsCard() {
  const [view, setView] = useState<'earners' | 'worstPerformers'>('earners');
  const { data, isPortfolioLoading, error } = usePortfolioHighlights();

  const currentList = view === 'earners' ? (data?.topEarners ?? []) : (data?.topWorstPerformers ?? []);
  const hasData = currentList.length > 0;
  const totalItems = (data?.topEarners?.length ?? 0) + (data?.topWorstPerformers?.length ?? 0);

  // Loading state
  if (isPortfolioLoading) {
    return (
      <div className="border border-foreground rounded-lg overflow-hidden flex flex-col h-full">
        <div className="flex items-center justify-between border-b border-foreground p-3">
          <div className="text-xs font-medium uppercase tracking-wide">
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
        <div className="divide-y divide-foreground flex-1">
          <HoldingRowSkeleton />
          <HoldingRowSkeleton />
          <HoldingRowSkeleton />
        </div>
      </div>
    );
  }

  // Empty state - no holdings
  if (!data?.hasHoldings) {
    return (
      <div className="border border-foreground rounded-lg overflow-hidden flex flex-col h-full">
        <div className="border-b border-foreground p-3">
          <div className="text-xs font-medium uppercase tracking-wide">Top Performers</div>
        </div>
        <div className="p-6 text-center flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No stock holdings yet. Make some trades to see your top performers.
          </p>
        </div>
      </div>
    );
  }

  // Empty state - no data for current view
  if (!hasData) {
    const emptyMessage = view === 'earners' 
      ? 'No profitable positions yet. Keep trading!' 
      : 'All positions are profitable!';
    
    return (
      <div className="border border-foreground rounded-lg overflow-hidden flex flex-col h-full">
        <div className="flex items-center justify-between border-b border-foreground">
          <div className="p-3 flex-1">
            <div className="text-xs font-medium uppercase tracking-wide">
              {view === 'earners' ? 'Top Earners' : 'Worst Performers'}
            </div>
          </div>
          {/* Segmented toggle showing both options */}
          <div className="flex border-l border-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('earners')}
              className={`h-10 w-10 p-0 rounded-none transition-colors ${
                view === 'earners' 
                  ? 'bg-chart-positive/10 text-chart-positive' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Show top earners"
            >
              <Cheers className="h-4 w-4" weight={view === 'earners' ? 'fill' : 'regular'} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('worstPerformers')}
              className={`h-10 w-10 p-0 rounded-none border-l border-foreground transition-colors ${
                view === 'worstPerformers' 
                  ? 'bg-chart-negative/10 text-chart-negative' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Show worst performers"
            >
              <MaskSad className="h-4 w-4" weight={view === 'worstPerformers' ? 'fill' : 'regular'} />
            </Button>
          </div>
        </div>
        <div className="p-6 text-center flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-foreground rounded-lg overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-foreground">
        <div className="p-3 flex-1">
          <div className="text-xs font-medium uppercase tracking-wide">
            {view === 'earners' ? 'Top Earners' : 'Worst Performers'}
            <span className="ml-2 text-[10px] font-normal text-muted-foreground">
              {currentList.length}/{totalItems}
            </span>
          </div>
          {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
        </div>
        {/* Segmented toggle showing both options */}
        <div className="flex border-l border-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('earners')}
            className={`h-10 w-10 p-0 rounded-none transition-colors ${
              view === 'earners' 
                ? 'bg-chart-positive/10 text-chart-positive' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Show top earners"
          >
            <Cheers className="h-4 w-4" weight={view === 'earners' ? 'fill' : 'regular'} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('worstPerformers')}
            className={`h-10 w-10 p-0 rounded-none border-l border-foreground transition-colors ${
              view === 'worstPerformers' 
                ? 'bg-chart-negative/10 text-chart-negative' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Show worst performers"
          >
            <MaskSad className="h-4 w-4" weight={view === 'worstPerformers' ? 'fill' : 'regular'} />
          </Button>
        </div>
      </div>

      <div className="divide-y divide-foreground">
        {currentList.map((allocation) => (
          <HoldingRow
            key={allocation.asset.ticker}
            allocation={allocation}
            sparklineMetadata={data?.sparklineDataByTicker?.[allocation.asset.ticker]}
            colorScheme={view === 'earners' ? 'positive' : 'negative'}
          />
        ))}
      </div>
    </div>
  );
}
