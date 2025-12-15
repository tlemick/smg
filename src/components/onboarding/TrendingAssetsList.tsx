'use client';

import { useEffect, useState } from 'react';
import { TrendingAsset } from '@/types';
import { CircleNotchIcon, Icon, TrendUpIcon } from '@/components/ui';
import Image from 'next/image';

interface TrendingAssetsListProps {
  assetType: string;
  onSelect: (ticker: string) => void;
  compact?: boolean;
}

export function TrendingAssetsList({ assetType, onSelect, compact = false }: TrendingAssetsListProps) {
  const [assets, setAssets] = useState<TrendingAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendingAssets();
  }, [assetType]);

  const fetchTrendingAssets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/onboarding/trending-assets?type=${assetType}&limit=5`);
      const data = await response.json();

      if (data.success) {
        setAssets(data.assets);
      } else {
        setError('Failed to load trending assets');
      }
    } catch (err) {
      console.error('Error fetching trending assets:', err);
      setError('Failed to load trending assets');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center ${compact ? 'py-2' : 'py-8'}`}>
        <Icon icon={CircleNotchIcon} size={compact ? "sm" : "lg"} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span className={`ml-2 text-gray-600 dark:text-gray-400 ${compact ? 'text-xs' : ''}`}>Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-xs text-red-600 dark:text-red-400 ${compact ? 'py-2' : 'py-8'}`}>
        {error}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className={`text-xs text-gray-600 dark:text-gray-400 ${compact ? 'py-2' : 'py-8'}`}>
        No trending assets
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {assets.map((asset) => (
        <button
          key={asset.id}
          onClick={() => onSelect(asset.ticker)}
          className={`w-full text-left rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            compact 
              ? 'p-2 border-gray-200 dark:border-gray-600' 
              : 'p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <span className={`font-bold text-gray-900 dark:text-gray-100 ${compact ? 'text-xs' : 'text-sm'}`}>
                  {asset.ticker}
                </span>
                {!compact && <Icon icon={TrendUpIcon} size="xs" className="text-orange-500" />}
              </div>
              <p className={`text-gray-600 dark:text-gray-400 truncate ${compact ? 'text-xs' : 'text-xs'}`}>
                {asset.name}
              </p>
            </div>

            {!compact && (
              <div className="text-right ml-3">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(asset.currentPrice)}
                </div>
                <div
                  className={`text-xs font-medium ${
                    asset.priceChangePercent >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatPercent(asset.priceChangePercent)}
                </div>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

