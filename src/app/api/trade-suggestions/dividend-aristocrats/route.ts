import { NextResponse } from 'next/server';
import { getDividendAristocrats, getBatchQuotes } from '@/lib/yahoo-finance-service';
import { prisma } from '@/prisma/client';
import type { StockSuggestion } from '@/types';

/**
 * GET /api/trade-suggestions/dividend-aristocrats
 * 
 * Returns dividend aristocrat stocks (25+ years of consecutive dividend increases)
 * These are "Safe & Steady" stocks that pay you to own them
 */
export async function GET() {
  try {
    // Get dividend aristocrat tickers
    const tickers = getDividendAristocrats();
    
    if (tickers.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          category: 'dividend-aristocrats',
          count: 0,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Batch fetch quotes for all dividend aristocrats
    const quotes = await getBatchQuotes(tickers);
    
    // Get asset data from database for logos and names
    const assets = await prisma.asset.findMany({
      where: { ticker: { in: tickers } },
      select: { ticker: true, logoUrl: true, name: true }
    });
    
    const assetMap = new Map(assets.map(a => [a.ticker, a]));
    
    // Transform to StockSuggestion format with dividend data
    const suggestions: StockSuggestion[] = quotes
      .filter(q => q.quote && !q.error)
      .map(q => {
        const asset = assetMap.get(q.ticker);
        const quote = q.quote;
        
        return {
          ticker: q.ticker,
          name: asset?.name || quote.longName || quote.shortName || q.ticker,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
          logoUrl: asset?.logoUrl || null,
          marketCap: quote.marketCap ? quote.marketCap.toString() : null,
          volume: quote.regularMarketVolume ? quote.regularMarketVolume.toString() : null,
          category: 'dividend',
          // Dividend-specific fields
          dividendYield: quote.dividendYield || null,
          dividendRate: quote.dividendRate || null,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
        };
      })
      // Sort by dividend yield (highest first) to show best yielding stocks first
      .sort((a, b) => (b.dividendYield || 0) - (a.dividendYield || 0));
    
    return NextResponse.json({
      success: true,
      data: suggestions,
      meta: {
        category: 'dividend-aristocrats',
        count: suggestions.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching dividend aristocrats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dividend aristocrats',
        data: []
      },
      { status: 500 }
    );
  }
}
