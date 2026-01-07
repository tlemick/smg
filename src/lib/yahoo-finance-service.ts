import YahooFinance from 'yahoo-finance2';
import { prisma } from '../../prisma/client';
import { getCompanyLogoUrl } from './logo-service';
import type { AnalystConsensus } from '@/types';

// Initialize Yahoo Finance v3 with suppressed notices
const yahooFinance = new YahooFinance({
  suppressNotices: ['ripHistorical', 'yahooSurvey']
});

// Cache TTL constants
const QUOTE_CACHE_TTL = 10 * 1000;

/**
 * Process Yahoo Finance recommendationTrend data into our AnalystConsensus format
 */
function processAnalystConsensus(recommendationTrend: any): AnalystConsensus | null {
  if (!recommendationTrend?.trend || !Array.isArray(recommendationTrend.trend)) {
    return null;
  }

  // Get current period (0m) for summary calculation
  const currentPeriod = recommendationTrend.trend.find((t: any) => t.period === '0m');
  
  let totalAnalysts = 0;
  let averageRating = 0;
  let consensus: AnalystConsensus['consensus'] = 'Hold';

  if (currentPeriod) {
    const { strongBuy = 0, buy = 0, hold = 0, sell = 0, strongSell = 0 } = currentPeriod;
    totalAnalysts = strongBuy + buy + hold + sell + strongSell;
    
    if (totalAnalysts > 0) {
      // Calculate weighted average (1=Strong Buy, 5=Strong Sell)
      averageRating = (
        strongBuy * 1 + 
        buy * 2 + 
        hold * 3 + 
        sell * 4 + 
        strongSell * 5
      ) / totalAnalysts;
      
      // Determine consensus based on average
      if (averageRating <= 1.5) consensus = 'Strong Buy';
      else if (averageRating <= 2.5) consensus = 'Buy';
      else if (averageRating <= 3.5) consensus = 'Hold';
      else if (averageRating <= 4.5) consensus = 'Sell';
      else consensus = 'Strong Sell';
    }
  }

  return {
    trend: recommendationTrend.trend,
    maxAge: recommendationTrend.maxAge || 86400,
    totalAnalysts,
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    consensus
  };
}

// 10 seconds - simple cache to prevent rapid refresh spam
const SEARCH_CACHE_TTL = 60 * 60 * 1000; // 1 hour for search results

// Yahoo Finance valid intervals - must match their API expectations
export type ValidInterval = "1m" | "2m" | "5m" | "15m" | "30m" | "60m" | "90m" | "1h" | "1d" | "5d" | "1wk" | "1mo" | "3mo";

// Chart data transformation types
export interface TransformedChartData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

// Serialized chart data for JSON responses (volume as string)
export interface SerializedChartData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: string; // Serialized as string for JSON
}

export interface ChartDataDirectResponse {
  success: boolean;
  data: SerializedChartData[];
  meta: {
    ticker: string;
    interval: ValidInterval;
    dataPoints: number;
    startDate: string;
    endDate: string;
    source: string;
  };
}

/**
 * Transform chart API response to match expected historical data format
 * This adapter ensures compatibility between the new chart() API and existing data structures
 */
export function transformChartDataToHistoricalFormat(chartData: any): TransformedChartData[] {
  const quotes = chartData.quotes || [];
  
  return quotes
    .filter((quote: any) => 
      quote.open !== null && 
      quote.high !== null && 
      quote.low !== null && 
      quote.close !== null
    )
    .map((quote: any): TransformedChartData => ({
      date: quote.date,
      open: quote.open as number,
      high: quote.high as number,
      low: quote.low as number,
      close: quote.close as number,
      adjClose: (quote.adjclose || quote.close) as number,
      volume: quote.volume || 0,
    }));
}

/**
 * Get batch quotes for multiple tickers efficiently
 * This reduces API calls from N individual calls to 1 batch call
 */
interface BatchQuoteResult {
  ticker: string;
  quote: any | null;
  error: string | null;
}

