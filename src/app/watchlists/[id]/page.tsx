'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { AddAssetToWatchlistModal, EditWatchlistModal, EditItemNotesModal } from '@/components/asset';
import { useWatchlistQuotes } from '@/hooks/useWatchlistQuotes';
import { RefreshIndicator } from '@/components/watchlist/RefreshIndicator';
import { useToast } from '@/hooks/useToast';
import { MainNavigation } from '@/components/navigation';
import { CompanyLogo } from '@/components/ui';
import { getZIndexClass } from '@/lib/z-index';

interface Asset {
  id: number;
  ticker: string;
  name: string;
  type: string;
  logoUrl?: string | null;
}

interface WatchlistItem {
  id: string;
  watchlistId: string;
  assetId: number;
  assetType: string;
  addedAt: string;
  notes?: string;
  asset: Asset;
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
  quote: QuoteData | null; // Allow null quotes for error cases
  error: string | null;
}

interface Watchlist {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: WatchlistItem[];
}

export default function WatchlistDetailPage() {
  const { user, isLoading } = useUser();
  const { success, error: showErrorToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const watchlistId = params.id as string;

  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [quotes, setQuotes] = useState<WatchlistQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isEditWatchlistModalOpen, setIsEditWatchlistModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);
  const [removingItem, setRemovingItem] = useState<WatchlistItem | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);

  // Fetch watchlist details function
  const fetchWatchlist = async () => {
    if (!user || !watchlistId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/watchlist?include=items`);
      const data = await response.json();

      if (data.success) {
        const targetWatchlist = data.data.find((w: Watchlist) => w.id === watchlistId);
        if (targetWatchlist) {
          setWatchlist(targetWatchlist);
        } else {
          setError('Watchlist not found');
        }
      } else {
        setError(data.error || 'Failed to load watchlist');
      }
    } catch (err) {
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  // Fetch watchlist details on component mount
  useEffect(() => {
    fetchWatchlist();
  }, [user, watchlistId]);

  // Use our optimized quotes hook with manual refresh
  const { 
    quotes: hookQuotes, 
    lastUpdate, 
    isRefreshing, 
    error: quotesError, 
    refreshQuotes 
  } = useWatchlistQuotes(watchlistId);

  // Update local quotes state when hook provides new data
  useEffect(() => {
    setQuotes(hookQuotes);
  }, [hookQuotes]);

  const handleAddAssetSuccess = (message: string) => {
    // Refresh the watchlist data
    fetchWatchlist();
  };

  const handleEditWatchlistSuccess = (message: string) => {
    success(message);
    // Refresh the watchlist data
    fetchWatchlist();
  };

  const handleEditNotesSuccess = (message: string) => {
    success(message);
    // Refresh the watchlist data
    fetchWatchlist();
  };

  const handleRemoveItem = async (item: WatchlistItem) => {
    try {
      setRemoveLoading(true);
      
      const response = await fetch(`/api/watchlist/${item.watchlistId}/items/${item.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the watchlist data
        fetchWatchlist();
        setRemovingItem(null);
      } else {
        const errorMessage = `Failed to remove ${item.asset.ticker}: ${data.error || 'Unknown error'}`;
        showErrorToast(errorMessage);
      }
    } catch (err) {
      const errorMessage = `Failed to remove ${item.asset.ticker}`;
      showErrorToast(errorMessage);
    } finally {
      setRemoveLoading(false);
    }
  };

  // Show loading while checking authentication
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

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
        bgColor: 'bg-gray-50',
      };
    }

    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    return {
      absolute: `${sign}${change.toFixed(2)}`,
      percent: `${sign}${changePercent.toFixed(2)}%`,
      color: isPositive ? 'text-green-600' : 'text-red-600',
      bgColor: isPositive ? 'bg-green-50' : 'bg-red-50',
    };
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <MainNavigation />

      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/watchlists" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Watchlists
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    {watchlist?.name || 'Loading...'}
                  </span>
                </div>
              </li>
            </ol>
          </nav>



          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading watchlist...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Watchlist Content */}
          {!loading && !error && watchlist && (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                      {watchlist.name}
                    </h1>
                    <p className="text-gray-600">
                      {watchlist.itemCount} {watchlist.itemCount === 1 ? 'stock' : 'stocks'} • Created {new Date(watchlist.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsAddAssetModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditWatchlistModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* Assets List */}
              {watchlist.items.length === 0 ? (
                /* Empty State */
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No stocks yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first stock to this watchlist.</p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setIsAddAssetModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Your First Stock
                    </button>
                  </div>
                </div>
              ) : (
                /* Assets Grid */
                <div className="space-y-4">
                  {/* Live Quotes Refresh Indicator */}
                  <RefreshIndicator
                    isRefreshing={isRefreshing}
                    lastUpdate={lastUpdate}
                    onRefresh={refreshQuotes}
                    quotesCount={quotes.length}
                    error={quotesError}
                  />

                  {/* Assets List */}
                  {watchlist.items.map((item) => {
                    const quote = quotes.find(q => q.watchlistItemId === item.id);
                    const changeData = quote?.quote ? formatChange(quote.quote.regularMarketChange, quote.quote.regularMarketChangePercent) : null;

                    return (
                      <div
                        key={item.id}
                        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between">
                            {/* Asset Info */}
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <CompanyLogo 
                                  ticker={item.asset.ticker}
                                  companyName={item.asset.name}
                                  logoUrl={item.asset.logoUrl}
                                  size="lg"
                                />
                              </div>
                              <div>
                                <Link
                                  href={`/asset/${item.asset.ticker}`}
                                  className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                                >
                                  {item.asset.ticker}
                                </Link>
                                <p className="text-sm text-gray-600">{item.asset.name}</p>
                                {item.notes && (
                                  <p className="text-sm text-gray-500 mt-1">Note: {item.notes}</p>
                                )}
                              </div>
                            </div>

                            {/* Quote Data */}
                            <div className="text-right">
                              {quote?.error ? (
                                <p className="text-sm text-red-600">Failed to load quote</p>
                              ) : quote?.quote ? (
                                <>
                                  <p className="text-2xl font-bold text-gray-900">
                                    {formatPrice(quote.quote.regularMarketPrice, quote.quote.currency)}
                                  </p>
                                  {changeData && (
                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${changeData.bgColor} ${changeData.color}`}>
                                      {changeData.absolute} ({changeData.percent})
                                    </div>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    {quote.quote.marketState} • {quote.quote.isCached ? 'Cached' : 'Live'}
                                  </p>
                                </>
                              ) : (
                                <div className="animate-pulse">
                                  <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => setEditingItem(item)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Edit notes"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => setRemovingItem(item)}
                                className="text-gray-400 hover:text-red-600"
                                title="Remove from watchlist"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Asset Modal */}
      <AddAssetToWatchlistModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        watchlistId={watchlistId}
        watchlistName={watchlist?.name || ''}
        onSuccess={handleAddAssetSuccess}
      />

      {/* Edit Watchlist Modal */}
      <EditWatchlistModal
        isOpen={isEditWatchlistModalOpen}
        onClose={() => setIsEditWatchlistModalOpen(false)}
        watchlist={watchlist ? { id: watchlist.id, name: watchlist.name } : null}
        onSuccess={handleEditWatchlistSuccess}
      />

      {/* Edit Item Notes Modal */}
      <EditItemNotesModal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSuccess={handleEditNotesSuccess}
      />

      {/* Remove Item Confirmation Dialog */}
      {removingItem && (
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 ${getZIndexClass('modalBackdrop')}`}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Remove from Watchlist</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {removingItem.asset.ticker}
                  </h4>
                  <p className="text-sm text-gray-600">{removingItem.asset.name}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700">
                Are you sure you want to remove this asset from your watchlist? This action cannot be undone.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setRemovingItem(null)}
                disabled={removeLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemoveItem(removingItem)}
                disabled={removeLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {removeLoading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 