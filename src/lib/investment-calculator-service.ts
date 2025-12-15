/**
 * Investment Projections Calculator Service
 * 
 * Provides calculations for compound growth, portfolio projections,
 * and educational financial planning for teen investors.
 */

export interface AssetAllocation {
  stocks: number;      // percentage (0-100)
  bonds: number;       // percentage (0-100)
  etfs: number;        // percentage (0-100) - treated by category
  mutualFunds: number; // percentage (0-100)
}

export interface CalculatorResults {
  finalValue: number;
  totalContributions: number;
  totalGains: number;
  percentageGain: number;
  chartData: Array<{
    year: number;
    contributions: number;
    gains: number;
    total: number;
  }>;
}

export interface AssetTypeInfo {
  mean: number;
  stdDev: number;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
}

export type AssetType = 'stocks' | 'bonds' | 'etfs' | 'mutualFunds' | 'savingsAccount';

/**
 * Investment Calculator Service
 * Uses historical average returns to project portfolio growth
 */
export class InvestmentCalculator {
  
  // Historical average annual returns (nominal, pre-inflation)
  private static readonly RETURN_RATES: Record<AssetType, number> = {
    stocks: 0.10,        // 10% average annual return
    bonds: 0.05,         // 5% average annual return
    etfs: 0.09,          // 9% average annual return (weighted by type - equity ETFs ~10%, bond ETFs ~5%)
    mutualFunds: 0.075,  // 7.5% average annual return (balanced funds)
    savingsAccount: 0.005 // 0.5% savings account baseline
  };

  // Historical volatility (standard deviation)
  private static readonly VOLATILITY: Record<AssetType, number> = {
    stocks: 0.15,        // 15% standard deviation
    bonds: 0.05,         // 5% standard deviation
    etfs: 0.12,          // 12% standard deviation (weighted by type - equity ETFs ~15%, bond ETFs ~5%)
    mutualFunds: 0.10,   // 10% standard deviation
    savingsAccount: 0.0  // Minimal volatility
  };

  /**
   * Calculate future value with monthly contributions
   * Using the compound interest formula with regular contributions
   */
  static calculateFutureValue(
    principal: number,
    monthlyContribution: number,
    annualRate: number,
    years: number,
    adjustForInflation: boolean = false,
    inflationRate: number = 0.03
  ): CalculatorResults {
    
    // Adjust for inflation if requested
    const effectiveRate = adjustForInflation 
      ? ((1 + annualRate) / (1 + inflationRate)) - 1
      : annualRate;
    
    // Convert to monthly rate
    const monthlyRate = Math.pow(1 + effectiveRate, 1/12) - 1;
    const months = years * 12;
    
    // Calculate year-by-year for chart data
    const chartData: Array<{
      year: number;
      contributions: number;
      gains: number;
      total: number;
    }> = [];
    
    let currentValue = principal;
    let totalContributions = principal;
    
    for (let year = 0; year <= years; year++) {
      const monthsElapsed = year * 12;
      
      // Future value of initial principal
      const fvPrincipal = principal * Math.pow(1 + monthlyRate, monthsElapsed);
      
      // Future value of monthly contributions (annuity formula)
      const fvContributions = monthlyContribution > 0 && monthsElapsed > 0
        ? monthlyContribution * ((Math.pow(1 + monthlyRate, monthsElapsed) - 1) / monthlyRate)
        : 0;
      
      currentValue = fvPrincipal + fvContributions;
      totalContributions = principal + (monthlyContribution * monthsElapsed);
      const gains = currentValue - totalContributions;
      
      chartData.push({
        year,
        contributions: totalContributions,
        gains: Math.max(0, gains), // Don't show negative gains
        total: currentValue
      });
    }
    
    const finalData = chartData[chartData.length - 1];
    const percentageGain = totalContributions > 0 
      ? ((finalData.total - totalContributions) / totalContributions) * 100
      : 0;
    
    return {
      finalValue: finalData.total,
      totalContributions,
      totalGains: finalData.gains,
      percentageGain,
      chartData
    };
  }

  /**
   * Get historical return information for an asset type
   */
  static getHistoricalReturns(assetType: AssetType): AssetTypeInfo {
    const mean = this.RETURN_RATES[assetType];
    const stdDev = this.VOLATILITY[assetType];
    
    const riskLevel: 'low' | 'medium' | 'high' = 
      stdDev <= 0.05 ? 'low' : 
      stdDev <= 0.10 ? 'medium' : 
      'high';
    
    const descriptions: Record<AssetType, string> = {
      stocks: 'Historically highest returns with higher volatility. Best for long-term goals (10+ years).',
      bonds: 'Lower returns but more stable. Good for medium-term goals (3-10 years).',
      mutualFunds: 'Balanced mix of stocks and bonds. Good middle ground for most investors.',
      savingsAccount: 'Minimal returns but zero risk. Baseline for comparison only.'
    };
    
    return {
      mean,
      stdDev,
      riskLevel,
      description: descriptions[assetType]
    };
  }