export async function getBatchQuotes(tickers: string[]): Promise<BatchQuoteResult[]> {
  if (!tickers || tickers.length === 0) {
    return [];
  }

  try {
    const BATCH_SIZE = 50; // Conservative limit for Yahoo Finance API
    const results: BatchQuoteResult[] = [];
    
    // Process tickers in batches of 50
    for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
      const batch = tickers.slice(i, i + BATCH_SIZE);
      
      try {
        // Yahoo Finance supports multi-symbol quotes
        const quoteResponse = await yahooFinance.quote(batch);
        const quotes = Array.isArray(quoteResponse) ? quoteResponse : [quoteResponse];
        
        // Map quotes back to tickers (order matters)
        batch.forEach((ticker, index) => {
          const quote = quotes[index];
          results.push({
            ticker,
            quote: quote || null,
            error: quote ? null : `No data for ${ticker}`
          });
        });
        
      } catch (batchError: any) {
        console.warn(`Batch quote fetch failed for batch starting at ${batch[0]}:`, batchError.message);
        
        // Add error entries for this batch
        batch.forEach(ticker => {
          results.push({
            ticker,
            quote: null,
            error: batchError.message || 'Batch fetch failed'
          });
        });
      }
    }
    
    return results;
  } catch (error: any) {
    console.error('Failed to fetch batch quotes:', error);
    
    // Return error entries for all tickers
    return tickers.map(ticker => ({
      ticker,
      quote: null,
      error: error.message || 'Failed to fetch quotes'
    }));
  }
}

/**
 * Get cached quote for an asset (for watchlist tiles)
 */
export async function getAssetQuoteWithCache(assetId: number) {
  // Check cache first
  const cached = await prisma.assetQuoteCache.findUnique({
    where: { assetId },
    include: { asset: true }
  });

  // Return cached data if not expired
  if (cached && cached.expiresAt > new Date()) {
    return {
      ...cached,
      isCached: true,
      cacheAge: Date.now() - cached.lastUpdated.getTime()
    };
  }

  // Get asset to fetch ticker
  const asset = cached?.asset || await prisma.asset.findUnique({
    where: { id: assetId }
  });

  if (!asset) {
    throw new Error(`Asset with id ${assetId} not found`);
  }

  try {
    // Fetch fresh data from Yahoo Finance
    const quoteResponse = await yahooFinance.quote(asset.ticker);
    const quote = Array.isArray(quoteResponse) ? quoteResponse[0] : quoteResponse;
    
    // Simple cache TTL to prevent rapid refresh spam
    const expiresAt = new Date(Date.now() + QUOTE_CACHE_TTL);
    
    // Update cache
    const cachedQuote = await prisma.assetQuoteCache.upsert({
      where: { assetId },
      update: {
        regularMarketPrice: quote.regularMarketPrice,
        regularMarketChange: quote.regularMarketChange || null,
        regularMarketChangePercent: quote.regularMarketChangePercent || null,
        regularMarketPreviousClose: quote.regularMarketPreviousClose || null,
        regularMarketOpen: quote.regularMarketOpen || null,
        regularMarketDayLow: quote.regularMarketDayLow || null,
        regularMarketDayHigh: quote.regularMarketDayHigh || null,
        regularMarketVolume: quote.regularMarketVolume ? BigInt(quote.regularMarketVolume) : null,
        currency: quote.currency,
        exchangeName: quote.fullExchangeName || null,
        marketState: quote.marketState || null,
        // Store advanced metrics that StockMetrics needs (only fields available in quote API)
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
        marketCap: (quote.marketCap && typeof quote.marketCap === 'number') ? BigInt(Math.floor(quote.marketCap)) : null,
        sharesOutstanding: (quote.sharesOutstanding && typeof quote.sharesOutstanding === 'number') ? BigInt(Math.floor(quote.sharesOutstanding)) : null,
        bookValue: quote.bookValue || null,
        priceToBook: quote.priceToBook || null,
        earningsPerShare: quote.epsTrailingTwelveMonths || null,
        trailingPE: quote.trailingPE || null,
        forwardPE: quote.forwardPE || null,
        dividendRate: quote.dividendRate || null,
        dividendYield: quote.dividendYield || null,
        // Beta: preserve existing value from initial creation, don't overwrite with null
        beta: cached?.beta || null,
        expiresAt,
      },
      create: {
        assetId,
        regularMarketPrice: quote.regularMarketPrice,
        regularMarketChange: quote.regularMarketChange || null,
        regularMarketChangePercent: quote.regularMarketChangePercent || null,
        regularMarketPreviousClose: quote.regularMarketPreviousClose || null,
        regularMarketOpen: quote.regularMarketOpen || null,
        regularMarketDayLow: quote.regularMarketDayLow || null,
        regularMarketDayHigh: quote.regularMarketDayHigh || null,
        regularMarketVolume: quote.regularMarketVolume ? BigInt(quote.regularMarketVolume) : null,
        currency: quote.currency,
        exchangeName: quote.fullExchangeName || null,
        marketState: quote.marketState || null,
        // Store advanced metrics that StockMetrics needs (only fields available in quote API)
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
        marketCap: (quote.marketCap && typeof quote.marketCap === 'number') ? BigInt(Math.floor(quote.marketCap)) : null,
        sharesOutstanding: (quote.sharesOutstanding && typeof quote.sharesOutstanding === 'number') ? BigInt(Math.floor(quote.sharesOutstanding)) : null,
        bookValue: quote.bookValue || null,
        priceToBook: quote.priceToBook || null,
        earningsPerShare: quote.epsTrailingTwelveMonths || null,
        trailingPE: quote.trailingPE || null,
        forwardPE: quote.forwardPE || null,
        dividendRate: quote.dividendRate || null,
        dividendYield: quote.dividendYield || null,
        // Beta will be null for new cache entries since quote API doesn't have it
        beta: null,
        expiresAt,
      },
      include: { asset: true }
    });

    return {
      ...cachedQuote,
      isCached: false,
      cacheAge: 0
    };
  } catch (error) {
    // If API fails, return stale cache if available
    if (cached) {
      return {
        ...cached,
        isCached: true,
        isStale: true,
        cacheAge: Date.now() - cached.lastUpdated.getTime()
      };
    }
    throw error;
  }
}

