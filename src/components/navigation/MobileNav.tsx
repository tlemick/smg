'use client';

import { useState } from 'react';
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
  HouseIcon, 
  BriefcaseIcon, 
  TrendUpIcon, 
  ListIcon,
  FileTextIcon,
  TrophyIcon,
  SignOutIcon,
  Icon 
} from '@/components/ui';
import { ThemeToggle } from '@/components/ui';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getUserAvatarUrl } from '@/lib/avatar-service';

const primaryNavItems = [
  { name: 'Home', href: '/dashboard', icon: HouseIcon },
  { name: 'Portfolio', href: '/portfolio', icon: BriefcaseIcon },
  { name: 'Trade', href: '/trade', icon: TrendUpIcon },
  { name: 'News', href: '/news', icon: FileTextIcon },
];

const secondaryNavItems = [
  { name: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const [sheetOpen, setSheetOpen] = useState(false);

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
      <div className="grid grid-cols-5 h-16">
        {/* Primary navigation items */}
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
              {/* User Info */}
              {user && (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
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

              {/* All navigation items */}
              <nav className="space-y-1">
                {[...primaryNavItems, ...secondaryNavItems].map((item) => {
                  const isActive = isActiveRoute(item.href);
                  return (
                    <Link
                      key={item.name}
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
