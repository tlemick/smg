/**
 * FinancialCalculators Service
 * 
 * Complex financial calculations for portfolios, positions, and orders.
 * All calculations use FinancialMath for precision.
 * 
 * USAGE RULES:
 * - Components NEVER perform calculations directly
 * - Hooks call these calculators and pass results to components
 * - All calculations return numeric values (not formatted strings)
 * - Use Formatters service for display formatting
 * 
 * @example
 * // In a hook:
 * const metrics = FinancialCalculators.calculatePositionMetrics(
 *   holding,
 *   currentPrice
 * );
 * 
 * // Returns: { currentValue: number, unrealizedPnL: number, ... }
 */

import Decimal from 'decimal.js';
import { FinancialMath } from './financial-math';

// ==================== TYPE DEFINITIONS ====================

export interface Holding {
  quantity: number;
  averagePrice: number;
  asset?: {
    id: number;
    ticker: string;
    type: string;
  };
}

export interface PortfolioMetrics {
  totalValue: number;
  cashValue: number;
  investedValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  cashPercent: number;
  equityPercent: number;
}

export interface PositionMetrics {
  quantity: number;
  costBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface OrderCost {
  shares: number;
  pricePerShare: number;
  subtotal: number;
  fees: number;
  total: number;
  breakdown: {
    commissionFee: number;
    regulatoryFees: number;
  };
}

export interface AllocationBreakdown {
  byAssetType: Record<string, number>;
  byAsset: Record<string, number>;
}

export class FinancialCalculators {
  
  // ==================== PORTFOLIO CALCULATIONS ====================
  
  /**
   * Calculate comprehensive portfolio metrics
   * 
   * @param holdings - Array of user holdings with quantity and current price
   * @param cash - Current cash balance
   * @returns Portfolio metrics including total value, P&L, and allocation percentages
   */
  static calculatePortfolioMetrics(
    holdings: Array<{ quantity: number; averagePrice: number; currentPrice: number }>,
    cash: number
  ): PortfolioMetrics {
    // Calculate total invested value (cost basis)
    let totalCostBasis = new Decimal(0);
    let totalCurrentValue = new Decimal(0);
    
    for (const holding of holdings) {
      const costBasis = FinancialMath.multiply(holding.quantity, holding.averagePrice);
      const currentValue = FinancialMath.multiply(holding.quantity, holding.currentPrice);
      
      totalCostBasis = FinancialMath.add(totalCostBasis, costBasis);
      totalCurrentValue = FinancialMath.add(totalCurrentValue, currentValue);
    }
    
    // Add cash to get total portfolio value
    const cashDec = new Decimal(cash);
    const totalValue = FinancialMath.add(totalCurrentValue, cashDec);
    
    // Calculate unrealized P&L
    const unrealizedPnL = FinancialMath.subtract(totalCurrentValue, totalCostBasis);
    const unrealizedPnLPercent = totalCostBasis.greaterThan(0)
      ? FinancialMath.divide(unrealizedPnL, totalCostBasis)
      : new Decimal(0);
    
    // Calculate allocation percentages
    const cashPercent = totalValue.greaterThan(0)
      ? FinancialMath.divide(cashDec, totalValue)
      : new Decimal(0);
    
    const equityPercent = totalValue.greaterThan(0)
      ? FinancialMath.divide(totalCurrentValue, totalValue)
      : new Decimal(0);
    
    return {
      totalValue: totalValue.toNumber(),
      cashValue: cash,
      investedValue: totalCurrentValue.toNumber(),
      unrealizedPnL: unrealizedPnL.toNumber(),
      unrealizedPnLPercent: unrealizedPnLPercent.toNumber(),
      cashPercent: cashPercent.toNumber(),
      equityPercent: equityPercent.toNumber(),
    };
  }
  
