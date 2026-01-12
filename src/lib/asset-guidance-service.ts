/**
 * Asset Guidance Service
 * 
 * Generates teen-friendly pros/cons guidance for investment decisions.
 * 
 * Architecture Compliance:
 * - Pure functions (no React dependencies)
 * - Testable without mocking
 * - Single responsibility (guidance generation only)
 * - Returns formatted strings (no formatting in components)
 * 
 * @example
 * const guidance = AssetGuidanceService.generateGuidance({
 *   asset,
 *   quote,
 *   riskMeasures,
 *   userHoldings,
 *   authenticated
 * });
 */

import type { 
  GuidanceResult, 
  GuidanceParams, 
  GuidancePoint,
  RiskMeasures,
  AssetDetailData,
  UserHoldingsSummary 
} from '@/types';
import { Formatters } from './financial';

export class AssetGuidanceService {
  /**
   * Main entry point - generates complete guidance for an asset
   */
  static generateGuidance(params: GuidanceParams): GuidanceResult {
    const { asset, quote, riskMeasures, userHoldings } = params;
    
    // Collect pros and cons based on asset type
    let pros: GuidancePoint[] = [];
    let cons: GuidancePoint[] = [];
    
    // Asset-type specific analysis
    switch (asset.type) {
      case 'STOCK':
        const stockAnalysis = this.analyzeStock(quote, riskMeasures);
        pros.push(...stockAnalysis.pros);
        cons.push(...stockAnalysis.cons);
        break;
      case 'BOND':
        const bondAnalysis = this.analyzeBond(quote, riskMeasures);
        pros.push(...bondAnalysis.pros);
        cons.push(...bondAnalysis.cons);
        break;
      case 'ETF':
        const etfAnalysis = this.analyzeETF(quote, riskMeasures);
        pros.push(...etfAnalysis.pros);
        cons.push(...etfAnalysis.cons);
        break;
      case 'MUTUAL_FUND':
        const fundAnalysis = this.analyzeMutualFund(quote, riskMeasures);
        pros.push(...fundAnalysis.pros);
        cons.push(...fundAnalysis.cons);
        break;
      case 'INDEX':
        const indexAnalysis = this.analyzeIndex(quote, riskMeasures);
        pros.push(...indexAnalysis.pros);
        cons.push(...indexAnalysis.cons);
        break;
    }
    
    // Add universal guidance (applies to all assets)
    const universalAnalysis = this.analyzeUniversal(quote, riskMeasures);
    pros.push(...universalAnalysis.pros);
    cons.push(...universalAnalysis.cons);
    
    // Limit to 3-4 items per side (most important first)
    pros = pros.slice(0, 4);
    cons = cons.slice(0, 4);
    
    // Ensure we have at least some guidance
    if (pros.length === 0 && cons.length === 0) {
      const fallback = this.getFallbackGuidance();
      pros = fallback.pros;
      cons = fallback.cons;
    }
    
    // Generate contextual messaging
    const hasHoldings = userHoldings !== null && userHoldings.totalQuantity > 0;
    const summary = this.generateSummary(asset.ticker, asset.name, hasHoldings);
    const context = this.generateContext(asset.type, hasHoldings);
    const holdingSummary = hasHoldings ? this.generateHoldingSummary(userHoldings!) : undefined;
    
    return {
      pros,
      cons,
      summary,
      context,
      hasHoldings,
      holdingSummary
    };
  }
  
