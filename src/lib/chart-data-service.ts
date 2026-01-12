/**
 * ChartDataService
 * 
 * Handles all chart-specific data transformations and calculations.
 * This service is responsible for:
 * - Date range calculations (fixing month overflow bugs)
 * - Chart data transformation and formatting
 * - Data deduplication for daily intervals
 * - Date label formatting based on timeframe
 * 
 * USAGE:
 * - Used by useAssetChartData hook
 * - Never imported directly in components
 * 
 * @example
 * const { startDate, endDate } = ChartDataService.calculateDateRange('1mo');
 * const transformed = ChartDataService.transformChartData(rawData, '1d', '1mo');
 */

import type { 
  RawChartData, 
  ChartDataPoint, 
  TimeframeConfig 
} from '@/types';

export class ChartDataService {
  
  // ==================== TIMEFRAME CONFIGURATION ====================
  
  /**
   * Predefined timeframe configurations with correct date ranges
   */
  static readonly TIMEFRAMES: TimeframeConfig[] = [
    { value: '1d', label: '1D', interval: '15m', days: 1 },
    { value: '5d', label: '5D', interval: '1h', days: 5 },
    { value: '1mo', label: '1M', interval: '1d', days: 30 },
    { value: '3mo', label: '3M', interval: '1d', days: 90 },
    { value: '6mo', label: '6M', interval: '1d', days: 180 },
    { value: '1y', label: '1Y', interval: '1d', days: 365 },
    { value: '5y', label: '5Y', interval: '1d', days: 365 * 5 },
  ];
  
  /**
   * Get timeframe configuration by value
   */
  static getTimeframeConfig(timeframe: string): TimeframeConfig {
    const config = this.TIMEFRAMES.find(tf => tf.value === timeframe);
    if (!config) {
      console.warn(`Unknown timeframe: ${timeframe}, defaulting to 1mo`);
      return this.TIMEFRAMES[2]; // Default to 1mo
    }
    return config;
  }
  
  // ==================== DATE RANGE CALCULATION ====================
  
  /**
   * Calculate date range for a given timeframe
   * 
   * FIXES:
   * - No month overflow bugs (using millisecond arithmetic)
   * - Consistent day counting
   * - Proper date cloning to avoid mutation
   * 
   * @param timeframe - Timeframe identifier (e.g., '1mo', '1y')
   * @returns Object with startDate and endDate
   * 
   * @example
   * const { startDate, endDate } = ChartDataService.calculateDateRange('1mo');
   * // Returns dates exactly 30 days apart
   */
  static calculateDateRange(timeframe: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    
    const config = this.getTimeframeConfig(timeframe);
    
    // Use millisecond arithmetic for accurate date calculation
    // 1 day = 24 * 60 * 60 * 1000 milliseconds
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const millisecondsToSubtract = config.days * millisecondsPerDay;
    
    startDate.setTime(endDate.getTime() - millisecondsToSubtract);
    
    return { startDate, endDate };
  }
  
  // ==================== DATA TRANSFORMATION ====================
  
  /**
   * Transform raw API chart data into chart-ready format
   * 
   * Handles:
   * - Filtering out null/invalid data points
   * - Date formatting based on interval
   * - Data deduplication for daily intervals
   * - Sorting by timestamp
   * 
   * @param rawData - Raw chart data from API
   * @param interval - Data interval (e.g., '1d', '1h', '15m')
   * @param timeframe - Selected timeframe (for formatting decisions)
   * @returns Array of transformed chart data points
   */
  static transformChartData(
    rawData: RawChartData[],
    interval: string,
    timeframe: string
  ): ChartDataPoint[] {
    // Filter out invalid data points
    const validData = rawData.filter((item) => 
      item.close !== null && 
      item.open !== null && 
      item.high !== null && 
      item.low !== null
    );
    
    // Transform to chart format
    const transformed = validData.map((item) => {
      const date = new Date(item.date);
      
      // Handle volume: can be string, bigint, or null
      let volumeNumber = 0;
      if (item.volume !== null) {
        if (typeof item.volume === 'bigint') {
          volumeNumber = Number(item.volume);
        } else if (typeof item.volume === 'string') {
          volumeNumber = parseInt(item.volume, 10);
        } else {
          volumeNumber = item.volume;
        }
      }
      
      return {
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        timestamp: date.getTime(),
        open: item.open || 0,
        high: item.high || 0,
        low: item.low || 0,
        close: item.close || 0,
        volume: volumeNumber,
        originalDate: date, // Temporary field for formatting
      };
    });
    
    // Deduplicate daily data (keep latest timestamp for each date)
    const deduplicated = this.deduplicateDailyData(transformed, interval, timeframe);
    
    // Add formatted date labels
    const withFormattedDates = deduplicated.map((item: any) => ({
      ...item,
      formattedDate: this.formatChartDate(item.originalDate, interval, timeframe),
    }));
    
    // Remove temporary originalDate field and sort
    return withFormattedDates
      .map(({ originalDate, ...rest }: any) => rest)
      .sort((a, b) => a.timestamp - b.timestamp);
  }
  
