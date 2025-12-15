import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAssetFromTicker } from '@/lib/yahoo-finance-service';
import { prisma } from '../../../../../../../prisma/client';

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
 * GET /api/user/watchlists/for-asset/[ticker]
 * Get user's watchlists with info about whether each contains the specified asset
 * Used for "Add to Watchlist" modal
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

    // Find or create asset
    let asset = await prisma.asset.findUnique({
      where: { ticker: upperTicker },
      select: {
        id: true,
        ticker: true,
        name: true,
        type: true,
        market: true,
        logoUrl: true
      }
    });

    if (!asset) {
      try {
        const createdAsset = await createAssetFromTicker(upperTicker);
        asset = {
          id: createdAsset.id,
          ticker: createdAsset.ticker,
          name: createdAsset.name,
          type: createdAsset.type,
          market: createdAsset.market,
          logoUrl: createdAsset.logoUrl
        };
      } catch (error: any) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Asset not found and could not be created: ${error.message}` 
          },
          { status: 404 }
        );
      }
    }

    // Get user's watchlists
    const watchlists = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: {
        items: {
          where: { assetId: asset.id },
          select: { id: true }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Format response
    const formattedWatchlists = watchlists.map(watchlist => ({
      id: watchlist.id,
      name: watchlist.name,
      itemCount: watchlist._count.items,
      containsAsset: watchlist.items.length > 0,
      watchlistItemId: watchlist.items.length > 0 ? watchlist.items[0].id : null,
      createdAt: watchlist.createdAt.toISOString(),
      updatedAt: watchlist.updatedAt.toISOString()
    }));

    const containingWatchlists = formattedWatchlists.filter(w => w.containsAsset);

    return NextResponse.json({
      success: true,
      data: {
        asset,
        watchlists: formattedWatchlists,
        summary: {
          totalWatchlists: watchlists.length,
          containingWatchlists: containingWatchlists.length,
          availableWatchlists: watchlists.length - containingWatchlists.length
        }
      },
      timestamp: new Date().toISOString(),
      meta: {
        userId: user.id,
        ticker: upperTicker,
        assetId: asset.id
      }
    });

  } catch (error: any) {
    console.error(`Error fetching watchlists for asset ${(await params).ticker}:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch watchlists for asset' 
      },
      { status: 500 }
    );
  }
} 