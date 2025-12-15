import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/admin/setup-trading
 * Setup initial trading environment (Admin only)
 * Creates default game session and test user if needed
 */
export async function POST(request: NextRequest) {
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

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    let results = {
      gameSession: null as any,
      testUser: null as any,
      portfolio: null as any,
      assets: [] as any[]
    };

    // 1. Create or ensure active game session exists
    let activeSession = await prisma.gameSession.findFirst({
      where: { isActive: true }
    });

    if (!activeSession) {
      // Create a default active session
      activeSession = await prisma.gameSession.create({
        data: {
          name: 'Default Trading Session',
          description: 'Default session for trading simulation',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          startingCash: 100000,
          isActive: true,
        }
      });
      results.gameSession = activeSession;
    }

    // 2. Ensure test user exists
    let testUser = await prisma.user.findUnique({
      where: { email: 'user@smg.com' }
    });

    if (!testUser) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('user123', 10);
      
      testUser = await prisma.user.create({
        data: {
          email: 'user@smg.com',
          name: 'Test User',
          password: hashedPassword,
          role: 'USER',
          active: true,
        }
      });
      results.testUser = testUser;
    }

    // 3. Ensure test user has a portfolio in the active session
    let portfolio = await prisma.portfolio.findFirst({
      where: { 
        userId: testUser.id,
        sessionId: activeSession.id
      }
    });

    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: {
          name: `${testUser.name || 'Test User'}'s Portfolio`,
          userId: testUser.id,
          sessionId: activeSession.id,
          cash_balance: activeSession.startingCash,
        }
      });
      results.portfolio = portfolio;
    }

    // 4. Ensure basic test assets exist
    const existingAssets = await prisma.asset.count();
    
    if (existingAssets === 0) {
      const testAssets = [
        {
          ticker: 'AAPL',
          name: 'Apple Inc.',
          type: 'STOCK',
          allowFractionalShares: true,
          currencyName: 'USD',
          logoUrl: null,
        },
        {
          ticker: 'MSFT',
          name: 'Microsoft Corporation',
          type: 'STOCK',
          allowFractionalShares: true,
          currencyName: 'USD',
          logoUrl: null,
        },
        {
          ticker: 'GOOGL',
          name: 'Alphabet Inc.',
          type: 'STOCK',
          allowFractionalShares: true,
          currencyName: 'USD',
          logoUrl: null,
        },
      ];

      for (const assetData of testAssets) {
        const asset = await prisma.asset.create({
          data: assetData
        });

        // Create basic stock data
        if (assetData.type === 'STOCK') {
          await prisma.stock.create({
            data: {
              assetId: asset.id,
              sector: 'Technology',
              industry: 'Technology',
              marketCap: 1000000000,
              peRatio: 25.0,
              dividendYield: 0.5,
            }
          });
        }

        // Create basic quote cache
        await prisma.assetQuoteCache.create({
          data: {
            assetId: asset.id,
            regularMarketPrice: assetData.ticker === 'AAPL' ? 175.00 : 
                               assetData.ticker === 'MSFT' ? 340.00 : 410.00,
            currency: 'USD',
            marketState: 'REGULAR',
            lastUpdated: new Date(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          }
        });

        results.assets.push(asset);
      }
    }

    // Get current counts for summary
    const [totalUsers, totalPortfolios, totalAssets, totalSessions] = await Promise.all([
      prisma.user.count(),
      prisma.portfolio.count(),
      prisma.asset.count(),
      prisma.gameSession.count()
    ]);

    return NextResponse.json({
      success: true,
      message: 'Trading environment setup completed successfully',
      data: {
        created: results,
        summary: {
          activeSession: activeSession.name,
          testUserEmail: 'user@smg.com',
          testUserPassword: 'user123',
          totalUsers,
          totalPortfolios,
          totalAssets,
          totalSessions,
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Setup trading environment error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to setup trading environment: ${error.message}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}