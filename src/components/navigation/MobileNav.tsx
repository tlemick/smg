'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  DiamondsFourIcon, 
  ChartPieSliceIcon, 
  TrendUpIcon, 
  ListIcon,
  ArticleMediumIcon,
  SketchLogoIcon,
  SignOutIcon,
  CaretDownIcon,
  Icon 
} from '@/components/ui';
import { ThemeToggle } from '@/components/ui';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getUserAvatarUrl } from '@/lib/avatar-service';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  children?: {
    name: string;
    href: string;
  }[];
}

const primaryNavItems: NavItem[] = [
  { 
    name: 'Home', 
    href: '/dashboard', 
    icon: DiamondsFourIcon,
    children: [
      { name: 'Watchlist', href: '/dashboard/watchlist' },
      { name: 'Transactions', href: '/dashboard/transactions' },
      { name: 'Learning', href: '/dashboard/learning' },
    ]
  },
  { name: 'Portfolio', href: '/dashboard/portfolio', icon: ChartPieSliceIcon },
  { name: 'Trade', href: '/dashboard/trade', icon: TrendUpIcon },
  { name: 'News', href: '/dashboard/news', icon: ArticleMediumIcon },
];

const secondaryNavItems: NavItem[] = [
  { name: 'Leaderboard', href: '/leaderboard', icon: SketchLogoIcon },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['Home']));

  // Load expanded menus state
  useEffect(() => {
    const storedMenus = localStorage.getItem('mobile-nav-expanded-menus');
    if (storedMenus) {
      try {
        setExpandedMenus(new Set(JSON.parse(storedMenus)));
      } catch (e) {
        // If parsing fails, default to Home expanded
        setExpandedMenus(new Set(['Home']));
      }
    }
  }, []);

  // Toggle submenu expansion
  const toggleSubmenu = (name: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      localStorage.setItem('mobile-nav-expanded-menus', JSON.stringify([...next]));
      return next;
    });
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-50">
      {/* h-16 = 64px (16 baseline units) */}
      <div className="grid grid-cols-5 h-16">
        {/* Primary navigation items - gap-1 = 4px (1 unit), text-xs = 16px line (4 units) */}
        {primaryNavItems.map((item) => {
          const isActive = isActiveRoute(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon icon={item.icon} size="md" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}

        {/* Menu button - opens sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon icon={ListIcon} size="md" />
              <span className="text-xs font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 space-y-4">
              {/* User Info - mt-6 = 24px (6 units), space-y-4 = 16px (4 units), h-10 = 40px (10 units) */}
              {user && (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                    {/* gap-3 p-3 = 12px (3 units), h-10 w-10 = 40px (10 units) */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getUserAvatarUrl(user.id)} alt={user.email} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.name || user.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* All navigation items - space-y-1 = 4px (1 unit), px-3 py-2 = 12px/8px (3/2 units) */}
              <nav className="space-y-1">
                {[...primaryNavItems, ...secondaryNavItems].map((item) => {
                  const isActive = isActiveRoute(item.href);
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expandedMenus.has(item.name);
                  const isAnyChildActive = hasChildren && item.children?.some(child => pathname === child.href || pathname.startsWith(child.href));

                  return (
                    <div key={item.name}>
                      {/* Parent Item - px-3 py-2 = 12px/8px (3/2 units) = 36px total (9 units) with text-sm 20px line */}
                      {hasChildren ? (
                        <button
                          onClick={() => toggleSubmenu(item.name)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full',
                            (isActive || isAnyChildActive)
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <Icon icon={item.icon} size="md" />
                          <span className="flex-1 text-left">{item.name}</span>
                          <div className={cn('transition-transform', isExpanded && 'rotate-180')}>
                            <Icon icon={CaretDownIcon} size="sm" />
                          </div>
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => setSheetOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <Icon icon={item.icon} size="md" />
                          <span>{item.name}</span>
                        </Link>
                      )}

                      {/* Submenu Items */}
                      {hasChildren && isExpanded && (
                        <div className="mt-1 border-l border-border pl-4 space-y-1">
                          {item.children?.map((child) => {
                            const isChildActive = pathname === child.href || pathname.startsWith(child.href);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setSheetOpen(false)}
                                className={cn(
                                  'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                  isChildActive
                                    ? 'text-primary bg-muted'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                )}
                              >
                                {child.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              <Separator />

              {/* Theme Toggle */}
              <div className="px-3">
                <ThemeToggle />
              </div>

              {/* Sign Out */}
              {user && (
                <>
                  <Separator />
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSheetOpen(false);
                      logout();
                    }}
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                  >
                    <Icon icon={SignOutIcon} size="md" />
                    <span className="ml-2">Sign Out</span>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
