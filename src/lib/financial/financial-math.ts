/**
 * FinancialMath Service
 * 
 * Provides precision arithmetic for financial calculations using Decimal.js.
 * JavaScript's native floating-point arithmetic is fundamentally flawed for money:
 *   0.1 + 0.2 = 0.30000000000000004  (WRONG)
 *   100 * 0.29 = 28.999999999999996  (WRONG)
 * 
 * This service wraps Decimal.js with domain-specific financial operations.
 * 
 * @example
 * // Instead of: const total = shares * price;
 * const total = FinancialMath.multiply(shares, price);
 * 
 * // Instead of: const gain = current - cost;
 * const gain = FinancialMath.subtract(current, cost);
 */

import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({
  precision: 20,                    // 20 significant digits
  rounding: Decimal.ROUND_HALF_UP,  // Banker's rounding
  toExpNeg: -9,                     // Don't use exponential notation for small numbers
  toExpPos: 20,                     // Don't use exponential notation for large numbers
});

export class FinancialMath {
  
  // ==================== CORE ARITHMETIC ====================
  
  /**
   * Add two numbers with precision
   * @example FinancialMath.add(0.1, 0.2) → Decimal(0.3)
   */
  static add(a: number | Decimal, b: number | Decimal): Decimal {
    return new Decimal(a).plus(new Decimal(b));
  }
  
  /**
   * Subtract two numbers with precision
   * @example FinancialMath.subtract(1.0, 0.9) → Decimal(0.1)
   */
  static subtract(a: number | Decimal, b: number | Decimal): Decimal {
    return new Decimal(a).minus(new Decimal(b));
  }
  
  /**
   * Multiply two numbers with precision
   * @example FinancialMath.multiply(100, 0.29) → Decimal(29)
   */
  static multiply(a: number | Decimal, b: number | Decimal): Decimal {
    return new Decimal(a).times(new Decimal(b));
  }
  
  /**
   * Divide two numbers with precision
   * @example FinancialMath.divide(10, 3) → Decimal(3.333333...)
   */
  static divide(a: number | Decimal, b: number | Decimal): Decimal {
    const divisor = new Decimal(b);
    if (divisor.isZero()) {
      throw new Error('Division by zero');
    }
    return new Decimal(a).dividedBy(divisor);
  }
  
  // ==================== FINANCIAL OPERATIONS ====================
  
  /**
   * Calculate order cost (shares × price)
   * Used for buy/sell order calculations
   */
  static calculateCost(shares: number | Decimal, pricePerShare: number | Decimal): Decimal {
    return this.multiply(shares, pricePerShare);
  }
  
  /**
   * Calculate gain/loss (current value - cost basis)
   * Used for P&L calculations
   */
  static calculateGain(currentValue: number | Decimal, costBasis: number | Decimal): Decimal {
    return this.subtract(currentValue, costBasis);
  }
  
  /**
   * Calculate gain percentage ((gain / cost basis) × 100)
   * Returns percentage as decimal (e.g., 0.25 = 25%)
   */
  static calculateGainPercent(gain: number | Decimal, costBasis: number | Decimal): Decimal {
    const cost = new Decimal(costBasis);
    if (cost.isZero()) {
      return new Decimal(0);
    }
    return this.divide(gain, cost);
  }
  
  /**
   * Calculate return on investment (ROI)
   * Returns percentage as decimal (e.g., 0.15 = 15% return)
   */
  static calculateROI(invested: number | Decimal, current: number | Decimal): Decimal {
    const investedDec = new Decimal(invested);
    if (investedDec.isZero()) {
      return new Decimal(0);
    }
    const gain = this.subtract(current, invested);
    return this.divide(gain, invested);
  }
  
  /**
   * Calculate portfolio allocation percentage
   * Returns percentage as decimal (e.g., 0.35 = 35% of portfolio)
   */
  static calculatePortfolioPercent(assetValue: number | Decimal, totalValue: number | Decimal): Decimal {
    const total = new Decimal(totalValue);
    if (total.isZero()) {
      return new Decimal(0);
    }
    return this.divide(assetValue, total);
  }
  
  /**
   * Calculate average price (total cost / total shares)
   * Used for calculating cost basis
   */
  static calculateAveragePrice(totalCost: number | Decimal, totalShares: number | Decimal): Decimal {
    const shares = new Decimal(totalShares);
    if (shares.isZero()) {
      return new Decimal(0);
    }
    return this.divide(totalCost, shares);
  }
  
  /**
   * Calculate compound interest
   * FV = PV × (1 + r)^n
   */
  static calculateCompoundInterest(
    principal: number | Decimal,
    rate: number | Decimal,
    periods: number
  ): Decimal {
    const pv = new Decimal(principal);
    const r = new Decimal(rate);
    const onePlusRate = r.plus(1);
    return pv.times(onePlusRate.pow(periods));
  }
  
