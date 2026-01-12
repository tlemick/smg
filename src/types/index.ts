// === Core Types ===

// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  hasCompletedOnboarding?: boolean;
  onboardingCompletedAt?: Date | string | null;
}

// AuthUser is an alias for User for backward compatibility
export type AuthUser = User;

// === Stock API Types ===

// Import ValidInterval from yahoo-finance-service for type consistency
import type { ValidInterval } from '@/lib/yahoo-finance-service';

export interface SearchApiRequest {
  query: string;
  quotesCount?: number;
  newsCount?: number;
}

export interface SearchQuote {
  exchange?: string;
  shortname?: string;
  quoteType?: string;
  symbol?: string;
  index?: string;
  score?: number;
  typeDisp?: string;
  longname?: string;
  name?: string;
  isYahooFinance?: boolean;
}

export interface SearchResult {
  explains: any[];
  count: number;
  quotes: SearchQuote[];
  news: any[];
  nav: any[];
  lists: any[];
  researchReports: any[];
  totalTime: number;
}

export interface SearchApiResponse extends SearchResult {}

export interface QuoteApiRequest {
  ticker: string;
  startDate?: string;
  endDate?: string;
  useCache?: boolean;
  createAssetIfMissing?: boolean;
}

export interface QuoteDataSerializable {
  regularMarketPrice: number;
  currency: string;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  regularMarketDayLow?: number;
  regularMarketDayHigh?: number;
  regularMarketVolume?: string;
  marketCap?: string;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  sharesOutstanding?: string;
  isCached?: boolean;
  cacheAge?: number;
  isStale?: boolean;
  exchangeName?: string;
  marketState?: string;
  [key: string]: any;
}

export interface ChartQuoteSerializable {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: string | null;
  adjclose?: number | null;
}

export interface QuoteApiResponse {
  quote: QuoteDataSerializable;
  historical: ChartQuoteSerializable[];
  asset?: {
    id: number;
    ticker: string;
    name: string;
    market: string | null;
    type: string;
  };
}

export interface ChartApiRequest {
  ticker: string;
  period1?: string;
  period2?: string;
  interval?: ValidInterval;
  includeAdjClose?: boolean;
  events?: string;
  range?: string;
}

export interface TradingPeriod {
  timezone: string;
  start: Date;
  end: Date;
  gmtoffset: number;
}

export interface ChartMeta {
  currency: string;
  symbol: string;
  exchangeName: string;
  instrumentType: string;
  firstTradeDate: Date | null;
  regularMarketTime: Date;
  gmtoffset: number;
  timezone: string;
  exchangeTimezoneName: string;
  regularMarketPrice: number;
  chartPreviousClose?: number;
  priceHint: number;
  currentTradingPeriod?: {
    pre: TradingPeriod;
    regular: TradingPeriod;
    post: TradingPeriod;
  };
  dataGranularity: string;
  range: string;
  validRanges: string[];
}

export interface ChartQuote {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: bigint | null;
  adjclose?: number | null;
}

export interface ChartEvents {
  dividends?: Array<{
    amount: number;
    date: Date;
  }>;
  splits?: Array<{
    date: Date;
    numerator: number;
    denominator: number;
    splitRatio: string;
  }>;
}

export interface ChartData {
  meta: ChartMeta;
  quotes: ChartQuote[];
  events?: ChartEvents;
}

export interface ChartApiResponse extends ChartData {}

export interface AssetHistoricalRequest {
  assetId: string;
  range?: string;
  interval?: string;
}

export interface AssetHistoricalResponse {
  asset: {
    id: string;
    symbol: string;
    name: string;
  };
  prices: Array<{
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  meta: {
    range: string;
    interval: string;
    timezone: string;
    tradingPeriods: Array<{
      start: string;
      end: string;
    }>;
  };
}

export interface CreateAssetData {
  ticker: string;
  name: string;
  type: 'STOCK' | 'ETF' | 'MUTUAL_FUND' | 'BOND' | 'INDEX';
  market?: string;
  locale?: string;
  primaryExchange?: string;
  currencyName?: string;
  logoUrl?: string;
}

// === Watchlist Types ===

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  userId: string;
  isPublic: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  items?: WatchlistItem[];
  itemCount?: number;
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  assetId: string;
  addedAt: Date | string;
  notes?: string;
  asset?: {
    id: string;
    symbol: string;
    name: string;
    exchange: string;
    type: string;
  };
}

