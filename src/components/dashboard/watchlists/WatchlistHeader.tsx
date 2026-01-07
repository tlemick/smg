'use client';

import { Button, Input, Icon, MagnifyingGlassIcon } from '@/components/ui';

interface WatchlistHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateNew: () => void;
}

export function WatchlistHeader({
  searchTerm,
  onSearchChange,
  onCreateNew,
}: WatchlistHeaderProps) {
  return (
    <div className="flex flex-col justify-start gap-4">
      <h1 className="text-2xl font-mono text-foreground">Watchlists</h1>
      <div className="flex items-center gap-4">
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
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-8 text-sm"
            />
          </div>

          {/* Add new watchlist button */}
          <Button
            onClick={onCreateNew}
            size="sm"
            className="text-sm"
            variant="outline"
          >
            + New
          </Button>
        </div>
      </div>
    </div>
  );
}
