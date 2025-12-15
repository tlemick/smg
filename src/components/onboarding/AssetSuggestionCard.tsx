'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Icon, StarIcon } from '@/components/ui';

interface AssetSuggestionCardProps {
  ticker: string;
  name: string;
  reason: string;
  category?: string;
  logoUrl?: string;
  currentPrice?: number;
  onSelect: (ticker: string) => void;
}

export function AssetSuggestionCard({
  ticker,
  name,
  reason,
  category,
  logoUrl,
  currentPrice,
  onSelect,
}: AssetSuggestionCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div
      onClick={() => onSelect(ticker)}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="flex items-start space-x-3">
        {/* Logo */}
        <div className="flex-shrink-0">
          {logoUrl && !imageError ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Image
                src={logoUrl}
                alt={`${name} logo`}
                width={48}
                height={48}
                className="object-contain"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {ticker.slice(0, 2)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {ticker}
                </h4>
      <Icon icon={StarIcon} size="sm" className="text-yellow-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {name}
              </p>
            </div>
            {currentPrice && (
              <div className="text-right ml-2">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(currentPrice)}
                </div>
              </div>
            )}
          </div>

          {category && (
            <div className="mt-2">
              <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                {category}
              </span>
            </div>
          )}

          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {reason}
          </p>

          <div className="mt-3 flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
            Click to view details
            <svg
              className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