  /**
   * Analyze stock-specific metrics
   */
  private static analyzeStock(
    quote: AssetDetailData['quote'],
    riskMeasures?: RiskMeasures
  ): { pros: GuidancePoint[]; cons: GuidancePoint[] } {
    const pros: GuidancePoint[] = [];
    const cons: GuidancePoint[] = [];
    
    // P/E Ratio Analysis
    if (quote.trailingPE != null) {
      if (quote.trailingPE < 15 && quote.trailingPE > 0) {
        pros.push({
          id: 'low-pe',
          text: 'Looks like a good deal compared to similar companies',
          iconName: 'StarIcon',
          importance: 'good'
        });
      } else if (quote.trailingPE > 30) {
        cons.push({
          id: 'high-pe',
          text: 'Pretty expensive right now - might be overhyped',
          iconName: 'TrendUpIcon',
          severity: 'moderate'
        });
      }
    }
    
    // Dividend Analysis
    if (quote.dividendYield != null && quote.dividendYield > 0) {
      if (quote.dividendYield > 0.03) {
        const yieldPct = Formatters.percentage(quote.dividendYield, { decimals: 1 });
        pros.push({
          id: 'high-dividend',
          text: `Pays you to own it - ${yieldPct} per year in dividends`,
          iconName: 'CurrencyDollarIcon',
          importance: 'great'
        });
      } else if (quote.dividendYield < 0.01) {
        cons.push({
          id: 'low-dividend',
          text: 'Not paying you to wait - all about growth',
          iconName: 'ChartBarIcon',
          severity: 'mild'
        });
      }
    }
    
    // Risk Measures Analysis
    if (riskMeasures?.common) {
      // Volatility
      const volatility = riskMeasures.common.volatility90d;
      if (volatility != null) {
        const volPct = volatility * 100;
        if (volPct < 10) {
          pros.push({
            id: 'low-volatility',
            text: 'Pretty stable - not too much drama day-to-day',
            iconName: 'ShieldCheckIcon',
            importance: 'good'
          });
        } else if (volPct > 20) {
          cons.push({
            id: 'high-volatility',
            text: 'Buckle up - this one swings a lot',
            iconName: 'WaveformIcon',
            severity: 'moderate'
          });
        }
      }
      
      // Sharpe Ratio
      const sharpe = riskMeasures.common.sharpe90d;
      if (sharpe != null && sharpe > 1) {
        pros.push({
          id: 'strong-sharpe',
          text: 'Good bang for your buck risk-wise',
          iconName: 'TargetIcon',
          importance: 'great'
        });
      }
      
      // Max Drawdown
      const maxDrawdown = riskMeasures.common.maxDrawdown1y;
      if (maxDrawdown != null && maxDrawdown < -0.2) {
        cons.push({
          id: 'big-drawdown',
          text: 'Has dropped hard before (20%+) - could happen again',
          iconName: 'WarningCircleIcon',
          severity: 'severe'
        });
      }
      
      // 52-Week Position
      const position52w = riskMeasures.common.range52wPosition;
      if (position52w != null) {
        if (position52w > 0.8) {
          cons.push({
            id: 'near-high',
            text: 'Trading near its yearly high - might be due for a pullback',
            iconName: 'TrendUpIcon',
            severity: 'mild'
          });
        } else if (position52w < 0.3) {
          pros.push({
            id: 'near-low',
            text: 'Trading closer to yearly low - could be a good entry point',
            iconName: 'ArrowDownIcon',
            importance: 'good'
          });
        }
      }
    }
    
    // Stock-specific risk measures
    if (riskMeasures?.stock) {
      const beta = riskMeasures.stock.beta;
      if (beta != null) {
        if (beta > 1.5) {
          cons.push({
            id: 'high-beta',
            text: 'Extra sensitive to market moves - amplifies the ups and downs',
            iconName: 'GaugeIcon',
            severity: 'moderate'
          });
        } else if (beta < 0.8 && beta > 0) {
          pros.push({
            id: 'low-beta',
            text: 'Less drama than the overall market - moves its own way',
            iconName: 'ShieldCheckIcon',
            importance: 'good'
          });
        }
      }
    }
    
    // Volume/Liquidity (simple heuristic based on market cap)
    if (quote.marketCap != null) {
      const marketCapNum = typeof quote.marketCap === 'string' 
        ? parseFloat(quote.marketCap) 
        : quote.marketCap;
      
      if (marketCapNum > 10_000_000_000) { // > $10B
        pros.push({
          id: 'high-liquidity',
          text: 'Easy to buy/sell - lots of people trading it',
          iconName: 'WaveformIcon',
          importance: 'nice'
        });
      } else if (marketCapNum < 1_000_000_000) { // < $1B
        cons.push({
          id: 'low-liquidity',
          text: 'Smaller company - might be harder to sell quickly',
          iconName: 'ClockIcon',
          severity: 'mild'
        });
      }
    }
    
    return { pros, cons };
  }
  
