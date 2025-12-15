'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/hooks/useToast';
import { createModalClasses, createModalHandlers } from '@/lib/positioning';
import { CheckIcon, CircleNotchIcon, FileTextIcon, Icon, XIcon } from '@/components/ui';

interface Watchlist {
  id: string;
  name: string;
  itemCount: number;
  containsAsset: boolean;
  watchlistItemId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Asset {
  id: number;
  ticker: string;
  name: string;
  type: string;
  market: string | null;
  logoUrl: string | null;
}

interface WatchlistSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  assetName: string;
  onSuccess?: (message: string) => void;
}

export function WatchlistSelectionModal({ 
  isOpen, 
  onClose, 
  ticker, 
  assetName,
  onSuccess 
}: WatchlistSelectionModalProps) {
  const { success, error: showErrorToast } = useToast();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Create new watchlist states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch watchlists and asset info when modal opens
  useEffect(() => {
    if (!isOpen || !ticker) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/user/watchlists/for-asset/${ticker.toUpperCase()}`);
        const data = await response.json();

        if (data.success) {
          setWatchlists(data.data.watchlists);
          setAsset(data.data.asset);
          
          // Show create form if user has no watchlists
          if (data.data.watchlists.length === 0) {
            setShowCreateForm(true);
          }
        } else {
          setError(data.error || 'Failed to load watchlists');
        }
      } catch (err) {
        setError('Failed to load watchlists');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, ticker]);

  const handleAddToWatchlist = async (watchlistId: string, watchlistName: string) => {
    try {
      setActionLoading(watchlistId);
      
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
        // Update the watchlist to show it now contains the asset
        setWatchlists(prev => prev.map(w => 
          w.id === watchlistId 
            ? { ...w, containsAsset: true, watchlistItemId: data.data.id, itemCount: w.itemCount + 1 }
            : w
        ));
        
        const successMessage = `Added ${ticker.toUpperCase()} to "${watchlistName}"`;
        success(successMessage);
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
      setActionLoading(null);
    }
  };

  const handleRemoveFromWatchlist = async (watchlistId: string, watchlistItemId: string, watchlistName: string) => {
    try {
      setActionLoading(watchlistId);
      
      const response = await fetch(`/api/watchlist/${watchlistId}/items/${watchlistItemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Update the watchlist to show it no longer contains the asset
        setWatchlists(prev => prev.map(w => 
          w.id === watchlistId 
            ? { ...w, containsAsset: false, watchlistItemId: null, itemCount: w.itemCount - 1 }
            : w
        ));
        
        const successMessage = `Removed ${ticker.toUpperCase()} from "${watchlistName}"`;
        success(successMessage);
      } else {
        const errorMessage = data.error || 'Failed to remove from watchlist';
        setError(errorMessage);
        showErrorToast(errorMessage);
      }
    } catch (err) {
      const errorMessage = 'Failed to remove from watchlist';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWatchlistName.trim()) {
      setCreateError('Watchlist name is required');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      // Create the watchlist
      const createResponse = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newWatchlistName.trim(),
        }),
      });

      const createData = await createResponse.json();

      if (createData.success) {
        // Add the asset to the new watchlist
        const addResponse = await fetch(`/api/watchlist/${createData.data.id}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticker: ticker.toUpperCase(),
          }),
        });

        const addData = await addResponse.json();

        if (addData.success) {
          // Add the new watchlist to the list
          const newWatchlist: Watchlist = {
            id: createData.data.id,
            name: createData.data.name,
            itemCount: 1,
            containsAsset: true,
            watchlistItemId: addData.data.id,
            createdAt: createData.data.createdAt,
            updatedAt: createData.data.updatedAt,
          };
          
          setWatchlists(prev => [newWatchlist, ...prev]);
          setNewWatchlistName('');
          setShowCreateForm(false);
          
          const successMessage = `Created "${createData.data.name}" and added ${ticker.toUpperCase()}`;
          success(successMessage);
        } else {
          // Watchlist was created but adding asset failed
          setCreateError(addData.error || 'Watchlist created but failed to add asset');
        }
      } else {
        setCreateError(createData.error || 'Failed to create watchlist');
      }
    } catch (err) {
      setCreateError('Failed to create watchlist');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleClose = () => {
    setShowCreateForm(false);
    setNewWatchlistName('');
    setCreateError(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className={createModalClasses().backdrop} onClick={createModalHandlers(handleClose).backdropClick}>
      <div className={createModalClasses().container}>
      <div className={`${createModalClasses().content} max-h-[90vh] overflow-hidden`} onClick={createModalHandlers(handleClose).contentClick}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Add to Watchlist
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icon icon={XIcon} size="lg" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600 max-w-prose">
            {ticker.toUpperCase()} • {assetName}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Icon icon={CircleNotchIcon} size="lg" className="animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">Loading watchlists...</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* No watchlists state */}
              {watchlists.length === 0 && !showCreateForm && (
                <div className="text-center py-8">
                  <FileTextIcon size={48} className="mx-auto text-gray-400" />
                  <h4 className="mt-2 text-sm font-medium text-gray-900">No watchlists yet</h4>
                  <p className="mt-1 text-sm text-gray-500">Create your first watchlist to get started.</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Watchlist
                  </button>
                </div>
              )}

              {/* Create new watchlist form */}
              {showCreateForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Create New Watchlist</h4>
                  <form onSubmit={handleCreateWatchlist} className="space-y-3">
                    <input
                      type="text"
                      value={newWatchlistName}
                      onChange={(e) => setNewWatchlistName(e.target.value)}
                      placeholder="Enter watchlist name..."
                      className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      autoFocus
                      disabled={createLoading}
                    />
                    
                    {createError && (
                      <p className="text-sm text-red-600">{createError}</p>
                    )}

                    <div className="flex justify-end space-x-2">
                      {watchlists.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewWatchlistName('');
                            setCreateError(null);
                          }}
                          disabled={createLoading}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={createLoading || !newWatchlistName.trim()}
                        className="px-3 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-700 disabled:opacity-50"
                      >
                        {createLoading ? 'Creating...' : 'Create & Add'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Existing watchlists */}
              {watchlists.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">Your Watchlists</h4>
                    {!showCreateForm && (
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="text-sm text-gray-900 hover:text-gray-700"
                      >
                        Create New
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {watchlists.map((watchlist) => (
                      <div
                        key={watchlist.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {watchlist.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {watchlist.itemCount} {watchlist.itemCount === 1 ? 'stock' : 'stocks'}
                          </p>
                        </div>

                        <div className="flex-shrink-0 ml-3">
                          {watchlist.containsAsset ? (
                            <button
                              onClick={() => handleRemoveFromWatchlist(watchlist.id, watchlist.watchlistItemId!, watchlist.name)}
                              disabled={actionLoading === watchlist.id}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                              {actionLoading === watchlist.id ? (
                                <>
                                  <Icon icon={CircleNotchIcon} size="xs" className="animate-spin -ml-1 mr-1 text-gray-700" />
                                  Removing...
                                </>
                              ) : (
                                <>
                                  <Icon icon={CheckIcon} size="xs" className="mr-1" />
                                  Added
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAddToWatchlist(watchlist.id, watchlist.name)}
                              disabled={actionLoading === watchlist.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-50"
                            >
                              {actionLoading === watchlist.id ? (
                                <>
                                  <Icon icon={CircleNotchIcon} size="xs" className="animate-spin -ml-1 mr-1 text-white" />
                                  Adding...
                                </>
                              ) : (
                                'Add'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="w-full inline-flex justify-center px-4 py-2 border text-sm font-medium rounded-md text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
          >
            Done
          </button>
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
} 