'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { usePortfolioOverview } from '@/hooks/usePortfolioOverview';
import { LessonButton } from '@/components/ui/LessonButton';

interface TreemapDataPoint {
  name: string;
  size: number;
  value: number;
  pnlPercent: number;
  type: string;
  fullName: string;
  ticker: string;
  children?: TreemapDataPoint[];
  isParent?: boolean;
  assetCount?: number;
  [key: string]: any; // Index signature for Recharts compatibility
}

// Asset class display names
const ASSET_CLASS_NAMES: Record<string, string> = {
  STOCK: 'Stocks',
  ETF: 'ETFs',
  MUTUAL_FUND: 'Mutual Funds',
  BOND: 'Bonds',
  CASH: 'Cash',
  INDEX: 'Index Funds',
};

/**
 * Map performance (P&L %) to Tailwind fill color classes.
 * Mirrors the legend scale used below (emerald ↔ gray ↔ rose).
 */
const getPerformanceFillClass = (pnlPercent: number): string => {
  if (pnlPercent >= 10) {
    return 'fill-emerald-500';
  } else if (pnlPercent >= 5) {
    return 'fill-emerald-400';
  } else if (pnlPercent >= 2) {
    return 'fill-emerald-300';
  } else if (pnlPercent >= -2) {
    return 'fill-neutral-500';
  } else if (pnlPercent >= -5) {
    return 'fill-rose-300';
  } else if (pnlPercent >= -10) {
    return 'fill-rose-400';
  } else {
    return 'fill-rose-500';
  }
};

