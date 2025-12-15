'use client';

import { useState, useEffect } from 'react';
import { createModalClasses, createModalHandlers } from '@/lib/positioning';
import { Icon, XIcon } from '@/components/ui';

interface EditWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: {
    id: string;
    name: string;
  } | null;
  onSuccess?: (message: string) => void;
}

export function EditWatchlistModal({ 
  isOpen, 
  onClose, 
  watchlist,
  onSuccess 
}: EditWatchlistModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with watchlist data
  useEffect(() => {
    if (isOpen && watchlist) {
      setName(watchlist.name);
      setError(null);
    }
  }, [isOpen, watchlist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!watchlist || !name.trim()) {
      setError('Watchlist name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/watchlist/${watchlist.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(`Watchlist renamed to "${name.trim()}"`);
        handleClose();
      } else {
        setError(data.error || 'Failed to update watchlist');
      }
    } catch (err) {
      setError('Failed to update watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError(null);
    onClose();
  };

  if (!isOpen || !watchlist) return null;

  return (
    <div className={createModalClasses().backdrop} onClick={createModalHandlers(handleClose).backdropClick}>
      <div className={createModalClasses().container}>
        <div className={createModalClasses().content} onClick={createModalHandlers(handleClose).contentClick}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Edit Watchlist
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icon icon={XIcon} size="lg" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Name Input */}
          <div className="mb-4">
            <label htmlFor="watchlist-name" className="block text-sm font-medium text-gray-700 mb-2">
              Watchlist Name
            </label>
            <input
              type="text"
              id="watchlist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter watchlist name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              autoFocus
              disabled={loading}
              maxLength={100}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || name.trim() === watchlist.name}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
} 