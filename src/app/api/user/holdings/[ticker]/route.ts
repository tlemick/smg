import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAssetQuoteWithCache } from '@/lib/yahoo-finance-service';
import { prisma } from '@/prisma/client';

/**
 * Helper function to get authenticated user from session cookie
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

/**
 * GET /api/user/holdings/[ticker]
 * Get user's holdings for a specific asset across all portfolios
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const upperTicker = ticker.toUpperCase();

    // Get authenticated user (required)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find asset by ticker
    const asset = await prisma.asset.findUnique({
      where: { ticker: upperTicker },
      select: { id: true, ticker: true, name: true, type: true }
    });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: `Asset not found: ${upperTicker}` },
        { status: 404 }
      );
    }

    // Get user's holdings for this asset
    const holdings = await prisma.holding.findMany({
      where: {
        assetId: asset.id,
        portfolio: {
          userId: user.id
        }
      },
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
            cash_balance: true,
            gameSession: {
              select: {
                id: true,
                name: true,
                isActive: true,
                startDate: true,
                endDate: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (holdings.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          asset,
          hasHoldings: false,
          message: `No holdings found for ${upperTicker}`
        },
        timestamp: new Date().toISOString()
      });
    }

    // Get current quote for P&L calculations
    const quoteData = await getAssetQuoteWithCache(asset.id);
    const currentPrice = quoteData.regularMarketPrice;

    // Calculate aggregated position data
    const totalQuantity = holdings.reduce((sum, h) => sum + h.quantity, 0);
    const totalCostBasis = holdings.reduce((sum, h) => sum + (h.quantity * h.averagePrice), 0);
    const avgCostBasis = totalCostBasis / totalQuantity;
    const currentValue = totalQuantity * currentPrice;
    const unrealizedPnL = currentValue - totalCostBasis;
    const unrealizedPnLPercent = (unrealizedPnL / totalCostBasis) * 100;

    // Get total transaction history for this asset
    const transactions = await prisma.transaction.findMany({
      where: {
        assetId: asset.id,
        userId: user.id
      },
      orderBy: {
        date: 'desc'
      },
      take: 10 // Last 10 transactions
    });

    // Calculate realized P&L from transactions
    const buyTransactions = transactions.filter(t => t.type === 'BUY');
    const sellTransactions = transactions.filter(t => t.type === 'SELL');
    const totalBought = buyTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalSold = sellTransactions.reduce((sum, t) => sum + t.total, 0);
    const realizedPnL = totalSold - totalBought;

    // Format individual holdings
    const formattedHoldings = holdings.map(holding => ({
      id: holding.id,
      quantity: holding.quantity,
      averagePrice: holding.averagePrice,
      costBasis: holding.quantity * holding.averagePrice,
      currentValue: holding.quantity * currentPrice,
      unrealizedPnL: (holding.quantity * currentPrice) - (holding.quantity * holding.averagePrice),
      unrealizedPnLPercent: (((holding.quantity * currentPrice) - (holding.quantity * holding.averagePrice)) / (holding.quantity * holding.averagePrice)) * 100,
      createdAt: holding.createdAt,
      updatedAt: holding.updatedAt,
      portfolio: holding.portfolio
    }));

    const response = {
      success: true,
      data: {
        asset,
        hasHoldings: true,
        summary: {
          totalQuantity,
          avgCostBasis,
          totalCostBasis,
          currentPrice,
          currentValue,
          unrealizedPnL,
          unrealizedPnLPercent,
          realizedPnL,
          totalPnL: unrealizedPnL + realizedPnL
        },
        holdings: formattedHoldings,
        recentTransactions: transactions.slice(0, 5), // Last 5 transactions
        quote: {
          regularMarketPrice: currentPrice,
          regularMarketChange: quoteData.regularMarketChange,
          regularMarketChangePercent: quoteData.regularMarketChangePercent,
          currency: quoteData.currency,
          marketState: quoteData.marketState,
          isCached: quoteData.isCached,
          cacheAge: quoteData.cacheAge
        }
      },
      timestamp: new Date().toISOString(),
      meta: {
        userId: user.id,
        ticker: upperTicker,
        assetId: asset.id,
        holdingCount: holdings.length,
        transactionCount: transactions.length,
        cacheAge: quoteData.cacheAge
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error(`Error fetching user holdings for ${(await params).ticker}:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch user holdings' 
      },
      { status: 500 }
    );
  }
} 