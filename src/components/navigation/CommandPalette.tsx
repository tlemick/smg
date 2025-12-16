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
import { 
  HouseIcon, 
  BriefcaseIcon, 
  TrendUpIcon, 
  FileTextIcon,
  StarIcon,
  TrophyIcon,
  MagnifyingGlassIcon,
  Icon 
} from '@/components/ui';

interface Asset {
  id: number;
  ticker: string;
  name: string;
  type: string;
}

const quickActions = [
  { name: 'Dashboard', href: '/dashboard', icon: HouseIcon, keywords: ['home', 'overview'] },
  { name: 'Portfolio', href: '/portfolio', icon: BriefcaseIcon, keywords: ['holdings', 'positions'] },
  { name: 'Trade', href: '/trade', icon: TrendUpIcon, keywords: ['buy', 'sell', 'order'] },
  { name: 'Watchlists', href: '/watchlists', icon: StarIcon, keywords: ['watch', 'tracking'] },
  { name: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon, keywords: ['rankings', 'competition'] },
  { name: 'News', href: '/news', icon: FileTextIcon, keywords: ['articles', 'updates'] },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [watchlistAssets, setWatchlistAssets] = useState<Asset[]>([]);
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Load watchlist assets when opened
  useEffect(() => {
    if (open && watchlistAssets.length === 0) {
      loadWatchlistAssets();
    }
  }, [open]);

  const loadWatchlistAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/watchlist?include=items');
      const data = await response.json();
      
      if (data.success) {
        const assets: Asset[] = [];
        data.data.forEach((watchlist: any) => {
          watchlist.items.forEach((item: any) => {
            // Avoid duplicates
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

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search assets, pages, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Quick Navigation */}
        <CommandGroup heading="Pages">
          {quickActions.map((action) => (
            <CommandItem
              key={action.href}
              onSelect={() => handleSelect(() => router.push(action.href))}
              className="flex items-center gap-3"
            >
              <Icon icon={action.icon} size="sm" className="text-muted-foreground" />
              <span>{action.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Watchlist Assets */}
        {watchlistAssets.length > 0 && (
          <CommandGroup heading="Watchlist Assets">
            {watchlistAssets.slice(0, 8).map((asset) => (
              <CommandItem
                key={asset.id}
                onSelect={() => handleSelect(() => router.push(`/asset/${asset.ticker}`))}
                className="flex items-center gap-3"
              >
                <Icon icon={MagnifyingGlassIcon} size="sm" className="text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{asset.ticker}</span>
                  <span className="text-xs text-muted-foreground">{asset.name}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Common Actions */}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => handleSelect(() => router.push('/trade'))}
            className="flex items-center gap-3"
          >
            <Icon icon={TrendUpIcon} size="sm" className="text-muted-foreground" />
            <span>Place a Trade</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => router.push('/watchlists'))}
            className="flex items-center gap-3"
          >
            <Icon icon={StarIcon} size="sm" className="text-muted-foreground" />
            <span>Create Watchlist</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
