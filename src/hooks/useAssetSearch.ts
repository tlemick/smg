import { useState, useEffect } from 'react';
import { ApiClient, ApiError } from '@/lib/api';

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

      const result = await ApiClient.post<any>('/api/search', {
        query: searchQuery.trim(),
        quotesCount: 5,
        newsCount: 0
      });

      if (result.success && result.data?.quotes) {
        const validResults = result.data.quotes
          .filter((item: any) => 
            item && item.symbol && (item.longname || item.shortname)
          )
          .map((item: any) => ({
            id: item.symbol, // Use symbol as unique ID
            ticker: item.symbol,
            name: item.longname || item.shortname || item.symbol,
            type: item.quoteType || 'EQUITY',
            exchange: item.exchange
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