'use client';

import { useState, useEffect } from 'react';
import { createModalClasses, createModalHandlers } from '@/lib/positioning';
import { Icon, XIcon } from '@/components/ui';

interface EditItemNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    watchlistId: string;
    asset: {
      ticker: string;
      name: string;
    };
    notes?: string;
  } | null;
  onSuccess?: (message: string) => void;
}

export function EditItemNotesModal({ 
  isOpen, 
  onClose, 
  item,
  onSuccess 
}: EditItemNotesModalProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with item notes
  useEffect(() => {
    if (isOpen && item) {
      setNotes(item.notes || '');
      setError(null);
    }
  }, [isOpen, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/watchlist/${item.watchlistId}/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(`Updated notes for ${item.asset.ticker}`);
        handleClose();
      } else {
        setError(data.error || 'Failed to update notes');
      }
    } catch (err) {
      setError('Failed to update notes');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNotes('');
    setError(null);
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div className={createModalClasses().backdrop} onClick={createModalHandlers(handleClose).backdropClick}>
      <div className={createModalClasses().container}>
        <div className={createModalClasses().content} onClick={createModalHandlers(handleClose).contentClick}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Edit Notes
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icon icon={XIcon} size="lg" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {item.asset.ticker} • {item.asset.name}
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Notes Input */}
          <div className="mb-4">
            <label htmlFor="item-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes about this asset..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              autoFocus
              disabled={loading}
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500">{notes.length}/500 characters</p>
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
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
} 