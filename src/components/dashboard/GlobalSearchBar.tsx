'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Icon, MagnifyingGlassIcon } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAssetSearch } from '@/hooks/useAssetSearch';

export function GlobalSearchBar() {
  const router = useRouter();
  const { query, setQuery, results, isSearching, clearSearch } = useAssetSearch();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Open dropdown when query has results
  useEffect(() => {
    setIsOpen(query.length >= 2);
  }, [query, results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        // If user presses enter with no results, try to navigate to the query as a ticker
        handleSelect(query.toUpperCase());
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex].ticker);
        }
        break;
    }
  };

  const handleSelect = (ticker: string) => {
    if (ticker) {
      router.push(`/dashboard/asset/${ticker}`);
      setIsOpen(false);
      clearSearch();
      inputRef.current?.blur();
    }
  };

  const showResults = isOpen && query.length >= 2;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <Icon
          icon={MagnifyingGlassIcon}
          size="sm"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search stocks, ETFs, bonds..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(query.length >= 2)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-4 h-9 bg-background"
        />
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-md shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {/* Loading State */}
          {isSearching && (
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            </div>
          )}

          {/* Results */}
          {!isSearching && results.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Assets
              </div>
              {results.map((asset, idx) => (
                <button
                  key={asset.id}
                  onClick={() => handleSelect(asset.ticker)}
                  className={cn(
                    'w-full flex items-center gap-3 px-2 py-2 rounded-sm text-sm transition-colors',
                    idx === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <div className="h-8 w-8 rounded flex items-center justify-center flex-shrink-0 bg-muted">
                    <span className="text-xs font-semibold">
                      {asset.ticker.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col items-start flex-1">
                    <span className="font-medium">{asset.ticker}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-full">
                      {asset.name}
                    </span>
                  </div>
                  {asset.type && (
                    <span className="text-xs text-muted-foreground uppercase">
                      {asset.type}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isSearching && results.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <p>No assets found</p>
              <p className="text-xs mt-1">Try searching with a ticker symbol</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

