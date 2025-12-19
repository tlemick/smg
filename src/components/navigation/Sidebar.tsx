'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  DiamondsFourIcon, 
  ChartPieSliceIcon, 
  TrendUpIcon, 
  ArticleMediumIcon,
  SketchLogoIcon,
  GearIcon,
  CaretLeftIcon,
  CaretRightIcon,
  Icon 
} from '@/components/ui';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
}

const navigationItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: DiamondsFourIcon },
  { name: 'Portfolio', href: '/dashboard/portfolio', icon: ChartPieSliceIcon },
  { name: 'Trade', href: '/dashboard/trade', icon: TrendUpIcon },
  { name: 'Leaderboard', href: '/leaderboard', icon: SketchLogoIcon },
  { name: 'News', href: '/dashboard/news', icon: ArticleMediumIcon },
  { name: 'Settings', href: '/settings', icon: GearIcon },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
    setMounted(true);
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <aside
        className={cn(
          'bg-card border-r border-border flex flex-col h-screen transition-all duration-300 w-60',
          className
        )}
      >
        <div className="h-20 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-muted animate-pulse rounded" />
            <div className="w-12 h-5 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="flex-1 px-3 pt-12 pb-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-9 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        'bg-muted/40 border-r border-border flex flex-col h-screen transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-60',
        className
      )}
    >
      {/* Header - Logo & Collapse Toggle */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-border">
        {!isCollapsed ? (
          <Link href="/dashboard" className="flex items-center space-x-2 text-foreground">
            <img
              src="/svg_logo.svg"
              alt="SMG"
              width={24}
              height={24}
              className="flex-shrink-0 dark:invert"
            />
            <span className="font-semibold text-lg">SMG</span>
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center justify-center w-full text-foreground">
            <img
              src="/svg_logo.svg"
              alt="SMG"
              width={24}
              height={24}
              className="flex-shrink-0 dark:invert"
            />
          </Link>
        )}
        
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-8 w-8"
            title="Collapse sidebar"
          >
            <Icon icon={CaretLeftIcon} size="sm" />
          </Button>
        )}
      </div>

      {/* Collapsed toggle button - shown when collapsed */}
      {isCollapsed && (
        <div className="px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-8 w-8 mx-auto"
            title="Expand sidebar"
          >
            <Icon icon={CaretRightIcon} size="sm" />
          </Button>
        </div>
      )}

      {/* Navigation - pt-8 = 32px to match main content padding */}
      <ScrollArea className="flex-1 px-3 pt-8 pb-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = isActiveRoute(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors group',
                  'hover:bg-muted',
                  isCollapsed && 'justify-center'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <div 
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  <Icon icon={item.icon} size="md" />
                </div>
                {!isCollapsed && (
                  <span 
                    className={cn(
                      'transition-colors',
                      isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  >
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

    </aside>
  );
}
