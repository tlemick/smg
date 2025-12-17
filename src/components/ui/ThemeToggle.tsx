'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { CircleHalfIcon, Icon } from './Icon';
import { getZIndexClass } from '@/lib/z-index';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  showLabel?: boolean;
  variant?: 'icon' | 'dropdown';
  className?: string;
}

/**
 * ThemeToggle component for switching between light, dark, and system theme
 * 
 * Usage:
 * <ThemeToggle /> - Icon only
 * <ThemeToggle showLabel /> - Icon with label
 * <ThemeToggle variant="dropdown" /> - Dropdown menu with all options
 */
export function ThemeToggle({ showLabel = false, variant = 'icon', className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-md bg-muted animate-pulse" />
    );
  }

  // Simple icon toggle (cycles through themes)
  if (variant === 'icon') {
    const cycleTheme = () => {
      if (theme === 'light') setTheme('dark');
      else if (theme === 'dark') setTheme('light');
      else setTheme('light');
    };

    return (
      <button
        onClick={cycleTheme}
        className={cn(
          'p-2 text-muted-foreground hover:text-foreground transition-all rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className
        )}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Current: ${theme} (${resolvedTheme})`}
      >
        <div className={cn('transition-transform duration-300', theme === 'dark' && 'rotate-180')}>
          <Icon icon={CircleHalfIcon} size="md" />
        </div>
      </button>
    );
  }

  // Dropdown variant - just toggle between light and dark
  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className={cn(
        'p-2 text-muted-foreground hover:text-foreground transition-all rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background flex items-center gap-2',
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className={cn('transition-transform duration-300', theme === 'dark' && 'rotate-180')}>
        <Icon icon={CircleHalfIcon} size="md" />
      </div>
      {showLabel && (
        <span className="text-sm font-medium">
          {theme === 'dark' ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}