export interface WatchlistQuotesResponse {
  watchlist: Watchlist;
  quotes: Array<{
    item: WatchlistItem;
    quote: {
      symbol: string;
      regularMarketPrice: number;
      regularMarketChange: number;
      regularMarketChangePercent: number;
      currency: string;
    };
  }>;
}

// Dashboard-specific watchlist types (more detailed than API types above)
export interface WatchlistAsset {
  id: number;
  ticker: string;
  name: string;
  type: string;
  logoUrl?: string | null;
}

export interface WatchlistItemDetailed {
  id: string;
  watchlistId: string;
  assetId: number;
  assetType: string;
  addedAt: string;
  notes?: string;
  asset: WatchlistAsset;
}

export interface WatchlistDetailed {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: WatchlistItemDetailed[];
}

export interface WatchlistQuoteData {
  regularMarketPrice: number;
  regularMarketOpen?: number;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
  currency: string;
  marketState: string;
  beta?: number;
}

export interface WatchlistQuoteItem {
  watchlistItemId: string;
  asset: WatchlistAsset;
  quote: WatchlistQuoteData | null;
  error: string | null;
}

export interface WatchlistUserHolding {
  ticker: string;
  shares: number;
}

// === Generic API Response Types ===

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  cached?: boolean;
  meta?: any;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// === Error Types ===

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// === Asset Detail Page API Types ===
// Used by GET /api/asset-detail/[ticker] endpoint

