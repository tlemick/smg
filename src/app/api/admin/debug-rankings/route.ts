import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/client';

/**
 * Debug endpoint to check ranking calculations
 * GET /api/admin/debug-rankings
 */
export async function GET(request: NextRequest) {
  try {
    // Get active session
    const activeSession = await prisma.gameSession.findFirst({ 
      where: { isActive: true },
      include: {
        portfolios: {
          include: {
            user: { select: { name: true, email: true } },
            holdings: true,
          },
          take: 5, // Just get first 5 for debugging
        }
      }
    });

    if (!activeSession) {
      return NextResponse.json({
        success: false,
        error: 'No active session found'
      });
    }

    // Get quote cache for holdings
    const allAssetIds = new Set<number>();
    activeSession.portfolios.forEach(p => {
      p.holdings.forEach(h => allAssetIds.add(h.assetId));
    });

    const quotes = await prisma.assetQuoteCache.findMany({
      where: { assetId: { in: Array.from(allAssetIds) } }
    });

    const priceMap = new Map<number, number>();
    quotes.forEach(q => priceMap.set(q.assetId, Number(q.regularMarketPrice)));

    // Calculate sample portfolio values
    const samplePortfolios = activeSession.portfolios.map(p => {
      let total = Number(p.cash_balance) || 0;
      
      p.holdings.forEach(h => {
        const price = priceMap.get(h.assetId) || 0;
        total += Number(h.quantity) * price;
      });

      const returnPercent = activeSession.startingCash > 0 
        ? ((total / Number(activeSession.startingCash)) - 1) * 100 
        : 0;

      return {
        user: p.user.name || p.user.email,
        cashBalance: Number(p.cash_balance),
        holdingsValue: total - Number(p.cash_balance),
        totalValue: total,
        returnPercent: Number(returnPercent.toFixed(2)),
      };
    });

    // Check cached rankings
    const cachedRankings = await prisma.userRanking.findMany({
      where: { sessionId: activeSession.id },
      orderBy: { rank: 'asc' },
      take: 5,
      include: { user: { select: { name: true, email: true } } }
    });

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: activeSession.id,
          name: activeSession.name,
          startingCash: Number(activeSession.startingCash),
          startDate: activeSession.startDate,
          endDate: activeSession.endDate,
          isActive: activeSession.isActive,
        },
        samplePortfolios,
        cachedRankings: cachedRankings.map(r => ({
          rank: r.rank,
          user: r.user.name || r.user.email,
          totalPortfolioValue: Number(r.totalPortfolioValue),
          returnPercent: Number(r.returnPercent),
          calculatedAt: r.calculatedAt,
        })),
        diagnosis: {
          expectedStartingCash: 100000,
          actualStartingCash: Number(activeSession.startingCash),
          isCorrect: Number(activeSession.startingCash) === 100000,
          issue: Number(activeSession.startingCash) !== 100000 
            ? `Starting cash is ${Number(activeSession.startingCash)} instead of 100000` 
            : null,
        }
      }
    });

  } catch (error: any) {
    console.error('Debug rankings error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Debug failed' },
      { status: 500 }
    );
  }
}

/**
 * Fix starting cash if wrong
 * POST /api/admin/debug-rankings
 */
export async function POST(request: NextRequest) {
  try {
    const { startingCash } = await request.json();
    
    if (!startingCash || startingCash <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid starting cash value'
      }, { status: 400 });
    }

    // Update active session
    const updated = await prisma.gameSession.updateMany({
      where: { isActive: true },
      data: { startingCash }
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${updated.count} session(s) with starting cash: ${startingCash}`,
      data: { updated: updated.count, newStartingCash: startingCash }
    });

  } catch (error: any) {
    console.error('Update starting cash error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Update failed' },
      { status: 500 }
    );
  }
}