  /**
   * Calculate metrics for a single position/holding
   * 
   * @param holding - Holding with quantity and average price
   * @param currentPrice - Current market price
   * @param previousClose - Previous day's close price (optional, for day change)
   * @returns Position metrics including current value, P&L, and day change
   */
  static calculatePositionMetrics(
    holding: { quantity: number; averagePrice: number },
    currentPrice: number,
    previousClose?: number
  ): PositionMetrics {
    const quantity = holding.quantity;
    const avgPrice = holding.averagePrice;
    
    // Calculate cost basis and current value
    const costBasis = FinancialMath.multiply(quantity, avgPrice);
    const currentValue = FinancialMath.multiply(quantity, currentPrice);
    
    // Calculate unrealized P&L
    const unrealizedPnL = FinancialMath.subtract(currentValue, costBasis);
    const unrealizedPnLPercent = costBasis.greaterThan(0)
      ? FinancialMath.divide(unrealizedPnL, costBasis)
      : new Decimal(0);
    
    // Calculate day change (if previous close provided)
    let dayChange = new Decimal(0);
    let dayChangePercent = new Decimal(0);
    
    if (previousClose !== undefined) {
      const prevValue = FinancialMath.multiply(quantity, previousClose);
      dayChange = FinancialMath.subtract(currentValue, prevValue);
      
      if (prevValue.greaterThan(0)) {
        dayChangePercent = FinancialMath.divide(dayChange, prevValue);
      }
    }
    
    return {
      quantity,
      costBasis: costBasis.toNumber(),
      currentPrice,
      currentValue: currentValue.toNumber(),
      unrealizedPnL: unrealizedPnL.toNumber(),
      unrealizedPnLPercent: unrealizedPnLPercent.toNumber(),
      dayChange: dayChange.toNumber(),
      dayChangePercent: dayChangePercent.toNumber(),
    };
  }
  
  // ==================== ORDER CALCULATIONS ====================
  
  /**
   * Calculate order cost including fees
   * 
   * @param shares - Number of shares
   * @param pricePerShare - Price per share
   * @param orderType - 'BUY' or 'SELL' (affects fee calculation)
   * @returns Order cost breakdown with fees
   */
  static calculateOrderCost(
    shares: number,
    pricePerShare: number,
    orderType: 'BUY' | 'SELL' = 'BUY'
  ): OrderCost {
    const subtotal = FinancialMath.multiply(shares, pricePerShare);
    
    // Fee structure (educational, simplified)
    const commissionFee = 0; // Most modern brokers are commission-free
    const regulatoryFees = orderType === 'SELL' 
      ? FinancialMath.multiply(subtotal, 0.0000229).toNumber() // SEC fee for sells only
      : 0;
    
    const totalFees = new Decimal(commissionFee + regulatoryFees);
    const total = FinancialMath.add(subtotal, totalFees);
    
    return {
      shares,
      pricePerShare,
      subtotal: subtotal.toNumber(),
      fees: totalFees.toNumber(),
      total: total.toNumber(),
      breakdown: {
        commissionFee,
        regulatoryFees,
      },
    };
  }
  
  /**
   * Calculate shares from dollar amount
   * 
   * @param dollarAmount - Dollar amount to invest
   * @param pricePerShare - Price per share
   * @param allowFractional - Whether fractional shares are allowed
   * @returns Number of shares (fractional or whole)
   */
  static calculateSharesFromDollars(
    dollarAmount: number,
    pricePerShare: number,
    allowFractional: boolean = true
  ): number {
    if (pricePerShare <= 0) {
      return 0;
    }
    
    const shares = FinancialMath.divide(dollarAmount, pricePerShare);
    
    if (allowFractional) {
      return shares.toNumber();
    }
    
    // Round down to whole shares if fractional not allowed
    return Math.floor(shares.toNumber());
  }
  
  /**
   * Calculate maximum shares affordable with available cash
   * 
   * @param cashAvailable - Available cash balance
   * @param pricePerShare - Price per share
   * @param allowFractional - Whether fractional shares are allowed
   * @param fees - Optional fees to account for
   * @returns Maximum shares that can be purchased
   */
  static calculateMaxShares(
    cashAvailable: number,
    pricePerShare: number,
    allowFractional: boolean = true,
    fees: number = 0
  ): number {
    if (pricePerShare <= 0) {
      return 0;
    }
    
    // Account for fees
    const availableForShares = FinancialMath.subtract(cashAvailable, fees);
    
    if (availableForShares.lessThanOrEqualTo(0)) {
      return 0;
    }
    
    return this.calculateSharesFromDollars(
      availableForShares.toNumber(),
      pricePerShare,
      allowFractional
    );
  }
  
  // ==================== ALLOCATION CALCULATIONS ====================
  