  /**
   * Calculate blended return rate based on portfolio allocation
   */
  static calculateBlendedReturnRate(allocation: AssetAllocation): number {
    const stockWeight = allocation.stocks / 100;
    const bondWeight = allocation.bonds / 100;
    const etfWeight = allocation.etfs / 100;
    const fundWeight = allocation.mutualFunds / 100;
    
    return (
      stockWeight * this.RETURN_RATES.stocks +
      bondWeight * this.RETURN_RATES.bonds +
      etfWeight * this.RETURN_RATES.etfs +
      fundWeight * this.RETURN_RATES.mutualFunds
    );
  }

  /**
   * Calculate blended volatility based on portfolio allocation
   * Simplified - doesn't account for correlation between assets
   */
  static calculateBlendedVolatility(allocation: AssetAllocation): number {
    const stockWeight = allocation.stocks / 100;
    const bondWeight = allocation.bonds / 100;
    const etfWeight = allocation.etfs / 100;
    const fundWeight = allocation.mutualFunds / 100;
    
    // Weighted average (simplified, ignores correlation)
    return (
      stockWeight * this.VOLATILITY.stocks +
      bondWeight * this.VOLATILITY.bonds +
      etfWeight * this.VOLATILITY.etfs +
      fundWeight * this.VOLATILITY.mutualFunds
    );
  }

  /**
   * Classify asset type for historical return calculation
   * Maps database asset types to calculator asset types
   */
  static classifyAssetType(dbAssetType: string): AssetType {
    const type = dbAssetType.toUpperCase();
    
    if (type === 'STOCK') return 'stocks';
    if (type === 'BOND') return 'bonds';
    if (type === 'ETF') return 'etfs';
    if (type === 'MUTUAL_FUND' || type === 'INDEX') return 'mutualFunds';
    
    // Default to stocks for unknown types
    return 'stocks';
  }

  /**
   * Calculate portfolio allocation from holdings
   * Returns percentage breakdown by asset type
   */
  static calculateAllocationFromHoldings(
    holdings: Array<{ type: string; currentValue: number }>
  ): AssetAllocation {
    const total = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    
    if (total === 0) {
      return { stocks: 100, bonds: 0, etfs: 0, mutualFunds: 0 };
    }
    
    const allocation = { stocks: 0, bonds: 0, etfs: 0, mutualFunds: 0 };
    
    holdings.forEach(holding => {
      const weight = (holding.currentValue / total) * 100;
      const assetType = this.classifyAssetType(holding.type);
      
      if (assetType === 'stocks') {
        allocation.stocks += weight;
      } else if (assetType === 'bonds') {
        allocation.bonds += weight;
      } else if (assetType === 'etfs') {
        allocation.etfs += weight;
      } else {
        allocation.mutualFunds += weight;
      }
    });
    
    return allocation;
  }

  /**
   * Calculate time held for a position
   * Returns formatted string like "3 months" or "2 years"
   */
  static calculateTimeHeld(purchaseDate: Date | string): string {
    const now = new Date();
    const purchased = new Date(purchaseDate);
    const monthsHeld = Math.floor(
      (now.getTime() - purchased.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    
    if (monthsHeld < 1) return 'less than 1 month';
    if (monthsHeld === 1) return '1 month';
    if (monthsHeld < 12) return `${monthsHeld} months`;
    
    const years = Math.floor(monthsHeld / 12);
    const remainingMonths = monthsHeld % 12;
    
    if (years === 1 && remainingMonths === 0) return '1 year';
    if (years === 1) return `1 year, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    if (remainingMonths === 0) return `${years} years`;
    
    return `${years} years, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  }

  /**
   * Generate comparison across all asset types
   * Useful for showing users different allocation strategies
   */
  static generateComparison(
    principal: number,
    monthlyContribution: number,
    years: number
  ): Array<{
    assetType: AssetType;
    name: string;
    finalValue: number;
    totalGains: number;
    percentageGain: number;
    avgReturn: number;
  }> {
    const assetTypes: Array<{ type: AssetType; name: string }> = [
      { type: 'stocks', name: 'Stocks' },
      { type: 'mutualFunds', name: 'Mutual Funds' },
      { type: 'bonds', name: 'Bonds' },
      { type: 'savingsAccount', name: 'Savings Account' }
    ];
    
    return assetTypes.map(({ type, name }) => {
      const rate = this.RETURN_RATES[type];
      const results = this.calculateFutureValue(
        principal,
        monthlyContribution,
        rate,
        years
      );
      
      return {
        assetType: type,
        name,
        finalValue: results.finalValue,
        totalGains: results.totalGains,
        percentageGain: results.percentageGain,
        avgReturn: rate * 100 // Convert to percentage
      };
    });
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number, decimals: number = 0): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
  }

  /**
   * Format percentage for display
   */
  static formatPercent(value: number, decimals: number = 1): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  }
}