/**
 * Update multiple quote cache entries in a single transaction
 * More efficient than individual cache updates
 */
async function updateBatchQuoteCache(quoteResults: BatchQuoteResult[], assetMap: Map<string, any>) {
  const cacheUpdates = [];
  
  for (const result of quoteResults) {
    if (!result.quote || result.error) continue;
    
    const asset = assetMap.get(result.ticker);
    if (!asset) continue;
    
    const quote = result.quote;
    const expiresAt = new Date(Date.now() + QUOTE_CACHE_TTL);
    
    cacheUpdates.push({
      assetId: asset.id,
      data: {
        regularMarketPrice: quote.regularMarketPrice,
        regularMarketChange: quote.regularMarketChange || null,
        regularMarketChangePercent: quote.regularMarketChangePercent || null,
        regularMarketPreviousClose: quote.regularMarketPreviousClose || null,
        regularMarketOpen: quote.regularMarketOpen || null,
        regularMarketDayLow: quote.regularMarketDayLow || null,
        regularMarketDayHigh: quote.regularMarketDayHigh || null,
        regularMarketVolume: quote.regularMarketVolume ? BigInt(quote.regularMarketVolume) : null,
        currency: quote.currency,
        exchangeName: quote.fullExchangeName || null,
        marketState: quote.marketState || null,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
        marketCap: (quote.marketCap && typeof quote.marketCap === 'number') ? BigInt(Math.floor(quote.marketCap)) : null,
        sharesOutstanding: (quote.sharesOutstanding && typeof quote.sharesOutstanding === 'number') ? BigInt(Math.floor(quote.sharesOutstanding)) : null,
        bookValue: quote.bookValue || null,
        priceToBook: quote.priceToBook || null,
        earningsPerShare: quote.epsTrailingTwelveMonths || null,
        trailingPE: quote.trailingPE || null,
        forwardPE: quote.forwardPE || null,
        dividendRate: quote.dividendRate || null,
        dividendYield: quote.dividendYield || null,
        expiresAt,
      }
    });
  }

  if (cacheUpdates.length === 0) {
    return [];
  }

  // Batch update in a single transaction
  return prisma.$transaction(
    cacheUpdates.map(update => 
      prisma.assetQuoteCache.upsert({
        where: { assetId: update.assetId },
        update: update.data,
        create: {
          assetId: update.assetId,
          ...update.data
        },
        include: { asset: true }
      })
    )
  );
}

/**
 * Get watchlist quotes efficiently using batch fetching
 * Reduces API calls from N individual calls to 1 batch call
 */
