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
  {/* 1. m-0: Removes the global 16px bottom margin 
      2. leading-none: Pulls lines closer internally (optional, but looks cleaner for names)
  */}
  <p className="text-sm font-medium text-foreground truncate max-w-[150px] m-0 leading-none">
    {user.name || user.email.split('@')[0]}
  </p>
  
  {/* Add a tiny top margin (mt-0.5 is 2px) if you want a micro-gap, or keep it 0 */}
  <p className="text-xs text-muted-foreground truncate max-w-[150px] m-0 leading-tight">
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

