'use client';

import { useState } from 'react';
import type { AssetDetailData, UserHoldingsSummary } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TradeDrawer } from '@/components/trading';
import { usePortfolioOverview } from '@/hooks/usePortfolioOverview';
import {
  Icon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowClockwiseIcon,
  CalendarIcon,
  ChartBarIcon,
  ChartPieIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  GaugeIcon,
  HourglassHighIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  StarIcon,
  TargetIcon,
  TrendDownIcon,
  TrendUpIcon,
  WarningCircleIcon,
  WaveformIcon,
  BriefcaseIcon,
} from '@/components/ui/Icon';
import { createModalClasses } from '@/lib/positioning';
import { createPortal } from 'react-dom';
import { useAssetGuidance } from '@/hooks/useAssetGuidance';
import type { ComponentType } from 'react';
import type { IconProps as PhosphorIconProps } from '@phosphor-icons/react';

interface AssetGuidanceSectionProps {
  asset: AssetDetailData['asset'];
  quote: AssetDetailData['quote'];
  userHoldings: UserHoldingsSummary | null;
  authenticated: boolean;
  riskMeasures?: AssetDetailData['riskMeasures'];
}

/**
 * AssetGuidanceSection Component
 * 
 * Teen-friendly pros/cons guidance section at the bottom of asset pages.
 * 
 * Features:
 * - Side-by-side pros/cons columns
 * - Conversational, age-appropriate language
 * - Holdings-aware messaging
 * - Asset-type specific guidance
 * - Buy/Sell action buttons
 * 
 * Architecture Compliance:
 * - Pure presentation component (no data fetching)
 * - Uses semantic tokens for styling
 * - Follows 4px vertical rhythm
 * - All logic delegated to useAssetGuidance hook
 */
