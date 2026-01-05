'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { CompanyLogo, Input, Button } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { AddAssetToWatchlistModal } from '@/components/asset';
import { CaretRightIcon, CircleNotchIcon, Icon, MagnifyingGlassIcon, TrashIcon, DotsThreeOutlineVerticalIcon, PencilSimpleIcon } from '@/components/ui';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const router = useRouter();
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

  // Reusable function to fetch all watchlist data
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
        if (!watchlist.items || watchlist.items.length === 0) return { watchlistId: watchlist.id, quotes: [] };
        
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

  // Fetch watchlists and related data on mount and when user changes
  useEffect(() => {
    fetchWatchlistData();
  }, [user]);

  // Refresh watchlist data after adding assets (modal stays open so users can add multiple assets)
  const handleAddAssetSuccess = async (message: string) => {
    // Note: We don't need to do anything here since the AddAssetToWatchlistModal
    // has its own internal state management and will refresh when needed.
    // The main refresh happens when the modal closes via the onClose handler.
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
        // Add the new watchlist to the list with items initialized as empty array
        const newWatchlist = {
          ...data.data,
          items: data.data.items || [],
          itemCount: data.data.itemCount || 0
        };
        setWatchlists(prev => [newWatchlist, ...prev]);
        
        // Close create modal
        setCreateWatchlistModal(false);
        setNewWatchlistName('');
        
        // Open add assets modal with the new watchlist
        setAddAssetModal({
          isOpen: true,
          watchlistId: newWatchlist.id,
          watchlistName: newWatchlist.name
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
      return 'text-muted-foreground';
    }
    return value > 0 
      ? 'text-chart-positive' 
      : 'text-chart-negative';
  };

  const filteredWatchlists = watchlists.filter(watchlist => 
    watchlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (watchlist.items && watchlist.items.some(item => 
      item.asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  if (!user) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h5 className="text-xs font-bold text-foreground mb-4">Watchlists</h5>
        <p className="text-muted-foreground text-center py-8">Please log in to view your watchlists</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card pt-16">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h5 className="text-xs font-bold text-foreground mb-4">Watchlists</h5>
        <div className="text-center py-8">
          <p className="text-destructive mb-2">Error loading watchlists</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card pt-16">
      {/* Header */}
     
      <div className="flex flex-col justify-start gap-4">
        <h1 className="text-2xl font-mono text-foreground">Watchlists</h1>
        <div className='flex items-center gap-4'>
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon icon={MagnifyingGlassIcon} size="sm" className="text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Filter"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-8 text-sm"
              />
            </div>
            
            {/* Add new watchlist button */}
            <Button
              onClick={handleOpenCreateModal}
              size="sm"
              className="text-sm"
              variant="outline"
            >
              + New
            </Button>
          </div>
        </div>
      </div>

      {/* Watchlists */}
      {filteredWatchlists.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'No watchlists match your search' : 'No watchlists created yet'}
          </p>
          {!searchTerm && (
            <Button
              onClick={handleOpenCreateModal}
              variant="default"
            >
              Create Your First Watchlist
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWatchlists.map((watchlist) => {
            const isExpanded = expandedWatchlists[watchlist.id];
            const watchlistQuotes = quotes[watchlist.id] || [];
            
            return (
              <Collapsible
                key={watchlist.id}
                open={isExpanded}
                onOpenChange={() => toggleWatchlist(watchlist.id)}
                className="overflow-hidden"
              >
                <CollapsibleTrigger asChild>
                  {/* px-4 py-3 = 16px/12px (4/3 units), space-x-3 = 12px (3 units) */}
                  <div className="w-full py-3 border-b border-muted-foreground flex items-center transition-colors cursor-pointer">
                    <Icon
                      icon={CaretRightIcon}
                      size="sm"
                      className={`text-muted-foreground transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                    />
                    <span className="font-medium text-foreground ml-3">{watchlist.name}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-3"
                        >
                          <Icon icon={DotsThreeOutlineVerticalIcon} size="lg" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddAssetModal({
                              isOpen: true,
                              watchlistId: watchlist.id,
                              watchlistName: watchlist.name
                            });
                          }}
                        >
                          <Icon icon={PencilSimpleIcon} size="sm" className="mr-2" />
                          Manage Assets
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingWatchlist({
                              id: watchlist.id,
                              name: watchlist.name
                            });
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Icon icon={TrashIcon} size="sm" className="mr-2" />
                          Delete Watchlist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  {watchlist.items && watchlist.items.length > 0 ? (
                    <div className="bg-card rounded-b-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[140px]">Ticker</TableHead>
                            <TableHead className="text-left">Shares</TableHead>
                            <TableHead className="text-left">Last Price</TableHead>
                            <TableHead className="text-left">Open</TableHead>
                            <TableHead className="text-left">Beta</TableHead>
                            <TableHead className="text-left">Change</TableHead>
                            <TableHead className="text-left">% Change</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {watchlist.items.map((item) => {
                            const quote = watchlistQuotes.find(q => q.watchlistItemId === item.id);
                            const quoteData = quote?.quote;
                            const userShares = holdings[item.asset.ticker];
                            
                            return (
                              <TableRow 
                                key={item.id}
                                onClick={() => router.push(`/asset/${item.asset.ticker}`)}
                                className="cursor-pointer"
                              >
                                <TableCell className="w-[140px]">
                                  <div>
                                    <div className="font-medium">{item.asset.ticker}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-20">{item.asset.name}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-left">
                                  {userShares ? userShares.toLocaleString() : '—'}
                                </TableCell>
                                <TableCell className="text-left font-medium">
                                  {quoteData ? formatCurrency(quoteData.regularMarketPrice) : '—'}
                                </TableCell>
                                <TableCell className="text-left">
                                  {quoteData?.regularMarketOpen ? formatCurrency(quoteData.regularMarketOpen) : '—'}
                                </TableCell>
                                <TableCell className="text-left">
                                  {quoteData?.beta ? quoteData.beta.toFixed(2) : '—'}
                                </TableCell>
                                <TableCell className={`text-left font-medium ${getChangeColor(quoteData?.regularMarketChange || null)}`}>
                                  {quoteData?.regularMarketChange !== null && quoteData?.regularMarketChange !== undefined
                                    ? formatChange(quoteData.regularMarketChange) 
                                    : '—'
                                  }
                                </TableCell>
                                <TableCell className={`text-left font-medium ${getChangeColor(quoteData?.regularMarketChangePercent || null)}`}>
                                  {quoteData?.regularMarketChangePercent !== null && quoteData?.regularMarketChangePercent !== undefined
                                    ? formatPercentage(quoteData.regularMarketChangePercent) 
                                    : '—'
                                  }
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="bg-card px-4 py-8 text-center border-t border-border rounded-b-md">
                      <p className="text-muted-foreground mb-3">No assets in this watchlist yet</p>
                      <Button
                        variant="link"
                        onClick={() => setAddAssetModal({
                          isOpen: true,
                          watchlistId: watchlist.id,
                          watchlistName: watchlist.name
                        })}
                      >
                        Add your first asset
                      </Button>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Create Watchlist Modal */}
      <Dialog open={createWatchlistModal} onOpenChange={setCreateWatchlistModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-mono">Create New Watchlist</DialogTitle>
            <DialogDescription>
              Give your watchlist a name to get started
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="watchlist-name" className="text-sm font-medium">
                Watchlist Name
              </label>
              <Input
                id="watchlist-name"
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !createLoading && newWatchlistName.trim()) {
                    handleCreateAndProceed();
                  }
                }}
                placeholder="e.g., Tech Stocks, Dividend Portfolio, Growth Picks..."
                autoFocus
                disabled={createLoading}
              />
            </div>

            {createError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{createError}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleCreateAndProceed}
              disabled={createLoading || !newWatchlistName.trim()}
              className="w-full"
            >
              {createLoading ? (
                <>
                  <Icon icon={CircleNotchIcon} size="md" className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Confirm and Proceed to Add Assets'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCloseCreateModal}
              disabled={createLoading}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingWatchlist} onOpenChange={(open) => !open && !deleteLoading && setDeletingWatchlist(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Watchlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingWatchlist?.name}"? All assets in this watchlist will be removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-start space-x-3 py-4">
            <div className="flex-shrink-0 h-10 w-10 bg-destructive/10 rounded-lg flex items-center justify-center">
              <Icon icon={TrashIcon} size="md" className="text-destructive" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-medium mb-1">
                {deletingWatchlist?.name}
              </h4>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingWatchlist(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWatchlist}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Icon icon={CircleNotchIcon} size="sm" className="animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Watchlist'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Asset Modal */}
      <AddAssetToWatchlistModal
        isOpen={addAssetModal.isOpen}
        onClose={() => {
          setAddAssetModal({ isOpen: false, watchlistId: '', watchlistName: '' });
          // Refresh data when modal closes to ensure dashboard is up to date
          fetchWatchlistData();
        }}
        watchlistId={addAssetModal.watchlistId}
        watchlistName={addAssetModal.watchlistName}
        onSuccess={handleAddAssetSuccess}
      />
    </div>
  );
}