  /**
   * Analyze bond-specific metrics
   */
  private static analyzeBond(
    quote: AssetDetailData['quote'],
    riskMeasures?: RiskMeasures
  ): { pros: GuidancePoint[]; cons: GuidancePoint[] } {
    const pros: GuidancePoint[] = [];
    const cons: GuidancePoint[] = [];
    
    // Yield to Maturity
    if (riskMeasures?.bond?.yieldToMaturity != null) {
      const ytm = riskMeasures.bond.yieldToMaturity;
      if (ytm > 0.05) { // > 5%
        const ytmPct = Formatters.percentage(ytm, { decimals: 1 });
        pros.push({
          id: 'good-yield',
          text: `Reliable income - ${ytmPct} per year`,
          iconName: 'CurrencyDollarIcon',
          importance: 'great'
        });
      } else if (ytm < 0.02) { // < 2%
        cons.push({
          id: 'low-yield',
          text: 'Not much income for tying up your money',
          iconName: 'TrendDownIcon',
          severity: 'moderate'
        });
      }
    }
    
    // Duration Risk
    if (riskMeasures?.bond?.durationApprox != null) {
      const duration = riskMeasures.bond.durationApprox;
      if (duration < 5) {
        pros.push({
          id: 'short-duration',
          text: 'Gets your money back quick if rates change',
          iconName: 'ArrowClockwiseIcon',
          importance: 'good'
        });
      } else if (duration > 10) {
        cons.push({
          id: 'long-duration',
          text: 'Stuck with it for a while - rates could move against you',
          iconName: 'HourglassHighIcon',
          severity: 'moderate'
        });
      }
    }
    
    // General bond pros
    pros.push({
      id: 'bond-stability',
      text: 'Super stable compared to stocks',
      iconName: 'ShieldCheckIcon',
      importance: 'good'
    });
    
    // General bond cons
    cons.push({
      id: 'rate-risk',
      text: 'If interest rates go up, this is worth less',
      iconName: 'ChartBarIcon',
      severity: 'mild'
    });
    
    return { pros, cons };
  }
  
  /**
   * Analyze ETF-specific metrics
   */
  private static analyzeETF(
    quote: AssetDetailData['quote'],
    riskMeasures?: RiskMeasures
  ): { pros: GuidancePoint[]; cons: GuidancePoint[] } {
    const pros: GuidancePoint[] = [];
    const cons: GuidancePoint[] = [];
    
    // Expense Ratio
    if (riskMeasures?.etf?.expenseRatio != null) {
      const expenseRatio = riskMeasures.etf.expenseRatio;
      if (expenseRatio < 0.005) { // < 0.5%
        const erPct = Formatters.percentage(expenseRatio, { decimals: 2 });
        pros.push({
          id: 'low-expense',
          text: `Cheap to own - only ${erPct} in fees = more for you`,
          iconName: 'CurrencyDollarIcon',
          importance: 'great'
        });
      } else if (expenseRatio > 0.01) { // > 1%
        const erPct = Formatters.percentage(expenseRatio, { decimals: 2 });
        cons.push({
          id: 'high-expense',
          text: `Fees eat into your returns - ${erPct} per year adds up`,
          iconName: 'CurrencyDollarIcon',
          severity: 'moderate'
        });
      }
    }
    
    // General ETF benefits
    pros.push({
      id: 'etf-diversified',
      text: 'Spreads your risk across tons of companies',
      iconName: 'TargetIcon',
      importance: 'great'
    });
    
    pros.push({
      id: 'etf-liquid',
      text: 'Easy to get in and out - trades like a stock',
      iconName: 'WaveformIcon',
      importance: 'good'
    });
    
    // Volatility check
    if (riskMeasures?.common?.volatility90d != null) {
      const volPct = riskMeasures.common.volatility90d * 100;
      if (volPct < 10) {
        pros.push({
          id: 'etf-stable',
          text: 'Pretty smooth ride - not too bumpy',
          iconName: 'ShieldCheckIcon',
          importance: 'good'
        });
      }
    }
    
    return { pros, cons };
  }
  
  /**
   * Analyze mutual fund-specific metrics
   */
  private static analyzeMutualFund(
    quote: AssetDetailData['quote'],
    riskMeasures?: RiskMeasures
  ): { pros: GuidancePoint[]; cons: GuidancePoint[] } {
    const pros: GuidancePoint[] = [];
    const cons: GuidancePoint[] = [];
    
    // Expense Ratio
    if (riskMeasures?.fund?.expenseRatio != null) {
      const expenseRatio = riskMeasures.fund.expenseRatio;
      if (expenseRatio < 0.005) { // < 0.5%
        const erPct = Formatters.percentage(expenseRatio, { decimals: 2 });
        pros.push({
          id: 'low-expense',
          text: `Low fees - only ${erPct} per year`,
          iconName: 'CurrencyDollarIcon',
          importance: 'great'
        });
      } else if (expenseRatio > 0.01) { // > 1%
        const erPct = Formatters.percentage(expenseRatio, { decimals: 2 });
        cons.push({
          id: 'high-expense',
          text: `High fees - ${erPct} per year cuts into gains`,
          iconName: 'CurrencyDollarIcon',
          severity: 'moderate'
        });
      }
    }
    
    // General fund benefits
    pros.push({
      id: 'fund-diversified',
      text: 'Professional management + diversification',
      iconName: 'BriefcaseIcon',
      importance: 'good'
    });
    
    pros.push({
      id: 'fund-balanced',
      text: 'Usually balanced across different types of investments',
      iconName: 'ChartPieIcon',
      importance: 'good'
    });
    
    return { pros, cons };
  }
  
