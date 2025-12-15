'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider wraps next-themes to provide dark mode support
 * 
 * Features:
 * - System preference detection (light/dark/auto)
 * - Manual theme switching
 * - Persistent user preference in localStorage
 * - No flash on page load
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}

