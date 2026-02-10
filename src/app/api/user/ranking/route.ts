import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/prisma/client';
import { getAssetQuoteWithCache } from '@/lib/yahoo-finance-service';
import { getUserAvatarUrl } from '@/lib/avatar-service';

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
  } catch {
    return null;
  }
}

/**
 * Get rankings from cache (UserRanking table)
 * Returns null if cache is missing or stale
 */
async function getRankingsFromCache(sessionId: string, maxAgeHours: number = 24) {
  const rankings = await prisma.userRanking.findMany({
    where: { sessionId },
    orderBy: { rank: 'asc' },
    include: { user: true },
  });

  if (rankings.length === 0) {
    return null;
  }

  // Check if cache is stale (older than maxAgeHours)
  const latestCalculation = rankings[0].calculatedAt;
  const ageHours = (Date.now() - latestCalculation.getTime()) / (1000 * 60 * 60);
  
  if (ageHours > maxAgeHours) {
    console.log(`Ranking cache is stale (${ageHours.toFixed(1)} hours old)`);
    return null;
  }

  return rankings;
}

/**
 * GET /api/user/ranking
 * Get current user's ranking among all users based on portfolio performance
 * Supports query param: ?fresh=true to bypass cache
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

    // Check if fresh data is requested (bypass cache)
    const { searchParams } = new URL(request.url);
    const forceFresh = searchParams.get('fresh') === 'true';

    // Scope to the active game session
    const activeSession = await prisma.gameSession.findFirst({ where: { isActive: true } });
    if (!activeSession) {
      return NextResponse.json({
        success: true,
        data: {
          currentUser: { rank: 0, totalUsers: 0, totalPortfolioValue: 0, returnPercent: 0, name: user.name || user.email.split('@')[0], avatarUrl: getUserAvatarUrl(user.id) },
          topUsers: [],
          meta: { totalActiveUsers: 0, calculatedAt: new Date().toISOString(), sessionId: null, startingCash: null, isCached: false }
        },
        timestamp: new Date().toISOString()
      });
    }

    // Try to get rankings from cache (unless forceFresh is true)
    if (!forceFresh) {
      const cachedRankings = await getRankingsFromCache(activeSession.id);
      
      if (cachedRankings && cachedRankings.length > 0) {
        // Use cached data
        const currentUserRanking = cachedRankings.find(r => r.userId === user.id);
        const totalUsers = cachedRankings.length;
        const calculatedAt = cachedRankings[0].calculatedAt.toISOString();

        const topUsers = cachedRankings.slice(0, 20).map(r => ({
          rank: r.rank,
          name: r.user.name || r.user.email.split('@')[0],
          returnPercent: Number(r.returnPercent.toFixed(2)),
          isCurrentUser: r.userId === user.id,
          avatarUrl: getUserAvatarUrl(r.userId),
        }));

        return NextResponse.json({
          success: true,
          data: {
            currentUser: {
              rank: currentUserRanking?.rank || 0,
              totalUsers,
              totalPortfolioValue: currentUserRanking?.totalPortfolioValue || 0,
              returnPercent: currentUserRanking ? Number(currentUserRanking.returnPercent.toFixed(2)) : 0,
              name: currentUserRanking?.user.name || user.name || user.email.split('@')[0],
              avatarUrl: getUserAvatarUrl(currentUserRanking?.userId || user.id),
            },
            topUsers,
            meta: {
              totalActiveUsers: totalUsers,
              calculatedAt,
              sessionId: activeSession.id,
              startingCash: Number(activeSession.startingCash),
              isCached: true,
            }
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Fall back to real-time calculation if cache is missing or fresh data requested
    console.log('Computing rankings in real-time (cache miss or fresh request)')

    // Get all portfolios in the active session with holdings and users
    const portfoliosInSession = await prisma.portfolio.findMany({
      where: { sessionId: activeSession.id },
      include: {
        user: true,
        holdings: { select: { assetId: true, quantity: true } },
      },
    });

    if (portfoliosInSession.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          currentUser: { rank: 0, totalUsers: 0, totalPortfolioValue: 0, returnPercent: 0, name: user.name || user.email.split('@')[0] },
          topUsers: [],
          meta: { totalActiveUsers: 0, calculatedAt: new Date().toISOString(), sessionId: activeSession.id, startingCash: Number(activeSession.startingCash) }
        },
        timestamp: new Date().toISOString()
      });
    }

    // Collect unique assetIds to fetch quotes in bulk from cache
    const uniqueAssetIds = Array.from(new Set(portfoliosInSession.flatMap(p => p.holdings.map(h => h.assetId))));
    const cachedQuotes = uniqueAssetIds.length > 0
      ? await prisma.assetQuoteCache.findMany({ where: { assetId: { in: uniqueAssetIds } } })
      : [];
    const priceMap = new Map<number, number>();
    for (const q of cachedQuotes) {
      priceMap.set(q.assetId, Number(q.regularMarketPrice));
    }

    // For any assets missing in cache, attempt to fetch using getAssetQuoteWithCache
    const missingAssetIds = uniqueAssetIds.filter(id => !priceMap.has(id));
    if (missingAssetIds.length > 0) {
      await Promise.all(
        missingAssetIds.map(async (assetId) => {
          try {
            const quote = await getAssetQuoteWithCache(assetId);
            if (quote?.regularMarketPrice != null) {
              priceMap.set(assetId, Number(quote.regularMarketPrice));
            }
          } catch {
            // Ignore failures; treat as 0 for now
          }
        })
      );
    }

    // Aggregate per-user totals across their portfolios in this session
    const perUser: Array<{ userId: string; name: string; email: string; totalPortfolioValue: number; portfolioCount: number }>= [];
    const byUser = new Map<string, { userId: string; name: string; email: string; totalPortfolioValue: number; portfolioCount: number }>();

    for (const pf of portfoliosInSession) {
      let total = Number(pf.cash_balance) || 0;
      for (const h of pf.holdings) {
        const price = priceMap.get(h.assetId) || 0;
        total += Number(h.quantity) * price;
      }
      const key = pf.user.id;
      const existing = byUser.get(key);
      if (existing) {
        existing.totalPortfolioValue += total;
        existing.portfolioCount += 1;
      } else {
        byUser.set(key, {
          userId: pf.user.id,
          name: pf.user.name || pf.user.email.split('@')[0],
          email: pf.user.email,
          totalPortfolioValue: total,
          portfolioCount: 1,
        });
      }
    }

    for (const v of byUser.values()) perUser.push(v);

    // Compute return percent against session starting cash (multiply by portfolio count if needed)
    const sessionStartingCash = Number(activeSession.startingCash);
    const userRankings = perUser.map(u => {
      const base = sessionStartingCash * Math.max(1, u.portfolioCount);
      const returnPercent = base > 0 ? ((u.totalPortfolioValue / base) - 1) * 100 : 0;
      return { ...u, returnPercent };
    });

    // Sort by return percent desc
    userRankings.sort((a, b) => b.returnPercent - a.returnPercent || a.name.localeCompare(b.name));

    // Find current user's rank
    const currentIndex = userRankings.findIndex(u => u.userId === user.id);
    const currentUserRank = currentIndex >= 0 ? currentIndex + 1 : 0;
    const currentUserData = currentIndex >= 0 ? userRankings[currentIndex] : null;
    const totalUsers = userRankings.length;

    // Get top 20 for leaderboard (or all if less than 20)
    const topUsers = userRankings.slice(0, 20).map((u, index) => ({
      rank: index + 1,
      name: u.name,
      returnPercent: Number(u.returnPercent.toFixed(2)),
      isCurrentUser: u.userId === user.id,
      avatarUrl: getUserAvatarUrl(u.userId),
    }));

    const response = {
      success: true,
      data: {
        currentUser: {
          rank: currentUserRank,
          totalUsers,
          totalPortfolioValue: currentUserData?.totalPortfolioValue || 0,
          returnPercent: Number((currentUserData?.returnPercent || 0).toFixed(2)),
          name: currentUserData?.name || user.name || user.email.split('@')[0],
          avatarUrl: getUserAvatarUrl(currentUserData?.userId || user.id),
        },
        topUsers,
        meta: {
          totalActiveUsers: totalUsers,
          calculatedAt: new Date().toISOString(),
          sessionId: activeSession.id,
          startingCash: sessionStartingCash,
          isCached: false,
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Error calculating user rankings:', error);
    return NextResponse.json(
      { success: false, error: (error as Error)?.message || 'Failed to calculate user rankings' },
      { status: 500 }
    );
  }
}