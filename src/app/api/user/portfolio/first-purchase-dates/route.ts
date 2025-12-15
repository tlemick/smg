import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../../../prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function getAuthenticatedUser(): Promise<{ id: string; email: string; name: string; role: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; name: string; role: string };
    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch (error) {
    return null;
  }
}

interface FirstPurchaseDatesRequest {
  tickers: string[];
}

/**
 * Get the first purchase date for each ticker in the user's portfolio
 * Returns a map of ticker -> ISO date string
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

    // For each ticker, find the first BUY transaction
    const firstPurchaseDates: Record<string, string> = {};

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
        },
      });

      if (firstTransaction) {
        firstPurchaseDates[upperTicker] = firstTransaction.date.toISOString();
      }
    }

    return NextResponse.json({
      success: true,
      data: firstPurchaseDates,
    });
  } catch (error: any) {
    console.error('Error fetching first purchase dates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