// Analyst consensus data from Yahoo Finance recommendationTrend
export interface AnalystRecommendation {
  period: string; // "0m", "-1m", "-2m", "-3m"
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export interface AnalystConsensus {
  trend: AnalystRecommendation[];
  maxAge: number;
  // Calculated summary for current period (0m)
  totalAnalysts?: number;
  averageRating?: number; // 1=Strong Buy, 2=Buy, 3=Hold, 4=Sell, 5=Strong Sell
  consensus?: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
}

export interface AssetDetailQuote {
  regularMarketPrice: number;
  currency: string;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  regularMarketDayLow?: number;
  regularMarketDayHigh?: number;
  regularMarketVolume?: string;
  marketCap?: string;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  beta?: number;
  trailingPE?: number;
  forwardPE?: number;
  dividendYield?: number;
  earningsPerShare?: number;
  bookValue?: number;
  priceToBook?: number;
  exchangeName?: string;
  marketState?: string;
  isCached: boolean;
  cacheAge: number;
  // Analyst consensus data
  analystConsensus?: AnalystConsensus;
}

export interface AssetDetailTypeSpecific {
  stock?: {
    id: number;
    ticker: string;
    name: string;
    sector: string | null;
    industry: string | null;
  } | null;
  bond?: {
    id: number;
    issuer: string | null;
    issueDate: string | Date | null; // JSON serialized as string
    maturityDate: string | Date | null; // JSON serialized as string
    couponRate: number | null;
    faceValue: number | null;
    yieldToMaturity: number | null;
    creditRating: string | null;
    bondType: string | null;
    paymentFrequency: string | null;
  } | null;
  mutualFund?: {
    id: number;
    fundFamily: string | null;
    fundType: string | null;
    expenseRatio: number | null;
    fundManager: string | null;
    inceptionDate: string | Date | null; // JSON serialized as string
    aum: number | null;
    nav: number | null;
    minimumInvestment: number | null;
  } | null;
}

export interface UserHoldingDetail {
  id: string;
  quantity: number;
  averagePrice: number;
  costBasis: number;
  currentValue: number;
  unrealizedPnL: number;
  portfolio: {
    id: string;
    name: string;
    gameSession: {
      id: string;
      name: string | null;
      isActive: boolean;
    };
  };
}

export interface UserHoldingsSummary {
  totalQuantity: number;
  avgCostBasis: number;
  totalCostBasis: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  holdings: UserHoldingDetail[];
}

export interface AssetDetailData {
  asset: {
    id: number;
    ticker: string;
    name: string;
    type: string;
    market: string | null;
    locale: string | null;
    primaryExchange: string | null;
    active: boolean | null;
    currencyName: string | null;
    logoUrl: string | null;
    allowFractionalShares: boolean;
    lastUpdated: string | Date | null; // JSON serialized as string
  };
  quote: AssetDetailQuote;
  typeSpecific: AssetDetailTypeSpecific;
  profile?: any; // AssetProfile type can be added later if needed
  userHoldings: UserHoldingsSummary | null;
  authenticated: boolean;
  riskMeasures?: RiskMeasures;
}

export interface AssetDetailApiResponse extends ApiResponse<AssetDetailData> {
  meta: {
    ticker: string;
    assetId: number;
    assetType: string;
    userId?: string;
    cacheAge: number;
    hasUserHoldings: boolean;
  };
}

// === Risk Measures Types ===

export interface RiskMeasuresCommon {
  volatility30d: number | null;
  volatility90d: number | null;
  maxDrawdown1y: number | null;
  range52wPosition: number | null; // 0..1
  downsideDays90dPct: number | null; // 0..1
  sharpe90d: number | null;
}

export interface RiskMeasuresStock {
  beta?: number | null;
  trailingPE?: number | null;
  forwardPE?: number | null;
  dividendYield?: number | null;
}

export interface RiskMeasuresFundLike {
  expenseRatio?: number | null;
}

export interface RiskMeasuresBond {
  durationApprox?: number | null;
  yieldToMaturity?: number | null;
}

export interface RiskMeasures {
  common: RiskMeasuresCommon;
  stock?: RiskMeasuresStock;
  fund?: RiskMeasuresFundLike;
  etf?: RiskMeasuresFundLike;
  index?: Record<string, never>;
  bond?: RiskMeasuresBond;
}

// === User Holdings API Types ===

export interface UserHoldingsQuote {
  regularMarketPrice: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  currency: string;
  marketState?: string;
  isCached: boolean;
  cacheAge: number;
}

export interface UserHoldingsSummaryDetailed {
  totalQuantity: number;
  avgCostBasis: number;
  totalCostBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  totalPnL: number;
}

export interface UserHoldingsDetailWithPnL {
  id: string;
  quantity: number;
  averagePrice: number;
  costBasis: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  createdAt: Date;
  updatedAt: Date;
  portfolio: {
    id: string;
    name: string;
    cash_balance: number;
    gameSession: {
      id: string;
      name: string | null;
      isActive: boolean;
      startDate: Date;
      endDate: Date;
    };
  };
}

export interface UserHoldingsData {
  asset: {
    id: number;
    ticker: string;
    name: string;
    type: string;
  };
  hasHoldings: boolean;
  summary?: UserHoldingsSummaryDetailed;
  holdings?: UserHoldingsDetailWithPnL[];
  recentTransactions?: any[]; // Transaction type can be added later
  quote?: UserHoldingsQuote;
  message?: string;
}

export interface UserHoldingsApiResponse extends ApiResponse<UserHoldingsData> {
  meta: {
    userId: string;
    ticker: string;
    assetId: number;
    holdingCount: number;
    transactionCount: number;
    cacheAge: number;
  };
} 

// === Trading UI Types ===
// Types for the trading modal components and order management

export interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    id: number;
    ticker: string;
    name: string;
    type: string;
    allowFractionalShares: boolean;
    currencyName?: string | null;
  };
  currentPrice: number;
  currency: string;
  marketState?: string;
  onSuccess: (message: string) => void;
  onError?: (error: string) => void;
}

export interface BuyOrderModalProps extends TradingModalProps {
  userCashBalance?: number;
  maxPurchasePower?: number;
}

export interface SellOrderModalProps extends TradingModalProps {
  userHoldings?: {
    totalQuantity: number;
    avgCostBasis: number;
    currentValue: number;
    unrealizedPnL: number;
  };
}

