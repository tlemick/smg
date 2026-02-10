import { NextResponse } from 'next/server';
import { getRandomConsumerBrands, getBatchQuotes } from '@/lib/yahoo-finance-service';
import { prisma } from '@/prisma/client';
import type { StockSuggestion } from '@/types';

/**
 * GET /api/trade-suggestions/consumer-brands
 * 
 * Returns a random selection of recognizable consumer brand stocks
 * These are "Stuff You Buy" - brands students interact with daily
 */
export async function GET() {
  try {
    // Get random selection of 10 consumer brand tickers
    const tickers = getRandomConsumerBrands(10);
    
    if (tickers.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          category: 'consumer-brands',
          count: 0,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Batch fetch quotes for all selected brands
    const quotes = await getBatchQuotes(tickers);
    
    // Get asset data from database for logos and names
    const assets = await prisma.asset.findMany({
      where: { ticker: { in: tickers } },
      select: { ticker: true, logoUrl: true, name: true }
    });
    
    const assetMap = new Map(assets.map(a => [a.ticker, a]));
    
    // Transform to StockSuggestion format
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
          category: 'consumer',
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
        };
      });
    
    return NextResponse.json({
      success: true,
      data: suggestions,
      meta: {
        category: 'consumer-brands',
        count: suggestions.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching consumer brands:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch consumer brands',
        data: []
      },
      { status: 500 }
    );
  }
}
