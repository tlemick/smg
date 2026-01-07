import { useState, useCallback } from 'react';
import { ApiClient, ApiError } from '@/lib/api';
import { WatchlistDetailed } from '@/types';

interface UseWatchlistMutationsReturn {
  createWatchlist: (name: string) => Promise<WatchlistDetailed | null>;
  deleteWatchlist: (id: string) => Promise<boolean>;
  isCreating: boolean;
  isDeleting: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Custom hook for watchlist mutations (create, delete)
 * Handles loading states and error handling for mutations
 */
export function useWatchlistMutations(): UseWatchlistMutationsReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createWatchlist = useCallback(async (name: string): Promise<WatchlistDetailed | null> => {
    if (!name.trim()) {
      setError('Watchlist name is required');
      return null;
    }

    try {
      setIsCreating(true);
      setError(null);

      const result = await ApiClient.post<WatchlistDetailed>('/api/watchlist', {
        name: name.trim(),
      });

      if (!result.success) {
        const errorMessage = result.error || 'Failed to create watchlist';
        setError(errorMessage);
        return null;
      }

      // Ensure items array exists
      const newWatchlist = {
        ...result.data!,
        items: result.data!.items || [],
        itemCount: result.data!.itemCount || 0,
      };

      return newWatchlist;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create watchlist';
      setError(errorMessage);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const deleteWatchlist = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsDeleting(true);
      setError(null);

      const result = await ApiClient.delete(`/api/watchlist/${id}`);

      if (!result.success) {
        const errorMessage = result.error || 'Failed to delete watchlist';
        setError(errorMessage);
        return false;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete watchlist';
      setError(errorMessage);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    createWatchlist,
    deleteWatchlist,
    isCreating,
    isDeleting,
    error,
    clearError,
  };
}