  /**
   * Calculate weighted average
   * Used for portfolio calculations
   */
  static calculateWeightedAverage(
    values: Array<{ value: number | Decimal; weight: number | Decimal }>
  ): Decimal {
    if (values.length === 0) {
      return new Decimal(0);
    }
    
    let weightedSum = new Decimal(0);
    let totalWeight = new Decimal(0);
    
    for (const item of values) {
      const val = new Decimal(item.value);
      const weight = new Decimal(item.weight);
      weightedSum = weightedSum.plus(val.times(weight));
      totalWeight = totalWeight.plus(weight);
    }
    
    if (totalWeight.isZero()) {
      return new Decimal(0);
    }
    
    return weightedSum.dividedBy(totalWeight);
  }
  
  /**
   * Sum an array of values with precision
   */
  static sum(values: Array<number | Decimal>): Decimal {
    return values.reduce(
      (acc, val) => acc.plus(new Decimal(val)),
      new Decimal(0)
    );
  }
  
  /**
   * Find minimum value in array
   */
  static min(...values: Array<number | Decimal>): Decimal {
    if (values.length === 0) {
      throw new Error('Cannot find minimum of empty array');
    }
    return values.reduce(
      (min, val) => Decimal.min(min, new Decimal(val)),
      new Decimal(values[0])
    );
  }
  
  /**
   * Find maximum value in array
   */
  static max(...values: Array<number | Decimal>): Decimal {
    if (values.length === 0) {
      throw new Error('Cannot find maximum of empty array');
    }
    return values.reduce(
      (max, val) => Decimal.max(max, new Decimal(val)),
      new Decimal(values[0])
    );
  }
  
  /**
   * Calculate absolute value
   */
  static abs(value: number | Decimal): Decimal {
    return new Decimal(value).abs();
  }
  
  /**
   * Round to specified decimal places
   * Uses ROUND_HALF_UP (banker's rounding)
   */
  static round(value: number | Decimal, decimalPlaces: number): Decimal {
    return new Decimal(value).toDecimalPlaces(decimalPlaces);
  }
  
  // ==================== CONVERSION & FORMATTING ====================
  
  /**
   * Convert Decimal to JavaScript number
   * WARNING: May lose precision for very large or small numbers
   */
  static toNumber(decimal: number | Decimal): number {
    if (typeof decimal === 'number') {
      return decimal;
    }
    return decimal.toNumber();
  }
  
  /**
   * Convert to currency string with 2 decimal places
   * Returns plain number string (e.g., "1234.56")
   * Use Formatters.currency() for display formatting
   */
  static toCurrency(value: number | Decimal): string {
    return new Decimal(value).toFixed(2);
  }
  
  /**
   * Convert to percentage string (e.g., "12.34" for 12.34%)
   * Returns plain number string without % symbol
   * Use Formatters.percentage() for display formatting
   */
  static toPercentage(value: number | Decimal, decimalPlaces: number = 2): string {
    return this.multiply(value, 100).toFixed(decimalPlaces);
  }
  
  /**
   * Check if value is zero
   */
  static isZero(value: number | Decimal): boolean {
    return new Decimal(value).isZero();
  }
  
  /**
   * Check if value is positive
   */
  static isPositive(value: number | Decimal): boolean {
    return new Decimal(value).greaterThan(0);
  }
  
  /**
   * Check if value is negative
   */
  static isNegative(value: number | Decimal): boolean {
    return new Decimal(value).lessThan(0);
  }
  
  /**
   * Compare two values
   * Returns: -1 if a < b, 0 if a = b, 1 if a > b
   */
  static compare(a: number | Decimal, b: number | Decimal): number {
    return new Decimal(a).comparedTo(new Decimal(b));
  }
  
  /**
   * Check if a equals b (with precision)
   */
  static equals(a: number | Decimal, b: number | Decimal): boolean {
    return new Decimal(a).equals(new Decimal(b));
  }
  
  /**
   * Check if a > b
   */
  static greaterThan(a: number | Decimal, b: number | Decimal): boolean {
    return new Decimal(a).greaterThan(new Decimal(b));
  }
  
  /**
   * Check if a >= b
   */
  static greaterThanOrEqual(a: number | Decimal, b: number | Decimal): boolean {
    return new Decimal(a).greaterThanOrEqualTo(new Decimal(b));
  }
  
  /**
   * Check if a < b
   */
  static lessThan(a: number | Decimal, b: number | Decimal): boolean {
    return new Decimal(a).lessThan(new Decimal(b));
  }
  
  /**
   * Check if a <= b
   */
  static lessThanOrEqual(a: number | Decimal, b: number | Decimal): boolean {
    return new Decimal(a).lessThanOrEqualTo(new Decimal(b));
  }
  
  // ==================== UTILITY ====================
  
  /**
   * Safely parse string to Decimal
   * Returns null if invalid
   */
  static parse(value: string): Decimal | null {
    try {
      return new Decimal(value);
    } catch {
      return null;
    }
  }
  
  /**
   * Clamp value between min and max
   */
  static clamp(
    value: number | Decimal,
    min: number | Decimal,
    max: number | Decimal
  ): Decimal {
    const val = new Decimal(value);
    const minDec = new Decimal(min);
    const maxDec = new Decimal(max);
    
    if (val.lessThan(minDec)) return minDec;
    if (val.greaterThan(maxDec)) return maxDec;
    return val;
  }
}
