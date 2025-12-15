import { NextRequest, NextResponse } from 'next/server';
import { getWatchlistQuotes } from '@/lib/yahoo-finance-service';

/**
 * GET /api/watchlist/[id]/quotes
 * Get cached quotes for all assets in a watchlist
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  
  try {
    const watchlistId = resolvedParams.id;

    if (!watchlistId) {
      return NextResponse.json(
        { success: false, error: 'Watchlist ID is required' },
        { status: 400 }
      );
    }

    // Get cached quotes for all assets in the watchlist
    const quotes = await getWatchlistQuotes(watchlistId);
    
    // Serialize BigInt fields to strings for JSON compatibility
    const serializedQuotes = quotes.map(item => ({
      ...item,
      quote: item.quote ? {
        ...item.quote,
        // Convert BigInt fields to strings
        regularMarketVolume: item.quote.regularMarketVolume?.toString(),
        marketCap: item.quote.marketCap?.toString(),
        sharesOutstanding: item.quote.sharesOutstanding?.toString(),
        averageVolume: item.quote.averageVolume?.toString(),
        averageVolume10days: item.quote.averageVolume10days?.toString(),
      } : null
    }));
    
    return NextResponse.json({
      success: true,
      data: serializedQuotes,
      timestamp: new Date().toISOString(),
      meta: {
        watchlistId,
        count: quotes.length,
        cachedCount: quotes.filter(q => q.quote?.isCached).length,
        errorCount: quotes.filter(q => q.error).length,
      }
    });
  } catch (error: any) {
    console.error('Error fetching watchlist quotes:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch watchlist quotes' 
      },
      { status: 500 }
    );
  }
} 