export function AssetGuidanceSection({
  asset,
  quote,
  userHoldings,
  authenticated,
  riskMeasures,
}: AssetGuidanceSectionProps) {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isTradeDrawerOpen, setIsTradeDrawerOpen] = useState(false);
  const [tradeAction, setTradeAction] = useState<'BUY' | 'SELL'>('BUY');

  // Get user cash balance for trade drawer
  const { cashBalance } = usePortfolioOverview();

  // Get guidance from hook
  const guidance = useAssetGuidance({
    asset,
    quote,
    riskMeasures,
    userHoldings,
    authenticated
  });

  // Map icon names to Phosphor icon components
  const getIconComponent = (iconName?: string): ComponentType<PhosphorIconProps> | null => {
    if (!iconName) return null;
    
    const iconMap: Record<string, ComponentType<PhosphorIconProps>> = {
      'ArrowClockwiseIcon': ArrowClockwiseIcon,
      'ArrowDownIcon': ArrowDownIcon,
      'CalendarIcon': CalendarIcon,
      'ChartBarIcon': ChartBarIcon,
      'ChartPieIcon': ChartPieIcon,
      'CheckCircleIcon': CheckCircleIcon,
      'ClockIcon': ClockIcon,
      'CurrencyDollarIcon': CurrencyDollarIcon,
      'GaugeIcon': GaugeIcon,
      'HourglassHighIcon': HourglassHighIcon,
      'InfoIcon': InfoIcon,
      'MagnifyingGlassIcon': MagnifyingGlassIcon,
      'ShieldCheckIcon': ShieldCheckIcon,
      'StarIcon': StarIcon,
      'TargetIcon': TargetIcon,
      'TrendDownIcon': TrendDownIcon,
      'TrendUpIcon': TrendUpIcon,
      'WarningCircleIcon': WarningCircleIcon,
      'WaveformIcon': WaveformIcon,
      'BriefcaseIcon': BriefcaseIcon,
    };
    
    return iconMap[iconName] || null;
  };

  // Buy/Sell handlers
  const handleBuyClick = () => {
    if (!authenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setTradeAction('BUY');
    setIsTradeDrawerOpen(true);
  };

  const handleSellClick = () => {
    if (!authenticated) {
      setShowLoginPrompt(true);
      return;
    }
    if (!userHoldings || userHoldings.totalQuantity === 0) {
      return;
    }
    setTradeAction('SELL');
    setIsTradeDrawerOpen(true);
  };

  return (
    <>
      <div className="w-full mt-24 mb-32">
        {/* Header Section */}
        <div className="mb-6">
          <h3 className="text-[48px] text-foreground leading-none mb-4">
            Decision Time!
          </h3>
          <p className="text-lg text-foreground mb-2">
            {guidance.summary}
          </p>
          <p className="text-sm text-muted-foreground">
            {guidance.context}
          </p>
          {guidance.holdingSummary && (
            <p className="text-sm text-primary mt-2">
              {guidance.holdingSummary}
            </p>
          )}
        </div>

        {/* Two-Column Pros/Cons Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pros Column */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={CheckCircleIcon} size="lg" className="text-emerald-600" />
                <span>Things to Like</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guidance.pros.length > 0 ? (
                <ul className="space-y-3">
                  {guidance.pros.map((pro) => {
                    const IconComponent = getIconComponent(pro.iconName);
                    return (
                      <li key={pro.id} className="flex items-start gap-3">
                        {IconComponent && (
                          <span className="flex-shrink-0 mt-0.5">
                            <Icon icon={IconComponent} size="sm" className="text-muted-foreground" />
                          </span>
                        )}
                        <span className="text-sm text-foreground">{pro.text}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No specific pros identified yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Cons Column */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={WarningCircleIcon} size="lg" className="text-amber-600" />
                <span>Watch Out For</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guidance.cons.length > 0 ? (
                <ul className="space-y-3">
                  {guidance.cons.map((con) => {
                    const IconComponent = getIconComponent(con.iconName);
                    return (
                      <li key={con.id} className="flex items-start gap-3">
                        {IconComponent && (
                          <span className="flex-shrink-0 mt-0.5">
                            <Icon icon={IconComponent} size="sm" className="text-muted-foreground" />
                          </span>
                        )}
                        <span className="text-sm text-foreground">{con.text}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No specific concerns identified yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Buy/Sell Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-20 justify-end">
          <Button
            onClick={handleBuyClick}
            variant="neutral"
            size="lg"
            className="min-w-[140px]"
          >
            <Icon icon={ArrowUpIcon} size="sm" />
            Buy {asset.ticker}
          </Button>
          <Button
            onClick={handleSellClick}
            variant="neutral"
            size="lg"
            className="min-w-[140px]"
            disabled={!userHoldings || userHoldings.totalQuantity === 0}
          >
            <Icon icon={ArrowDownIcon} size="sm" />
            Sell {asset.ticker}
          </Button>
        </div>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && createPortal(
        <div className={createModalClasses().backdrop} onClick={() => setShowLoginPrompt(false)}>
          <div className={createModalClasses().container}>
            <div className={createModalClasses().content} onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-medium text-foreground">Login Required</h3>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Please log in to trade {asset.ticker}.
                </p>
              </div>
              <div className="px-6 py-4 bg-muted flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowLoginPrompt(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => (window.location.href = '/')}
                >
                  Log In
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Trade Drawer */}
      <TradeDrawer
        isOpen={isTradeDrawerOpen}
        onClose={() => setIsTradeDrawerOpen(false)}
        asset={{
          ticker: asset.ticker,
          name: asset.name,
          allowFractionalShares: asset.allowFractionalShares,
        }}
        orderType={tradeAction}
        currentPrice={quote.regularMarketPrice}
        userCashBalance={cashBalance}
        userHoldings={
          userHoldings
            ? {
                totalQuantity: userHoldings.totalQuantity,
                avgCostBasis: userHoldings.avgCostBasis,
              }
            : undefined
        }
      />
    </>
  );
}
