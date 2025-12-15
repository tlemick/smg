'use client';

import { useState, useRef, useEffect } from 'react';
import { useAssetSearch } from '@/hooks/useAssetSearch';
import { Icon, MagnifyingGlassIcon, XIcon } from '@/components/ui';

interface OnboardingSearchProps {
  onSelect: (ticker: string) => void;
  placeholder?: string;
}

export function OnboardingSearch({ onSelect, placeholder = 'Search stocks, funds, or bonds...' }: OnboardingSearchProps) {
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
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && results[focusedIndex]) {
          handleAssetSelect(results[focusedIndex].ticker);
        } else if (results.length > 0) {
          handleAssetSelect(results[0].ticker);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleAssetSelect = (ticker: string) => {
    setIsOpen(false);
    setFocusedIndex(-1);
    clearSearch();
    onSelect(ticker);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(value.trim().length > 0);
    setFocusedIndex(-1);
  };

  const getAssetTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      STOCK: 'Stock',
      MUTUALFUND: 'Mutual Fund',
      BOND: 'Bond',
      ETF: 'ETF',
    };
    return types[type] || type;
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Icon icon={MagnifyingGlassIcon} size="md" className="text-gray-400" />
        </div>
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
        {query && (
          <button
            onClick={() => {
              clearSearch();
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icon icon={XIcon} size="sm" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div
          ref={resultsRef}
          className="absolute z-[100] w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto"
        >
          {isSearching ? (
            <div className="p-4 text-center text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((asset, index) => (
                <button
                  key={asset.id}
                  onClick={() => handleAssetSelect(asset.ticker)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    index === focusedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {asset.ticker}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {asset.name}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      {getAssetTypeLabel(asset.type)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-4 text-center text-gray-600 dark:text-gray-400">
              No assets found for &quot;{query}&quot;
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