export async function getWatchlistQuotes(watchlistId: string) {
  // Get all assets in the watchlist
  const watchlistItems = await prisma.watchlistItem.findMany({
    where: { watchlistId },
    include: { asset: true }
  });

  if (watchlistItems.length === 0) {
    return [];
  }

  // Check cache first for all assets
  const assetIds = watchlistItems.map(item => item.assetId);
  const cachedQuotes = await prisma.assetQuoteCache.findMany({
    where: { 
      assetId: { in: assetIds },
      expiresAt: { gt: new Date() } // Only non-expired cache
    },
    include: { asset: true }
  });

  // Create maps for quick lookup
  const cacheMap = new Map(cachedQuotes.map(cache => [cache.assetId, cache]));
  const assetMap = new Map(watchlistItems.map(item => [item.asset.ticker, item.asset]));
  
  // Find assets that need fresh data
  const itemsNeedingFresh = watchlistItems.filter(item => !cacheMap.has(item.assetId));
  const tickersToFetch = itemsNeedingFresh.map(item => item.asset.ticker);

  // Batch fetch fresh quotes for uncached assets
  let freshQuotes: any[] = [];
  if (tickersToFetch.length > 0) {
    console.log(`Batch fetching ${tickersToFetch.length} quotes: ${tickersToFetch.join(', ')}`);
    freshQuotes = await getBatchQuotes(tickersToFetch);
    
    // Update cache with fresh data
    try {
      await updateBatchQuoteCache(freshQuotes, assetMap);
      console.log(`Successfully updated cache for ${freshQuotes.filter(q => q.quote).length} assets`);
    } catch (error) {
      console.warn('Failed to update batch cache:', error);
    }
  }

  // Create fresh quote lookup
  const freshQuoteMap = new Map(freshQuotes.map(fq => [fq.ticker, fq]));

  // Get asset profiles for beta data (if available)
  const assetProfiles = await prisma.assetProfile.findMany({
    where: { assetId: { in: assetIds } }
  });
  const profileMap = new Map(assetProfiles.map(profile => [profile.assetId, profile]));

  // Build final result combining cached, fresh, and profile data
  return watchlistItems.map(item => {
    const cached = cacheMap.get(item.assetId);
    const fresh = freshQuoteMap.get(item.asset.ticker);
    const profile = profileMap.get(item.assetId);
    
    if (cached) {
      // Use cached data with profile enhancement
      return {
        watchlistItemId: item.id,
        asset: item.asset,
        quote: {
          ...cached,
          // Enhance with profile beta if cache doesn't have it
          beta: cached.beta || profile?.beta || null,
          isCached: true,
          cacheAge: Date.now() - cached.lastUpdated.getTime()
        },
        error: null,
      };
    } else if (fresh && fresh.quote) {
      // Use fresh data with profile enhancement
      return {
        watchlistItemId: item.id,
        asset: item.asset,
        quote: {
          ...fresh.quote,
          // Enhance with profile beta if fresh doesn't have it
          beta: fresh.quote.beta || profile?.beta || null,
          isCached: false,
          cacheAge: 0
        },
        error: null,
      };
    } else {
      // Error case
      return {
        watchlistItemId: item.id,
        asset: item.asset,
        quote: null,
        error: fresh?.error || 'Failed to fetch quote',
      };
    }
  });
}

/**
 * Store historical price data for an asset using existing DailyAggregate model
 * Uses Yahoo Finance chart() API (migrated from deprecated historical() API)
 * 
 * @param assetId - Asset ID to sync
 * @param startDate - Start date for sync
 * @param endDate - End date for sync
 * @param forceFullSync - If true, sync entire range even if data exists
 */