export interface OrderFormData {
  orderType: 'MARKET' | 'LIMIT';
  tradeType: 'BUY' | 'SELL';
  quantityType: 'SHARES' | 'DOLLARS';
  shares?: number;
  dollarAmount?: number;
  limitPrice?: number;
  notes?: string;
}

export interface OrderValidation {
  isValid: boolean;
  errors: {
    shares?: string;
    dollarAmount?: string;
    limitPrice?: string;
    general?: string;
    marketClosed?: string; // Add field for market state validation
  };
  warnings: {
    marketClosed?: string;
    highVolatility?: string;
    largeOrder?: string;
  };
}

export interface MarketOrderApiRequest {
  assetId: number;
  orderType: 'BUY' | 'SELL';
  shares?: number;
  dollarAmount?: number;
  notes?: string;
}

export interface LimitOrderApiRequest {
  assetId: number;
  orderType: 'BUY' | 'SELL';
  shares?: number;
  dollarAmount?: number;
  limitPrice: number;
  expireAt?: Date;
  notes?: string;
}

export interface OrderApiResponse {
  success: boolean;
  orderId?: string;
  transactionId?: string;
  executionStatus: 'EXECUTED' | 'QUEUED' | 'FAILED';
  message: string;
  orderDetails: {
    asset: any;
    orderType: 'BUY' | 'SELL';
    shares: number;
    pricePerShare: number;
    totalValue: number;
    fees: number;
    netAmount: number;
    marketState: string;
    executedAt?: Date;
    queuedUntil?: Date;
  };
  portfolioUpdate?: {
    previousCash: number;
    newCash: number;
    newHolding?: any;
  };
  educationalNote: string;
  error?: string;
}

export interface UnifiedOrder {
  id: string;
  type: 'market' | 'limit';
  orderType: 'BUY' | 'SELL';
  assetId: number;
  asset: {
    id: number;
    ticker: string;
    name: string;
    type: string;
    logoUrl?: string | null;
  };
  quantity: number;
  price?: number | null;
  limitPrice?: number | null;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  createdAt: Date;
  expireAt?: Date | null;
  executedAt?: Date | null;
  executedPrice?: number | null;
  notes?: string | null;
  isMarketOrder: boolean;
  educationalNote: string;
}

export interface OrderManagementProps {
  userId: string;
  showEducationalContent?: boolean;
  maxHeight?: string;
  onOrderUpdate?: (order: UnifiedOrder) => void;
}

export interface TradingGuidanceProps {
  orderType: 'BUY' | 'SELL';
  tradeType: 'MARKET' | 'LIMIT';
  asset: {
    ticker: string;
    name: string;
    type: string;
  };
  marketState?: string;
  isFirstTime?: boolean;
  showRiskWarnings?: boolean;
}

