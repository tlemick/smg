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
    <div className="flex flex-col justify-start gap-0">
      <h1 className="text-2xl font-sans text-foreground">Watchlists</h1>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Search */}
          <div className="flex-1 max-w-md min-w-0">
            <div className="rounded-full p-[2px] bg-[linear-gradient(135deg,hsl(var(--chart-1)),hsl(var(--chart-4)))]">
              <div className="relative rounded-full bg-background">
                <Icon
                  icon={MagnifyingGlassIcon}
                  size="sm"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                  type="text"
                  placeholder="Filter"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 pr-4 h-9 bg-transparent border-0 shadow-none rounded-full focus-visible:ring-0 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Add new watchlist button */}
          <Button
            onClick={onCreateNew}
            size="md"
            className="text-sm"
            variant="secondary"
          >
            + New
          </Button>
        </div>
      </div>
    </div>
  );
}