export async function syncAssetHistoricalData(
  assetId: number,
  startDate: Date,
  endDate: Date,
  forceFullSync: boolean = false
) {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId }
  });

  if (!asset) {
    throw new Error(`Asset with id ${assetId} not found`);
  }

  try {
    let actualStartDate = startDate;
    
    // Incremental sync: Check if we already have recent data
    if (!forceFullSync) {
      const lastKnownData = await prisma.dailyAggregate.findFirst({
        where: { 
          assetId,
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: 'desc' },
        select: { date: true }
      });
      
      if (lastKnownData) {
        const lastDate = new Date(lastKnownData.date);
        const daysSinceLastData = Math.floor((endDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // If we have data from yesterday or today, no need to sync
        if (daysSinceLastData < 1) {
          return { success: true, recordsUpdated: 0, cached: true, asset: asset.ticker };
        }
        
        // Only sync from day after last known data
        actualStartDate = new Date(lastDate);
        actualStartDate.setDate(actualStartDate.getDate() + 1);
      }
    }
    
    // Fetch chart data from Yahoo Finance using the new chart() API
    const chartData = await yahooFinance.chart(asset.ticker, {
      period1: actualStartDate,
      period2: endDate,
      interval: '1d'
    });

    let recordsUpdated = 0;

    // Transform chart data to historical format
    const historicalData = transformChartDataToHistoricalFormat(chartData);

    // Store each day's data in DailyAggregate
    for (const data of historicalData) {
      await prisma.dailyAggregate.upsert({
        where: {
          assetId_date: {
            assetId,
            date: data.date
          }
        },
        update: {
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          adjustedClose: data.adjClose,
          volume: BigInt(data.volume),
          dataSource: 'yahoo-finance2',
        },
        create: {
          assetId,
          date: data.date,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          adjustedClose: data.adjClose,
          volume: BigInt(data.volume),
          dataSource: 'yahoo-finance2',
        },
      });
      recordsUpdated++;
    }

    return { success: true, recordsUpdated, cached: false, asset: asset.ticker };
  } catch (error) {
    console.error(`Failed to sync chart data for ${asset.ticker}:`, error);
    throw error;
  }
}

/**
 * Get historical data for an asset from DailyAggregate
 */
export async function getAssetHistoricalData(
  assetId: number,
  startDate?: Date,
  endDate?: Date
) {
  const data = await prisma.dailyAggregate.findMany({
    where: {
      assetId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
    include: { asset: true }
  });

  return data.map(item => ({
    ...item,
    volume: item.volume.toString(), // Convert BigInt to string for JSON serialization
  }));
}

/**
 * Search with caching
 */
export async function searchWithCache(query: string, quotesCount = 10, newsCount = 5) {
  const trimmedQuery = query.trim().toLowerCase();
  
  // Check cache first
  const cached = await prisma.yahooSearchCache.findUnique({
    where: { query: trimmedQuery }
  });

  // Return cached data if not expired
  if (cached && cached.expiresAt > new Date()) {
    return {
      data: cached.results,
      isCached: true,
      cacheAge: Date.now() - cached.lastUpdated.getTime()
    };
  }

  try {
    // Fetch fresh data from Yahoo Finance
    const searchResult = await yahooFinance.search(query, {
      quotesCount,
      newsCount
    });
    
    // Calculate expiration time
    const expiresAt = new Date(Date.now() + SEARCH_CACHE_TTL);
    
    // Update cache
    await prisma.yahooSearchCache.upsert({
      where: { query: trimmedQuery },
      update: {
        results: searchResult as any,
        expiresAt,
      },
      create: {
        query: trimmedQuery,
        results: searchResult as any,
        expiresAt,
      },
    });

    return {
      data: searchResult,
      isCached: false,
      cacheAge: 0
    };
  } catch (error) {
    // If API fails, return stale cache if available
    if (cached) {
      return {
        data: cached.results,
        isCached: true,
        isStale: true,
        cacheAge: Date.now() - cached.lastUpdated.getTime()
      };
    }
    throw error;
  }
}

/**
 * Store/update company profile for an asset
 */
export async function syncAssetProfile(assetId: number) {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId }
  });

  if (!asset) {
    throw new Error(`Asset with id ${assetId} not found`);
  }

  try {
    // Get quote data which includes some profile info
    const quote = await yahooFinance.quote(asset.ticker);
    
    // Try to get more detailed info if available (including company blurb)
    let additionalData = null;
    try {
      additionalData = await yahooFinance.quoteSummary(asset.ticker, {
        modules: ['defaultKeyStatistics', 'assetProfile', 'summaryProfile', 'recommendationTrend'] as any
      });
    } catch (err) {
      console.warn(`Could not fetch quoteSummary for ${asset.ticker}:`, err);
      // Fall back to just quote data
    }

    const keyStats = additionalData?.defaultKeyStatistics;
    const yfAssetProfile = additionalData?.assetProfile as any | undefined;
    const yfSummaryProfile = additionalData?.summaryProfile as any | undefined;
    const description: string | null = yfAssetProfile?.longBusinessSummary || yfSummaryProfile?.longBusinessSummary || null;

    // Create a minimal profile with just the essential data
    const assetProfileRecord = await prisma.assetProfile.upsert({
      where: { assetId },
      update: {
        marketCap: quote.marketCap ? BigInt(quote.marketCap) : null,
        trailingPE: quote.trailingPE || null,
        forwardPE: quote.forwardPE || null,
        priceToBook: keyStats?.priceToBook || null,
        beta: keyStats?.beta || null,
        dividendYield: (quote as any).dividendYield || null,
        description: description || undefined,
      },
      create: {
        assetId,
        marketCap: quote.marketCap ? BigInt(quote.marketCap) : null,
        trailingPE: quote.trailingPE || null,
        forwardPE: quote.forwardPE || null,
        priceToBook: keyStats?.priceToBook || null,
        beta: keyStats?.beta || null,
        dividendYield: (quote as any).dividendYield || null,
        description: description || undefined,
      },
      include: { asset: true }
    });

    return { success: true, profile: assetProfileRecord };
  } catch (error) {
    console.error(`Failed to sync profile for ${asset.ticker}:`, error);
    throw error;
  }
}

