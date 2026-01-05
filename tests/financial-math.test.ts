/**
 * FinancialMath Service Test Suite
 * 
 * Tests precision arithmetic operations and financial calculations.
 * Run with: npm test
 */

import { FinancialMath } from '../src/lib/financial/financial-math';
import Decimal from 'decimal.js';

describe('FinancialMath - Core Arithmetic', () => {
  describe('add', () => {
    test('handles floating point precision', () => {
      // JavaScript: 0.1 + 0.2 = 0.30000000000000004
      const result = FinancialMath.add(0.1, 0.2);
      expect(result.toNumber()).toBe(0.3);
    });
    
    test('adds integers correctly', () => {
      const result = FinancialMath.add(10, 20);
      expect(result.toNumber()).toBe(30);
    });
    
    test('adds negative numbers', () => {
      const result = FinancialMath.add(-10, 5);
      expect(result.toNumber()).toBe(-5);
    });
  });
  
  describe('subtract', () => {
    test('handles floating point precision', () => {
      // JavaScript: 1.0 - 0.9 = 0.09999999999999998
      const result = FinancialMath.subtract(1.0, 0.9);
      expect(result.toNumber()).toBe(0.1);
    });
    
    test('subtracts integers correctly', () => {
      const result = FinancialMath.subtract(20, 10);
      expect(result.toNumber()).toBe(10);
    });
  });
  
  describe('multiply', () => {
    test('handles floating point precision', () => {
      // JavaScript: 100 * 0.29 = 28.999999999999996
      const result = FinancialMath.multiply(100, 0.29);
      expect(result.toNumber()).toBe(29);
    });
    
    test('multiplies decimals correctly', () => {
      const result = FinancialMath.multiply(0.1, 0.2);
      expect(result.toNumber()).toBe(0.02);
    });
  });
  
  describe('divide', () => {
    test('divides correctly', () => {
      const result = FinancialMath.divide(10, 3);
      expect(result.toFixed(2)).toBe('3.33');
    });
    
    test('throws error on division by zero', () => {
      expect(() => FinancialMath.divide(10, 0)).toThrow('Division by zero');
    });
    
    test('handles fractional division', () => {
      const result = FinancialMath.divide(1, 3);
      expect(result.toFixed(10)).toBe('0.3333333333');
    });
  });
});

describe('FinancialMath - Financial Operations', () => {
  describe('calculateCost', () => {
    test('calculates order cost accurately', () => {
      // 100 shares @ $29.99 should be exactly $2,999.00
      const cost = FinancialMath.calculateCost(100, 29.99);
      expect(cost.toNumber()).toBe(2999.00);
    });
    
    test('handles fractional shares', () => {
      const cost = FinancialMath.calculateCost(10.5, 50);
      expect(cost.toNumber()).toBe(525);
    });
    
    test('handles penny stocks', () => {
      const cost = FinancialMath.calculateCost(1000, 0.15);
      expect(cost.toNumber()).toBe(150);
    });
  });
  
  describe('calculateGain', () => {
    test('calculates positive gain', () => {
      const gain = FinancialMath.calculateGain(1500, 1000);
      expect(gain.toNumber()).toBe(500);
    });
    
    test('calculates negative gain (loss)', () => {
      const gain = FinancialMath.calculateGain(800, 1000);
      expect(gain.toNumber()).toBe(-200);
    });
    
    test('handles zero gain', () => {
      const gain = FinancialMath.calculateGain(1000, 1000);
      expect(gain.toNumber()).toBe(0);
    });
  });
  
  describe('calculateGainPercent', () => {
    test('calculates 25% gain correctly', () => {
      const gain = new Decimal(250);
      const costBasis = 1000;
      const percent = FinancialMath.calculateGainPercent(gain, costBasis);
      expect(percent.toNumber()).toBe(0.25); // 25%
    });
    
    test('calculates loss percentage', () => {
      const gain = new Decimal(-200);
      const costBasis = 1000;
      const percent = FinancialMath.calculateGainPercent(gain, costBasis);
      expect(percent.toNumber()).toBe(-0.2); // -20%
    });
    
    test('handles zero cost basis', () => {
      const gain = new Decimal(100);
      const costBasis = 0;
      const percent = FinancialMath.calculateGainPercent(gain, costBasis);
      expect(percent.toNumber()).toBe(0);
    });
  });
  
  describe('calculateROI', () => {
    test('calculates 50% ROI', () => {
      const roi = FinancialMath.calculateROI(1000, 1500);
      expect(roi.toNumber()).toBe(0.5); // 50% return
    });
    
    test('calculates negative ROI', () => {
      const roi = FinancialMath.calculateROI(1000, 750);
      expect(roi.toNumber()).toBe(-0.25); // -25% return
    });
    
    test('handles zero investment', () => {
      const roi = FinancialMath.calculateROI(0, 1000);
      expect(roi.toNumber()).toBe(0);
    });
  });
  
  describe('calculatePortfolioPercent', () => {
    test('calculates 30% allocation', () => {
      const percent = FinancialMath.calculatePortfolioPercent(3000, 10000);
      expect(percent.toNumber()).toBe(0.3); // 30%
    });
    
    test('handles zero total value', () => {
      const percent = FinancialMath.calculatePortfolioPercent(100, 0);
      expect(percent.toNumber()).toBe(0);
    });
    
    test('calculates 100% allocation', () => {
      const percent = FinancialMath.calculatePortfolioPercent(10000, 10000);
      expect(percent.toNumber()).toBe(1); // 100%
    });
  });
  
  describe('calculateAveragePrice', () => {
    test('calculates average price', () => {
      const avgPrice = FinancialMath.calculateAveragePrice(5000, 100);
      expect(avgPrice.toNumber()).toBe(50);
    });
    
    test('handles fractional shares', () => {
      const avgPrice = FinancialMath.calculateAveragePrice(525, 10.5);
      expect(avgPrice.toNumber()).toBe(50);
    });
  });
});