  /**
   * Calculate portfolio allocation breakdown by asset type and individual assets
   * 
   * @param holdings - Array of holdings with type and current value
   * @returns Allocation percentages by asset type and by individual asset
   */
  static calculateAllocationBreakdown(
    holdings: Array<{ 
      asset: { id: number; ticker: string; type: string }; 
      currentValue: number 
    }>
  ): AllocationBreakdown {
    // Calculate total portfolio value
    const totalValue = holdings.reduce(
      (sum, h) => FinancialMath.add(sum, h.currentValue),
      new Decimal(0)
    );
    
    if (totalValue.isZero()) {
      return {
        byAssetType: {},
        byAsset: {},
      };
    }
    
    // Calculate allocation by asset type
    const byAssetType: Record<string, Decimal> = {};
    const byAsset: Record<string, Decimal> = {};
    
    for (const holding of holdings) {
      const assetType = holding.asset.type;
      const ticker = holding.asset.ticker;
      const value = new Decimal(holding.currentValue);
      const percent = FinancialMath.divide(value, totalValue);
      
      // Aggregate by asset type
      if (!byAssetType[assetType]) {
        byAssetType[assetType] = new Decimal(0);
      }
      byAssetType[assetType] = FinancialMath.add(byAssetType[assetType], percent);
      
      // Track individual assets
      byAsset[ticker] = percent;
    }
    
    // Convert Decimals to numbers
    const byAssetTypeNumbers: Record<string, number> = {};
    for (const [type, percent] of Object.entries(byAssetType)) {
      byAssetTypeNumbers[type] = percent.toNumber();
    }
    
    const byAssetNumbers: Record<string, number> = {};
    for (const [ticker, percent] of Object.entries(byAsset)) {
      byAssetNumbers[ticker] = percent.toNumber();
    }
    
    return {
      byAssetType: byAssetTypeNumbers,
      byAsset: byAssetNumbers,
    };
  }
  
  /**
   * Calculate target allocation rebalancing suggestions
   * 
   * @param currentAllocations - Current allocation percentages by asset type
   * @param targetAllocations - Target allocation percentages by asset type
   * @param totalPortfolioValue - Total portfolio value
   * @returns Suggested dollar amounts to buy/sell for each asset type
   */
  static calculateRebalancingSuggestions(
    currentAllocations: Record<string, number>,
    targetAllocations: Record<string, number>,
    totalPortfolioValue: number
  ): Record<string, { currentDollars: number; targetDollars: number; adjustDollars: number }> {
    const suggestions: Record<string, any> = {};
    const portfolioValue = new Decimal(totalPortfolioValue);
    
    // Get all asset types (union of current and target)
    const allTypes = new Set([
      ...Object.keys(currentAllocations),
      ...Object.keys(targetAllocations),
    ]);
    
    for (const assetType of allTypes) {
      const currentPercent = currentAllocations[assetType] || 0;
      const targetPercent = targetAllocations[assetType] || 0;
      
      const currentDollars = FinancialMath.multiply(portfolioValue, currentPercent);
      const targetDollars = FinancialMath.multiply(portfolioValue, targetPercent);
      const adjustDollars = FinancialMath.subtract(targetDollars, currentDollars);
      
      suggestions[assetType] = {
        currentDollars: currentDollars.toNumber(),
        targetDollars: targetDollars.toNumber(),
        adjustDollars: adjustDollars.toNumber(),
      };
    }
    
    return suggestions;
  }
  
  // ==================== RETURN CALCULATIONS ====================
  
  /**
   * Calculate annualized return
   * 
   * @param initialValue - Initial investment value
   * @param finalValue - Final investment value
   * @param days - Number of days held
   * @returns Annualized return as decimal (e.g., 0.12 = 12% annually)
   */
  static calculateAnnualizedReturn(
    initialValue: number,
    finalValue: number,
    days: number
  ): number {
    if (initialValue <= 0 || days <= 0) {
      return 0;
    }
    
    // Annualized return = ((final / initial) ^ (365 / days)) - 1
    const ratio = FinancialMath.divide(finalValue, initialValue).toNumber();
    const years = days / 365;
    const annualizedReturn = Math.pow(ratio, 1 / years) - 1;
    
    return annualizedReturn;
  }
  
