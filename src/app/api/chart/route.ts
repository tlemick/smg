import { NextRequest, NextResponse } from 'next/server';
import { syncAssetHistoricalData, getAssetHistoricalData, createAssetFromTicker, getChartDataDirect, ValidInterval } from '@/lib/yahoo-finance-service';
import { prisma } from '../../../../prisma/client';
import { ChartApiRequest, ChartQuoteSerializable } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ChartApiRequest = await request.json();
    const { ticker, period1, period2, interval = '1d', includeAdjClose = false } = body;

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
    });

    if (!asset) {
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
    }

    // Convert periods to dates
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (period1) {
      startDate = typeof period1 === 'string' ? new Date(period1) : new Date(period1 * 1000);
    }
    if (period2) {
      endDate = typeof period2 === 'string' ? new Date(period2) : new Date(period2 * 1000);
    }

    // Default to last 30 days if no periods specified
    if (!startDate && !endDate) {
      endDate = new Date();
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    }

    // Validate interval and cast to ValidInterval
    const validIntervals: ValidInterval[] = ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"];
    const typedInterval: ValidInterval = validIntervals.includes(interval as ValidInterval) ? interval as ValidInterval : '1d';

    // Determine data strategy based on timeframe and interval
    const daysDiff = endDate && startDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 30;
    const isShortTimeframe = daysDiff <= 7; // 1D, 5D timeframes
    const useIntraday = typedInterval !== '1d' && (typedInterval.toString().includes('m') || typedInterval.toString().includes('h'));
    
    // Use direct fetch for long historical ranges to avoid database cache issues
    // The incremental sync logic can incorrectly limit data if only recent data exists
    const isLongHistorical = daysDiff > 90; // 3M, 6M, 1Y, 5Y

    let quotes: ChartQuoteSerializable[] = [];
    let dataSource = 'database';

    // Use direct fetch for: short timeframes, intraday, OR long historical ranges
    if (isShortTimeframe || useIntraday || isLongHistorical) {
      // Get data directly from Yahoo Finance
      try {
        const directData = await getChartDataDirect(upperTicker, startDate!, endDate!, typedInterval);
        quotes = directData.data.map((item: any) => ({
          date: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
          adjclose: includeAdjClose ? item.adjClose : undefined,
        }));
        dataSource = 'yahoo-finance-direct';
      } catch (directError: any) {
        console.warn(`Failed to fetch direct data for ${upperTicker}:`, directError.message);
        // Fallback to database data if available
      }
    }

    // If we don't have data yet, try database approach for daily data
    if (quotes.length === 0 && typedInterval === '1d') {
      try {
        // Sync daily data to database for longer timeframes
        if (startDate && endDate && !isShortTimeframe) {
          await syncAssetHistoricalData(asset.id, startDate, endDate);
        }

        // Get historical data from database
        const historicalData = await getAssetHistoricalData(asset.id, startDate, endDate);
        
        quotes = historicalData.map((item: any) => ({
          date: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume, // Already converted to string in service
          adjclose: includeAdjClose ? item.adjustedClose : undefined,
        }));
        dataSource = 'database';
      } catch (syncError: any) {
        console.warn(`Failed to sync/fetch database data for ${upperTicker}:`, syncError.message);
      }
    }

    // Create chart metadata
    const meta = {
      currency: asset.currencyName || 'USD',
      symbol: asset.ticker,
      exchangeName: asset.market || asset.primaryExchange || 'Unknown',
      instrumentType: asset.type.toLowerCase(),
      firstTradeDate: quotes.length > 0 ? quotes[0].date : null,
      regularMarketTime: new Date(),
      gmtoffset: 0, // Would need timezone logic
      timezone: 'UTC',
      exchangeTimezoneName: 'UTC',
      regularMarketPrice: quotes.length > 0 ? quotes[quotes.length - 1].close : 0,
      priceHint: 2,
      dataGranularity: typedInterval,
      range: `${startDate?.toISOString()}_${endDate?.toISOString()}`,
      validRanges: ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'],
    };

    return NextResponse.json({
      success: true,
      data: {
        meta,
        quotes,
      },
      timestamp: new Date().toISOString(),
      meta: {
        assetId: asset.id,
        ticker: asset.ticker,
        dataPoints: quotes.length,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        interval: typedInterval,
        includeAdjClose,
        dataSource,
        isShortTimeframe,
        useIntraday,
        isLongHistorical,
        daysDiff,
        requestedDays: daysDiff,
        actualDataPoints: quotes.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching chart data:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch chart data' 
      },
      { status: 500 }
    );
  }
} 