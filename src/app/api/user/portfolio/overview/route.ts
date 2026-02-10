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
 * GET /api/user/portfolio/overview
 * Get user's complete portfolio overview with allocation percentages
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user (required)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get all user holdings across all portfolios
    const holdings = await prisma.holding.findMany({
      where: {
        portfolio: {
          userId: user.id
        }
      },
      include: {
        asset: {
          select: {
            id: true,
            ticker: true,
            name: true,
            type: true,
            logoUrl: true,
            currencyName: true
          }
        },
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

    // If no holdings, return empty state
    if (holdings.length === 0) {
      // Still need to get portfolio info for cash balances
      const portfolios = await prisma.portfolio.findMany({
        where: {
          userId: user.id
        },
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
      });

             const totalCashBalance = portfolios.reduce((sum: number, p: any) => sum + p.cash_balance, 0);

      return NextResponse.json({
        success: true,
        data: {
          totalPortfolioValue: totalCashBalance,
          cashBalance: totalCashBalance,
          totalInvestedValue: 0,
          totalUnrealizedPnLPercent: 0,
          allocations: [],
          portfolioBreakdown: portfolios,
          lastUpdated: new Date().toISOString()
        },
        meta: {
          userId: user.id,
          holdingCount: 0,
          assetCount: 0,
          cacheAgeMs: 0
        },
        timestamp: new Date().toISOString()
      });
    }

    // Group holdings by asset to aggregate across portfolios
    const assetHoldingsMap = new Map<number, {
      asset: any;
      totalQuantity: number;
      totalCostBasis: number;
      holdings: any[];
    }>();

         holdings.forEach((holding: any) => {
       const assetId = holding.asset.id;
       const costBasis = holding.quantity * holding.averagePrice;
      
      if (!assetHoldingsMap.has(assetId)) {
        assetHoldingsMap.set(assetId, {
          asset: holding.asset,
          totalQuantity: 0,
          totalCostBasis: 0,
          holdings: []
        });
      }
      
      const assetData = assetHoldingsMap.get(assetId)!;
      assetData.totalQuantity += holding.quantity;
      assetData.totalCostBasis += costBasis;
      assetData.holdings.push(holding);
    });

    // Get unique assets for quote fetching
    const uniqueAssets = Array.from(assetHoldingsMap.values());
    const assetIds = uniqueAssets.map(item => item.asset.id);

    // Fetch quotes for all assets in parallel
    const quotePromises = assetIds.map(assetId => 
      getAssetQuoteWithCache(assetId).catch(error => {
        console.error(`Failed to fetch quote for asset ${assetId}:`, error);
        return {
          regularMarketPrice: 0,
          regularMarketChange: 0,
          regularMarketChangePercent: 0,
          currency: 'USD',
          marketState: 'CLOSED',
          isCached: false,
          cacheAge: 0
        };
      })
    );

    const quotes = await Promise.all(quotePromises);

    // Calculate portfolio metrics
    let totalInvestedValue = 0;
    let maxCacheAge = 0;

    const allocations = uniqueAssets.map((assetData, index) => {
      const quote = quotes[index];
      const currentPrice = quote.regularMarketPrice;
      const currentValue = assetData.totalQuantity * currentPrice;
      const avgCostBasis = assetData.totalCostBasis / assetData.totalQuantity;
      const unrealizedPnL = currentValue - assetData.totalCostBasis;
      const unrealizedPnLPercent = assetData.totalCostBasis > 0 
        ? (unrealizedPnL / assetData.totalCostBasis) * 100 
        : 0;

      totalInvestedValue += currentValue;
      maxCacheAge = Math.max(maxCacheAge, quote.cacheAge || 0);

      return {
        asset: {
          id: assetData.asset.id,
          ticker: assetData.asset.ticker,
          name: assetData.asset.name,
          type: assetData.asset.type,
          logoUrl: assetData.asset.logoUrl
        },
        totalQuantity: assetData.totalQuantity,
        avgCostBasis,
        totalCostBasis: assetData.totalCostBasis,
        currentPrice,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent,
        portfolioPercent: 0, // Will be calculated after we know total portfolio value
        quote: {
          currency: quote.currency,
          marketState: quote.marketState,
          regularMarketChange: quote.regularMarketChange,
          regularMarketChangePercent: quote.regularMarketChangePercent
        }
      };
    });

    // Get portfolio breakdown for cash balances
    const portfolioBreakdown = await prisma.portfolio.findMany({
      where: {
        userId: user.id
      },
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
            endDate: true,
            startingCash: true
          }
        }
      }
    });

    const totalCashBalance = portfolioBreakdown.reduce((sum: number, p: any) => sum + p.cash_balance, 0);
    const totalPortfolioValue = totalInvestedValue + totalCashBalance;
    
    // Calculate total return based on starting cash (same as performance chart)
    const startingCash = portfolioBreakdown[0]?.gameSession?.startingCash 
      ? Number(portfolioBreakdown[0].gameSession.startingCash) 
      : totalPortfolioValue; // Fallback to current value if no starting cash
    const totalUnrealizedPnLPercent = startingCash > 0 
      ? ((totalPortfolioValue / startingCash) - 1) * 100 
      : 0;

    // Calculate portfolio percentages and add cash allocation
    const finalAllocations = allocations.map(allocation => ({
      ...allocation,
      portfolioPercent: totalPortfolioValue > 0 
        ? (allocation.currentValue / totalPortfolioValue) * 100 
        : 0
    }));

    // Add cash allocation if there's cash balance
    if (totalCashBalance > 0) {
      finalAllocations.push({
        asset: {
          id: 0,
          ticker: 'CASH',
          name: 'Cash',
          type: 'CASH',
          logoUrl: null
        },
        totalQuantity: totalCashBalance,
        avgCostBasis: 1,
        totalCostBasis: totalCashBalance,
        currentPrice: 1,
        currentValue: totalCashBalance,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        portfolioPercent: totalPortfolioValue > 0 
          ? (totalCashBalance / totalPortfolioValue) * 100 
          : 0,
        quote: {
          currency: 'USD',
          marketState: 'REGULAR',
          regularMarketChange: 0,
          regularMarketChangePercent: 0
        }
      });
    }

    // Sort by portfolio percentage (largest first)
    finalAllocations.sort((a, b) => b.portfolioPercent - a.portfolioPercent);

    const response = {
      success: true,
      data: {
        totalPortfolioValue,
        cashBalance: totalCashBalance,
        totalInvestedValue,
        totalUnrealizedPnLPercent,
        allocations: finalAllocations,
        portfolioBreakdown,
        lastUpdated: new Date().toISOString()
      },
      meta: {
        userId: user.id,
        holdingCount: holdings.length,
        assetCount: uniqueAssets.length,
        cacheAgeMs: maxCacheAge
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error fetching portfolio overview:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch portfolio overview' 
      },
      { status: 500 }
    );
  }
} 