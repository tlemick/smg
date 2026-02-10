import { NextRequest, NextResponse } from 'next/server';
import { getAssetQuoteWithCache, createAssetFromTicker, getAssetHistoricalData } from '@/lib/yahoo-finance-service';
import { prisma } from '@/prisma/client';
import { QuoteApiRequest, QuoteDataSerializable, ChartQuoteSerializable } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: QuoteApiRequest = await request.json();
    const { ticker, startDate, endDate, useCache = true, createAssetIfMissing = true } = body;

    if (!ticker) {
      return NextResponse.json(
        { success: false, error: 'Ticker symbol is required' },
        { status: 400 }
      );
    }

    const upperTicker = ticker.toUpperCase();

    // Find or create asset
    let asset = await prisma.asset.findUnique({ 
      where: { ticker: upperTicker },
      include: { stock: true, bond: true, mutualFund: true }
    });

    if (!asset && createAssetIfMissing) {
      try {
        asset = await createAssetFromTicker(upperTicker);
      } catch (error: any) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Failed to create asset for ticker ${upperTicker}: ${error.message}` 
          },
          { status: 400 }
        );
      }
    } else if (!asset) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Asset not found for ticker ${upperTicker}. Set createAssetIfMissing=true to create automatically.` 
        },
        { status: 404 }
      );
    }

    // Ensure asset is not null before proceeding
    if (!asset) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to find or create asset for ticker ${upperTicker}` 
        },
        { status: 500 }
      );
    }

    // Get cached quote data
    const quoteData = await getAssetQuoteWithCache(asset.id);
    
    // Prepare serializable quote data
    const quote: QuoteDataSerializable = {
      regularMarketPrice: quoteData.regularMarketPrice,
      currency: quoteData.currency,
      regularMarketChange: quoteData.regularMarketChange ?? undefined,
      regularMarketChangePercent: quoteData.regularMarketChangePercent ?? undefined,
      regularMarketPreviousClose: quoteData.regularMarketPreviousClose ?? undefined,
      regularMarketOpen: quoteData.regularMarketOpen ?? undefined,
      regularMarketDayLow: quoteData.regularMarketDayLow ?? undefined,
      regularMarketDayHigh: quoteData.regularMarketDayHigh ?? undefined,
      regularMarketVolume: quoteData.regularMarketVolume?.toString(),
      isCached: quoteData.isCached,
      cacheAge: quoteData.cacheAge,
      isStale: (quoteData as any).isStale,
      exchangeName: quoteData.exchangeName,
      marketState: quoteData.marketState,
    };

    // Get historical data if dates are provided
    let historical: ChartQuoteSerializable[] = [];
    if (startDate && endDate) {
      try {
        const historicalData = await getAssetHistoricalData(
          asset.id,
          new Date(startDate),
          new Date(endDate)
        );
        
        historical = historicalData.map((item: any) => ({
          date: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume, // Already converted to string in service
          adjclose: item.adjustedClose,
        }));
      } catch (error: any) {
        console.warn(`Failed to fetch chart data for ${upperTicker}:`, error.message);
        // Continue without historical data
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        quote,
        historical,
        asset: {
          id: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          type: asset.type,
          market: asset.market,
        }
      },
      cached: quoteData.isCached,
      timestamp: new Date().toISOString(),
      meta: {
        assetId: asset.id,
        historicalCount: historical.length,
        cacheAge: quoteData.cacheAge,
      }
    });
  } catch (error: any) {
    console.error('Error fetching quote data:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch quote data' 
      },
      { status: 500 }
    );
  }
} 