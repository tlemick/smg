'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { CompanyLogo } from '@/components/ui';
import { AddAssetToWatchlistModal } from '@/components/asset';
import { CaretRightIcon, CircleNotchIcon, Icon, MagnifyingGlassIcon, TrashIcon } from '@/components/ui';
import Link from 'next/link';

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

interface Watchlist {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: WatchlistItem[];
}

interface QuoteData {
  regularMarketPrice: number;
  regularMarketOpen?: number;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
  currency: string;
  marketState: string;
  beta?: number;
}

interface WatchlistQuote {
  watchlistItemId: string;
  asset: Asset;
  quote: QuoteData | null;
  error: string | null;
}

interface UserHolding {
  ticker: string;
  shares: number;
}

export function Watchlists() {
  const { user } = useUser();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [quotes, setQuotes] = useState<Record<string, WatchlistQuote[]>>({});
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWatchlists, setExpandedWatchlists] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [addAssetModal, setAddAssetModal] = useState<{isOpen: boolean, watchlistId: string, watchlistName: string}>({
    isOpen: false,
    watchlistId: '',
    watchlistName: ''
  });
  const [createWatchlistModal, setCreateWatchlistModal] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingWatchlist, setDeletingWatchlist] = useState<{id: string, name: string} | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch watchlists and related data
  useEffect(() => {
    const fetchWatchlistData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch watchlists with items
        const watchlistsResponse = await fetch('/api/watchlist?include=items');
        const watchlistsData = await watchlistsResponse.json();
        
        if (!watchlistsData.success) {
          throw new Error(watchlistsData.error || 'Failed to fetch watchlists');
        }

        const watchlistsWithItems = watchlistsData.data;
        setWatchlists(watchlistsWithItems);

        // Auto-expand all watchlists by default
        const expandedState: Record<string, boolean> = {};
        watchlistsWithItems.forEach((watchlist: Watchlist) => {
          expandedState[watchlist.id] = true;
        });
        setExpandedWatchlists(expandedState);

        // Fetch quotes for each watchlist
        const quotesPromises = watchlistsWithItems.map(async (watchlist: Watchlist) => {
          if (watchlist.items.length === 0) return { watchlistId: watchlist.id, quotes: [] };
          
          try {
            const quotesResponse = await fetch(`/api/watchlist/${watchlist.id}/quotes`);
            const quotesData = await quotesResponse.json();
            return {
              watchlistId: watchlist.id,
              quotes: quotesData.success ? quotesData.data : []
            };
          } catch (err) {
            return { watchlistId: watchlist.id, quotes: [] };
          }
        });

        const quotesResults = await Promise.all(quotesPromises);
        const quotesMap: Record<string, WatchlistQuote[]> = {};
        quotesResults.forEach(result => {
          quotesMap[result.watchlistId] = result.quotes;
        });
        setQuotes(quotesMap);

        // Fetch user holdings from portfolio overview
        try {
          const holdingsResponse = await fetch('/api/user/portfolio/overview');
          if (holdingsResponse.ok) {
            const holdingsData = await holdingsResponse.json();
            if (holdingsData.success && holdingsData.data.allocations) {
              const holdingsMap: Record<string, number> = {};
              holdingsData.data.allocations.forEach((allocation: any) => {
                holdingsMap[allocation.asset.ticker] = allocation.totalQuantity;
              });
              setHoldings(holdingsMap);
            }
          }
        } catch (err) {
          // Holdings are optional, don't fail if unavailable
          console.log('Holdings not available:', err);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load watchlists');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlistData();
  }, [user]);

  // Refresh watchlist data after adding assets
  const handleAddAssetSuccess = async (message: string) => {
    // Refresh data (modal stays open so users can add multiple assets)
    if (user) {
      try {
        // Fetch updated watchlists
        const watchlistsResponse = await fetch('/api/watchlist?include=items');
        const watchlistsData = await watchlistsResponse.json();
        
        if (watchlistsData.success) {
          setWatchlists(watchlistsData.data);
          
          // Refresh quotes for the updated watchlist
          const updatedWatchlist = watchlistsData.data.find((w: Watchlist) => w.id === addAssetModal.watchlistId);
          if (updatedWatchlist && updatedWatchlist.items.length > 0) {
            const quotesResponse = await fetch(`/api/watchlist/${addAssetModal.watchlistId}/quotes`);
            const quotesData = await quotesResponse.json();
            if (quotesData.success) {
              setQuotes(prev => ({
                ...prev,
                [addAssetModal.watchlistId]: quotesData.data
              }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to refresh watchlist data:', err);
      }
    }
  };

  const toggleWatchlist = (watchlistId: string) => {
    setExpandedWatchlists(prev => ({
      ...prev,
      [watchlistId]: !prev[watchlistId]
    }));
  };

  const handleOpenCreateModal = () => {
    setCreateWatchlistModal(true);
    setNewWatchlistName('');
    setCreateError(null);
  };

  const handleCloseCreateModal = () => {
    setCreateWatchlistModal(false);
    setNewWatchlistName('');
    setCreateError(null);
  };

  const handleCreateAndProceed = async () => {
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
        setWatchlists(prev => [data.data, ...prev]);
        
        // Close create modal
        setCreateWatchlistModal(false);
        setNewWatchlistName('');
        
        // Open add assets modal with the new watchlist
        setAddAssetModal({
          isOpen: true,
          watchlistId: data.data.id,
          watchlistName: data.data.name
        });
      } else {
        const errorMessage = data.error || 'Failed to create watchlist';
        setCreateError(errorMessage);
      }
    } catch (err) {
      const errorMessage = 'Failed to create watchlist';
      setCreateError(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteWatchlist = async () => {
    if (!deletingWatchlist) return;

    try {
      setDeleteLoading(true);
      
      const response = await fetch(`/api/watchlist/${deletingWatchlist.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove from local state
        setWatchlists(prev => prev.filter(w => w.id !== deletingWatchlist.id));
        setDeletingWatchlist(null);
      } else {
        // Error is handled by the API response
        console.error('Failed to delete watchlist:', data.error);
      }
    } catch (err) {
      console.error('Failed to delete watchlist:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${formatCurrency(value)}`;
  };

  const getChangeColor = (value: number | null) => {
    if (value === null || value === 0) {
      return 'text-gray-500 dark:text-gray-400';
    }
    return value > 0 
      ? 'text-emerald-600 dark:text-emerald-500' 
      : 'text-rose-800 dark:text-rose-500';
  };

  const filteredWatchlists = watchlists.filter(watchlist => 
    watchlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    watchlist.items.some(item => 
      item.asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-4">Watchlists</h5>
        <p className="text-gray-500 text-center py-8">Please log in to view your watchlists</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-4">Watchlists</h5>
        <div className="flex items-center justify-center py-8">
          <Icon icon={CircleNotchIcon} size="lg" className="animate-spin text-gray-800 dark:text-gray-100" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading watchlists...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-4">Watchlists</h5>
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Error loading watchlists</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">Watchlists</h5>
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon={MagnifyingGlassIcon} size="sm" className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-48"
            />
          </div>
          
          {/* Add new watchlist button */}
          <button
            onClick={handleOpenCreateModal}
            className="bg-gray-800 text-white px-3 py-1.5 text-sm rounded-md hover:bg-gray-700 hover:dark:bg-gray-600 transition-colors"
          >
            + Add new watchlist
          </button>
        </div>
      </div>

      {/* Watchlists */}
      {filteredWatchlists.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'No watchlists match your search' : 'No watchlists created yet'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Your First Watchlist
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWatchlists.map((watchlist) => {
            const isExpanded = expandedWatchlists[watchlist.id];
            const watchlistQuotes = quotes[watchlist.id] || [];
            
            return (
              <div key={watchlist.id} className=" overflow-hidden">
                {/* Watchlist Header */}
                <div
                  onClick={() => toggleWatchlist(watchlist.id)}
                  className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      icon={CaretRightIcon}
                      size="sm"
                      className={`text-gray-500 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                    />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{watchlist.name}</span>
                    <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                      {watchlist.itemCount}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddAssetModal({
                          isOpen: true,
                          watchlistId: watchlist.id,
                          watchlistName: watchlist.name
                        });
                      }}
                      className="text-sm text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 rounded-md px-4 py-2 hover:bg-gray-400 hover:dark:bg-gray-800 transition-colors cursor-pointer"
                    >
                      + Add / Remove Assets
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingWatchlist({
                          id: watchlist.id,
                          name: watchlist.name
                        });
                      }}
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-rose-400 dark:hover:bg-rose-900/80 hover:text-white rounded transition-colors"
                      title="Delete watchlist"
                    >
                      <Icon icon={TrashIcon} size="sm" />
                    </button>
                  </div>
                </div>

                {/* Watchlist Content */}
                {isExpanded && watchlist.items.length > 0 && (
                  <div className="bg-white dark:bg-gray-800">
                    {/* Table Header */}
                    <div className="grid grid-cols-7 gap-4 px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <div>Ticker</div>
                      <div className="text-left">Shares</div>
                      <div className="text-left">Last Price</div>
                      <div className="text-left">Open</div>
                      <div className="text-left">Beta</div>
                      <div className="text-left">Change</div>
                      <div className="text-left">% Change</div>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y dark:divide-neutral-700">
                      {watchlist.items.map((item) => {
                        const quote = watchlistQuotes.find(q => q.watchlistItemId === item.id);
                        const quoteData = quote?.quote;
                        const userShares = holdings[item.asset.ticker];
                        
                        return (
                          <Link
                            key={item.id}
                            href={`/asset/${item.asset.ticker}`}
                            className="grid grid-cols-7 gap-4 px-4 py-3 hover:bg-gray-50 hover:dark:bg-gray-700 transition-colors cursor-pointer"
                          >
                            {/* Ticker with Logo */}
                            <div className="flex items-center">
                              
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">{item.asset.ticker}</div>
                                <div className="text-xs text-gray-500 truncate max-w-20">{item.asset.name}</div>
                              </div>
                            </div>

                            {/* Shares */}
                            <div className="text-left text-sm text-gray-900 dark:text-gray-100">
                              {userShares ? userShares.toLocaleString() : '—'}
                            </div>

                            {/* Last Price */}
                            <div className="text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                              {quoteData ? formatCurrency(quoteData.regularMarketPrice) : '—'}
                            </div>

                            {/* Open */}
                            <div className="text-left text-sm text-gray-900 dark:text-gray-100">
                              {quoteData?.regularMarketOpen ? formatCurrency(quoteData.regularMarketOpen) : '—'}
                            </div>

                            {/* Beta */}
                            <div className="text-left text-sm text-gray-900 dark:text-gray-100">
                              {quoteData?.beta ? quoteData.beta.toFixed(2) : '—'}
                            </div>

                            {/* Change */}
                            <div className={`text-left text-sm font-medium ${
                              getChangeColor(quoteData?.regularMarketChange || null)
                            }`}>
                              {quoteData?.regularMarketChange !== null && quoteData?.regularMarketChange !== undefined
                                ? formatChange(quoteData.regularMarketChange) 
                                : '—'
                              }
                            </div>

                            {/* % Change */}
                            <div className={`text-left text-sm font-medium ${
                              getChangeColor(quoteData?.regularMarketChangePercent || null)
                            }`}>
                              {quoteData?.regularMarketChangePercent !== null && quoteData?.regularMarketChangePercent !== undefined
                                ? formatPercentage(quoteData.regularMarketChangePercent) 
                                : '—'
                              }
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty State for Expanded Watchlist */}
                {isExpanded && watchlist.items.length === 0 && (
                  <div className="bg-white dark:bg-gray-700 px-4 py-8 text-center border-t border-gray-200">
                    <p className="text-gray-500 mb-3">No assets in this watchlist yet</p>
                    <button
                      onClick={() => setAddAssetModal({
                        isOpen: true,
                        watchlistId: watchlist.id,
                        watchlistName: watchlist.name
                      })}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Add your first asset
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Watchlist Modal */}
      {createWatchlistModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
            onClick={handleCloseCreateModal}
          />
          
          {/* Full Screen Modal */}
          <div className="relative h-full w-full bg-white dark:bg-gray-900 flex items-center justify-center">
            {/* Centered Content */}
            <div className="max-w-2xl w-full mx-auto px-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
                  Create New Watchlist
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
                  Give your watchlist a name to get started
                </p>

                {/* Input */}
                <div className="mb-6">
                  <label htmlFor="watchlist-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Watchlist Name
                  </label>
                  <input
                    type="text"
                    id="watchlist-name"
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !createLoading && newWatchlistName.trim()) {
                        handleCreateAndProceed();
                      }
                    }}
                    placeholder="e.g., Tech Stocks, Dividend Portfolio, Growth Picks..."
                    className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
                    autoFocus
                    disabled={createLoading}
                  />
                </div>

                {/* Error Message */}
                {createError && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">{createError}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleCreateAndProceed}
                    disabled={createLoading || !newWatchlistName.trim()}
                    className="w-full px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {createLoading ? (
                      <>
                        <Icon icon={CircleNotchIcon} size="md" className="animate-spin -ml-1 mr-3 text-white" />
                        Creating...
                      </>
                    ) : (
                      'Confirm and Proceed to Add Assets'
                    )}
                  </button>
                  <button
                    onClick={handleCloseCreateModal}
                    disabled={createLoading}
                    className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingWatchlist && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
            onClick={() => !deleteLoading && setDeletingWatchlist(null)}
          />
          
          {/* Modal */}
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">Delete Watchlist</h5>
              </div>
              
              {/* Content */}
              <div className="px-6 py-4">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="flex-shrink-0 h-10 w-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                    <Icon icon={TrashIcon} size="md" className="text-red-600 dark:text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {deletingWatchlist.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Are you sure you want to delete this watchlist? All assets in this watchlist will be removed. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setDeletingWatchlist(null)}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteWatchlist}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  {deleteLoading ? (
                    <>
                      <Icon icon={CircleNotchIcon} size="sm" className="animate-spin -ml-1 mr-2 text-white" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Watchlist'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      <AddAssetToWatchlistModal
        isOpen={addAssetModal.isOpen}
        onClose={() => setAddAssetModal({ isOpen: false, watchlistId: '', watchlistName: '' })}
        watchlistId={addAssetModal.watchlistId}
        watchlistName={addAssetModal.watchlistName}
        onSuccess={handleAddAssetSuccess}
      />
    </div>
  );
}