describe('FinancialMath - Aggregation', () => {
  describe('sum', () => {
    test('sums array of numbers', () => {
      const result = FinancialMath.sum([1, 2, 3, 4, 5]);
      expect(result.toNumber()).toBe(15);
    });
    
    test('handles decimals', () => {
      const result = FinancialMath.sum([0.1, 0.2, 0.3]);
      expect(result.toNumber()).toBe(0.6);
    });
    
    test('handles empty array', () => {
      const result = FinancialMath.sum([]);
      expect(result.toNumber()).toBe(0);
    });
  });
  
  describe('min', () => {
    test('finds minimum value', () => {
      const result = FinancialMath.min(5, 2, 8, 1, 9);
      expect(result.toNumber()).toBe(1);
    });
    
    test('handles negative numbers', () => {
      const result = FinancialMath.min(-5, 0, 5);
      expect(result.toNumber()).toBe(-5);
    });
  });
  
  describe('max', () => {
    test('finds maximum value', () => {
      const result = FinancialMath.max(5, 2, 8, 1, 9);
      expect(result.toNumber()).toBe(9);
    });
    
    test('handles negative numbers', () => {
      const result = FinancialMath.max(-5, -10, -2);
      expect(result.toNumber()).toBe(-2);
    });
  });
});

describe('FinancialMath - Comparison', () => {
  describe('equals', () => {
    test('compares equal values', () => {
      expect(FinancialMath.equals(0.1 + 0.2, 0.3)).toBe(true);
    });
    
    test('compares unequal values', () => {
      expect(FinancialMath.equals(0.1, 0.2)).toBe(false);
    });
  });
  
  describe('greaterThan', () => {
    test('compares greater value', () => {
      expect(FinancialMath.greaterThan(5, 3)).toBe(true);
    });
    
    test('compares equal values', () => {
      expect(FinancialMath.greaterThan(5, 5)).toBe(false);
    });
  });
  
  describe('lessThan', () => {
    test('compares lesser value', () => {
      expect(FinancialMath.lessThan(3, 5)).toBe(true);
    });
    
    test('compares equal values', () => {
      expect(FinancialMath.lessThan(5, 5)).toBe(false);
    });
  });
});

describe('FinancialMath - Conversion', () => {
  describe('toCurrency', () => {
    test('formats to 2 decimal places', () => {
      const result = FinancialMath.toCurrency(1234.567);
      expect(result).toBe('1234.57');
    });
    
    test('handles whole numbers', () => {
      const result = FinancialMath.toCurrency(1000);
      expect(result).toBe('1000.00');
    });
  });
  
  describe('toPercentage', () => {
    test('converts decimal to percentage', () => {
      const result = FinancialMath.toPercentage(0.1234);
      expect(result).toBe('12.34');
    });
    
    test('handles negative percentages', () => {
      const result = FinancialMath.toPercentage(-0.05);
      expect(result).toBe('-5.00');
    });
  });
});

describe('FinancialMath - Edge Cases', () => {
  test('handles very large numbers', () => {
    const result = FinancialMath.multiply(1000000000, 1000000000);
    expect(result.toNumber()).toBe(1e18);
  });
  
  test('handles very small numbers', () => {
    const result = FinancialMath.multiply(0.0001, 0.0001);
    expect(result.toNumber()).toBe(0.00000001);
  });
  
  test('maintains precision in complex calculations', () => {
    // ((100 * 0.29) + 0.1) / 3
    const step1 = FinancialMath.multiply(100, 0.29);
    const step2 = FinancialMath.add(step1, 0.1);
    const result = FinancialMath.divide(step2, 3);
    expect(result.toFixed(2)).toBe('9.70');
  });
  
  test('handles chain of operations', () => {
    // Portfolio calculation: (shares * price) + (shares2 * price2) + cash
    const position1 = FinancialMath.multiply(100, 50.25);
    const position2 = FinancialMath.multiply(50, 75.5);
    const investments = FinancialMath.add(position1, position2);
    const total = FinancialMath.add(investments, 1000);
    expect(total.toNumber()).toBe(9825);
  });
});
