'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssetSearch } from '@/hooks/useAssetSearch';
import { CaretRightIcon, Icon, MagnifyingGlassIcon } from '@/components/ui';
import { getZIndexClass } from '@/lib/z-index';

interface GlobalSearchBarProps {
  className?: string;
}

export function GlobalSearchBar({ className = '' }: GlobalSearchBarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const { query, setQuery, results, isSearching, clearSearch } = useAssetSearch();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node) &&
          resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        // If user presses enter with no results, search for the query as-is
        handleAssetSelect(query.toUpperCase());
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && results[focusedIndex]) {
          handleAssetSelect(results[focusedIndex].ticker || '');
        } else if (results.length > 0) {
          handleAssetSelect(results[0].ticker || '');
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        searchRef.current?.blur();
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length >= 2);
    setFocusedIndex(-1);
  };

  const handleInputFocus = () => {
    if (query.length >= 2) {
      setIsOpen(true);
    }
  };

  const handleAssetSelect = (ticker: string) => {
    if (ticker) {
      clearSearch();
      setIsOpen(false);
      setFocusedIndex(-1);
      router.push(`/dashboard/asset/${ticker}`);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Global SearchBar Container */}
      {/* Search Input Wrapper */}
      <div className="relative">
        {/* Leading Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon icon={MagnifyingGlassIcon} size="md" className="text-gray-900 dark:text-gray-100" />
        </div>
        {/* Text Input */}
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search stocks, ETFs, bonds..."
          className="block w-full pl-10 pr-3 py-2 border-2 border-gray-900 dark:border-gray-100 rounded-full leading-5 placeholder-gray-900 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-800 focus:border-emerald-800 dark:focus:border-emerald-200 text-sm text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div 
          ref={resultsRef}
          className={`absolute ${getZIndexClass('dropdown')} mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-gray-200 dark:ring-gray-700 overflow-auto focus:outline-none sm:text-sm`}
        >
          {/* Loading State */}
          {isSearching ? (
            <div className="px-4 py-3 text-center">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black dark:border-white"></div>
                <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">Searching...</span>
              </div>
            </div>
          ) : results.length === 0 && query.length >= 2 ? (
            /* Empty State */
            <div className="px-4 py-3 text-center">
              <p className="text-sm text-gray-800 dark:text-gray-200">No assets found</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Try searching with a ticker symbol</p>
            </div>
          ) : (
            /* Results List */
            results.map((result, index) => {
              const ticker = result.ticker || 'N/A';
              const name = result.name || 'Unknown';
              const isFocused = index === focusedIndex;
              
              return (
                // Result Item
                <div
                  key={result.id}
                  onClick={() => handleAssetSelect(ticker)}
                  className={`relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                    isFocused 
                      ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                      : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {/* Row: Left Badge + Text + Right Chevron */}
                  <div className="flex items-center gap-3">
                    {/* Left: Symbol Initials Badge */}
                    <div className={`h-8 w-8 rounded flex items-center justify-center flex-shrink-0 ${
                      isFocused 
                        ? 'bg-white dark:bg-gray-800' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      <span className={`text-xs font-semibold ${
                        isFocused 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {ticker.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    {/* Middle: Ticker + Name */}
                    <div className="flex-1 flex flex-col leading-tight">
                      <div className={`text-sm font-medium truncate ${
                        isFocused 
                          ? 'text-white' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {ticker}
                      </div>
                      <div className={`text-xs truncate ${
                        isFocused 
                          ? 'text-blue-100 dark:text-blue-200' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {name}
                      </div>
                    </div>
                    {/* Right: Chevron Icon */}
                    <div className="flex-shrink-0">
                      <Icon
                        icon={CaretRightIcon}
                        size="sm"
                        className={isFocused ? 'text-white' : 'text-gray-400 dark:text-gray-500'}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
} 