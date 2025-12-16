'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to resolve CSS variables into actual color values for Recharts.
 * Recharts component props (stroke, fill) don't reliably resolve CSS custom properties,
 * so we need to read the computed values at runtime.
 */
export function useChartColors() {
  const [colors, setColors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const resolveColors = () => {
      if (typeof window === 'undefined') return;
      
      const style = getComputedStyle(document.documentElement);
      
      // Resolve all chart color tokens
      const resolved: Record<string, string> = {};
      for (let i = 1; i <= 6; i++) {
        const value = style.getPropertyValue(`--chart-${i}`).trim();
        if (value) {
          resolved[`chart-${i}`] = `hsl(${value})`;
        }
      }
      
      // Resolve special chart colors
      const positive = style.getPropertyValue('--chart-positive').trim();
      if (positive) resolved['chart-positive'] = `hsl(${positive})`;
      
      const negative = style.getPropertyValue('--chart-negative').trim();
      if (negative) resolved['chart-negative'] = `hsl(${negative})`;
      
      // Resolve semantic colors
      const tokens = [
        'background', 'foreground', 'muted', 'muted-foreground',
        'border', 'primary', 'primary-foreground', 'card', 'card-foreground'
      ];
      
      tokens.forEach(token => {
        const value = style.getPropertyValue(`--${token}`).trim();
        if (value) {
          resolved[token] = `hsl(${value})`;
        }
      });
      
      setColors(resolved);
    };
    
    resolveColors();
    
    // Re-resolve on theme change (listen to .dark class changes on html)
    const observer = new MutationObserver(resolveColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  return { colors, mounted };
}
