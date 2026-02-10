'use client';

import { useEffect, useState } from 'react';
import { GlobalSearchBar } from './GlobalSearchBar';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Icon, DiscordLogoIcon, BellIcon } from '@/components/ui';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  className?: string;
}

export function DashboardHeader({ className }: DashboardHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header
      className={cn(
        'h-20 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 gap-4 flex-shrink-0 relative z-50',
        // h-20 = 80px (20 baseline units), gap-4 = 16px (4 units), px-4/6 = 16px/24px (4/6 units)
        className
      )}
    >
      {/* Search Bar - Left Side */}
      {mounted && <GlobalSearchBar />}
      {!mounted && <div className="h-9 w-64 bg-muted animate-pulse rounded-md" />}

      {/* Icons and User Menu - Far Right */}
      <div className="flex items-center gap-2 ml-auto">
        {mounted ? (
          <>
            {/* Discord Icon */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              // Added [&_svg]:size-5 to match your Bell icon (20px)
              // Or use size-6 (24px) if you want it slightly bigger
              className="text-muted-foreground hover:text-foreground [&_svg]:size-5"
              title="Discord"
            >
              <a 
                href="" 
                target="_blank" 
                rel="noreferrer"
                title="Discord"
              >
                {/* The size="xl" here is being ignored by the Button's CSS, 
                    so the class above is what actually controls the size. */}
                <Icon icon={DiscordLogoIcon} size="md" />
              </a>
            </Button>
            {/* Bell Notification Icon */}
            <Button
              variant="ghost"
              size="icon"
              // The [&_svg] selector targets any SVG inside this button
              // :size-6 forces width/height to 1.5rem (24px)
              className="text-muted-foreground hover:text-foreground [&_svg]:size-5"
              title="Notifications"
            >
              <Icon icon={BellIcon} size="md" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <UserMenu />
          </>
        ) : (
          <>
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-9 bg-muted animate-pulse rounded-full" />
          </>
        )}
      </div>
    </header>
  );
}