export interface EducationalSection {
  title: string;
  description: string;
  icon: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface TradingEducation {
  title: string;
  sections: EducationalSection[];
  riskWarnings?: string[];
  tips?: string[];
}

// === Portfolio Allocation Types ===
// Types for portfolio overview and allocation display

export interface PortfolioAllocation {
  asset: {
    id: number;
    ticker: string;
    name: string;
    type: string;
    logoUrl?: string | null;
  };
  totalQuantity: number;
  avgCostBasis: number;
  totalCostBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  portfolioPercent: number; // Key field for allocation display
  quote: {
    currency: string;
    marketState?: string;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
  };
}

export interface PortfolioBreakdown {
  id: string;
  name: string;
  cashBalance: number;
  gameSession: {
    id: string;
    name: string | null;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
  };
}

export interface PortfolioOverviewData {
  totalPortfolioValue: number;
  cashBalance: number;
  totalInvestedValue: number;
  totalUnrealizedPnLPercent: number;
  allocations: PortfolioAllocation[];
  portfolioBreakdown: PortfolioBreakdown[];
  lastUpdated: string;
}

export interface PortfolioOverviewResponse extends ApiResponse<PortfolioOverviewData> {
  meta: {
    userId: string;
    holdingCount: number;
    assetCount: number;
    cacheAgeMs: number;
  };
}

// === Portfolio Category Series (for stacked bar chart) ===

export interface PortfolioCategoryPoint {
  date: string; // ISO date (end of day)
  stocks: number;
  bonds: number;
  mutualFunds: number;
  cash: number;
  total: number;
}

export interface PortfolioCategorySeriesData {
  points: PortfolioCategoryPoint[];
}

export interface PortfolioCategorySeriesResponse extends ApiResponse<PortfolioCategorySeriesData> {
  meta: {
    userId: string;
    portfolioId: string;
    range: string;
    interval: string;
    startDate: string;
    endDate: string;
    dataPoints: number;
  };
}

export interface PortfolioAllocationProps {
  className?: string;
  showHeader?: boolean;
  showEmptyState?: boolean;
  maxItems?: number;
  onAssetClick?: (asset: PortfolioAllocation['asset']) => void;
} 

// === Activity Feed Types ===

export interface UserActivity {
  id: string;
  userId: string;
  type: string; // 'TRADE', 'PORTFOLIO', 'MARKET', 'EDUCATION', 'SYSTEM'
  subtype: string; // 'ORDER_EXECUTED', 'LIMIT_PLACED', 'MILESTONE_REACHED', etc.
  title: string;
  description?: string;
  data?: any; // JSON data with activity-specific information
  importance: number; // 1=Low, 2=Medium, 3=High
  relatedAssetId?: number;
  relatedOrderId?: string;
  relatedTransactionId?: string;
  icon?: string;
  color?: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Date | string;
  expiresAt?: Date | string | null;
  relatedAsset?: {
    id: number;
    ticker: string;
    name: string;
    type: string;
  };
}

export interface ActivityFeedData {
  activities: UserActivity[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  stats: Record<string, number>; // Activity count by type
}

export interface ActivityFeedResponse extends ApiResponse<ActivityFeedData> {
  meta: {
    userId: string;
    categoriesFilter: string[] | null;
    generatedAt: string;
  };
}

export interface ActivityFeedOptions {
  limit?: number;
  categories?: string[];
  realTime?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export type ActivityCategory = 'TRADE' | 'PORTFOLIO' | 'MARKET' | 'EDUCATION' | 'SYSTEM';

export interface ActivityItemProps {
  activity: UserActivity;
  onMarkRead?: (id: string) => void;
  onAction?: (actionUrl: string) => void;
  showTimestamp?: boolean;
  compact?: boolean;
}

export interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
  categories?: ActivityCategory[];
  showFilters?: boolean;
  showHeader?: boolean;
  compact?: boolean;
  autoRefresh?: boolean;
}

// === Portfolio Performance Series (for triple line chart) ===

export interface PerformancePoint {
  date: string; // ISO day
  youPct: number | null;
  leaderPct: number | null;
  sp500Pct: number | null;
}

export interface PortfolioPerformanceSeriesData {
  points: PerformancePoint[];
}

export interface PortfolioPerformanceSeriesResponse extends ApiResponse<PortfolioPerformanceSeriesData> {
  meta: {
    sessionId: string;
    startDate: string;
    endDate: string;
    leaderUserId: string | null;
    leaderName: string | null;
    dataPoints: number;
  };
}

// === Transactions Feed Types ===

// Note: TransactionsCardProps moved to component file (inline pattern)

export interface TransactionItemProps {
  order: UnifiedOrder;
  showTimestamp?: boolean;
  compact?: boolean;
  onOrderClick?: (orderId: string) => void;
}

export interface TransactionSectionProps {
  title: string;
  icon: 'pending' | 'completed';
  orders: UnifiedOrder[];
  emptyMessage: string;
  loading?: boolean;
}

// === Asset News Types ===

export interface NewsItem {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: Date;
  type: string;
  thumbnail?: string;
  relatedTickers?: string[];
  isRecent?: boolean; // < 24 hours
}

export interface AssetNewsApiRequest {
  ticker: string;
  limit?: number; // default 10
  useCache?: boolean; // default true
}

export interface AssetNewsResponse extends ApiResponse<NewsItem[]> {
  meta: {
    ticker: string;
    itemCount: number;
    cacheAge: number;
    lastUpdated: string;
  };
}

// === Onboarding Types ===

export type OnboardingStep = 'welcome' | 'stocks' | 'mutual-funds' | 'bonds' | 'complete';

export interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  hasCompletedOnboarding: boolean;
}

export interface OnboardingStatus {
  hasCompletedOnboarding: boolean;
  currentStep: OnboardingStep | null;
  portfolio: {
    cashBalance: number;
    hasStocks: boolean;
    hasMutualFunds: boolean;
    hasBonds: boolean;
    totalHoldings: number;
  };
}

export interface TrendingAsset {
  id: number;
  ticker: string;
  name: string;
  type: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  recentTransactions: number;
  logoUrl?: string;
}

export interface TrendingAssetsResponse {
  success: boolean;
  assets: TrendingAsset[];
  assetType: string;
}

export interface SimplifiedBuyRequest {
  assetId: number;
  dollarAmount: number;
  notes?: string;
}

export interface OnboardingAssetSuggestion {
  ticker: string;
  name: string;
  reason: string;
  category?: string;
}

// === Dashboard Component Types ===

// TikTok-style lessons
export interface TikTokLesson {
  id: string;
  title: string;
  topic: string;
  image: string;
  duration?: string;
}

export interface TikTokLessonCardProps {
  lesson: TikTokLesson;
  onClick: () => void;
}

export interface TikTokLessonsProps {
  title?: string;
  subtitle?: string;
  topics?: string[];
  maxItems?: number;
}

// === Chart Data Types ===

/**
 * Raw chart data from API (OHLCV format)
 * Used for candlestick charts and line charts
 * Note: volume can be string (from some endpoints) or bigint (from yahoo-finance2)
 */
export interface RawChartData {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: string | bigint | null;
}

/**
 * Transformed chart data point ready for display
 * Includes formatted date labels for X-axis
 */
export interface ChartDataPoint {
  date: string;              // YYYY-MM-DD format
  timestamp: number;          // Unix timestamp for sorting
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  formattedDate: string;      // Display label for X-axis
}

/**
 * Timeframe configuration for chart display
 */
export interface TimeframeConfig {
  value: string;              // e.g., '1d', '1mo', '1y'
  label: string;              // e.g., '1D', '1M', '1Y'
  interval: string;           // e.g., '15m', '1h', '1d'
  days: number;               // Number of days to display
}

/**
 * Chart API response structure
 */
export interface ChartApiResponse {
  success: boolean;
  data: {
    quotes: RawChartData[];
    meta?: {
      currency?: string;
      symbol?: string;
      exchangeName?: string;
      instrumentType?: string;
      firstTradeDate?: number;
      regularMarketTime?: number;
      gmtoffset?: number;
      timezone?: string;
      exchangeTimezoneName?: string;
      [key: string]: unknown;
    };
  };
  error?: string;
}

// === Asset Guidance Types ===

/**
 * Individual guidance point (pro or con) with teen-friendly messaging
 */
export interface GuidancePoint {
  id: string;
  text: string;              // Teen-friendly explanation
  iconName?: string;         // Optional Phosphor icon name (e.g., 'CurrencyDollarIcon', 'TargetIcon')
  severity?: 'mild' | 'moderate' | 'severe'; // For cons
  importance?: 'nice' | 'good' | 'great';    // For pros
}

/**
 * Complete guidance result with pros, cons, and contextual messaging
 */
export interface GuidanceResult {
  pros: GuidancePoint[];
  cons: GuidancePoint[];
  summary: string;           // "Thinking about buying AAPL?"
  context: string;           // "Here's what makes it interesting..."
  hasHoldings: boolean;      // true if user owns it
  holdingSummary?: string;   // "You own 10 shares"
}

/**
 * Parameters for generating asset guidance
 */
export interface GuidanceParams {
  asset: AssetDetailData['asset'];
  quote: AssetDetailData['quote'];
  riskMeasures?: AssetDetailData['riskMeasures'];
  userHoldings: UserHoldingsSummary | null;
  authenticated: boolean;
} 