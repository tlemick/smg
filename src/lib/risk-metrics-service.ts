import type { SerializedChartData } from './yahoo-finance-service';

// Utility: choose a reasonable benchmark by asset type
export function getBenchmarkTickerForAsset(assetType?: string, fundType?: string): string {
  if (!assetType) return 'SPY';
  const type = assetType.toUpperCase();
  
  // For bonds, use AGG (aggregate bond index)
  if (type === 'BOND') return 'AGG';
  
  // For ETFs, check the fund type to determine if it's equity or bond
  if (type === 'ETF') {
    if (fundType && fundType.toLowerCase().includes('bond')) {
      return 'AGG'; // Bond ETFs benchmark against AGG
    }
    return 'SPY'; // Equity ETFs benchmark against SPY
  }
  
  // Default to SPY for stocks and mutual funds
  return 'SPY';
}

// Map chart data to close price series (prefers adjusted close when present)
export function mapChartToCloseSeries(chart: SerializedChartData[]): { date: Date; close: number }[] {
  return (chart || [])
    .filter(p => typeof p.close === 'number' && !Number.isNaN(p.close))
    .map(p => ({ date: new Date(p.date), close: typeof p.adjClose === 'number' ? p.adjClose : p.close }));
}

// Compute daily log returns from a close price series
export function computeDailyReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    const curr = prices[i];
    if (prev > 0 && curr > 0) {
      returns.push(Math.log(curr / prev));
    }
  }
  return returns;
}

// Standard deviation helper
function stdDev(values: number[]): number | null {
  if (!values || values.length < 2) return null;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// Annualize volatility from daily returns
export function annualizeVolatility(dailyReturns: number[] | null | undefined): number | null {
  if (!dailyReturns || dailyReturns.length < 2) return null;
  const sd = stdDev(dailyReturns);
  if (sd == null) return null;
  return sd * Math.sqrt(252);
}

// Max drawdown over a price series. Returns magnitude as a positive fraction (e.g., 0.25 for -25%).
export function maxDrawdown(series: { date: Date; close: number }[]): { value: number; start: Date | null; end: Date | null } {
  let peak = Number.NEGATIVE_INFINITY;
  let peakDate: Date | null = null;
  let maxDD = 0;
  let ddStart: Date | null = null;
  let ddEnd: Date | null = null;

  for (const point of series) {
    if (point.close > peak) {
      peak = point.close;
      peakDate = point.date;
    }
    const drawdown = peak > 0 ? (peak - point.close) / peak : 0;
    if (drawdown > maxDD) {
      maxDD = drawdown;
      ddStart = peakDate;
      ddEnd = point.date;
    }
  }

  return { value: maxDD, start: ddStart, end: ddEnd };
}

// Beta vs benchmark using OLS slope: cov(asset, bench) / var(bench)
export function betaVsBenchmark(assetReturns: number[], benchmarkReturns: number[]): number | null {
  const n = Math.min(assetReturns.length, benchmarkReturns.length);
  if (n < 10) return null;
  const a = assetReturns.slice(-n);
  const b = benchmarkReturns.slice(-n);
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let cov = 0;
  let varB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    cov += da * db;
    varB += db * db;
  }
  if (varB === 0) return null;
  return cov / varB;
}

// Sharpe ratio using daily returns and daily risk-free rate
export function sharpeRatio(dailyReturns: number[], riskFreeDaily = 0.03 / 252): number | null {
  if (!dailyReturns || dailyReturns.length < 2) return null;
  const excess = dailyReturns.map(r => r - riskFreeDaily);
  const mean = excess.reduce((s, v) => s + v, 0) / excess.length;
  const sd = stdDev(excess);
  if (!sd || sd === 0) return null;
  return (mean / sd) * Math.sqrt(252);
}

// Position in range as a 0..1 value (clamped). Returns null if invalid inputs.
export function positionInRange(current: number | undefined | null, low: number | undefined | null, high: number | undefined | null): number | null {
  if (current == null || low == null || high == null) return null;
  const range = high - low;
  if (range <= 0) return null;
  const pos = (current - low) / range;
  return Math.max(0, Math.min(1, pos));
}

// Downside days percentage over a window of daily returns
export function downsideDaysPct(dailyReturns: number[]): number | null {
  if (!dailyReturns || dailyReturns.length === 0) return null;
  const negatives = dailyReturns.filter(r => r < 0).length;
  return negatives / dailyReturns.length;
}

// Approximate duration (very rough). If inputs are missing, return null.
export function approximateDuration(couponRateAnnual?: number | null, ytmAnnual?: number | null, maturityYears?: number | null): number | null {
  if (couponRateAnnual == null || ytmAnnual == null || maturityYears == null) return null;
  // Simple rule of thumb: duration ~ (1 + ytm) / ytm - ((1 + ytm) + maturity * (coupon - ytm)) / (coupon * (1 + ytm) ** maturity)
  // For practical teen-friendly purposes, clamp to [0, maturity]
  const y = Math.max(0.0001, ytmAnnual);
  const c = Math.max(0, couponRateAnnual);
  const n = Math.max(0, maturityYears);
  // If coupon ~ 0 (zero-coupon), duration ~ maturity
  if (c === 0) return n;
  const num = 1 + y;
  const denom = y;
  const firstTerm = num / denom;
  const secondTerm = ((num) + n * (c - y)) / (c * Math.pow(1 + y, n));
  const approx = firstTerm - secondTerm;
  return Math.max(0, Math.min(n, approx));
}

export function safeNumber(value: any): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}


