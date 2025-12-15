import { useState, useEffect } from 'react';

interface SearchResult {
  id: string;
  ticker: string;
  name: string;
  type: string;
  exchange?: string;
}

interface UseAssetSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  clearSearch: () => void;
}

export function useAssetSearch(): UseAssetSearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          quotesCount: 5,
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
            id: result.symbol, // Use symbol as unique ID
            ticker: result.symbol,
            name: result.longname || result.shortname || result.symbol,
            type: result.quoteType || 'EQUITY',
            exchange: result.exchange
          }));
        setResults(validResults);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  return {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch,
  };
} 