import { NextRequest, NextResponse } from 'next/server';
import { searchWithCache } from '@/lib/yahoo-finance-service';
import { SearchApiRequest, ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: SearchApiRequest = await request.json();
    const { query, quotesCount = 10, newsCount = 5 } = body;

    // Validate query parameter
    if (typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate counts
    if (quotesCount < 0 || quotesCount > 50) {
      return NextResponse.json(
        { success: false, error: 'quotesCount must be between 0 and 50' },
        { status: 400 }
      );
    }

    if (newsCount < 0 || newsCount > 20) {
      return NextResponse.json(
        { success: false, error: 'newsCount must be between 0 and 20' },
        { status: 400 }
      );
    }

    // Perform cached search
    const searchResult = await searchWithCache(query.trim(), quotesCount, newsCount);

    return NextResponse.json({
      success: true,
      data: searchResult.data,
      cached: searchResult.isCached,
      timestamp: new Date().toISOString(),
      meta: {
        query: query.trim(),
        quotesCount,
        newsCount,
        cacheAge: searchResult.cacheAge,
        isStale: searchResult.isStale,
      }
    });
  } catch (error: any) {
    console.error('Error performing search:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to perform search' 
      },
      { status: 500 }
    );
  }
} 