export function PortfolioTreemap() {
  const router = useRouter();
  const { allocations, loading, error, refresh } = usePortfolioOverview();
  const [parentGroups, setParentGroups] = useState<Array<{ name: string; x: number; y: number; width: number; height: number }>>([]);
  const isCollectingPositions = useRef(false);

  // Transform allocations to hierarchical treemap format grouped by asset class
  const treemapData = useMemo(() => {
    if (!allocations || allocations.length === 0) return [];
    
    // Filter out cash and group by asset type
    const nonCashAllocations = allocations.filter(
      allocation => allocation.asset.ticker !== 'CASH'
    );
    
    // Group holdings by asset class
    const assetClassMap = new Map<string, TreemapDataPoint[]>();
    
    nonCashAllocations.forEach(allocation => {
      const assetType = allocation.asset.type;
      
      if (!assetClassMap.has(assetType)) {
        assetClassMap.set(assetType, []);
      }
      
      assetClassMap.get(assetType)!.push({
        name: allocation.asset.ticker,
        size: allocation.currentValue,
        value: allocation.portfolioPercent,
        pnlPercent: allocation.unrealizedPnLPercent,
        type: allocation.asset.type,
        fullName: allocation.asset.name,
        ticker: allocation.asset.ticker,
        isParent: false,
      });
    });
    
    // Create hierarchical structure
    const hierarchicalData: TreemapDataPoint[] = [];
    
    assetClassMap.forEach((children, assetType) => {
      // Calculate aggregate metrics for the asset class
      const totalSize = children.reduce((sum, child) => sum + child.size, 0);
      const totalValue = children.reduce((sum, child) => sum + child.value, 0);
      
      // Calculate weighted average P&L for the class
      const weightedPnL = children.reduce((sum, child) => {
        const weight = child.size / totalSize;
        return sum + (child.pnlPercent * weight);
      }, 0);
      
      hierarchicalData.push({
        name: ASSET_CLASS_NAMES[assetType] || assetType,
        size: totalSize,
        value: totalValue,
        pnlPercent: weightedPnL,
        type: assetType,
        fullName: ASSET_CLASS_NAMES[assetType] || assetType,
        ticker: assetType,
        children: children.sort((a, b) => b.size - a.size), // Sort children by size
        isParent: true,
        assetCount: children.length,
      });
    });
    
    // Sort asset classes by total value (largest first)
    return hierarchicalData.sort((a, b) => b.size - a.size);
  }, [allocations]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Helper to find data point in hierarchical structure
  const findDataPoint = (name: string): TreemapDataPoint | undefined => {
    // Check parent level
    const parent = treemapData.find(d => d.name === name);
    if (parent) return parent;
    
    // Check children
    for (const parentNode of treemapData) {
      if (parentNode.children) {
        const child = parentNode.children.find(c => c.name === name);
        if (child) return child;
      }
    }
    return undefined;
  };

  // Temporary storage for parent positions during render
  const tempParentPositions = useRef<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());

  // Custom cell renderer with hierarchical support
  const CustomTreemapCell = (props: any) => {
    const { x, y, width, height, name, depth } = props;
    
    // Find the data point from our hierarchical treemapData
    const dataPoint = findDataPoint(name);
    if (!dataPoint) {
      return null;
    }
    
    const portfolioPercent = dataPoint.value || 0;
    const pnlPercent = dataPoint.pnlPercent || 0;
    // Check if this is a parent based on depth (1 = asset class level, 2 = individual assets)
    const isParent = depth === 1;
    
    // For parent nodes (asset classes), store position but don't render anything
    // The labels will be rendered as an overlay on top
    if (isParent) {
      // Store parent position - will be used to render labels on top later
      tempParentPositions.current.set(name, { x, y, width, height });
      
      // Update state only once after all positions are collected
      if (!isCollectingPositions.current) {
        isCollectingPositions.current = true;
        requestAnimationFrame(() => {
          const positions = Array.from(tempParentPositions.current.entries()).map(([name, pos]) => ({
            name,
            ...pos
          }));
          setParentGroups(positions);
          isCollectingPositions.current = false;
        });
      }
      
      // Return null - parent nodes are invisible, only children are visible
      return null;
    }
    
    // For child nodes (individual assets), render colored rectangles
    const fillClass = getPerformanceFillClass(pnlPercent);
    
    // Add spacing for visual separation between assets
    const gap = 1;
    const adjustedX = x + gap;
    const adjustedY = y + gap;
    const adjustedWidth = Math.max(0, width - gap * 2);
    const adjustedHeight = Math.max(0, height - gap * 2);
    
    // Determine text display based on size
    const showMainText = adjustedWidth > 60 && adjustedHeight > 40;
    const showSecondaryText = adjustedWidth > 80 && adjustedHeight > 70;
    const showTertiaryText = adjustedWidth > 100 && adjustedHeight > 90;
    
    return (
      <g
        onClick={() => {
          if (dataPoint.ticker && dataPoint.ticker !== dataPoint.type) {
            router.push(`/asset/${dataPoint.ticker}`);
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <rect
          x={adjustedX}
          y={adjustedY}
          width={adjustedWidth}
          height={adjustedHeight}
          className={` ${fillClass}`}
          rx={3}
        />
        
        {/* Asset ticker */}
        {showMainText && (
          <text
            x={adjustedX + adjustedWidth / 2}
            y={adjustedY + adjustedHeight / 2 - (showSecondaryText ? 12 : 0)}
            textAnchor="middle"
            className="fill-neutral-900"
            fontSize={14}
            fontWeight="700"
            style={{ pointerEvents: 'none' }}
          >
            {name}
          </text>
        )}
        
        {/* Performance percentage */}
        {showSecondaryText && (
          <text
            x={adjustedX + adjustedWidth / 2}
            y={adjustedY + adjustedHeight / 2 + 6}
            textAnchor="middle"
            className="fill-neutral-900"
            fontSize={12}
            fontWeight="600"
            style={{ pointerEvents: 'none' }}
          >
            {formatPercentage(pnlPercent)}
          </text>
        )}
        
        {/* Portfolio allocation percentage */}
        {showTertiaryText && (
          <text
            x={adjustedX + adjustedWidth / 2}
            y={adjustedY + adjustedHeight / 2 + 24}
            textAnchor="middle"
            className="fill-neutral-900"
            fontSize={11}
            style={{ pointerEvents: 'none' }}
          >
            {portfolioPercent.toFixed(1)}% of portfolio
          </text>
        )}
      </g>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const rawData = payload[0].payload;
    
    // Find the original data point from treemapData
    const data = findDataPoint(rawData.name);
    if (!data) return null;
    
    const isPositive = (data.pnlPercent || 0) >= 0;
    const isParent = data.isParent || false;

    return (
      <div className="bg-white border border-neutral-300 rounded-lg shadow-lg p-3 min-w-[220px]">
        <div className="space-y-1">
          <div className="font-semibold text-neutral-900 text-base">
            {data.name}
            {isParent && (
              <span className="ml-2 text-xs font-normal text-neutral-500">
                ({data.assetCount} {data.assetCount === 1 ? 'asset' : 'assets'})
              </span>
            )}
          </div>
          {!isParent && (
            <div className="text-xs text-neutral-600 truncate max-w-[200px]">
              {data.fullName}
            </div>
          )}
          <div className="pt-2 space-y-1.5 text-sm">
            <div className="flex justify-between space-x-6">
              <span className="text-neutral-600">Value:</span>
              <span className="font-medium text-neutral-900">{formatCurrency(data.size)}</span>
            </div>
            <div className="flex justify-between space-x-6">
              <span className="text-neutral-600">Allocation:</span>
              <span className="font-medium text-neutral-900">{data.value.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between space-x-6 pt-1 border-t border-neutral-200">
              <span className="text-neutral-600">Performance:</span>
              <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(data.pnlPercent)}
              </span>
            </div>
          </div>
          {!isParent && (
            <div className="pt-2 text-xs text-neutral-500">
              Click to view asset details
            </div>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6">
        <div className="mb-4">
        <h4 className="text-base leading-none -mb-2 font-semibold text-neutral-900 dark:text-white">Asset Treemap</h4>
        <p className="text-sm -mt-2 text-neutral-600 dark:text-neutral-400">
          Holdings grouped by asset class • Color shows performance • Size shows allocation
        </p>
      </div>
        <div className="h-80 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
            <span className="text-neutral-400">Loading portfolio...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6">
        <div className="mb-4">
        <h4 className="text-base leading-none -mb-2 font-semibold text-neutral-900 dark:text-white">Asset Treemap</h4>
        <p className="text-sm -mt-2 text-neutral-600 dark:text-neutral-400">
          Holdings grouped by asset class • Color shows performance • Size shows allocation
        </p>
      </div>
        <div className="h-80 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Failed to Load Portfolio
          </h3>
          <p className="text-neutral-600 mb-4 text-center max-w-md">
            {error}
          </p>
          <button 
            onClick={refresh}
            className="bg-primary-400 text-white px-4 py-2 rounded hover:bg-primary-900 font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (treemapData.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6">
        <div className="mb-4">
        <h4 className="text-base leading-none -mb-2 font-semibold text-neutral-900 dark:text-white">Asset Treemap</h4>
        <p className="text-sm -mt-2 text-neutral-600 dark:text-neutral-400">
          Holdings grouped by asset class • Color shows performance • Size shows allocation
        </p>
      </div>
        <div className="h-80 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            No Holdings Yet
          </h3>
          <p className="text-neutral-600 mb-4 text-center max-w-md">
            Start investing to see your portfolio visualization. Make your first trade to see it displayed here.
          </p>
          <button 
            onClick={() => router.push('/trade')}
            className="bg-primary-400 text-white px-4 py-2 rounded hover:bg-primary-900 font-medium transition-colors"
          >
            Start Trading
          </button>
        </div>
      </div>
    );
  }

  // Render treemap
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg p-6">
      <div className="mb-4">
        <h4 className="text-base leading-none -mb-2 font-semibold text-neutral-900 dark:text-white">Asset Treemap</h4>
        <p className="text-sm -mt-2 text-neutral-600 dark:text-neutral-400">
          Holdings grouped by asset class • Color shows performance • Size shows allocation
        </p>
      </div>
      <div className="h-120 relative">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={16 / 9}
            content={<CustomTreemapCell />}
            isAnimationActive={false}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
        
        {/* Overlay asset class labels on top */}
        {parentGroups.length > 0 && (
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width="100%"
            height="100%"
            style={{ overflow: 'visible' }}
          >
            {parentGroups.map((group) => (
              <g key={group.name}>
                {/* Label background */}
                <rect
                  x={group.x + 8}
                  y={group.y + 8}
                  width={Math.min(group.name.length * 9 + 16, group.width - 16)}
                  height={26}
                  className="fill-neutral-800 opacity-95"
                  rx={4}
                />
                {/* Label text */}
                <text
                  x={group.x + 16}
                  y={group.y + 26}
                  className="fill-white"
                  fontSize={12}
                  fontWeight="700"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  {group.name}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>
      
      {/* Legend and Lesson Button */}
      <div className="mt-4 pt-4">
        <div className="flex items-center justify-between">
          {/* Performance Color Scale Legend */}
          <div className="flex flex-col space-y-2">
            <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Performance Color Scale:
            </div>
            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-1">
                <div className="w-6 h-4 rounded bg-rose-500"></div>
                <span className="text-xs text-neutral-600 dark:text-neutral-300">-10%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-6 h-4 rounded bg-rose-400"></div>
                <span className="text-xs text-neutral-600 dark:text-neutral-300">-5%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-6 h-4 rounded bg-rose-300"></div>
                <span className="text-xs text-neutral-600 dark:text-neutral-300">-2%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-6 h-4 rounded bg-neutral-500"></div>
                <span className="text-xs text-neutral-600 dark:text-neutral-300">±2%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-6 h-4 rounded bg-emerald-300"></div>
                <span className="text-xs text-neutral-600 dark:text-neutral-300">+2%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-6 h-4 rounded bg-emerald-400"></div>
                <span className="text-xs text-neutral-600 dark:text-neutral-300">+5%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-6 h-4 rounded bg-emerald-500"></div>
                <span className="text-xs text-neutral-600 dark:text-neutral-300">+10%</span>
              </div>
            </div>
          </div>
          
          <LessonButton
            text="Portfolio Diversification"
            topics={['Portfolio Management', 'Diversification Strategy', 'Asset Allocation']}
            maxItems={3}
            modalLayout="dual"
            modalContent={
              <div className="flex flex-col gap-4 p-8">
                <h4 className="text-lg font-semibold text-neutral-900">Understanding Your Portfolio Treemap</h4>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-neutral-900">What is a Portfolio Treemap?</h4>
                    <p className="text-sm text-neutral-600">
                      A treemap visualizes your portfolio allocation and performance at a glance. 
                      Larger rectangles mean bigger positions, while colors show which investments are winning or losing.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-neutral-900">How to Read It</h4>
                    <ul className="text-sm text-neutral-600 space-y-1 ml-4 list-disc">
                      <li><strong>Size</strong> = Percentage of your portfolio (bigger = larger position)</li>
                      <li><strong>Groups</strong> = Asset classes (Stocks, ETFs, Bonds, etc.) with thick borders</li>
                      <li><strong>Color</strong> = Performance: Red (losses), Gray (flat), Green (gains)</li>
                      <li><strong>Individual assets</strong> = Shown within their asset class group</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-neutral-900">Why Asset Class Matters</h4>
                    <p className="text-sm text-neutral-600 mb-2">
                      Different asset classes behave differently in market conditions:
                    </p>
                    <ul className="text-sm text-neutral-600 space-y-1 ml-4 list-disc">
                      <li><strong>Stocks:</strong> Higher growth potential, higher risk</li>
                      <li><strong>ETFs:</strong> Instant diversification across many holdings</li>
                      <li><strong>Bonds:</strong> Lower risk, stable income, cushion during downturns</li>
                      <li><strong>Mutual Funds:</strong> Professional management, specific strategies</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-neutral-900">Healthy Portfolio Guidelines</h4>
                    <ul className="text-sm text-neutral-600 space-y-1 ml-4 list-disc">
                      <li><strong>Avoid over-concentration:</strong> No single asset should dominate (20-30% max)</li>
                      <li><strong>Diversify across classes:</strong> Mix stocks, ETFs, and bonds based on your risk tolerance</li>
                      <li><strong>Watch the colors:</strong> Too much red? Time to reassess; all green? Don't get overconfident</li>
                      <li><strong>Rebalance periodically:</strong> Winners grow large, losers shrink—adjust to maintain your target mix</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-neutral-900 mb-2">⚠️ Warning Signs</h4>
                    <ul className="text-sm text-neutral-700 space-y-1 ml-4 list-disc">
                      <li>One asset class = 80%+ of portfolio (over-concentrated!)</li>
                      <li>One individual asset = 50%+ (extremely risky)</li>
                      <li>All holdings in same sector or industry (lack of diversification)</li>
                      <li>No defensive assets (bonds, cash) for market downturns</li>
                    </ul>
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
