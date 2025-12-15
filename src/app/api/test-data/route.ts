import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check current data state
    const [assetCount, userCount, portfolioCount] = await Promise.all([
      prisma.asset.count(),
      prisma.user.count(),
      prisma.portfolio.count()
    ]);

    // Get sample assets
    const sampleAssets = await prisma.asset.findMany({
      take: 5,
      include: {
        stock: true,
        bond: true,
        mutualFund: true
      }
    });

    return NextResponse.json({
      success: true,
      counts: {
        assets: assetCount,
        users: userCount,
        portfolios: portfolioCount
      },
      sampleAssets,
      message: 'Database state checked successfully'
    });

  } catch (error) {
    console.error('Test data check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check test data' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Get user session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = JSON.parse(sessionCookie.value);
    const userId = user.id;

    // Check if user already has a portfolio
    let portfolio = await prisma.portfolio.findFirst({
      where: { userId },
      include: { gameSession: true }
    });

    // If no portfolio, create one with game session
    if (!portfolio) {
      // Create game session first
      const gameSession = await prisma.gameSession.create({
        data: {
          name: `${user.name || 'User'}'s Trading Game`,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          startingCash: 100000,
          isActive: true,
        }
      });

      // Create portfolio
      portfolio = await prisma.portfolio.create({
        data: {
          name: `${user.name || 'User'}'s Portfolio`,
          userId: userId,
          sessionId: gameSession.id,
          cash_balance: 100000,
        },
        include: { gameSession: true }
      });
    }

    // Check if we have basic assets, create sample ones if not
    const assetCount = await prisma.asset.count();
    let createdAssets = [];

    if (assetCount === 0) {
      // Create sample assets for testing
      const assetData = [
        {
          name: 'Apple Inc.',
          ticker: 'AAPL',
          type: 'STOCK',
          stock: {
            sector: 'Technology',
            industry: 'Consumer Electronics',
          }
        },
        {
          name: 'Microsoft Corporation',
          ticker: 'MSFT', 
          type: 'STOCK',
          stock: {
            sector: 'Technology',
            industry: 'Software',
          }
        },
        {
          name: 'SPDR S&P 500 ETF Trust',
          ticker: 'SPY',
          type: 'FUND',
          mutualFund: {
            fundType: 'ETF',
            expenseRatio: 0.0945,
          }
        }
      ];

      for (const assetInfo of assetData) {
        const asset = await prisma.asset.create({
          data: {
            name: assetInfo.name,
            ticker: assetInfo.ticker,
            type: assetInfo.type,
          }
        });

        if (assetInfo.stock) {
          await prisma.stock.create({
            data: {
              id: asset.id,
              ticker: assetInfo.ticker,
              name: assetInfo.name,
              sector: assetInfo.stock.sector,
              industry: assetInfo.stock.industry,
            }
          });
        }

        if (assetInfo.mutualFund) {
          await prisma.mutualFund.create({
            data: {
              id: asset.id,
              fundType: assetInfo.mutualFund.fundType,
              expenseRatio: assetInfo.mutualFund.expenseRatio,
            }
          });
        }

        // Create basic quote cache for the asset
        await prisma.assetQuoteCache.create({
          data: {
            assetId: asset.id,
            regularMarketPrice: assetInfo.ticker === 'AAPL' ? 175.00 : 
                               assetInfo.ticker === 'MSFT' ? 340.00 : 410.00,
            currency: 'USD',
            marketState: 'REGULAR',
            lastUpdated: new Date(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          }
        });

        createdAssets.push(asset);
      }
    }

    // Get updated counts
    const [newAssetCount, newUserCount, newPortfolioCount] = await Promise.all([
      prisma.asset.count(),
      prisma.user.count(),
      prisma.portfolio.count()
    ]);

    return NextResponse.json({
      success: true,
      message: 'Test data setup completed',
      user: {
        id: userId,
        name: user.name,
        email: user.email
      },
      portfolio: {
        id: portfolio.id,
        cashBalance: Number(portfolio.cash_balance),
        gameSession: portfolio.gameSession
      },
      counts: {
        assets: newAssetCount,
        users: newUserCount,
        portfolios: newPortfolioCount
      },
      createdAssets: createdAssets.length,
      assetsCreated: createdAssets.map(a => ({ id: a.id, name: a.name, ticker: a.ticker }))
    });

  } catch (error) {
    console.error('Test data setup error:', error);
    return NextResponse.json(
      { success: false, error: `Failed to setup test data: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 