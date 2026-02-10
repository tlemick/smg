import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAssetFromTicker } from '@/lib/yahoo-finance-service';
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
 * POST /api/watchlist/[id]/items
 * Add an asset to a watchlist
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: watchlistId } = await params;

    // Get authenticated user (required)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { ticker, notes } = body;

    // Validate input
    if (!ticker || typeof ticker !== 'string' || ticker.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ticker symbol is required' },
        { status: 400 }
      );
    }

    const upperTicker = ticker.toUpperCase().trim();

    // Validate notes if provided
    if (notes && (typeof notes !== 'string' || notes.length > 500)) {
      return NextResponse.json(
        { success: false, error: 'Notes must be a string of 500 characters or less' },
        { status: 400 }
      );
    }

    // Check if watchlist exists and user owns it
    const watchlist = await prisma.watchlist.findUnique({
      where: { 
        id: watchlistId,
        userId: user.id
      }
    });

    if (!watchlist) {
      return NextResponse.json(
        { success: false, error: 'Watchlist not found' },
        { status: 404 }
      );
    }

    // Find or create asset
    let asset = await prisma.asset.findUnique({
      where: { ticker: upperTicker }
    });

    if (!asset) {
      try {
        asset = await createAssetFromTicker(upperTicker);
      } catch (error: any) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Failed to find or create asset for ticker ${upperTicker}: ${error.message}` 
          },
          { status: 400 }
        );
      }
    }

    if (!asset) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to find or create asset for ticker ${upperTicker}` 
        },
        { status: 500 }
      );
    }

    // Check if asset is already in this watchlist
    const existingItem = await prisma.watchlistItem.findUnique({
      where: {
        watchlistId_assetId: {
          watchlistId,
          assetId: asset.id
        }
      }
    });

    if (existingItem) {
      return NextResponse.json(
        { 
          success: false, 
          error: `${upperTicker} is already in this watchlist` 
        },
        { status: 409 }
      );
    }

    // Add asset to watchlist
    const watchlistItem = await prisma.watchlistItem.create({
      data: {
        watchlistId,
        assetId: asset.id,
        assetType: asset.type,
        notes: notes?.trim() || null
      },
      include: {
        asset: {
          select: {
            id: true,
            ticker: true,
            name: true,
            type: true,
            market: true,
            logoUrl: true,
            currencyName: true
          }
        }
      }
    });

    // Update watchlist timestamp
    await prisma.watchlist.update({
      where: { id: watchlistId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: watchlistItem.id,
        watchlistId: watchlistItem.watchlistId,
        addedAt: watchlistItem.addedAt.toISOString(),
        notes: watchlistItem.notes,
        asset: watchlistItem.asset
      },
      timestamp: new Date().toISOString(),
      meta: {
        userId: user.id,
        watchlistId,
        action: 'added',
        ticker: upperTicker,
        assetCreated: !asset // Indicates if we had to create the asset
      }
    });

  } catch (error: any) {
    console.error(`Error adding asset to watchlist ${(await params).id}:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to add asset to watchlist' 
      },
      { status: 500 }
    );
  }
} 