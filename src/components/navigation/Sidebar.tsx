'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { 
  HouseIcon, 
  BriefcaseIcon, 
  TrendUpIcon, 
  FileTextIcon,
  TrophyIcon,
  CaretLeftIcon,
  CaretRightIcon,
  SignOutIcon,
  Icon 
} from '@/components/ui';
import { ThemeToggle } from '@/components/ui';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getUserAvatarUrl } from '@/lib/avatar-service';

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HouseIcon },
  { name: 'Portfolio', href: '/portfolio', icon: BriefcaseIcon },
  { name: 'Trade', href: '/trade', icon: TrendUpIcon },
  { name: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
  { name: 'News', href: '/news', icon: FileTextIcon },
];

export function Sidebar({ className }: SidebarProps) {
  const { user, logout } = useUser();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
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
    <aside
      className={cn(
        'bg-card border-r border-border flex flex-col h-screen transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-60',
        className
      )}
    >
      {/* Header - Logo & Collapse Toggle */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-border">
        {!isCollapsed ? (
          <Link href="/dashboard" className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors">
            <Image
              src="/logo.png"
              alt="SMG"
              width={24}
              height={24}
              className="flex-shrink-0"
            />
            <span className="font-semibold text-lg">SMG</span>
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center justify-center w-full">
            <Image
              src="/logo.png"
              alt="SMG"
              width={24}
              height={24}
              className="flex-shrink-0"
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

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  isCollapsed && 'justify-center'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon icon={item.icon} size="md" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Footer - User Menu & Theme Toggle */}
      <div className="p-4 space-y-3">
        <ThemeToggle className={cn(isCollapsed && 'justify-center')} />
        
        {user && (
          <>
            <Separator />
            <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
              {!isCollapsed ? (
                <>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getUserAvatarUrl(user.id)} alt={user.email} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.name || user.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </>
              ) : (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getUserAvatarUrl(user.id)} alt={user.email} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            
            <Button
              variant="ghost"
              onClick={logout}
              className={cn(
                'w-full justify-start text-muted-foreground hover:text-foreground',
                isCollapsed && 'justify-center px-0'
              )}
            >
              <Icon icon={SignOutIcon} size="md" />
              {!isCollapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
