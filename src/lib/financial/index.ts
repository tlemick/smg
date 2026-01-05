/**
 * Financial Services - Barrel Export
 * 
 * Centralized export for all financial services.
 * Import from this file for consistency.
 * 
 * @example
 * import { FinancialMath, Formatters, FinancialCalculators } from '@/lib/financial';
 * 
 * const total = FinancialMath.multiply(shares, price);
 * const formatted = Formatters.currency(total);
 * const metrics = FinancialCalculators.calculatePositionMetrics(holding, currentPrice);
 */

export { FinancialMath } from './financial-math';
export { Formatters } from './formatters';
export type { CurrencyOptions, PercentageOptions, NumberOptions } from './formatters';
export { FinancialCalculators } from './calculators';
export type {
  Holding,
  PortfolioMetrics,
  PositionMetrics,
  OrderCost,
  AllocationBreakdown,
} from './calculators';
