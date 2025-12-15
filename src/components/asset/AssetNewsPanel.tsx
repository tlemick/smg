'use client';

import { useState, useEffect } from 'react';
import { NewsItem, AssetNewsResponse } from '@/types';

interface AssetNewsPanelProps {
  ticker: string;
  assetName: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function NewsItemCard({ item, isGrid = false }: { item: NewsItem; isGrid?: boolean }) {
  const handleNewsClick = () => {
    window.open(item.link, '_blank', 'noopener,noreferrer');
  };

  if (isGrid) {
    // Grid layout for larger screens
    return (
      <div 
        className="p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors rounded-lg border border-neutral-100 dark:border-neutral-700"
        onClick={handleNewsClick}
      >
        <div className="mb-3">
          {item.thumbnail ? (
            <img 
              src={item.thumbnail} 
              alt=""
              className="w-full h-32 object-cover rounded"
              onError={(e) => {
                // Replace with fallback on error
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-full h-32 bg-neutral-100 dark:bg-neutral-700 rounded flex items-center justify-center"
            style={{ display: item.thumbnail ? 'none' : 'flex' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-400">
              <rect width="24" height="24" fill="currentColor" fillOpacity="0.1"/>
              <path d="M12 8C10.9 8 10 8.9 10 10S10.9 12 12 12S14 11.1 14 10S13.1 8 12 8Z" fill="currentColor"/>
              <path d="M21 5H18.41L17 3.59C16.78 3.37 16.47 3.25 16.14 3.25H7.86C7.53 3.25 7.22 3.37 7 3.59L5.59 5H3C2.45 5 2 5.45 2 6V18C2 18.55 2.45 19 3 19H18C18.55 19 19 18.55 19 18V6C19 5.45 18.55 5 18 5ZM12 16C10.34 16 9 14.66 9 13S10.34 10 12 10S15 11.34 15 13S13.66 16 12 16Z" fill="currentColor"/>
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight overflow-hidden" 
              style={{ 
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical' as any
              }}>
            {item.title}
          </h4>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="truncate">{item.publisher}</span>
            <div className="flex items-center gap-2">
              {item.isRecent && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  New
                </span>
              )}
              <span className="whitespace-nowrap">{formatTimeAgo(item.publishedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List layout for smaller screens
  return (
    <div 
      className="py-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors rounded-md -mx-2 px-2"
      onClick={handleNewsClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {item.thumbnail ? (
            <img 
              src={item.thumbnail} 
              alt=""
              className="w-16 h-12 object-cover rounded"
              onError={(e) => {
                // Replace with fallback on error
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center"
            style={{ display: item.thumbnail ? 'none' : 'flex' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
              <rect width="24" height="24" fill="currentColor" fillOpacity="0.1"/>
              <path d="M12 8C10.9 8 10 8.9 10 10S10.9 12 12 12S14 11.1 14 10S13.1 8 12 8Z" fill="currentColor"/>
              <path d="M21 5H18.41L17 3.59C16.78 3.37 16.47 3.25 16.14 3.25H7.86C7.53 3.25 7.22 3.37 7 3.59L5.59 5H3C2.45 5 2 5.45 2 6V18C2 18.55 2.45 19 3 19H18C18.55 19 19 18.55 19 18V6C19 5.45 18.55 5 18 5ZM12 16C10.34 16 9 14.66 9 13S10.34 10 12 10S15 11.34 15 13S13.66 16 12 16Z" fill="currentColor"/>
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 leading-tight mb-1 overflow-hidden" 
              style={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as any
              }}>
            {item.title}
          </h4>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="truncate">{item.publisher}</span>
            <div className="flex items-center gap-2 ml-2">
              {item.isRecent && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  New
                </span>
              )}
              <span className="whitespace-nowrap">{formatTimeAgo(item.publishedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AssetNewsPanel({ ticker, assetName }: AssetNewsPanelProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheAge, setCacheAge] = useState<number>(0);

  useEffect(() => {
    const fetchNews = async () => {
      if (!ticker) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/asset-news/${ticker.toUpperCase()}?limit=4`);
        const result: AssetNewsResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch news');
        }
        // Convert date strings back to Date objects
        const newsWithDates = (result.data || []).map(item => ({
          ...item,
          publishedAt: new Date(item.publishedAt)
        }));
        setNews(newsWithDates);
        setCacheAge(result.meta?.cacheAge || 0);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [ticker]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-normal text-gray-900 dark:text-white">Recent News</h4>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-3">
                <div className="w-16 h-12 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-normal text-gray-900 dark:text-white">Recent News</h4>
        </div>
        <div className="text-center py-8">
          <div className="text-neutral-400 dark:text-neutral-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Unable to load news</p>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-normal text-neutral-900 dark:text-white">Recent News</h4>
        </div>
        <div className="text-center py-8">
          <div className="text-neutral-400 dark:text-neutral-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No recent news available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent News</h4>
        {cacheAge > 0 && (
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            Updated {Math.floor(cacheAge / 60000)}m ago
          </span>
        )}
      </div>

      {/* Mobile and tablet: List layout */}
      <div className="block lg:hidden">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-700 -mx-2">
          {news.slice(0, 4).map((item) => (
            <NewsItemCard key={item.uuid} item={item} isGrid={false} />
          ))}
        </div>
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {news.slice(0, 4).map((item) => (
            <NewsItemCard key={item.uuid} item={item} isGrid={true} />
          ))}
        </div>
      </div>

      {news.length > 4 && (
        <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-center">
          <button
            onClick={() => {
              // Could link to a dedicated news page in the future
              window.open(`https://finance.yahoo.com/quote/${ticker}/news`, '_blank', 'noopener,noreferrer');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all news →
          </button>
        </div>
      )}
    </div>
  );
}
