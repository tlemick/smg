'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { DesktopIcon, Icon, MoonIcon, SunIcon } from './Icon';
import { getZIndexClass } from '@/lib/z-index';

interface ThemeToggleProps {
  showLabel?: boolean;
  variant?: 'icon' | 'dropdown';
}

/**
 * ThemeToggle component for switching between light, dark, and system theme
 * 
 * Usage:
 * <ThemeToggle /> - Icon only
 * <ThemeToggle showLabel /> - Icon with label
 * <ThemeToggle variant="dropdown" /> - Dropdown menu with all options
 */
export function ThemeToggle({ showLabel = false, variant = 'icon' }: ThemeToggleProps) {
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
      else if (theme === 'dark') setTheme('system');
      else setTheme('light');
    };

    const currentIcon = resolvedTheme === 'dark' ? MoonIcon : SunIcon;

    return (
      <button
        onClick={cycleTheme}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} mode`}
        title={`Current: ${theme} (${resolvedTheme})`}
      >
        <Icon icon={currentIcon} size="md" />
      </button>
    );
  }

  // Dropdown variant with all options
  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-haspopup="menu"
        aria-expanded={isDropdownOpen}
      >
        <Icon icon={resolvedTheme === 'dark' ? MoonIcon : SunIcon} size="md" />
        {showLabel && (
          <span className="text-sm font-medium">
            {theme === 'system' ? 'Auto' : theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0"
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className={`absolute right-0 mt-2 w-40 bg-popover text-popover-foreground border border-border rounded-md shadow-lg ${getZIndexClass('dropdown')}`}>
            <div className="py-1">
              <button
                onClick={() => {
                  setTheme('light');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  theme === 'light'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon icon={SunIcon} size="sm" />
                Light
              </button>
              
              <button
                onClick={() => {
                  setTheme('dark');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon icon={MoonIcon} size="sm" />
                Dark
              </button>
              
              <button
                onClick={() => {
                  setTheme('system');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  theme === 'system'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon icon={DesktopIcon} size="sm" />
                System
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

