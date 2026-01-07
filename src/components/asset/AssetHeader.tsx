'use client';

/**
 * AssetHeader Component (Refactored)
 * 
 * Displays asset header with price, stats, and action buttons.
 * 
 * Architecture Compliance:
 * - Uses Formatters service for all formatting (no inline formatters)
 * - Uses AssetDisplayService for display logic
 * - Uses useWatchlistStatus hook for watchlist data (no direct fetch)
 * - Pure display component (no business logic)
 * - All calculations done in services/hooks before reaching this component
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AssetDetailQuote } from '@/types';
import { WatchlistSelectionModal } from './WatchlistSelectionModal';
import { useToast } from '@/hooks/useToast';
import { useWatchlistStatus } from '@/hooks/useWatchlistStatus';
import { Formatters } from '@/lib/financial';
import { AssetDisplayService } from '@/lib/asset-display-service';

import { CheckCircleIcon, CircleNotchIcon, CurrencyDollarIcon, Icon, LockIcon, PlusIcon } from '@/components/ui';
import { getZIndexClass } from '@/lib/z-index';

interface AssetHeaderProps {
  asset: {
    id: number;
    ticker: string;
    name: string;
    type: string;
    market: string | null;
    locale: string | null;
    primaryExchange: string | null;
    active: boolean | null;
    currencyName: string | null;
    logoUrl: string | null;
    allowFractionalShares: boolean;
    lastUpdated: string | Date | null; // API returns string (JSON serialized)
  };
  quote: AssetDetailQuote;
  hasHoldings: boolean;
  authenticated?: boolean;
  profile?: { description?: string | null } | null;
  hideActions?: boolean;
}

export function AssetHeader({ 
  asset, 
  quote, 
  hasHoldings, 
  authenticated = true, 
  profile, 
  hideActions = false 
}: AssetHeaderProps) {
  const { success } = useToast();
  const router = useRouter();
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isBlurbExpanded, setIsBlurbExpanded] = useState(false);

  // Use hook for watchlist status (replaces fetchWatchlistStatus)
  const { inWatchlists, totalWatchlists, isLoading: watchlistLoading } = useWatchlistStatus(
    asset.ticker,
    authenticated
  );

  // Use AssetDisplayService for price change color
  const priceColor = AssetDisplayService.getPriceChangeColor(quote.regularMarketChange);

  // Event handlers
  const handleWatchlistClick = () => {
    if (!authenticated) {
      setShowLoginPrompt(true);
      return;
    }
    if (watchlistLoading) {
      return;
    }
    setIsWatchlistModalOpen(true);
  };

  const handleWatchlistSuccess = () => {
    // Hook will automatically refetch when component remounts
    // No manual refresh needed
  };

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
    if (!hasHoldings) {
      success('You need to own shares before you can sell them.');
      return;
    }
    
    const returnUrl = `/asset/${asset.ticker}`;
    router.push(`/trade/sell/${asset.ticker}?returnTo=${encodeURIComponent(returnUrl)}`);
  };

  // Determine watchlist button state
  let watchlistButtonText = 'Add to Watchlist';
  let watchlistButtonClass = 'bg-transparent border border-gray-900 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-900/5 font-medium transition-colors';
  let watchlistIconComponent = PlusIcon;
  let watchlistIconSpin = false;

  if (!authenticated) {
    watchlistButtonText = 'Add to Watchlist';
    watchlistIconComponent = PlusIcon;
  } else if (watchlistLoading) {
    watchlistButtonText = 'Loading...';
    watchlistButtonClass = 'bg-transparent border border-gray-400 text-gray-400 px-4 py-2 rounded-lg font-medium cursor-not-allowed';
    watchlistIconComponent = CircleNotchIcon;
    watchlistIconSpin = true;
  } else if (inWatchlists === 0) {
    watchlistButtonText = 'Add to Watchlist';
    watchlistIconComponent = PlusIcon;
  } else if (inWatchlists === 1) {
    watchlistButtonText = 'In 1 Watchlist';
    watchlistIconComponent = CheckCircleIcon;
  } else {
    watchlistButtonText = `In ${inWatchlists} Watchlists`;
    watchlistIconComponent = CheckCircleIcon;
  }

  return (
    <div>
      <div className="py-0">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-20">
          {/* Left column: Asset info, stats, and actions */}
          <div className="flex-1 min-w-0 space-y-6">
            <div className="min-w-0">
              <div className="flex items-center">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-1">
                    <div className="flex !mb-0">
                      <h4 className="text-sm leading-none text-gray-900 truncate">
                        {asset.name}
                      </h4>
                    </div>
                    {/* Ticker line with exchanges and holdings */}
                    <div className="flex flex-row items-baseline gap-2 !mb-0">
                      <p className="text-lg text-white bg-gray-950 px-2 py-1 rounded-md truncate">
                        {asset.ticker}
                      </p>
                      {asset.primaryExchange && (
                        <span className="text-sm text-gray-600">{asset.primaryExchange}</span>
                      )}
                      {asset.market && asset.market !== asset.primaryExchange && (
                        <span className="text-sm text-gray-600">{asset.market}</span>
                      )}
                      {hasHoldings && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Owned
                        </span>
                      )}
                    </div>
                    {/* Price info below ticker line */}
                    <div className="mt-4">
                      <h1 className="text-4xl font-mono text-gray-900 leading-none !mb-0">
                        {Formatters.currency(quote.regularMarketPrice, { 
                          currency: quote.currency || 'USD' 
                        })}
                      </h1>
                      {AssetDisplayService.isValidPriceChange(
                        quote.regularMarketChange, 
                        quote.regularMarketChangePercent
                      ) && (
                        <div className={`text-lg font-medium ${priceColor} mt-1`}>
                          {Formatters.signedNumber(quote.regularMarketChange!, { decimals: 2 })} (
                          {Formatters.percentage(quote.regularMarketChangePercent! / 100, { 
                            showSign: true 
                          })})
                        </div>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        {quote.isCached && (
                          <span className="text-xs text-gray-500">
                            Cached ({Math.floor((quote.cacheAge || 0) / 1000)}s ago)
                          </span>
                        )}
                        
                        {quote.marketState && (
                          <span className="flex items-center text-xs text-gray-500">
                            <span className={`w-2 h-2 rounded-full mr-1 ${
                              AssetDisplayService.getMarketStateColor(quote.marketState)
                            }`}></span>
                            {AssetDisplayService.getMarketStateLabel(quote.marketState)}
                          </span>
                        )}
                      </div>
                      {/* Action Buttons (optional for legacy layout) */}
                      {!hideActions && (
                        <div className="flex flex-wrap gap-3 mt-8">
                          <button 
                            onClick={handleBuyClick}
                            className="bg-gray-950 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors inline-flex items-center gap-2"
                          >
                            <Icon icon={CurrencyDollarIcon} size="sm" />
                            Buy {asset.ticker}
                          </button>
                          {hasHoldings && (
                            <button 
                              onClick={handleSellClick}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium transition-colors"
                            >
                              Sell {asset.ticker}
                            </button>
                          )}
                          <button 
                            onClick={handleWatchlistClick}
                            className={watchlistButtonClass}
                            disabled={watchlistLoading}
                            title={
                              !authenticated 
                                ? 'Log in to add to watchlist'
                                : watchlistLoading
                                  ? 'Loading watchlist status...'
                                  : inWatchlists > 0
                                    ? 'Manage watchlists'
                                    : 'Add to watchlist'
                            }
                          >
                            <div className="flex items-center">
                              <Icon 
                                icon={watchlistIconComponent} 
                                size="md" 
                                className={`mr-2 ${watchlistIconSpin ? 'animate-spin' : ''}`}
                              />
                              {watchlistButtonText}
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {quote.regularMarketOpen && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Open</label>
                  <p className="text-sm font-medium text-gray-900">
                    {Formatters.currency(quote.regularMarketOpen, { 
                      currency: quote.currency || 'USD' 
                    })}
                  </p>
                </div>
              )}
              {quote.regularMarketDayHigh && quote.regularMarketDayLow && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Day Range</label>
                  <p className="text-sm font-medium text-gray-900">
                    {Formatters.currency(quote.regularMarketDayLow, { 
                      currency: quote.currency || 'USD' 
                    })} - {Formatters.currency(quote.regularMarketDayHigh, { 
                      currency: quote.currency || 'USD' 
                    })}
                  </p>
                </div>
              )}
              {quote.fiftyTwoWeekLow && quote.fiftyTwoWeekHigh && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">52W Range</label>
                  <p className="text-sm font-medium text-gray-900">
                    {Formatters.currency(quote.fiftyTwoWeekLow, { 
                      currency: quote.currency || 'USD' 
                    })} - {Formatters.currency(quote.fiftyTwoWeekHigh, { 
                      currency: quote.currency || 'USD' 
                    })}
                  </p>
                </div>
              )}
              {quote.regularMarketVolume && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Volume</label>
                  <p className="text-sm font-medium text-gray-900">
                    {Formatters.number(parseInt(quote.regularMarketVolume))}
                  </p>
                </div>
              )}
              {quote.marketCap && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Market Cap</label>
                  <p className="text-sm font-medium text-gray-900">
                    {Formatters.compactNumber(parseFloat(quote.marketCap))}
                  </p>
                </div>
              )}
              {quote.trailingPE && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">P/E Ratio</label>
                  <p className="text-sm font-medium text-gray-900">
                    {Formatters.number(quote.trailingPE, { decimals: 2 })}
                  </p>
                </div>
              )}
              {quote.dividendYield && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Dividend Yield</label>
                  <p className="text-sm font-medium text-gray-900">
                    {Formatters.percentage(quote.dividendYield)}
                  </p>
                </div>
              )}
              {quote.earningsPerShare && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">EPS</label>
                  <p className="text-sm font-medium text-gray-900">
                    {Formatters.currency(quote.earningsPerShare, { 
                      currency: quote.currency || 'USD' 
                    })}
                  </p>
                </div>
              )}
              {quote.bookValue && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Book Value</label>
                  <p className="text-sm font-medium text-gray-900">
                    {Formatters.currency(quote.bookValue, { 
                      currency: quote.currency || 'USD' 
                    })}
                  </p>
                </div>
              )}
              {quote.priceToBook && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">P/B Ratio</label>
                  <p className="text-sm font-medium text-gray-900">
                    {Formatters.number(quote.priceToBook, { decimals: 2 })}
                  </p>
                </div>
              )}
              {quote.beta && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Beta</label>
                  <p className="text-sm font-medium text-gray-900">
                    {Formatters.number(quote.beta, { decimals: 2 })}
                  </p>
                </div>
              )}
            </div>
            {/* Company blurb */}
            {profile?.description ? (
              <p className="mt-3 text-sm text-gray-700 max-w-[65ch]">
                {(() => {
                  const full = (profile.description || '').trim();
                  if (!full) return null;
                  const halfLen = Math.ceil(full.length / 2);
                  const needsTruncate = full.length > 0 && halfLen < full.length;
                  const preview = full.slice(0, halfLen).trim();
                  if (isBlurbExpanded) {
                    return (
                      <>
                        {full}
                        {needsTruncate && (
                          <>
                            {' '}
                            <button
                              type="button"
                              onClick={() => setIsBlurbExpanded(false)}
                              className="text-blue-600 hover:underline"
                            >
                              Show less
                            </button>
                          </>
                        )}
                      </>
                    );
                  }
                  if (needsTruncate) {
                    return (
                      <>
                        {preview}...
                        {' '}
                        <button
                          type="button"
                          onClick={() => setIsBlurbExpanded(true)}
                          className="text-blue-600 hover:underline"
                        >
                          See more
                        </button>
                      </>
                    );
                  }
                  return full;
                })()}
              </p>
            ) : (
              <p className="mt-3 text-sm text-gray-700 max-w-[65ch]">
                Looking for more about {asset.name}? See the overview on{' '}
                <a
                  href={`https://finance.yahoo.com/quote/${asset.ticker.toUpperCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Yahoo Finance
                </a>
                .
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 ${getZIndexClass('modalBackdrop')}`}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Login Required</h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="text-center">
                <LockIcon size={48} className="mx-auto text-blue-400" />
                <h4 className="mt-2 text-lg font-medium text-gray-900">Add to Watchlist</h4>
                <p className="mt-2 text-sm text-gray-600">
                  Please log in to add {asset.ticker} to your watchlist and track its performance.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Watchlist Selection Modal */}
      <WatchlistSelectionModal
        isOpen={isWatchlistModalOpen}
        onClose={() => setIsWatchlistModalOpen(false)}
        ticker={asset.ticker}
        assetName={asset.name}
        onSuccess={handleWatchlistSuccess}
      />
    </div>
  );
}
