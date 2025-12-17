'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Icon, MagnifyingGlassIcon, DiamondsFourIcon, ChartPieSliceIcon, TrendUpIcon, ArticleMediumIcon, SketchLogoIcon } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Asset {
  id: number;
  ticker: string;
  name: string;
  type: string;
}

interface QuickAction {
  name: string;
  href: string;
  icon: any;
  keywords: string[];
}

const quickActions: QuickAction[] = [
  { name: 'Dashboard', href: '/dashboard', icon: DiamondsFourIcon, keywords: ['home', 'overview'] },
  { name: 'Portfolio', href: '/dashboard/portfolio', icon: ChartPieSliceIcon, keywords: ['holdings', 'positions'] },
  { name: 'Trade', href: '/dashboard/trade', icon: TrendUpIcon, keywords: ['buy', 'sell', 'order'] },
  { name: 'Leaderboard', href: '/leaderboard', icon: SketchLogoIcon, keywords: ['rankings', 'competition'] },
  { name: 'News', href: '/dashboard/news', icon: ArticleMediumIcon, keywords: ['articles', 'updates'] },
];

export function GlobalSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [watchlistAssets, setWatchlistAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load watchlist assets on first focus
  useEffect(() => {
    if (isOpen && watchlistAssets.length === 0) {
      loadWatchlistAssets();
    }
  }, [isOpen]);

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

  const loadWatchlistAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/watchlist?include=items');
      const data = await response.json();
      
      if (data.success) {
        const assets: Asset[] = [];
        data.data.forEach((watchlist: any) => {
          watchlist.items.forEach((item: any) => {
            if (!assets.find(a => a.id === item.asset.id)) {
              assets.push(item.asset);
            }
          });
        });
        setWatchlistAssets(assets);
      }
    } catch (error) {
      console.error('Failed to load watchlist assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActions = query
    ? quickActions.filter(action =>
        action.name.toLowerCase().includes(query.toLowerCase()) ||
        action.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
      )
    : quickActions;

  const filteredAssets = query
    ? watchlistAssets.filter(asset =>
        asset.ticker.toLowerCase().includes(query.toLowerCase()) ||
        asset.name.toLowerCase().includes(query.toLowerCase())
      )
    : watchlistAssets.slice(0, 5);

  const allResults = [
    ...filteredActions.map(a => ({ type: 'action', data: a })),
    ...filteredAssets.map(a => ({ type: 'asset', data: a })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
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
        setSelectedIndex(prev => (prev + 1) % allResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allResults.length) % allResults.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleSelect(allResults[selectedIndex]);
        }
        break;
    }
  };

  const handleSelect = (result: { type: string; data: any }) => {
    if (result.type === 'action') {
      router.push(result.data.href);
    } else if (result.type === 'asset') {
      router.push(`/dashboard/asset/${result.data.ticker}`);
    }
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const showResults = isOpen && (query || watchlistAssets.length > 0);

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
          placeholder="Search assets, pages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-4 h-9 bg-background"
        />
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-md shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {/* Pages Section */}
          {filteredActions.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Pages
              </div>
              {filteredActions.map((action, idx) => {
                const globalIdx = allResults.findIndex(
                  r => r.type === 'action' && r.data === action
                );
                return (
                  <button
                    key={action.href}
                    onClick={() => handleSelect({ type: 'action', data: action })}
                    className={cn(
                      'w-full flex items-center gap-3 px-2 py-2 rounded-sm text-sm transition-colors',
                      globalIdx === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon icon={action.icon} size="sm" className="text-muted-foreground" />
                    <span>{action.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Assets Section */}
          {filteredAssets.length > 0 && (
            <div className="p-2 border-t border-border">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Watchlist Assets
              </div>
              {filteredAssets.map((asset) => {
                const globalIdx = allResults.findIndex(
                  r => r.type === 'asset' && r.data === asset
                );
                return (
                  <button
                    key={asset.id}
                    onClick={() => handleSelect({ type: 'asset', data: asset })}
                    className={cn(
                      'w-full flex items-center gap-3 px-2 py-2 rounded-sm text-sm transition-colors',
                      globalIdx === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon icon={MagnifyingGlassIcon} size="sm" className="text-muted-foreground" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{asset.ticker}</span>
                      <span className="text-xs text-muted-foreground">{asset.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {allResults.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