  /**
   * Analyze index fund-specific metrics
   */
  private static analyzeIndex(
    quote: AssetDetailData['quote'],
    riskMeasures?: RiskMeasures
  ): { pros: GuidancePoint[]; cons: GuidancePoint[] } {
    // Index funds are similar to ETFs - broad market exposure
    const pros: GuidancePoint[] = [];
    const cons: GuidancePoint[] = [];
    
    pros.push({
      id: 'index-diversified',
      text: 'Tracks the whole market - ultimate diversification',
      iconName: 'ChartPieIcon',
      importance: 'great'
    });
    
    pros.push({
      id: 'index-passive',
      text: 'Set it and forget it - no need to pick winners',
      iconName: 'ShieldCheckIcon',
      importance: 'good'
    });
    
    // Check volatility
    if (riskMeasures?.common?.volatility90d != null) {
      const volPct = riskMeasures.common.volatility90d * 100;
      if (volPct < 12) {
        pros.push({
          id: 'index-stable',
          text: 'Smoother than individual stocks',
          iconName: 'ChartBarIcon',
          importance: 'good'
        });
      }
    }
    
    return { pros, cons };
  }
  
  /**
   * Universal analysis that applies to all asset types
   */
  private static analyzeUniversal(
    quote: AssetDetailData['quote'],
    riskMeasures?: RiskMeasures
  ): { pros: GuidancePoint[]; cons: GuidancePoint[] } {
    const pros: GuidancePoint[] = [];
    const cons: GuidancePoint[] = [];
    
    // Check if price is reasonable within 52-week range
    if (riskMeasures?.common?.range52wPosition != null) {
      const position = riskMeasures.common.range52wPosition;
      if (position > 0.3 && position < 0.7) {
        pros.push({
          id: 'reasonable-price',
          text: 'Not at crazy highs or lows right now',
          iconName: 'CheckCircleIcon',
          importance: 'nice'
        });
      }
    }
    
    return { pros, cons };
  }
  
  /**
   * Fallback guidance when no specific metrics are available
   */
  private static getFallbackGuidance(): { pros: GuidancePoint[]; cons: GuidancePoint[] } {
    return {
      pros: [
        {
          id: 'fallback-diversify',
          text: 'Adding this could diversify your portfolio',
          iconName: 'TargetIcon',
          importance: 'nice'
        },
        {
          id: 'fallback-research',
          text: 'You can learn about this type of investment',
          iconName: 'InfoIcon',
          importance: 'nice'
        }
      ],
      cons: [
        {
          id: 'fallback-research-needed',
          text: 'Do more research before jumping in',
          iconName: 'MagnifyingGlassIcon',
          severity: 'moderate'
        },
        {
          id: 'fallback-understand',
          text: 'Make sure you understand what you\'re buying',
          iconName: 'InfoIcon',
          severity: 'moderate'
        },
        {
          id: 'fallback-timing',
          text: 'Consider dollar-cost averaging instead of going all-in',
          iconName: 'CalendarIcon',
          severity: 'mild'
        }
      ]
    };
  }
  
  /**
   * Generate contextual summary based on holdings status
   */
  private static generateSummary(ticker: string, name: string, hasHoldings: boolean): string {
    if (hasHoldings) {
      return `You already own ${ticker}. Buy more?`;
    }
    return `Thinking about buying ${name} (${ticker})?`;
  }
  
  /**
   * Generate context message based on asset type and holdings
   */
  private static generateContext(assetType: string, hasHoldings: boolean): string {
    if (hasHoldings) {
      return "Let's see if doubling down makes sense right now";
    }
    
    switch (assetType) {
      case 'STOCK':
        return "Here's what makes this stock interesting (and what to watch out for)";
      case 'BOND':
        return "Here's the deal with this bond";
      case 'ETF':
        return "Here's what you need to know about this ETF";
      case 'MUTUAL_FUND':
        return "Here's the scoop on this fund";
      case 'INDEX':
        return "Here's why index funds are popular (and what to consider)";
      default:
        return "Here's what to think about before investing";
    }
  }
  
  /**
   * Generate holdings summary message
   */
  private static generateHoldingSummary(holdings: UserHoldingsSummary): string {
    const shares = holdings.totalQuantity;
    const sharesText = shares === 1 ? '1 share' : `${Formatters.number(shares, { decimals: 2 })} shares`;
    const value = Formatters.currency(holdings.currentValue);
    const pnlPercent = Formatters.percentage(holdings.unrealizedPnLPercent, { showSign: true, decimals: 1 });
    
    return `You own ${sharesText} worth ${value} (${pnlPercent})`;
  }
}
