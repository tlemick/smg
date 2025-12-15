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
      <div className="w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
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
        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
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
        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
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
          <div className={`absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg ${getZIndexClass('dropdown')}`}>
            <div className="py-1">
              <button
                onClick={() => {
                  setTheme('light');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  theme === 'light'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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

