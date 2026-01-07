'use client';

import { Button, Icon, CircleNotchIcon, TrashIcon, Input } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  newName: string;
  onNameChange: (value: string) => void;
  onCreate: () => void;
  isCreating: boolean;
  error: string | null;
}

export function CreateWatchlistModal({
  isOpen,
  onClose,
  newName,
  onNameChange,
  onCreate,
  isCreating,
  error,
}: CreateWatchlistModalProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating && newName.trim()) {
      onCreate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-mono">
            Create New Watchlist
          </DialogTitle>
          <DialogDescription>Give your watchlist a name to get started</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="watchlist-name" className="text-sm font-medium">
              Watchlist Name
            </label>
            <Input
              id="watchlist-name"
              value={newName}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Tech Stocks, Dividend Portfolio, Growth Picks..."
              autoFocus
              disabled={isCreating}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={onCreate}
            disabled={isCreating || !newName.trim()}
            className="w-full"
          >
            {isCreating ? (
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
            onClick={onClose}
            disabled={isCreating}
            className="w-full"
          >
            Return to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteWatchlistModalProps {
  watchlistName: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteWatchlistModal({
  watchlistName,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteWatchlistModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isDeleting && onClose()}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Watchlist</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{watchlistName}"? All assets in this watchlist
            will be removed. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start space-x-3 py-4">
          <div className="flex-shrink-0 h-10 w-10 bg-destructive/10 rounded-lg flex items-center justify-center">
            <Icon icon={TrashIcon} size="md" className="text-destructive" />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-medium mb-1">{watchlistName}</h4>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
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
  );
}
