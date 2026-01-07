/**
 * ChartUtils Service
 * 
 * Provides chart-specific calculations and utilities.
 * These are display/visualization helpers, not financial calculations.
 * 
 * USAGE:
 * - Y-domain calculation for proper chart scaling
 * - Date marker generation for timeline visualization
 * - Reusable across all chart components
 * 
 * @example
 * const yDomain = ChartUtils.calculateYDomain([10, 20, -5, 15]);
 * const markers = ChartUtils.generateDateMarkers(startDate, endDate, 4);
 */

export interface DateMarker {
  date: string;           // Formatted date string for matching with chart data
  label: string;          // Display label (e.g., "Jan 15")
  isStart: boolean;       // Whether this is the start marker
}

export class ChartUtils {
  
  // ==================== Y-AXIS DOMAIN CALCULATION ====================
  
  /**
   * Calculate optimal Y-axis domain for chart with padding
   * 
   * @param dataPoints - Array of numeric values from all series
   * @param paddingPercent - Percentage of range to add as padding (default 0.1 = 10%)
   * @returns Tuple of [min, max] for Y-axis domain
   * 
   * @example
   * const values = [10, 20, -5, 15];
   * ChartUtils.calculateYDomain(values) // [-7, 22]
   */
  static calculateYDomain(
    dataPoints: number[],
    paddingPercent: number = 0.1
  ): [number, number] {
    if (dataPoints.length === 0) {
      return [0, 0];
    }
    
    const validPoints = dataPoints.filter(n => Number.isFinite(n));
    
    if (validPoints.length === 0) {
      return [-5, 5]; // Default range if no valid data
    }
    
    const min = Math.min(...validPoints);
    const max = Math.max(...validPoints);
    
    // Calculate padding based on range
    const range = max - min;
    const padding = Math.max(1, range * paddingPercent);
    
    return [
      Math.floor(min - padding),
      Math.ceil(max + padding)
    ];
  }
  
  // ==================== DATE MARKER GENERATION ====================
  
  /**
   * Generate evenly-spaced date markers for chart X-axis
   * 
   * Creates a start marker plus intermediate markers for timeline visualization.
   * Useful for displaying date labels on charts without cluttering.
   * 
   * @param startDate - Start date of timeline
   * @param endDate - End date of timeline
   * @param maxIntermediateMarkers - Maximum number of intermediate markers (default 4)
   * @returns Array of date markers with formatted labels
   * 
   * @example
   * const start = new Date('2024-01-01');
   * const end = new Date('2024-01-31');
   * ChartUtils.generateDateMarkers(start, end, 4)
   * // Returns markers at start + ~4 evenly spaced dates
   */
  static generateDateMarkers(
    startDate: Date,
    endDate: Date,
    maxIntermediateMarkers: number = 4
  ): DateMarker[] {
    const markers: DateMarker[] = [];
    
    // Add start date marker
    markers.push({
      date: startDate.toLocaleDateString(),
      label: startDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      isStart: true,
    });
    
    // Calculate intermediate markers
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const daysDiff = Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24));
    
    // Determine number of markers based on timeline length
    // One marker every ~2 weeks, max 4 markers
    const numMarkers = Math.min(
      maxIntermediateMarkers, 
      Math.max(2, Math.floor(daysDiff / 14))
    );
    
    if (numMarkers > 0 && daysDiff > 0) {
      const interval = daysDiff / (numMarkers + 1);
      
      for (let i = 1; i <= numMarkers; i++) {
        const markerTime = startTime + (interval * i * 24 * 60 * 60 * 1000);
        const markerDate = new Date(markerTime);
        
        markers.push({
          date: markerDate.toLocaleDateString(),
          label: markerDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          isStart: false,
        });
      }
    }
    
    return markers;
  }
  
  /**
   * Generate date markers from data points
   * Convenience method when you have chart data with date fields
   * 
   * @param dataPoints - Array of objects with date fields
   * @param startDate - Start date for timeline
   * @param maxIntermediateMarkers - Maximum number of intermediate markers
   * @returns Array of date markers
   */
  static generateDateMarkersFromData<T extends { dateObj?: Date; date?: string }>(
    dataPoints: T[],
    startDate: Date,
    maxIntermediateMarkers: number = 4
  ): DateMarker[] {
    if (dataPoints.length === 0) {
      return [];
    }
    
    // Find end date from data
    const lastPoint = dataPoints[dataPoints.length - 1];
    const endDate = lastPoint?.dateObj 
      || (lastPoint?.date ? new Date(lastPoint.date) : new Date());
    
    return this.generateDateMarkers(startDate, endDate, maxIntermediateMarkers);
  }
  
  // ==================== COLOR UTILITIES ====================
  
  /**
   * Get color class based on value (positive/negative)
   * Useful for P&L, returns, changes
   * 
   * @param value - Numeric value to evaluate
   * @returns Tailwind color class
   */
  static getValueColorClass(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return 'text-muted-foreground';
    }
    return value >= 0 ? 'text-chart-positive' : 'text-chart-negative';
  }
  
  /**
   * Format chart data point for tooltip display
   * Extracts the last valid value from a series
   * 
   * @param series - Array of values (may contain nulls)
   * @returns Last valid number or null
   */
  static getLastValidValue(series: Array<number | null>): number | null {
    for (let i = series.length - 1; i >= 0; i--) {
      const value = series[i];
      if (value !== null && Number.isFinite(value)) {
        return value;
      }
    }
    return null;
  }
}