  /**
   * Deduplicate daily data points
   * 
   * For daily intervals (1d), the API sometimes returns multiple data points
   * for the same calendar day. This method keeps only the latest one.
   * 
   * @param data - Transformed data with originalDate field
   * @param interval - Data interval
   * @param timeframe - Selected timeframe
   * @returns Deduplicated data
   */
  private static deduplicateDailyData(
    data: any[],
    interval: string,
    timeframe: string
  ): any[] {
    // Only deduplicate for daily intervals on longer timeframes
    const shouldDeduplicate = 
      interval === '1d' && 
      ['1mo', '3mo', '6mo', '1y', '5y'].includes(timeframe);
    
    if (!shouldDeduplicate) {
      return data;
    }
    
    // Group by date and keep latest timestamp
    const dateMap = new Map<string, any>();
    
    data.forEach((item) => {
      const existing = dateMap.get(item.date);
      if (!existing || item.timestamp > existing.timestamp) {
        dateMap.set(item.date, item);
      }
    });
    
    return Array.from(dateMap.values());
  }
  
  /**
   * Format date for chart X-axis based on interval and timeframe
   * 
   * Rules:
   * - Intraday (15m, 1h): Show "Mon 15\n3:45 PM" (date + time)
   * - 1D timeframe: Show time only "3:45 PM"
   * - Daily intervals: Show date only "Mon 15"
   * 
   * @param date - Date object to format
   * @param interval - Data interval
   * @param timeframe - Selected timeframe
   * @returns Formatted date string
   */
  private static formatChartDate(
    date: Date,
    interval: string,
    timeframe: string
  ): string {
    // Intraday intervals (15m, 1h)
    if (interval.includes('m') || interval.includes('h')) {
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return `${dateStr}\n${timeStr}`;
    }
    
    // 1D timeframe: show time only
    if (timeframe === '1d') {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Daily intervals: show date only
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // ==================== CALCULATIONS ====================
  
  /**
   * Calculate price change and percent change
   * 
   * @param data - Chart data points
   * @param currentPrice - Current asset price (fallback for last price)
   * @returns Object with change and percent values
   */
  static calculatePriceChange(
    data: ChartDataPoint[],
    currentPrice: number
  ): { change: number; percent: number } {
    if (data.length < 2) {
      return { change: 0, percent: 0 };
    }
    
    const firstPrice = data[0]?.close || 0;
    const lastPrice = data[data.length - 1]?.close || currentPrice;
    const change = lastPrice - firstPrice;
    const percent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;
    
    return { change, percent };
  }
  
  /**
   * Calculate Y-axis domain with proper padding
   * Uses ChartUtils for the calculation
   * 
   * @param data - Chart data points
   * @returns Tuple of [min, max] for Y-axis
   */
  static calculateYAxisDomain(data: ChartDataPoint[]): [number, number] {
    if (data.length === 0) {
      return [0, 100];
    }
    
    // Get all price points (high and low)
    const prices = data.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    return [
      minPrice - priceRange * 0.1, // 10% padding below
      maxPrice + priceRange * 0.1  // 10% padding above
    ];
  }
  
  /**
   * Validate chart data for errors
   * 
   * @param data - Chart data points
   * @returns True if data is valid
   */
  static validateChartData(data: ChartDataPoint[]): boolean {
    if (!data || data.length === 0) {
      return false;
    }
    
    // Check if all required fields are present and valid
    return data.every(point => 
      typeof point.close === 'number' &&
      typeof point.open === 'number' &&
      typeof point.high === 'number' &&
      typeof point.low === 'number' &&
      !isNaN(point.close) &&
      !isNaN(point.open) &&
      !isNaN(point.high) &&
      !isNaN(point.low)
    );
  }
}
