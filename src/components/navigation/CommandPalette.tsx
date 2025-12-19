'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
// No UI icon imports needed - using shadcn command component

interface SearchResult {
  id: string;
  ticker: string;
  name: string;
  type: string;
  exchange?: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Register keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search for assets when query changes
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const searchAssets = async () => {
      try {
        setIsSearching(true);
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query.trim(),
            quotesCount: 10,
            newsCount: 0
          }),
        });

        const data = await response.json();

        if (data.success && data.data.quotes) {
          const validResults = data.data.quotes
            .filter((result: any) => 
              result && result.symbol && (result.longname || result.shortname)
            )
            .map((result: any) => ({
              id: result.symbol,
              ticker: result.symbol,
              name: result.longname || result.shortname || result.symbol,
              type: result.quoteType || 'EQUITY',
              exchange: result.exchange
            }));
          setResults(validResults);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchAssets();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Search stocks, ETFs, bonds..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isSearching && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}
        
        {!isSearching && query.length >= 2 && results.length === 0 && (
          <CommandEmpty>No assets found. Try searching with a ticker symbol.</CommandEmpty>
        )}
        
        {!isSearching && query.length < 2 && (
          <CommandEmpty>Type at least 2 characters to search for assets.</CommandEmpty>
        )}

        {/* Search Results */}
        {!isSearching && results.length > 0 && (
          <CommandGroup heading="Assets">
            {results.map((asset) => (
              <CommandItem
                key={asset.id}
                onSelect={() => handleSelect(() => router.push(`/dashboard/asset/${asset.ticker}`))}
                className="flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded flex items-center justify-center flex-shrink-0 bg-muted">
                  <span className="text-xs font-semibold">
                    {asset.ticker.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col flex-1">
                  <span className="font-medium">{asset.ticker}</span>
                  <span className="text-xs text-muted-foreground truncate">{asset.name}</span>
                </div>
                {asset.type && (
                  <span className="text-xs text-muted-foreground uppercase">
                    {asset.type}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
