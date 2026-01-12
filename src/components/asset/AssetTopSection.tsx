'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AssetDetailQuote, AssetDetailData, UserHoldingsSummary } from '@/types';
import { Formatters } from '@/lib/financial';
import { AssetDisplayService } from '@/lib/asset-display-service';
import { getChangeColor } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon, ArrowUpIcon, ArrowDownIcon } from '@/components/ui/Icon';
import { WatchlistSelectionModal } from './WatchlistSelectionModal';
import { useWatchlistStatus } from '@/hooks/useWatchlistStatus';
import { createModalClasses } from '@/lib/positioning';
import { createPortal } from 'react-dom';

interface AssetTopSectionProps {
  asset: AssetDetailData['asset'];
  quote: AssetDetailQuote;
  userHoldings: UserHoldingsSummary | null;
  authenticated: boolean;
}

/**
 * AssetTopSection Component
 * 
 * Top section of asset detail page displaying:
 * - Left: Asset name, ticker badge, large price, percent change
 * - Right: Buy/Sell buttons, holdings indicator
 * 
 * Architecture Compliance:
 * - Pure display component (no business logic)
 * - Uses Formatters service for all formatting
 * - Uses AssetDisplayService for display logic
 * - Handles user interactions (navigation, modals)
 */
export function AssetTopSection({ 
  asset, 
  quote, 
  userHoldings, 
  authenticated 
}: AssetTopSectionProps) {
  const router = useRouter();
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const { inWatchlists, isLoading: watchlistLoading } = useWatchlistStatus(
    asset.ticker,
    authenticated
  );

  // Price change color (using semantic chart tokens)
  const priceColor = getChangeColor(quote.regularMarketChange ?? null);

  // Buy/Sell handlers
  const handleBuyClick = () => {
    if (!authenticated) {
      setShowLoginPrompt(true);
      return;
    }
    const returnUrl = `/asset/${asset.ticker}`;
    router.push(`/trade/buy/${asset.ticker}?returnTo=${encodeURIComponent(returnUrl)}`);
  };

  const handleSellClick = () => {
    if (!authenticated) {
      setShowLoginPrompt(true);
      return;
    }
    if (!userHoldings || userHoldings.totalQuantity === 0) {
      return;
    }
    const returnUrl = `/asset/${asset.ticker}`;
    router.push(`/trade/sell/${asset.ticker}?returnTo=${encodeURIComponent(returnUrl)}`);
  };

  const handleWatchlistClick = () => {
    if (!authenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setIsWatchlistModalOpen(true);
  };

  // Format holdings indicator
  const holdingsText = userHoldings && userHoldings.totalQuantity > 0
    ? `${Formatters.number(userHoldings.totalQuantity, { decimals: 4 })} shares worth ${Formatters.currency(userHoldings.currentValue, { currency: quote.currency || 'USD' })}`
    : null;

  // Check if price change is valid
  const hasValidPriceChange = AssetDisplayService.isValidPriceChange(
    quote.regularMarketChange,
    quote.regularMarketChangePercent
  );

  return (
    <>
      <div className="w-full mb-6 mt-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          {/* Left Side: Name, Ticker, Price, Change */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg lg:text-lg leading-none text-foreground truncate">
                {asset.name}
              </h1>
              <Badge variant="secondary" className="text-sm font-mono">
                {asset.ticker}
              </Badge>
            </div>
            
            <div className="flex items-baseline gap-4 flex-wrap">
              <div className="text-lg lg:text-4xl leading-none font-mono text-foreground">
                {Formatters.currency(quote.regularMarketPrice, { 
                  currency: quote.currency || 'USD' 
                })}
              </div>
              
              {hasValidPriceChange && (
                <div className={`text-xl font-medium ${priceColor}`}>
                  {Formatters.signedNumber(quote.regularMarketChange!, { decimals: 2 })} (
                  {Formatters.percentage(quote.regularMarketChangePercent! / 100, { 
                    showSign: true 
                  })})
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Holdings and Buttons */}
          <div className="flex flex-col gap-4 items-end">
            {holdingsText && (
              <div className="text-sm text-muted-foreground text-right">
                You own {holdingsText}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleBuyClick}
                variant="neutral"
              >
                <Icon icon={ArrowUpIcon} size="sm" />
                Buy {asset.ticker}
              </Button>
              <Button
                onClick={handleSellClick}
                variant="neutral"
                disabled={!userHoldings || userHoldings.totalQuantity === 0}
              >
                <Icon icon={ArrowDownIcon} size="sm" />
                Sell {asset.ticker}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Watchlist Modal */}
      <WatchlistSelectionModal
        isOpen={isWatchlistModalOpen}
        onClose={() => setIsWatchlistModalOpen(false)}
        ticker={asset.ticker}
        assetName={asset.name}
      />

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
                  Please log in to trade and manage watchlists for {asset.ticker}.
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
    </>
  );
}
