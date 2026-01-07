/**
 * Formatters Service
 * 
 * Centralized formatting for all display values.
 * This service consolidates all formatting logic that was previously duplicated
 * across components (formatCurrency, formatPercentage, etc.).
 * 
 * USAGE RULES:
 * - Components NEVER define their own formatting functions
 * - Import this service and use the static methods
 * - Prefer hooks to provide pre-formatted values when possible
 * 
 * @example
 * import { Formatters } from '@/lib/financial';
 * 
 * // Instead of: `$${value.toFixed(2)}`
 * Formatters.currency(1234.56) // "$1,234.56"
 * 
 * // Instead of: `${(value * 100).toFixed(2)}%`
 * Formatters.percentage(0.1234, { showSign: true }) // "+12.34%"
 */

import Decimal from 'decimal.js';

export interface CurrencyOptions {
  currency?: string;
  decimals?: number;
  hideSymbol?: boolean;
  compact?: boolean; // Use compact notation (e.g., $1.2K, $5.3M)
}

export interface PercentageOptions {
  decimals?: number;
  showSign?: boolean; // Show + for positive values
  multiplier?: number; // Default 100 (0.15 → 15%). Set to 1 if already in percentage form
}

export interface NumberOptions {
  decimals?: number;
  notation?: 'standard' | 'compact'; // 1,234,567 vs 1.2M
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export class Formatters {
  
  // ==================== CURRENCY FORMATTING ====================
  
  /**
   * Format a number as currency
   * 
   * @example
   * Formatters.currency(1234.56) // "$1,234.56"
   * Formatters.currency(1234.56, { currency: 'EUR' }) // "€1,234.56"
   * Formatters.currency(1234567, { compact: true }) // "$1.23M"
   * Formatters.currency(1234.56, { hideSymbol: true }) // "1,234.56"
   */
  static currency(
    amount: number | Decimal | null | undefined,
    options: CurrencyOptions = {}
  ): string {
    if (amount === null || amount === undefined) {
      return 'N/A';
    }
    
    const {
      currency = 'USD',
      decimals = 2,
      hideSymbol = false,
      compact = false,
    } = options;
    
    const value = typeof amount === 'number' ? amount : amount.toNumber();
    
    // Handle compact notation manually for better control
    if (compact) {
      return this.formatCompactCurrency(value, currency, hideSymbol);
    }
    
    // Standard currency formatting
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: hideSymbol ? 'decimal' : 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      
      return formatter.format(value);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return hideSymbol ? value.toFixed(decimals) : `$${value.toFixed(decimals)}`;
    }
  }
  
  /**
   * Format currency in compact notation (1.2K, 5.3M, 1.2B, 2.5T)
   */
  private static formatCompactCurrency(
    value: number,
    currency: string,
    hideSymbol: boolean
  ): string {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    const symbol = hideSymbol ? '' : this.getCurrencySymbol(currency);
    
    if (absValue >= 1e12) {
      return `${sign}${symbol}${(absValue / 1e12).toFixed(2)}T`;
    }
    if (absValue >= 1e9) {
      return `${sign}${symbol}${(absValue / 1e9).toFixed(2)}B`;
    }
    if (absValue >= 1e6) {
      return `${sign}${symbol}${(absValue / 1e6).toFixed(2)}M`;
    }
    if (absValue >= 1e3) {
      return `${sign}${symbol}${(absValue / 1e3).toFixed(2)}K`;
    }
    
    return `${sign}${symbol}${absValue.toFixed(2)}`;
  }
  
