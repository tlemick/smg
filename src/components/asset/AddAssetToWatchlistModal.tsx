'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { CompanyLogo, Button, Badge, Input, Icon } from '@/components/ui';
import { ArrowUUpLeftIcon, CheckIcon, CircleNotchIcon, ClipboardIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon, XIcon } from '@/components/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* Full Screen Modal */}
      <div className="relative h-full w-full bg-background flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold text-foreground">
                {watchlistName}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Manage assets in your watchlist
              </p>
            </div>
            <Button
              onClick={handleClose}
              variant="outline"
              className="gap-2"
            >
              <Icon icon={ArrowUUpLeftIcon} size="sm" />
              Return to Dashboard
            </Button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Section - Current Watchlist Items */}
          <div className="w-1/3 border-r border-border bg-muted/30 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-foreground">
                  Current Assets
                </h4>
                <Badge variant="secondary">
                  {watchlistItems.length}
                </Badge>
              </div>

              {loadingItems ? (
                <div className="flex items-center justify-center py-12">
                  <Icon icon={CircleNotchIcon} size="lg" className="animate-spin text-muted-foreground" />
                </div>
              ) : watchlistItems.length === 0 ? (
                <div className="text-center py-12">
                  <Icon icon={ClipboardIcon} size="xl" className="mx-auto text-muted-foreground mb-3" />
                  <h4 className="text-sm font-medium text-foreground">No assets yet</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Search and add assets to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {watchlistItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-all"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <CompanyLogo 
                          ticker={item.asset.ticker}
                          logoUrl={item.asset.logoUrl}
                          size="md"
                          className="flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-base font-semibold text-foreground">
                              {item.asset.ticker}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {item.asset.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {item.asset.name}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveAsset(item.id, item.asset.ticker)}
                        disabled={removingItem === item.id}
                        variant="destructive"
                        size="sm"
                        className="ml-4 gap-2"
                        title="Remove from watchlist"
                      >
                        {removingItem === item.id ? (
                          <>
                            <Icon icon={CircleNotchIcon} size="sm" className="animate-spin" />
                            Removing
                          </>
                        ) : (
                          <>
                            <Icon icon={TrashIcon} size="sm" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Search and Add Assets */}
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="p-8">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Search for Assets
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Find and add stocks, bonds, ETFs, and mutual funds to your watchlist
              </p>

              {/* Search Input */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon icon={MagnifyingGlassIcon} size="sm" className="text-muted-foreground" />
                  </div>
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ticker symbol or company name (e.g., AAPL, Apple)"
                    className="pl-12 h-11"
                    autoFocus
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Search Results */}
              <div>
                {searching && (
                  <div className="flex items-center justify-center py-16 gap-3">
                    <Icon icon={CircleNotchIcon} size="lg" className="animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Searching...</span>
                  </div>
                )}

                {!searching && searchQuery.length > 0 && searchResults.length === 0 && !error && (
                  <div className="text-center py-16">
                    <Icon icon={MagnifyingGlassIcon} size="xl" className="mx-auto text-muted-foreground mb-4" />
                    <h4 className="text-base font-medium text-foreground">No results found</h4>
                    <p className="mt-2 text-sm text-muted-foreground">Try searching with a different term</p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.map((result) => {
                      const symbol = result.symbol || 'N/A';
                      const name = result.longname || result.shortname || 'Unknown';
                      const quoteType = result.quoteType || 'Unknown';
                      const isInWatchlist = watchlistItems.some(item => item.asset.ticker === symbol);
                      
                      return (
                        <div
                          key={symbol}
                          className="flex items-center justify-between p-5 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-4">
                              <CompanyLogo 
                                ticker={symbol}
                                size="lg"
                                className="flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-row items-center gap-2">
                                  <p className="text-lg font-semibold text-foreground">
                                    {symbol}
                                  </p>
                                  <Badge variant="secondary" className="text-xs">
                                    {quoteType}
                                  </Badge>
                                  {result.exchange && (
                                    <span className="text-xs text-muted-foreground">
                                      {result.exchange}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate mt-0.5">
                                  {name}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex-shrink-0 ml-4">
                            {isInWatchlist ? (
                              <div className="inline-flex items-center px-4 py-2 text-sm font-medium bg-[hsl(var(--chart-positive))]/10 text-[hsl(var(--chart-positive))] border border-[hsl(var(--chart-positive))]/20 rounded-lg gap-2">
                                <Icon icon={CheckIcon} size="sm" />
                                Added
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleAddAsset(symbol, name)}
                                disabled={adding === symbol}
                                variant="default"
                                size="sm"
                                className="gap-2"
                              >
                                {adding === symbol ? (
                                  <>
                                    <Icon icon={CircleNotchIcon} size="sm" className="animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <Icon icon={PlusIcon} size="sm" />
                                    Add to Watchlist
                                  </>
                                )}
                              </Button>
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
                    <Icon icon={MagnifyingGlassIcon} size="xl" className="mx-auto text-muted-foreground mb-4" />
                    <h4 className="text-base font-medium text-foreground">Search for assets</h4>
                    <p className="mt-2 text-sm text-muted-foreground">
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