import { NextRequest, NextResponse } from 'next/server';
import { getAssetNews } from '@/lib/yahoo-finance-service';
import { AssetNewsResponse } from '@/types';

/**
 * GET /api/asset-news/[ticker]
 * Get news articles for a specific asset ticker
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const upperTicker = ticker.toUpperCase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20); // Max 20 items
    const useCache = searchParams.get('useCache') !== 'false';

    // Fetch news from Yahoo Finance
    const newsResult = await getAssetNews(upperTicker, limit);

    const response: AssetNewsResponse = {
      success: true,
      data: newsResult.news || [],
      cached: newsResult.isCached,
      timestamp: new Date().toISOString(),
      meta: {
        ticker: upperTicker,
        itemCount: newsResult.news?.length || 0,
        cacheAge: newsResult.cacheAge || 0,
        lastUpdated: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error(`Error fetching news for ${(await params).ticker}:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch news',
        data: [],
        meta: {
          ticker: (await params).ticker?.toUpperCase() || '',
          itemCount: 0,
          cacheAge: 0,
          lastUpdated: new Date().toISOString()
        }
      } as AssetNewsResponse,
      { status: 500 }
    );
  }
}
