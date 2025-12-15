'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/useToast';
import { CompanyLogo } from '@/components/ui';
import { createModalClasses, createModalHandlers } from '@/lib/positioning';

interface Asset {
  id: number;
  ticker: string;
  name: string;
  type: string;
  logoUrl?: string | null;
}

interface QuoteData {
  regularMarketPrice: number;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
  currency: string;
  marketState: string;
  isCached: boolean;
  cacheAge: number;
}

interface WatchlistQuote {
  watchlistItemId: string;
  asset: Asset;
  quote: QuoteData;
  error: string | null;
}

interface Watchlist {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WatchlistWithQuotes {
  watchlist: Watchlist;
  quotes: WatchlistQuote[];
  loading: boolean;
  error: string | null;
}

export function WatchlistsPreview() {
  const { user } = useUser();
  const { success, error: showErrorToast } = useToast();
  const [watchlistsWithQuotes, setWatchlistsWithQuotes] = useState<WatchlistWithQuotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Add asset states
  const [expandedWatchlist, setExpandedWatchlist] = useState<string | null>(null);

  // Fetch user's watchlists and their quotes
  useEffect(() => {
    const fetchWatchlistData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Fetch all watchlists
        const watchlistsResponse = await fetch('/api/watchlist');
        const watchlistsData = await watchlistsResponse.json();

        if (watchlistsData.success && watchlistsData.data.length > 0) {
          const watchlists: Watchlist[] = watchlistsData.data;
          
          // Initialize watchlists with loading state
          const initialWatchlistsWithQuotes: WatchlistWithQuotes[] = watchlists.map(watchlist => ({
            watchlist,
            quotes: [],
            loading: true,
            error: null,
          }));
          
          setWatchlistsWithQuotes(initialWatchlistsWithQuotes);
          
          // Fetch quotes for each watchlist
          await Promise.allSettled(
            watchlists.map(async (watchlist, index) => {
              if (watchlist.itemCount === 0) {
                // Skip empty watchlists
                setWatchlistsWithQuotes(prev => 
                  prev.map((item, i) => 
                    i === index 
                      ? { ...item, loading: false }
                      : item
                  )
                );
                return;
              }

              try {
                const quotesResponse = await fetch(`/api/watchlist/${watchlist.id}/quotes`);
                const quotesData = await quotesResponse.json();
                
                setWatchlistsWithQuotes(prev => 
                  prev.map((item, i) => 
                    i === index 
                      ? { 
                          ...item, 
                          quotes: quotesData.success ? quotesData.data : [],
                          loading: false,
                          error: quotesData.success ? null : (quotesData.error || 'Failed to load quotes')
                        }
                      : item
                  )
                );
              } catch (error) {
                setWatchlistsWithQuotes(prev => 
                  prev.map((item, i) => 
                    i === index 
                      ? { ...item, loading: false, error: 'Failed to load quotes' }
                      : item
                  )
                );
              }
            })
          );
        } else {
          setWatchlistsWithQuotes([]);
        }
      } catch (error) {
        console.error('Failed to fetch watchlist data:', error);
        setWatchlistsWithQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlistData();
  }, [user]);

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatChange = (change: number | null, changePercent: number | null) => {
    // Validate that both values are valid numbers
    if (change === null || change === undefined || isNaN(change) || 
        changePercent === null || changePercent === undefined || isNaN(changePercent)) {
      return {
        absolute: 'N/A',
        percent: 'N/A',
        color: 'text-gray-500',
      };
    }

    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    return {
      absolute: `${sign}${change.toFixed(2)}`,
      percent: `${sign}${changePercent.toFixed(2)}%`,
      color: isPositive ? 'text-green-600' : 'text-red-600',
    };
  };

  const handleCreateWatchlist = () => {
    setIsCreateModalOpen(true);
    setNewWatchlistName('');
    setCreateError(null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setNewWatchlistName('');
    setCreateError(null);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWatchlistName.trim()) {
      setCreateError('Watchlist name is required');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newWatchlistName.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add the new watchlist to the list
        const newWatchlist: Watchlist = data.data;
        const newWatchlistWithQuotes: WatchlistWithQuotes = {
          watchlist: newWatchlist,
          quotes: [],
          loading: false,
          error: null,
        };
        setWatchlistsWithQuotes(prev => [newWatchlistWithQuotes, ...prev]);
        success(`Created watchlist "${data.data.name}"`);
        handleCloseModal();
      } else {
        const errorMessage = data.error || 'Failed to create watchlist';
        setCreateError(errorMessage);
        showErrorToast(errorMessage);
      }
    } catch (err) {
      const errorMessage = 'Failed to create watchlist';
      setCreateError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };


  // Show loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Watchlists</h2>
          <Link
            href="/watchlists"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading watchlists...</span>
        </div>
      </div>
    );
  }

  // Show empty state if no watchlists
  if (!user || watchlistsWithQuotes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Watchlists</h2>
          <Link
            href="/watchlists"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No watchlists yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first watchlist to track stocks.</p>
          <div className="mt-6">
            <button
              onClick={handleCreateWatchlist}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Watchlist
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalAssets = watchlistsWithQuotes.reduce((sum, item) => sum + item.quotes.length, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Your Watchlists</h2>
          <p className="text-sm text-gray-600 mt-1">
            {watchlistsWithQuotes.length} {watchlistsWithQuotes.length === 1 ? 'watchlist' : 'watchlists'} • {totalAssets} total assets
          </p>
        </div>
        <Link
          href="/watchlists"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Manage All →
        </Link>
      </div>
      
      <div className="space-y-6">
        {watchlistsWithQuotes.map((item) => (
          <div key={item.watchlist.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <Link
                href={`/watchlists/${item.watchlist.id}`}
                className="group flex items-center"
              >
                <div className="flex-shrink-0 mr-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.watchlist.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.watchlist.itemCount} {item.watchlist.itemCount === 1 ? 'asset' : 'assets'}
                  </p>
                </div>
              </Link>
              
            </div>

            {/* Watchlist Contents */}
            {item.loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading assets...</span>
              </div>
            ) : item.error ? (
              <div className="text-center py-6">
                <p className="text-sm text-red-600">{item.error}</p>
              </div>
            ) : item.watchlist.itemCount === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">No assets in this watchlist yet</p>
                <div className="mt-3">
                  <Link
                    href={`/watchlists/${item.watchlist.id}`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Manage Watchlist
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {item.quotes.map((quote) => {
                  const changeData = quote.quote ? formatChange(quote.quote.regularMarketChange, quote.quote.regularMarketChangePercent) : null;
                  
                  return (
                    <Link
                      key={quote.watchlistItemId}
                      href={`/asset/${quote.asset.ticker}`}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <CompanyLogo 
                          ticker={quote.asset.ticker}
                          companyName={quote.asset.name}
                          logoUrl={quote.asset.logoUrl}
                          size="sm"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-800">{quote.asset.ticker}</h4>
                          <p className="text-sm text-gray-600 truncate max-w-48">{quote.asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {quote.error ? (
                          <p className="text-sm text-red-600">Error</p>
                        ) : quote.quote ? (
                          <>
                            <p className="font-semibold text-gray-900">{formatPrice(quote.quote.regularMarketPrice, quote.quote.currency)}</p>
                            {changeData && (
                              <p className={`text-sm ${changeData.color}`}>
                                {changeData.absolute} ({changeData.percent})
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-12"></div>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Add Asset Section */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <Link
                href={`/watchlists/${item.watchlist.id}`}
                className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Manage Watchlist
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {/* Create New Watchlist Button */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={handleCreateWatchlist}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create New Watchlist
        </button>
      </div>

      {/* Create Watchlist Modal */}
      {isCreateModalOpen && (
        <div className={createModalClasses().backdrop} onClick={createModalHandlers(() => setIsCreateModalOpen(false)).backdropClick}>
          <div className={createModalClasses().container}>
            <div className={createModalClasses().content} onClick={createModalHandlers(() => setIsCreateModalOpen(false)).contentClick}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Create New Watchlist</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmitCreate} className="px-6 py-4">
              <div className="mb-4">
                <label htmlFor="watchlist-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Watchlist Name
                </label>
                <input
                  type="text"
                  id="watchlist-name"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Tech Stocks, Dividend Stocks..."
                  maxLength={50}
                  autoFocus
                />
                {createError && (
                  <p className="mt-2 text-sm text-red-600">{createError}</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={createLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !newWatchlistName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Watchlist'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 