  /**
   * Calculate total return percentage
   * 
   * @param initialValue - Initial investment
   * @param finalValue - Final value
   * @returns Total return as decimal (e.g., 0.25 = 25% total return)
   */
  static calculateTotalReturn(
    initialValue: number,
    finalValue: number
  ): number {
    if (initialValue <= 0) {
      return 0;
    }
    
    return FinancialMath.divide(
      FinancialMath.subtract(finalValue, initialValue),
      initialValue
    ).toNumber();
  }
  
  /**
   * Calculate time-weighted return (for portfolios with cash flows)
   * Note: This is a simplified version. For accuracy with multiple cash flows,
   * use backend calculation with Modified Dietz method.
   */
  static calculateTimeWeightedReturn(
    beginningValue: number,
    endingValue: number,
    netCashFlow: number
  ): number {
    if (beginningValue <= 0) {
      return 0;
    }
    
    // TWR = (Ending Value - Net Cash Flow) / Beginning Value - 1
    const adjustedEnding = FinancialMath.subtract(endingValue, netCashFlow);
    return FinancialMath.divide(
      FinancialMath.subtract(adjustedEnding, beginningValue),
      beginningValue
    ).toNumber();
  }
  
  // ==================== AVERAGE CALCULATIONS ====================
  
  /**
   * Calculate new average price after additional purchase
   * Used when adding to existing position
   * 
   * @param existingShares - Current shares held
   * @param existingAvgPrice - Current average cost basis
   * @param newShares - Shares being purchased
   * @param newPrice - Purchase price of new shares
   * @returns New average price per share
   */
  static calculateNewAveragePrice(
    existingShares: number,
    existingAvgPrice: number,
    newShares: number,
    newPrice: number
  ): number {
    const existingCost = FinancialMath.multiply(existingShares, existingAvgPrice);
    const newCost = FinancialMath.multiply(newShares, newPrice);
    const totalCost = FinancialMath.add(existingCost, newCost);
    const totalShares = FinancialMath.add(existingShares, newShares);
    
    if (totalShares.isZero()) {
      return 0;
    }
    
    return FinancialMath.divide(totalCost, totalShares).toNumber();
  }
  
  // ==================== COMPARISON & ANALYSIS ====================
  
  /**
   * Calculate relative performance vs. benchmark
   * 
   * @param portfolioReturn - Portfolio return as decimal
   * @param benchmarkReturn - Benchmark return as decimal
   * @returns Excess return (alpha) as decimal
   */
  static calculateExcessReturn(
    portfolioReturn: number,
    benchmarkReturn: number
  ): number {
    return FinancialMath.subtract(portfolioReturn, benchmarkReturn).toNumber();
  }
  
  /**
   * Calculate position size as percentage of portfolio
   * 
   * @param positionValue - Value of the position
   * @param portfolioValue - Total portfolio value
   * @returns Position size as decimal (e.g., 0.15 = 15% of portfolio)
   */
  static calculatePositionSize(
    positionValue: number,
    portfolioValue: number
  ): number {
    if (portfolioValue <= 0) {
      return 0;
    }
    
    return FinancialMath.divide(positionValue, portfolioValue).toNumber();
  }
  
  /**
   * Calculate break-even price for a position
   * Accounts for fees paid when buying
   * 
   * @param costBasis - Total cost basis (including fees)
   * @param shares - Number of shares
   * @returns Break-even price per share
   */
  static calculateBreakEvenPrice(
    costBasis: number,
    shares: number
  ): number {
    if (shares <= 0) {
      return 0;
    }
    
    return FinancialMath.divide(costBasis, shares).toNumber();
  }
  
  // ==================== UTILITY CALCULATIONS ====================
  
  /**
   * Calculate days between two dates
   */
  static calculateDaysBetween(startDate: Date | string, endDate: Date | string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Calculate percentage change
   * 
   * @param oldValue - Original value
   * @param newValue - New value
   * @returns Percentage change as decimal
   */
  static calculatePercentageChange(
    oldValue: number,
    newValue: number
  ): number {
    if (oldValue === 0) {
      return 0;
    }
    
    return FinancialMath.divide(
      FinancialMath.subtract(newValue, oldValue),
      Math.abs(oldValue)
    ).toNumber();
  }
}
