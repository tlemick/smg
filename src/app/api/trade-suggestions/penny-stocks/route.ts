import { NextResponse } from 'next/server';
import { getPennyStockCandidates, getBatchQuotes } from '@/lib/yahoo-finance-service';
import { prisma } from '@/prisma/client';
import type { StockSuggestion } from '@/types';

/**
 * GET /api/trade-suggestions/penny-stocks
 * 
 * Returns penny stocks (stocks under $5) using curated list
 * These are "Cheap Seats" stocks where students can own many shares
 */
export async function GET() {
  try {
    // Get curated list of penny stock candidates
    const tickers = getPennyStockCandidates();
    
    if (tickers.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          category: 'penny-stocks',
          count: 0,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Batch fetch quotes for all candidates
    const quotes = await getBatchQuotes(tickers);
    
    // Get asset data from database for logos and names (optional)
    const assets = await prisma.asset.findMany({
      where: { ticker: { in: tickers } },
      select: { ticker: true, logoUrl: true, name: true }
    });
    
    const assetMap = new Map(assets.map(a => [a.ticker, a]));
    
    // Transform to StockSuggestion format, filter by price, and limit to 10
    const suggestions: StockSuggestion[] = quotes
      .filter(q => {
        // Filter: must have quote, no error, and price under $5
        if (!q.quote || q.error) return false;
        const price = q.quote.regularMarketPrice;
        return price > 0.01 && price < 5; // Exclude extremely cheap (delisted) stocks
      })
      .slice(0, 10) // Limit to 10 stocks
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
          category: 'penny',
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
        };
      })
      // Sort by price (cheapest first) to show most "shares per dollar"
      .sort((a, b) => a.price - b.price);
    
    return NextResponse.json({
      success: true,
      data: suggestions,
      meta: {
        category: 'penny-stocks',
        count: suggestions.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching penny stocks:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch penny stocks',
        data: []
      },
      { status: 500 }
    );
  }
}
