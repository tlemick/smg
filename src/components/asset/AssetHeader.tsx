import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AssetDetailQuote } from '@/types';
import { WatchlistSelectionModal } from './WatchlistSelectionModal';
import { useToast } from '@/hooks/useToast';

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
    lastUpdated: Date | null;
  };
  quote: AssetDetailQuote;
  hasHoldings: boolean;
  authenticated?: boolean;
  profile?: { description?: string | null } | null;
  hideActions?: boolean;
}

export function AssetHeader({ asset, quote, hasHoldings, authenticated = true, profile, hideActions = false }: AssetHeaderProps) {
  const { success, error } = useToast();
  const router = useRouter();
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState<{
    inWatchlists: number;
    totalWatchlists: number;
    loading: boolean;
  }>({ inWatchlists: 0, totalWatchlists: 0, loading: false });
  const [isBlurbExpanded, setIsBlurbExpanded] = useState(false);

  const priceColor = quote.regularMarketChange && quote.regularMarketChange > 0 
    ? 'text-green-600' 
    : quote.regularMarketChange && quote.regularMarketChange < 0 
      ? 'text-red-600' 
      : 'text-gray-600';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: quote.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number | null, percent: number | null) => {
    // Validate that both values are valid numbers
    if (change === null || change === undefined || isNaN(change) || 
        percent === null || percent === undefined || isNaN(percent)) {
      return 'N/A (N/A)';
    }

    const changeStr = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
    const percentStr = percent >= 0 ? `+${percent.toFixed(2)}%` : `${percent.toFixed(2)}%`;
    return `${changeStr} (${percentStr})`;
  };

  const formatMarketCap = (marketCapStr: string) => {
    try {
      const marketCapNum = parseFloat(marketCapStr);
      if (isNaN(marketCapNum) || marketCapNum <= 0) {
        return 'N/A';
      }

      if (marketCapNum >= 1e12) {
        return `${(marketCapNum / 1e12).toFixed(1)}T`;
      } else if (marketCapNum >= 1e9) {
        return `${(marketCapNum / 1e9).toFixed(1)}B`;
      } else if (marketCapNum >= 1e6) {
        return `${(marketCapNum / 1e6).toFixed(1)}M`;
      } else {
        return `${marketCapNum.toLocaleString()}`;
      }
    } catch (error) {
      console.warn('Error formatting market cap:', error);
      return 'N/A';
    }
  };

  const getMarketStateDisplay = (state?: string) => {
    switch (state) {
      case 'REGULAR': return 'Market Open';
      case 'PRE': return 'Pre-Market';
      case 'POST': return 'After Hours';
      case 'CLOSED': return 'Market Closed';
      default: return '';
    }
  };

  const getAssetTypeDisplay = (type: string) => {
    switch (type) {
      case 'STOCK': return 'Stock';
      case 'ETF': return 'ETF';
      case 'MUTUAL_FUND': return 'Mutual Fund';
      case 'BOND': return 'Bond';
      case 'INDEX': return 'Index Fund';
      default: return type.replace('_', ' ');
    }
  };

  const handleWatchlistClick = () => {
    if (!authenticated) {
      setShowLoginPrompt(true);
      return;
    }
    if (watchlistStatus.loading) {
      return; // Don't open modal while loading
    }
    setIsWatchlistModalOpen(true);
  };

  const handleWatchlistSuccess = (message: string) => {
    // Refresh watchlist status
    if (authenticated) {
      fetchWatchlistStatus();
    }
  };

  // Trading handlers
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

  // Fetch watchlist status for authenticated users
  const fetchWatchlistStatus = async () => {
    if (!authenticated) return;

    try {
      setWatchlistStatus(prev => ({ ...prev, loading: true }));
      
      const response = await fetch(`/api/user/watchlists/for-asset/${asset.ticker.toUpperCase()}`);
      const data = await response.json();

      if (data.success) {
        const containingWatchlists = data.data.watchlists.filter((w: any) => w.containsAsset);
        setWatchlistStatus({
          inWatchlists: containingWatchlists.length,
          totalWatchlists: data.data.watchlists.length,
          loading: false,
        });
      } else {
        setWatchlistStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      setWatchlistStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // Fetch watchlist status on component mount
  useEffect(() => {
    if (authenticated) {
      fetchWatchlistStatus();
    }
  }, [authenticated, asset.ticker]);

  // Get button content based on watchlist status
  const getWatchlistButtonContent = () => {
    if (!authenticated) {
      return {
        text: 'Add to Watchlist',
        className: 'bg-transparent border border-gray-900 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-900/5 font-medium transition-colors',
        icon: <Icon icon={PlusIcon} size="md" className="mr-2" />
      };
    }

    if (watchlistStatus.loading) {
      return {
        text: 'Loading...',
        className: 'bg-transparent border border-gray-400 text-gray-400 px-4 py-2 rounded-lg font-medium cursor-not-allowed',
        icon: <Icon icon={CircleNotchIcon} size="md" className="mr-2 animate-spin" />
      };
    }

    if (watchlistStatus.inWatchlists === 0) {
      return {
        text: 'Add to Watchlist',
        className: 'bg-transparent border border-gray-900 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-900/5 font-medium transition-colors',
        icon: <Icon icon={PlusIcon} size="md" className="mr-2" />
      };
    }

    if (watchlistStatus.inWatchlists === 1) {
      return {
        text: 'In 1 Watchlist',
        className: 'bg-transparent border border-gray-900 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-900/5 font-medium transition-colors',
        icon: <Icon icon={CheckCircleIcon} size="md" className="mr-2" />
      };
    }

    return {
      text: `In ${watchlistStatus.inWatchlists} Watchlists`,
      className: 'bg-transparent border border-gray-900 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-900/5 font-medium transition-colors',
      icon: <Icon icon={CheckCircleIcon} size="md" className="mr-2" />
    };
  };

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
                      <h1 className="text-4xl text-gray-900 leading-none !mb-0">
                        {formatPrice(quote.regularMarketPrice)}
                      </h1>
                      {(quote.regularMarketChange !== undefined && quote.regularMarketChange !== null) && 
                       (quote.regularMarketChangePercent !== undefined && quote.regularMarketChangePercent !== null) && (
                        <div className={`text-lg font-medium ${priceColor} mt-1`}>
                          {formatChange(quote.regularMarketChange, quote.regularMarketChangePercent)}
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
                              quote.marketState === 'REGULAR' ? 'bg-green-400' : 
                              quote.marketState === 'CLOSED' ? 'bg-red-400' : 'bg-yellow-400'
                            }`}></span>
                            {getMarketStateDisplay(quote.marketState)}
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
                            className={getWatchlistButtonContent().className}
                            disabled={watchlistStatus.loading}
                            title={
                              !authenticated 
                                ? 'Log in to add to watchlist'
                                : watchlistStatus.loading
                                  ? 'Loading watchlist status...'
                                  : watchlistStatus.inWatchlists > 0
                                    ? 'Manage watchlists'
                                    : 'Add to watchlist'
                            }
                          >
                            <div className="flex items-center">
                              {getWatchlistButtonContent().icon}
                              {getWatchlistButtonContent().text}
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
                    {formatPrice(quote.regularMarketOpen)}
                  </p>
                </div>
              )}
              {quote.regularMarketDayHigh && quote.regularMarketDayLow && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Day Range</label>
                  <p className="text-sm font-medium text-gray-900">
                    {formatPrice(quote.regularMarketDayLow)} - {formatPrice(quote.regularMarketDayHigh)}
                  </p>
                </div>
              )}
              {quote.fiftyTwoWeekLow && quote.fiftyTwoWeekHigh && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">52W Range</label>
                  <p className="text-sm font-medium text-gray-900">
                    {formatPrice(quote.fiftyTwoWeekLow)} - {formatPrice(quote.fiftyTwoWeekHigh)}
                  </p>
                </div>
              )}
              {quote.regularMarketVolume && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Volume</label>
                  <p className="text-sm font-medium text-gray-900">
                    {parseInt(quote.regularMarketVolume).toLocaleString()}
                  </p>
                </div>
              )}
              {quote.marketCap && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Market Cap</label>
                  <p className="text-sm font-medium text-gray-900">
                    {formatMarketCap(quote.marketCap)}
                  </p>
                </div>
              )}
              {quote.trailingPE && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">P/E Ratio</label>
                  <p className="text-sm font-medium text-gray-900">
                    {quote.trailingPE.toFixed(2)}
                  </p>
                </div>
              )}
              {quote.dividendYield && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Dividend Yield</label>
                  <p className="text-sm font-medium text-gray-900">
                    {(quote.dividendYield * 100).toFixed(2)}%
                  </p>
                </div>
              )}
              {quote.earningsPerShare && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">EPS</label>
                  <p className="text-sm font-medium text-gray-900">
                    {formatPrice(quote.earningsPerShare)}
                  </p>
                </div>
              )}
              {quote.bookValue && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Book Value</label>
                  <p className="text-sm font-medium text-gray-900">
                    {formatPrice(quote.bookValue)}
                  </p>
                </div>
              )}
              {quote.priceToBook && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">P/B Ratio</label>
                  <p className="text-sm font-medium text-gray-900">
                    {quote.priceToBook.toFixed(2)}
                  </p>
                </div>
              )}
              {quote.beta && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Beta</label>
                  <p className="text-sm font-medium text-gray-900">
                    {quote.beta.toFixed(2)}
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
                  // Navigate to login page
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