import { NextRequest, NextResponse } from 'next/server';
import { syncAssetHistoricalData, getAssetHistoricalData } from '@/lib/yahoo-finance-service';
import { prisma } from '../../../../../prisma/client';

interface BatchChartRequest {
  requests: {
    ticker: string;
    period1?: string | number;
    period2?: string | number;
  }[];
}

interface BatchChartResponse {
  success: boolean;
  results: {
    ticker: string;
    success: boolean;
    data?: number[];
    error?: string;
  }[];
}

/**
 * Batch chart data endpoint
 * Fetches historical price data for multiple tickers in a single request
 * Returns simplified close price arrays for sparkline visualization
 */
export async function POST(request: NextRequest) {
  try {
    const body: BatchChartRequest = await request.json();
    const { requests } = body;

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Requests array is required' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (requests.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum 50 tickers per batch request' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      requests.map(async (req) => {
        try {
          const { ticker, period1, period2 } = req;
          const upperTicker = ticker.toUpperCase();

          // Find asset
          let asset = await prisma.asset.findUnique({ 
            where: { ticker: upperTicker },
          });

          if (!asset) {
            return {
              ticker: upperTicker,
              success: false,
              error: `Asset ${upperTicker} not found`,
            };
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
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          }

          // Sync and fetch historical data
          await syncAssetHistoricalData(asset.id, startDate!, endDate!).catch(() => {
            // Ignore sync errors, we'll use what we have
          });

          const historicalData = await getAssetHistoricalData(asset.id, startDate, endDate);

          // Extract close prices in chronological order
          const closePrices = historicalData
            .map(h => ({
              date: new Date(h.date as any),
              close: (h.close as number) ?? (h.adjustedClose as number) ?? 0,
            }))
            .filter(h => h.close > 0)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(h => h.close);

          if (closePrices.length === 0) {
            return {
              ticker: upperTicker,
              success: false,
              error: 'No price data available for the specified period',
            };
          }

          return {
            ticker: upperTicker,
            success: true,
            data: closePrices,
          };
        } catch (error: any) {
          return {
            ticker: req.ticker.toUpperCase(),
            success: false,
            error: error.message || 'Failed to fetch chart data',
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results,
    } as BatchChartResponse);
  } catch (error: any) {
    console.error('Batch chart API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