  /**
   * Get currency symbol from currency code
   */
  private static getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
    };
    return symbols[currency] || '$';
  }
  
  // ==================== PERCENTAGE FORMATTING ====================
  
  /**
   * Format a number as percentage
   * 
   * @example
   * Formatters.percentage(0.1234) // "12.34%"
   * Formatters.percentage(0.1234, { showSign: true }) // "+12.34%"
   * Formatters.percentage(12.34, { multiplier: 1 }) // "12.34%" (already in percentage form)
   * Formatters.percentage(-0.05, { showSign: true }) // "-5.00%"
   */
  static percentage(
    value: number | Decimal | null | undefined,
    options: PercentageOptions = {}
  ): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    const {
      decimals = 2,
      showSign = false,
      multiplier = 100,
    } = options;
    
    const numValue = typeof value === 'number' ? value : value.toNumber();
    const percentValue = numValue * multiplier;
    
    // Add sign prefix if requested
    let sign = '';
    if (showSign && percentValue > 0) {
      sign = '+';
    }
    
    return `${sign}${percentValue.toFixed(decimals)}%`;
  }
  
  // ==================== NUMBER FORMATTING ====================
  
  /**
   * Format a number with locale formatting
   * 
   * @example
   * Formatters.number(1234567) // "1,234,567"
   * Formatters.number(1234567, { notation: 'compact' }) // "1.23M"
   * Formatters.number(1234.5678, { decimals: 2 }) // "1,234.57"
   */
  static number(
    value: number | Decimal | null | undefined,
    options: NumberOptions = {}
  ): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    const {
      decimals,
      notation = 'standard',
      minimumFractionDigits,
      maximumFractionDigits,
    } = options;
    
    const numValue = typeof value === 'number' ? value : value.toNumber();
    
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        notation,
        minimumFractionDigits: minimumFractionDigits ?? decimals,
        maximumFractionDigits: maximumFractionDigits ?? decimals,
      });
      
      return formatter.format(numValue);
    } catch (error) {
      console.error('Number formatting error:', error);
      return numValue.toFixed(decimals ?? 0);
    }
  }
  
  /**
   * Format shares/quantity with smart decimal handling
   * Shows decimals only when needed (fractional shares)
   * 
   * @example
   * Formatters.shares(100) // "100"
   * Formatters.shares(100.5) // "100.5"
   * Formatters.shares(100.532145) // "100.532145"
   */
  static shares(value: number | Decimal | null | undefined): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    const numValue = typeof value === 'number' ? value : value.toNumber();
    
    // Check if it's a whole number
    if (Number.isInteger(numValue)) {
      return numValue.toLocaleString('en-US');
    }
    
    // For fractional shares, show up to 6 decimals, trimming trailing zeros
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
  }
  
  /**
   * Format market cap with compact notation (1.2T, 500M, etc.)
   * 
   * @example
   * Formatters.marketCap('1234567890000') // "$1.23T"
   * Formatters.marketCap(5000000000) // "$5.00B"
   */
  static marketCap(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return 'N/A';
    }
    
    return this.formatCompactCurrency(numValue, 'USD', false);
  }
  
  /**
   * Format volume with compact notation (15.3M, 1.2B, etc.)
   * 
   * @example
   * Formatters.volume('15300000') // "15.3M"
   * Formatters.volume(1234567) // "1.23M"
   */
  static volume(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return 'N/A';
    }
    
    const absValue = Math.abs(numValue);
    
    if (absValue >= 1e9) {
      return `${(numValue / 1e9).toFixed(2)}B`;
    }
    if (absValue >= 1e6) {
      return `${(numValue / 1e6).toFixed(2)}M`;
    }
    if (absValue >= 1e3) {
      return `${(numValue / 1e3).toFixed(1)}K`;
    }
    
    return numValue.toLocaleString('en-US');
  }
  
  // ==================== DATE FORMATTING ====================
  
  /**
   * Format date for display
   * 
   * @example
   * Formatters.date(new Date(), 'short') // "12/29/24"
   * Formatters.date(new Date(), 'long') // "December 29, 2024"
   * Formatters.date('2024-12-29') // "Dec 29, 2024"
   */
  static date(
    date: Date | string | null | undefined,
    format: 'short' | 'long' | 'medium' = 'medium'
  ): string {
    if (!date) {
      return 'N/A';
    }
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      const options: Intl.DateTimeFormatOptions = 
        format === 'short' 
          ? { month: 'numeric', day: 'numeric', year: '2-digit' }
          : format === 'long'
          ? { month: 'long', day: 'numeric', year: 'numeric' }
          : { month: 'short', day: 'numeric', year: 'numeric' };
      
      return new Intl.DateTimeFormat('en-US', options).format(dateObj);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  }
  
  /**
   * Format date with time
   * 
   * @example
   * Formatters.dateTime(new Date()) // "Dec 29, 2024, 3:45 PM"
   */
  static dateTime(date: Date | string | null | undefined): string {
    if (!date) {
      return 'N/A';
    }
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(dateObj);
    } catch (error) {
      console.error('DateTime formatting error:', error);
      return 'Invalid Date';
    }
  }
  
  /**
   * Format relative time (e.g., "2 hours ago", "3 days ago")
   * 
   * @example
   * Formatters.relativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"
   * Formatters.relativeTime(new Date(Date.now() + 86400000)) // "in 1 day"
   */
  static relativeTime(date: Date | string | null | undefined): string {
    if (!date) {
      return 'N/A';
    }
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (Math.abs(diffSec) < 60) {
        return 'just now';
      } else if (Math.abs(diffMin) < 60) {
        return `${Math.abs(diffMin)} minute${Math.abs(diffMin) !== 1 ? 's' : ''} ago`;
      } else if (Math.abs(diffHour) < 24) {
        return `${Math.abs(diffHour)} hour${Math.abs(diffHour) !== 1 ? 's' : ''} ago`;
      } else if (Math.abs(diffDay) < 30) {
        return `${Math.abs(diffDay)} day${Math.abs(diffDay) !== 1 ? 's' : ''} ago`;
      } else {
        return this.date(dateObj, 'medium');
      }
    } catch (error) {
      console.error('Relative time formatting error:', error);
      return 'Invalid Date';
    }
  }
  
  // ==================== SPECIALIZED FORMATTING ====================
  
  /**
   * Format P&L (Profit & Loss) with sign and color indicator
   * Returns object with formatted value and color class
   * 
   * @example
   * Formatters.pnl(1234.56) // { value: "+$1,234.56", colorClass: "text-chart-positive" }
   * Formatters.pnl(-500) // { value: "-$500.00", colorClass: "text-chart-negative" }
   */
  static pnl(value: number | Decimal | null | undefined): {
    value: string;
    colorClass: string;
  } {
    if (value === null || value === undefined) {
      return { value: 'N/A', colorClass: 'text-muted-foreground' };
    }
    
    const numValue = typeof value === 'number' ? value : value.toNumber();
    const isPositive = numValue >= 0;
    
    return {
      value: this.currency(Math.abs(numValue), { hideSymbol: false }),
      colorClass: isPositive ? 'text-chart-positive' : 'text-chart-negative',
    };
  }
  
  /**
   * Format change percentage with sign and color
   * 
   * @example
   * Formatters.changePercent(0.1234) // { value: "+12.34%", colorClass: "text-chart-positive" }
   */
  static changePercent(value: number | Decimal | null | undefined): {
    value: string;
    colorClass: string;
  } {
    if (value === null || value === undefined) {
      return { value: 'N/A', colorClass: 'text-muted-foreground' };
    }
    
    const numValue = typeof value === 'number' ? value : value.toNumber();
    const isPositive = numValue >= 0;
    
    return {
      value: this.percentage(numValue, { showSign: true }),
      colorClass: isPositive ? 'text-chart-positive' : 'text-chart-negative',
    };
  }
  
  /**
   * Format price with smart decimal handling
   * Shows 2-4 decimals based on price magnitude
   * 
   * @example
   * Formatters.price(123.45) // "$123.45"
   * Formatters.price(0.0012) // "$0.0012"
   */
  static price(value: number | Decimal | null | undefined, currency: string = 'USD'): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    const numValue = typeof value === 'number' ? value : value.toNumber();
    const absValue = Math.abs(numValue);
    
    // Determine decimal places based on price
    let decimals = 2; // Default for most stocks
    
    if (absValue < 0.01) {
      decimals = 4; // Penny stocks / crypto
    } else if (absValue < 1) {
      decimals = 3;
    }
    
    return this.currency(numValue, { currency, decimals });
  }
  
  /**
   * Format large numbers in abbreviated form
   * Similar to marketCap but without currency symbol
   * 
   * @example
   * Formatters.abbreviateNumber(1234567) // "1.23M"
   */
  static abbreviateNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (absValue >= 1e12) {
      return `${sign}${(absValue / 1e12).toFixed(2)}T`;
    }
    if (absValue >= 1e9) {
      return `${sign}${(absValue / 1e9).toFixed(2)}B`;
    }
    if (absValue >= 1e6) {
      return `${sign}${(absValue / 1e6).toFixed(2)}M`;
    }
    if (absValue >= 1e3) {
      return `${sign}${(absValue / 1e3).toFixed(2)}K`;
    }
    
    return `${sign}${absValue.toFixed(0)}`;
  }
  
  /**
   * Format a number with sign prefix (+ for positive, - for negative)
   * Useful for displaying price changes, gains/losses
   * 
   * @example
   * Formatters.signedNumber(2.5, { decimals: 2 }) // "+2.50"
   * Formatters.signedNumber(-1.3, { decimals: 2 }) // "-1.30"
   * Formatters.signedNumber(0, { decimals: 2 }) // "0.00"
   */
  static signedNumber(
    value: number | Decimal | null | undefined,
    options: { decimals?: number } = {}
  ): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    const { decimals = 2 } = options;
    const numValue = typeof value === 'number' ? value : value.toNumber();
    
    // Add sign prefix
    const sign = numValue > 0 ? '+' : numValue < 0 ? '' : ''; // negative sign is automatic
    
    return `${sign}${numValue.toFixed(decimals)}`;
  }
  
  /**
   * Alias for compactNumber - formats large numbers
   * 
   * @example
   * Formatters.compactNumber(1234567890) // "1.23B"
   */
  static compactNumber(value: number | null | undefined): string {
    return this.abbreviateNumber(value);
  }
}
