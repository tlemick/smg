/**
 * Asset Display Service
 * 
 * Business logic for asset display transformations.
 * Keeps display logic out of components but separate from pure formatters.
 * 
 * Architecture Compliance:
 * - Pure functions (no React dependencies)
 * - Testable without mocking
 * - Single responsibility (asset display logic only)
 * - Used by hooks to transform data before passing to components
 * 
 * @example
 * const label = AssetDisplayService.getMarketStateLabel('REGULAR'); // "Market Open"
 * const color = AssetDisplayService.getMarketStateColor('CLOSED'); // "bg-red-400"
 */

export class AssetDisplayService {
  /**
   * Get human-readable label for market state
   */
  static getMarketStateLabel(state?: string): string {
    switch (state) {
      case 'REGULAR':
        return 'Market Open';
      case 'PRE':
        return 'Pre-Market';
      case 'POST':
        return 'After Hours';
      case 'CLOSED':
        return 'Market Closed';
      default:
        return '';
    }
  }

  /**
   * Get Tailwind color class for market state indicator dot
   */
  static getMarketStateColor(state?: string): string {
    switch (state) {
      case 'REGULAR':
        return 'bg-green-400';
      case 'PRE':
      case 'POST':
        return 'bg-yellow-400';
      case 'CLOSED':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  }

  /**
   * Get human-readable label for asset type
   */
  static getAssetTypeLabel(type: string): string {
    switch (type) {
      case 'STOCK':
        return 'Stock';
      case 'ETF':
        return 'ETF';
      case 'MUTUAL_FUND':
        return 'Mutual Fund';
      case 'BOND':
        return 'Bond';
      case 'INDEX':
        return 'Index Fund';
      default:
        // Fallback: replace underscores with spaces and title case
        return type.replace(/_/g, ' ');
    }
  }

  /**
   * Get Tailwind color class for price change (positive/negative/neutral)
   */
  static getPriceChangeColor(change?: number | null): string {
    if (change === null || change === undefined) {
      return 'text-gray-600';
    }
    
    if (change > 0) {
      return 'text-green-600';
    } else if (change < 0) {
      return 'text-red-600';
    } else {
      return 'text-gray-600';
    }
  }

  /**
   * Validate that price change values are valid numbers
   * Returns true if both values are valid and can be displayed
   */
  static isValidPriceChange(
    change: number | null | undefined,
    percent: number | null | undefined
  ): boolean {
    return (
      change !== null &&
      change !== undefined &&
      !isNaN(change) &&
      percent !== null &&
      percent !== undefined &&
      !isNaN(percent)
    );
  }

  /**
   * Get badge variant for asset type
   * Can be used with Badge component
   */
  static getAssetTypeBadgeVariant(type: string): 'default' | 'secondary' | 'outline' {
    switch (type) {
      case 'STOCK':
        return 'default';
      case 'ETF':
      case 'INDEX':
        return 'secondary';
      case 'MUTUAL_FUND':
      case 'BOND':
        return 'outline';
      default:
        return 'outline';
    }
  }

  /**
   * Determine if asset supports fractional shares
   * (This could be expanded with more business logic)
   */
  static supportsFractionalShares(type: string): boolean {
    // Most modern brokers support fractional shares for stocks and ETFs
    return type === 'STOCK' || type === 'ETF';
  }

  /**
   * Get appropriate icon name for asset type
   * (For use with icon libraries)
   */
  static getAssetTypeIcon(type: string): string {
    switch (type) {
      case 'STOCK':
        return 'chart-line';
      case 'ETF':
        return 'chart-bar';
      case 'MUTUAL_FUND':
        return 'building-library';
      case 'BOND':
        return 'document-text';
      case 'INDEX':
        return 'chart-pie';
      default:
        return 'currency-dollar';
    }
  }
}
