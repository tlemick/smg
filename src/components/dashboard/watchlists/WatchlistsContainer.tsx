'use client';

import { useState, useMemo } from 'react';
import { useUser } from '@/context/UserContext';
import { useWatchlists } from '@/hooks/useWatchlists';
import { useWatchlistMutations } from '@/hooks/useWatchlistMutations';
import { Button } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { AddAssetToWatchlistModal } from '@/components/asset';
import { WatchlistHeader } from './WatchlistHeader';
import { WatchlistItem } from './WatchlistItem';
import { CreateWatchlistModal, DeleteWatchlistModal } from './WatchlistModals';

export function WatchlistsContainer() {
  const { user } = useUser();
  const {
    watchlists,
    quotes,
    holdings,
    isLoading,
    error,
    refresh,
  } = useWatchlists();
  const {
    createWatchlist,
    deleteWatchlist,
    isCreating,
    isDeleting,
    error: mutationError,
  } = useWatchlistMutations();

  // Local UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedWatchlists, setExpandedWatchlists] = useState<Record<string, boolean>>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [deletingWatchlist, setDeletingWatchlist] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [addAssetModal, setAddAssetModal] = useState<{
    isOpen: boolean;
    watchlistId: string;
    watchlistName: string;
  }>({
    isOpen: false,
    watchlistId: '',
    watchlistName: '',
  });

  // Auto-expand all watchlists when loaded
  useMemo(() => {
    if (watchlists.length > 0 && Object.keys(expandedWatchlists).length === 0) {
      const expandedState: Record<string, boolean> = {};
      watchlists.forEach((watchlist) => {
        expandedState[watchlist.id] = true;
      });
      setExpandedWatchlists(expandedState);
    }
  }, [watchlists, expandedWatchlists]);

  // Filter watchlists by search term
  const filteredWatchlists = useMemo(
    () =>
      watchlists.filter(
        (watchlist) =>
          watchlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (watchlist.items &&
            watchlist.items.some(
              (item) =>
                item.asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.asset.name.toLowerCase().includes(searchTerm.toLowerCase())
            ))
      ),
    [watchlists, searchTerm]
  );

  const toggleWatchlist = (watchlistId: string) => {
    setExpandedWatchlists((prev) => ({
      ...prev,
      [watchlistId]: !prev[watchlistId],
    }));
  };

  const handleOpenCreateModal = () => {
    setCreateModalOpen(true);
    setNewWatchlistName('');
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    setNewWatchlistName('');
  };

  const handleCreateAndProceed = async () => {
    const newWatchlist = await createWatchlist(newWatchlistName);

    if (newWatchlist) {
      // Close create modal
      setCreateModalOpen(false);
      setNewWatchlistName('');

      // Refresh watchlists to get the new one
      await refresh();

      // Open add assets modal with the new watchlist
      setAddAssetModal({
        isOpen: true,
        watchlistId: newWatchlist.id,
        watchlistName: newWatchlist.name,
      });
    }
  };

  const handleDeleteWatchlist = async () => {
    if (!deletingWatchlist) return;

    const success = await deleteWatchlist(deletingWatchlist.id);

    if (success) {
      setDeletingWatchlist(null);
      // Refresh to update the list
      await refresh();
    }
  };

  // Loading state
  if (!user) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h5 className="text-xs font-bold text-foreground mb-4">Watchlists</h5>
        <p className="text-muted-foreground text-center py-8">
          Please log in to view your watchlists
        </p>
      </div>
    );
  }

  if (isLoading) {
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
      <WatchlistHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCreateNew={handleOpenCreateModal}
      />

      {/* Watchlists */}
      {filteredWatchlists.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'No watchlists match your search' : 'No watchlists created yet'}
          </p>
          {!searchTerm && (
            <Button onClick={handleOpenCreateModal} variant="default">
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
              <WatchlistItem
                key={watchlist.id}
                watchlist={watchlist}
                quotes={watchlistQuotes}
                holdings={holdings}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleWatchlist(watchlist.id)}
                onManageAssets={() =>
                  setAddAssetModal({
                    isOpen: true,
                    watchlistId: watchlist.id,
                    watchlistName: watchlist.name,
                  })
                }
                onDelete={() =>
                  setDeletingWatchlist({
                    id: watchlist.id,
                    name: watchlist.name,
                  })
                }
              />
            );
          })}
        </div>
      )}

      {/* Create Watchlist Modal */}
      <CreateWatchlistModal
        isOpen={createModalOpen}
        onClose={handleCloseCreateModal}
        newName={newWatchlistName}
        onNameChange={setNewWatchlistName}
        onCreate={handleCreateAndProceed}
        isCreating={isCreating}
        error={mutationError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteWatchlistModal
        watchlistName={deletingWatchlist?.name || null}
        isOpen={!!deletingWatchlist}
        onClose={() => setDeletingWatchlist(null)}
        onConfirm={handleDeleteWatchlist}
        isDeleting={isDeleting}
      />

      {/* Add Asset Modal */}
      <AddAssetToWatchlistModal
        isOpen={addAssetModal.isOpen}
        onClose={() => {
          setAddAssetModal({ isOpen: false, watchlistId: '', watchlistName: '' });
          // Refresh data when modal closes to ensure dashboard is up to date
          refresh();
        }}
        watchlistId={addAssetModal.watchlistId}
        watchlistName={addAssetModal.watchlistName}
        onSuccess={() => {
          // Refresh on success
          refresh();
        }}
      />
    </div>
  );
}
