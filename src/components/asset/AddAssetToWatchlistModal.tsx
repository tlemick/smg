'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { CompanyLogo } from '@/components/ui';
import { ArrowUUpLeftIcon, CheckIcon, CircleNotchIcon, ClipboardIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon, XIcon } from '@/components/ui';

interface SearchResult {
  symbol?: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
  exchange?: string;
}

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

interface AddAssetToWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlistId: string;
  watchlistName: string;
  onSuccess?: (message: string) => void;
}

export function AddAssetToWatchlistModal({ 
  isOpen, 
  onClose, 
  watchlistId, 
  watchlistName,
  onSuccess 
}: AddAssetToWatchlistModalProps) {
  const { error: showErrorToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [removingItem, setRemovingItem] = useState<string | null>(null);

  // Fetch watchlist items when modal opens
  useEffect(() => {
    if (isOpen && watchlistId) {
      fetchWatchlistItems();
    }
  }, [isOpen, watchlistId]);

  // Clear state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
    }
  }, [isOpen]);

  const fetchWatchlistItems = async () => {
    try {
      setLoadingItems(true);
      const response = await fetch(`/api/watchlist?include=items`);
      const data = await response.json();
      
      if (data.success) {
        const watchlist = data.data.find((w: any) => w.id === watchlistId);
        if (watchlist && watchlist.items) {
          setWatchlistItems(watchlist.items);
        }
      }
    } catch (err) {
      console.error('Failed to fetch watchlist items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      setSearching(true);
      setError(null);

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          quotesCount: 8,
          newsCount: 0
        }),
      });

      const data = await response.json();

      if (data.success && data.data.quotes) {
        // Filter out invalid results and add safety checks
        const validResults = data.data.quotes.filter((result: any) => 
          result && result.symbol && (result.longname || result.shortname)
        );
        setSearchResults(validResults);
        if (validResults.length === 0) {
          setError('No valid assets found');
        }
      } else {
        setSearchResults([]);
        setError('No assets found');
      }
    } catch (err) {
      const errorMessage = 'Search failed. Please try again.';
      setError(errorMessage);
      showErrorToast(errorMessage);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddAsset = async (ticker: string, name: string) => {
    try {
      setAdding(ticker);
      setError(null);

      const response = await fetch(`/api/watchlist/${watchlistId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: ticker.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove the added item from search results
        setSearchResults(prev => prev.filter(r => r.symbol !== ticker));
        // Refresh watchlist items
        await fetchWatchlistItems();
      } else {
        const errorMessage = data.error || 'Failed to add to watchlist';
        setError(errorMessage);
        showErrorToast(errorMessage);
      }
    } catch (err) {
      const errorMessage = 'Failed to add to watchlist';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setAdding(null);
    }
  };

  const handleRemoveAsset = async (itemId: string, ticker: string) => {
    try {
      setRemovingItem(itemId);
      
      const response = await fetch(`/api/watchlist/${watchlistId}/items/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Refresh watchlist items
        await fetchWatchlistItems();
      } else {
        const errorMessage = data.error || 'Failed to remove from watchlist';
        showErrorToast(errorMessage);
      }
    } catch (err) {
      const errorMessage = 'Failed to remove from watchlist';
      showErrorToast(errorMessage);
    } finally {
      setRemovingItem(null);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Full Screen Modal */}
      <div className="relative h-full w-full bg-white dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-500 dark:border-gray-700 bg-gray-200 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold leading-none -mb-2 text-gray-900 dark:text-gray-100">
                {watchlistName}
              </h4>
              <p className="text-sm leading-none -mt-4 !mb-0 text-gray-600 dark:text-gray-400">
                Manage assets in your watchlist
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-black dark:text-white bg-gray-400 dark:bg-gray-700 rounded-md px-4 py-2 flex flex-row items-center gap-2 hover:bg-gray-500 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowUUpLeftIcon className="h-6 w-6" />
              Return to Dashboard
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Section - Current Watchlist Items */}
          <div className="w-1/3 border-r border-gray-500 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-normal leading-none text-gray-900 dark:text-gray-100">
                  Current Assets
                </h4>
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-full">
                  {watchlistItems.length}
                </span>
              </div>

              {loadingItems ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-100"></div>
                </div>
              ) : watchlistItems.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <h4 className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100">No assets yet</h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Search and add assets to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {watchlistItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <CompanyLogo 
                          ticker={item.asset.ticker}
                          logoUrl={item.asset.logoUrl}
                          size="md"
                          className="flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-4">
                            <p className="text-base !mb-0 font-bold text-gray-900 dark:text-gray-100">
                              {item.asset.ticker}
                            </p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                              {item.asset.type}
                            </span>
                          </div>
                          <p className="text-sm !mb-0 text-gray-600 dark:text-gray-400 truncate">
                            {item.asset.name}
                          </p>
                          
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAsset(item.id, item.asset.ticker)}
                        disabled={removingItem === item.id}
                        className="ml-4 flex flex-row items-center p-2 gap-2 text-sm text-gray-900 dark:text-white hover:bg-rose-400 bg-gray-300 dark:bg-gray-700 dark:hover:bg-rose-900/80 rounded-md transition-colors disabled:opacity-50"
                        title="Remove from watchlist"
                      >
                        {removingItem === item.id ? (
                          <CircleNotchIcon className="animate-spin h-5 w-5" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Search and Add Assets */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Search for Assets
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Find and add stocks, bonds, ETFs, and mutual funds to your watchlist
              </p>

              {/* Search Input */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ticker symbol or company name (e.g., AAPL, Apple)"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
                    autoFocus
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Search Results */}
              <div>
                {searching && (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Searching...</span>
                  </div>
                )}

                {!searching && searchQuery.length > 0 && searchResults.length === 0 && !error && (
                  <div className="text-center py-16">
                    <MagnifyingGlassIcon className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
                    <h4 className="mt-4 text-base font-medium text-gray-900 dark:text-gray-100">No results found</h4>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Try searching with a different term</p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    {/* <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Search Results
                    </h4> */}
                    {searchResults.map((result) => {
                      const symbol = result.symbol || 'N/A';
                      const name = result.longname || result.shortname || 'Unknown';
                      const quoteType = result.quoteType || 'Unknown';
                      const isInWatchlist = watchlistItems.some(item => item.asset.ticker === symbol);
                      
                      return (
                        <div
                          key={symbol}
                          className="flex items-center justify-between p-5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-4">
                              <CompanyLogo 
                                ticker={symbol}
                                size="lg"
                                className="flex-shrink-0"
                              />
                              <div className="min-w-0 items-centerflex-1">
                                <div className="flex flex-row items-center space-x-2">
                                  <p className="text-lg !mb-0 font-semibold text-gray-900 dark:text-gray-100">
                                    {symbol}
                                  </p>
                                  <div className="flex items-center space-x-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                    {quoteType}
                                  </span>
                                  {result.exchange && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {result.exchange}
                                    </span>
                                  )}
                                </div>
                                </div>
                                <p className="text-sm !mb-0 text-gray-600 dark:text-gray-400 truncate">
                                  {name}
                                </p>
                                
                              </div>
                            </div>
                          </div>

                          <div className="flex-shrink-0 ml-4">
                            {isInWatchlist ? (
                              <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <CheckIcon className="h-4 w-4 mr-2" />
                                Added
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddAsset(symbol, name)}
                                disabled={adding === symbol}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {adding === symbol ? (
                                  <>
                                    <CircleNotchIcon className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add to Watchlist
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {!searching && searchQuery.length === 0 && (
                  <div className="text-center py-16">
                    <MagnifyingGlassIcon className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
                    <h4 className="mt-4 text-base font-medium text-gray-900 dark:text-gray-100">Search for assets</h4>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Start typing to search for stocks, ETFs, bonds, and mutual funds
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 