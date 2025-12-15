'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { MainNavigation } from '@/components/navigation';
import { Section, Container } from '@/components/layout';
import { getZIndexClass } from '@/lib/z-index';

interface Watchlist {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function WatchlistsPage() {
  const { user, isLoading } = useUser();
  const { success, error: showErrorToast } = useToast();
  const router = useRouter();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingWatchlist, setDeletingWatchlist] = useState<Watchlist | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);

  // Fetch user's watchlists
  useEffect(() => {
    const fetchWatchlists = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch('/api/watchlist');
        const data = await response.json();

        if (data.success) {
          setWatchlists(data.data);
        } else {
          setError(data.error || 'Failed to load watchlists');
        }
      } catch (err) {
        setError('Failed to load watchlists');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlists();
  }, [user]);

  // Show loading while checking authentication
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="text-lg text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

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
        setWatchlists(prev => [data.data, ...prev]);
        success(`Created watchlist "${data.data.name}"`);
        handleCloseModal();
        // Optionally navigate to the new watchlist
        router.push(`/watchlists/${data.data.id}`);
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

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <MainNavigation />

      <Section spacing="lg">
        <Container>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">
              Your Watchlists
            </h1>
            <p className="text-neutral-600">
              Track your favorite stocks and monitor their performance
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading watchlists...</span>
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

          {/* Watchlists Content */}
          {!loading && !error && (
            <>
              {watchlists.length === 0 ? (
                /* Empty State */
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-neutral-900">No watchlists</h3>
                  <p className="mt-1 text-sm text-neutral-600">Get started by creating your first watchlist.</p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleCreateWatchlist}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gr-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Watchlist
                    </button>
                  </div>
                </div>
              ) : (
                /* Watchlists Grid */
                <div className="space-y-6">
                  {/* Create New Watchlist Button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateWatchlist}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Watchlist
                    </button>
                  </div>

                  {/* Watchlists Grid */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {watchlists.map((watchlist) => (
                      <div
                        key={watchlist.id}
                        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                              </div>
                              <div className="ml-5">
                                <div className="text-sm font-medium text-neutral-500 truncate">Watchlist</div>
                                <Link href={`/watchlists/${watchlist.id}`} className="text-lg font-semibold text-neutral-900 hover:text-blue-600">
                                  {watchlist.name}
                                </Link>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDeletingWatchlist(watchlist)}
                              className="text-neutral-400 hover:text-red-600"
                              title="Delete watchlist"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-neutral-600">
                                {watchlist.itemCount} {watchlist.itemCount === 1 ? 'stock' : 'stocks'}
                              </span>
                              <span className="text-sm text-neutral-600">
                                {new Date(watchlist.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Container>
      </Section>

      {/* Create Watchlist Modal */}
      {isCreateModalOpen && (
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 ${getZIndexClass('modalBackdrop')}`}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Create New Watchlist</h3>
            </div>
            
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
                  placeholder="Enter watchlist name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  disabled={createLoading}
                />
              </div>

              {createError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{createError}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={createLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !newWatchlistName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Watchlist'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Watchlist Confirmation Dialog */}
      {deletingWatchlist && (
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 ${getZIndexClass('modalBackdrop')}`}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Delete Watchlist</h3>
            </div>
            {/* Content */}
            <div className="px-6 py-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{deletingWatchlist.name}</h4>
                  <p className="text-sm text-gray-600">{deletingWatchlist.itemCount} {deletingWatchlist.itemCount === 1 ? 'stock' : 'stocks'}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">Are you sure you want to delete this watchlist? This will remove all items in it. This action cannot be undone.</p>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingWatchlist(null)}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!deletingWatchlist) return;
                  try {
                    setDeleteLoading(true);
                    const response = await fetch(`/api/watchlist/${deletingWatchlist.id}`, { method: 'DELETE' });
                    const data = await response.json();
                    if (data.success) {
                      setWatchlists(prev => prev.filter(w => w.id !== deletingWatchlist.id));
                      success('Watchlist deleted');
                      setDeletingWatchlist(null);
                    } else {
                      showErrorToast(data.error || 'Failed to delete watchlist');
                    }
                  } catch (e) {
                    showErrorToast('Failed to delete watchlist');
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 