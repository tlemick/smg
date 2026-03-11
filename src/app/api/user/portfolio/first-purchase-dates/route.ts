import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/prisma/client';

/**
 * Helper function to get authenticated user from session cookie
 * Matches pattern used by overview and other user routes
 */
async function getAuthenticatedUser(): Promise<{ id: string; email: string; name: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session');

    if (!sessionCookie) {
      return null;
    }

    return JSON.parse(sessionCookie.value);
  } catch (error) {
    return null;
  }
}

interface FirstPurchaseDatesRequest {
  tickers: string[];
}

/**
 * Get the first purchase date and price for each ticker in the user's portfolio
 * Returns a map of ticker -> { date: ISO string, price: number }
 * Used for "Price Change (since first buy)" to align with actual transaction price
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body: FirstPurchaseDatesRequest = await request.json();
    const { tickers } = body;

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tickers array is required' },
        { status: 400 }
      );
    }

    // Find user's portfolio
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!portfolio) {
      return NextResponse.json({ success: true, data: {} });
    }

    // Get all assets for the tickers
    const assets = await prisma.asset.findMany({
      where: {
        ticker: {
          in: tickers.map(t => t.toUpperCase()),
        },
      },
      select: {
        id: true,
        ticker: true,
      },
    });

    const assetMap = new Map(assets.map(a => [a.ticker, a.id]));

    // For each ticker, find the first BUY transaction (date + price)
    const firstPurchaseData: Record<string, { date: string; price: number }> = {};

    for (const ticker of tickers) {
      const upperTicker = ticker.toUpperCase();
      const assetId = assetMap.get(upperTicker);

      if (!assetId) {
        continue;
      }

      // Find the first BUY transaction for this asset
      const firstTransaction = await prisma.transaction.findFirst({
        where: {
          portfolioId: portfolio.id,
          assetId: assetId,
          type: 'BUY',
        },
        orderBy: {
          date: 'asc',
        },
        select: {
          date: true,
          price: true,
        },
      });

      if (firstTransaction) {
        firstPurchaseData[upperTicker] = {
          date: firstTransaction.date.toISOString(),
          price: firstTransaction.price,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: firstPurchaseData,
    });
  } catch (error: any) {
    console.error('Error fetching first purchase dates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