/**
 * Clean up expired cache entries
 */
export async function cleanupExpiredCache() {
  const now = new Date();
  
  const [deletedQuotes, deletedSearches] = await Promise.all([
    prisma.assetQuoteCache.deleteMany({
      where: { expiresAt: { lt: now } }
    }),
    prisma.yahooSearchCache.deleteMany({
      where: { expiresAt: { lt: now } }
    })
  ]);

  return {
    deletedQuotes: deletedQuotes.count,
    deletedSearches: deletedSearches.count,
  };
}

/**
 * Force refresh cache for an asset
 */
export async function refreshAssetQuoteCache(assetId: number) {
  // Delete existing cache
  await prisma.assetQuoteCache.delete({
    where: { assetId }
  }).catch(() => {
    // Ignore if not found
  });

  // Fetch fresh data
  return await getAssetQuoteWithCache(assetId);
}

/**
 * Fetch analyst consensus data for a ticker
 * Returns null if data is not available or fails to fetch
 */
export async function getAnalystConsensus(ticker: string): Promise<AnalystConsensus | null> {
  try {
    const result = await yahooFinance.quoteSummary(ticker, {
      modules: ['recommendationTrend'] as any
    });

    if (result.recommendationTrend) {
      return processAnalystConsensus(result.recommendationTrend);
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to fetch analyst consensus for ${ticker}:`, error);
    return null;
  }
}

/**
 * Determine asset type based on Yahoo Finance quote type
 */
function determineAssetType(quoteType?: string): string {
  if (!quoteType) return 'STOCK';
  
  const type = quoteType.toLowerCase();
  if (type.includes('etf')) return 'ETF';
  if (type.includes('mutualfund') || type.includes('mutual fund')) return 'MUTUAL_FUND';
  if (type.includes('bond')) return 'BOND';
  if (type.includes('index')) return 'INDEX';
  return 'STOCK'; // Default to stock
}

/**
 * Create a new asset from a ticker symbol by fetching data from Yahoo Finance
 */
export async function createAssetFromTicker(ticker: string) {
  const upperTicker = ticker.toUpperCase();
  
  try {
    // First check if it already exists to avoid duplicates
    const existingAsset = await prisma.asset.findUnique({
      where: { ticker: upperTicker },
      include: { stock: true, bond: true, mutualFund: true }
    });
    
    if (existingAsset) {
      return existingAsset;
    }

    // Fetch quote data from Yahoo Finance to get basic info
    const quoteResponse = await yahooFinance.quote(upperTicker);
    const quote = Array.isArray(quoteResponse) ? quoteResponse[0] : quoteResponse;
    
    if (!quote) {
      throw new Error(`No data found for ticker ${upperTicker}`);
    }

    // Determine asset type
    const assetType = determineAssetType(quote.quoteType);
    
    // Get company logo URL
    const logoUrl = await getCompanyLogoUrl(upperTicker, quote.longName || quote.shortName);
    
    // Create the asset
    const asset = await prisma.asset.create({
      data: {
        ticker: upperTicker,
        name: quote.longName || quote.shortName || quote.displayName || upperTicker,
        type: assetType,
        market: quote.fullExchangeName || quote.exchange || null,
        locale: quote.region || null,
        primaryExchange: quote.exchange || null,
        active: true,
        currencyName: quote.currency || 'USD',
        logoUrl: logoUrl,
        minimumPurchaseAmount: 0.0001,
        allowFractionalShares: true,
      }
    });

    // Fetch additional profile data for enhanced metrics first (before creating Stock record)
    let additionalData = null;
    try {
      additionalData = await yahooFinance.quoteSummary(upperTicker, {
        modules: ['defaultKeyStatistics', 'assetProfile', 'summaryProfile', 'recommendationTrend'] as any
      });
    } catch (err) {
      console.warn(`Could not fetch enhanced data for ${upperTicker}:`, err);
      // Continue without enhanced data
    }

    const keyStats = additionalData?.defaultKeyStatistics;
    const yfAssetProfile2 = additionalData?.assetProfile as any | undefined;
    const yfSummaryProfile2 = additionalData?.summaryProfile as any | undefined;

    // Create specific asset type record if applicable
    if (assetType === 'STOCK') {
      // Get sector/industry from assetProfile or summaryProfile (not available in basic quote)
      const sector = yfAssetProfile2?.sector || yfSummaryProfile2?.sector || null;
      const industry = yfAssetProfile2?.industry || yfSummaryProfile2?.industry || null;
      
      await prisma.stock.create({
        data: {
          id: asset.id,
          ticker: upperTicker,
          name: asset.name,
          sector,
          industry,
        }
      });
    } else if (assetType === 'MUTUAL_FUND') {
      await prisma.mutualFund.create({
        data: {
          id: asset.id,
          fundFamily: (quote as any).fundFamily || null,
          fundType: (quote as any).category || null,
          expenseRatio: 0.0, // Default value since null is not allowed
          nav: quote.regularMarketPrice || null,
        }
      });
    } else if (assetType === 'BOND') {
      await prisma.bond.create({
        data: {
          id: asset.id,
          issuer: quote.longName || null,
          issueDate: new Date(), // Default to current date
          maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now
          couponRate: 0.0, // Default coupon rate
          bondType: 'Corporate', // Default, could be enhanced
          faceValue: 1000, // Default bond face value
          paymentFrequency: 'Semi-annually', // Default payment frequency
        }
      });
    }

    const description: string | null = yfAssetProfile2?.longBusinessSummary || yfSummaryProfile2?.longBusinessSummary || null;

    // Create initial quote cache entry with enhanced metrics
    if (quote.regularMarketPrice) {
      await prisma.assetQuoteCache.create({
        data: {
          assetId: asset.id,
          regularMarketPrice: quote.regularMarketPrice,
          regularMarketChange: quote.regularMarketChange || null,
          regularMarketChangePercent: quote.regularMarketChangePercent || null,
          regularMarketPreviousClose: quote.regularMarketPreviousClose || null,
          regularMarketOpen: quote.regularMarketOpen || null,
          regularMarketDayLow: quote.regularMarketDayLow || null,
          regularMarketDayHigh: quote.regularMarketDayHigh || null,
          regularMarketVolume: quote.regularMarketVolume ? BigInt(quote.regularMarketVolume) : null,
          currency: quote.currency || 'USD',
          exchangeName: quote.fullExchangeName || null,
          marketState: quote.marketState || null,
          // Enhanced metrics from quoteSummary
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
          marketCap: (quote.marketCap && typeof quote.marketCap === 'number') ? BigInt(Math.floor(quote.marketCap)) : null,
          sharesOutstanding: (quote.sharesOutstanding && typeof quote.sharesOutstanding === 'number') ? BigInt(Math.floor(quote.sharesOutstanding)) : null,
          averageVolume: (quote.averageVolume && typeof quote.averageVolume === 'number') ? BigInt(Math.floor(quote.averageVolume)) : null,
          averageVolume10days: (quote.averageVolume10days && typeof quote.averageVolume10days === 'number') ? BigInt(Math.floor(quote.averageVolume10days)) : null,
          bookValue: keyStats?.bookValue || null,
          priceToBook: keyStats?.priceToBook || null,
          earningsPerShare: keyStats?.trailingEps || null,
          trailingPE: quote.trailingPE || null,
          forwardPE: quote.forwardPE || null,
          dividendRate: quote.dividendRate || null,
          dividendYield: (quote as any).dividendYield || null,
          exDividendDate: quote.exDividendDate ? new Date(quote.exDividendDate * 1000) : null,
          beta: keyStats?.beta || null,
          expiresAt: new Date(Date.now() + QUOTE_CACHE_TTL),
        }
      });
    }

    // Create asset profile with enhanced data
    try {
      await prisma.assetProfile.create({
        data: {
          assetId: asset.id,
          marketCap: (quote.marketCap && typeof quote.marketCap === 'number') ? BigInt(Math.floor(quote.marketCap)) : null,
          trailingPE: quote.trailingPE || null,
          forwardPE: quote.forwardPE || null,
          priceToBook: keyStats?.priceToBook || null,
          beta: keyStats?.beta || null,
          dividendYield: (quote as any).dividendYield || null,
          description: description || undefined,
        }
      });
      console.log(`Successfully created profile data for ${upperTicker} with beta: ${keyStats?.beta}`);
    } catch (error) {
      console.warn(`Could not create profile data for ${upperTicker}:`, error);
      // Continue without profile data - this is not a critical failure
    }

    // Return asset with relations included - this ensures we return the correct type
    const assetWithRelations = await prisma.asset.findUnique({
      where: { id: asset.id },
      include: { stock: true, bond: true, mutualFund: true, profile: true }
    });
    
    if (!assetWithRelations) {
      throw new Error(`Failed to retrieve created asset ${upperTicker}`);
    }
    
    return assetWithRelations;
  } catch (error) {
    console.error(`Failed to create asset for ticker ${upperTicker}:`, error);
    throw new Error(`Could not create asset for ${upperTicker}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get chart data directly from Yahoo Finance (for intraday and short timeframes)
 * This function doesn't persist data to database - used for 1D, 5D timeframes
 */
export async function getChartDataDirect(
  ticker: string,
  startDate: Date,
  endDate: Date,
  interval: ValidInterval = '1d'
): Promise<ChartDataDirectResponse> {
  try {
    // Fetch chart data directly from Yahoo Finance
    const chartData = await yahooFinance.chart(ticker, {
      period1: startDate,
      period2: endDate,
      interval: interval // Now properly typed to match Yahoo Finance expectations
    });

    // Transform chart data to standard format
    const historicalData = transformChartDataToHistoricalFormat(chartData);

    return {
      success: true,
      data: historicalData.map((item: TransformedChartData): SerializedChartData => ({
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        adjClose: item.adjClose,
        volume: item.volume.toString(), // Convert to string for JSON serialization
      })),
      meta: {
        ticker,
        interval,
        dataPoints: historicalData.length,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        source: 'yahoo-finance-direct'
      }
    };
  } catch (error) {
    console.error(`Failed to fetch direct chart data for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Get news for a specific asset ticker
 * Uses existing search cache infrastructure for news items
 */
export async function getAssetNews(ticker: string, limit = 10) {
  try {
    // Use existing searchWithCache but focus on news only
    const searchResult = await searchWithCache(ticker, 0, limit);
    
    // Type assertion for the search result data structure
    const searchData = searchResult.data as any;
    
    if (!searchData || !searchData.news) {
      return {
        news: [],
        isCached: searchResult.isCached,
        cacheAge: searchResult.cacheAge,
        isStale: searchResult.isStale
      };
    }

    // Transform news items to our standard format
    const newsItems = searchData.news.map((item: any) => {
      // Handle different possible timestamp formats
      let publishedDate: Date;
      if (item.providerPublishTime) {
        // If it's a Unix timestamp (number), convert it
        if (typeof item.providerPublishTime === 'number') {
          publishedDate = new Date(item.providerPublishTime * 1000);
        } else {
          // If it's already a string/ISO date, parse it directly
          publishedDate = new Date(item.providerPublishTime);
        }
      } else {
        // Fallback to current time if no timestamp
        publishedDate = new Date();
      }

      // Validate the date
      if (isNaN(publishedDate.getTime())) {
        publishedDate = new Date();
      }

      const timeDiff = Date.now() - publishedDate.getTime();
      
      return {
        uuid: item.uuid,
        title: item.title,
        publisher: item.publisher,
        link: item.link,
        publishedAt: publishedDate,
        type: item.type,
        thumbnail: item.thumbnail?.resolutions?.[0]?.url,
        relatedTickers: item.relatedTickers,
        isRecent: timeDiff < 24 * 60 * 60 * 1000 && timeDiff > 0
      };
    });

    return {
      news: newsItems,
      isCached: searchResult.isCached,
      cacheAge: searchResult.cacheAge,
      isStale: searchResult.isStale
    };
  } catch (error) {
    console.error(`Failed to fetch news for ${ticker}:`, error);
    throw error;
  }
} 