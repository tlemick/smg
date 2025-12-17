'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { getUserAvatarUrl } from '@/lib/avatar-service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icon, GearIcon, SignOutIcon } from '@/components/ui';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const { user, logout } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />; // 36px = 9 baseline units
  }

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

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 hover:opacity-80 transition-opacity outline-none">
        {/* Avatar: 36px (9 units), gap: 12px (3 units) */}
        <Avatar className="h-9 w-9">
          <AvatarImage src={getUserAvatarUrl(user.id)} alt={user.email} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {getInitials(user.name, user.email)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start min-w-0">
          {/* text-sm = 20px line-height (5 units), text-xs = 16px line-height (4 units) */}
          <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
            {user.name || user.email.split('@')[0]}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
            {user.email}
          </p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
          <Icon icon={GearIcon} size="sm" className="mr-2 text-muted-foreground" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
          <Icon icon={SignOutIcon} size="sm" className="mr-2" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

