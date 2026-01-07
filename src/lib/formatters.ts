/**
 * Centralized Formatting Utilities
 * 
 * Display formatting functions for currency, percentages, and numbers.
 * These are acceptable per Rule 5 (Display Math) and should be used
 * consistently across all components.
 */

/**
 * Format a number as currency
 * @param value - The numeric value to format
 * @param currency - The currency code (default: 'USD')
 * @param options - Additional Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Format a number as a percentage
 * @param value - The decimal value to format (e.g., 0.05 for 5%)
 * @param options - Formatting options
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  options?: {
    showSign?: boolean;
    decimals?: number;
  }
): string {
  const { showSign = false, decimals = 2 } = options || {};
  const sign = showSign && value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a currency change value with sign
 * @param value - The change value
 * @param currency - The currency code (default: 'USD')
 * @returns Formatted change string with sign
 */
export function formatChange(
  value: number,
  currency: string = 'USD'
): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatCurrency(value, currency)}`;
}

/**
 * Get the appropriate color class for a change value
 * @param value - The change value (can be null)
 * @returns Tailwind CSS color class
 */
export function getChangeColor(value: number | null): string {
  if (value === null || value === 0) {
    return 'text-muted-foreground';
  }
  return value > 0 
    ? 'text-chart-positive' 
    : 'text-chart-negative';
}

/**
 * Format a large number with abbreviations (K, M, B, T)
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with abbreviation
 */
export function formatLargeNumber(
  value: number,
  decimals: number = 1
): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1e12) {
    return `${sign}${(absValue / 1e12).toFixed(decimals)}T`;
  }
  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(decimals)}B`;
  }
  if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(decimals)}M`;
  }
  if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(decimals)}K`;
  }
  return `${sign}${absValue.toFixed(decimals)}`;
}

/**
 * Format a number with locale-specific separators
 * @param value - The number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Format shares/quantity with smart precision
 * - Whole numbers for >= 1 share
 * - Up to 6 decimals for fractional shares
 * @param quantity - The share quantity
 * @returns Formatted quantity string
 */
export function formatShares(quantity: number): string {
  if (quantity >= 1) {
    return quantity.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  return quantity.toFixed(6).replace(/\.?0+$/, '');
}

/**
 * Format a date relative to now (e.g., "2 hours ago", "3 days ago")
 * @param date - The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

/**
 * Format a date as a short date string
 * @param date - The date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(dateObj);
}

/**
 * Format a compact date (no year if current year)
 * @param date - The date to format
 * @returns Compact formatted date string
 */
export function formatCompactDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const isSameYear = dateObj.getFullYear() === now.getFullYear();
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(isSameYear ? {} : { year: 'numeric' }),
  }).format(dateObj);
}
