import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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
 * PUT /api/watchlist/[id]/items/[itemId]
 * Update notes for a watchlist item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: watchlistId, itemId } = await params;

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
    const { notes } = body;

    // Validate notes
    if (notes !== null && notes !== undefined && (typeof notes !== 'string' || notes.length > 500)) {
      return NextResponse.json(
        { success: false, error: 'Notes must be a string of 500 characters or less' },
        { status: 400 }
      );
    }

    // Check if watchlist item exists and user owns the watchlist
    const watchlistItem = await prisma.watchlistItem.findFirst({
      where: {
        id: itemId,
        watchlistId,
        watchlist: {
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
            market: true,
            logoUrl: true,
            currencyName: true
          }
        }
      }
    });

    if (!watchlistItem) {
      return NextResponse.json(
        { success: false, error: 'Watchlist item not found' },
        { status: 404 }
      );
    }

    // Update the item
    const updatedItem = await prisma.watchlistItem.update({
      where: { id: itemId },
      data: {
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
        id: updatedItem.id,
        watchlistId: updatedItem.watchlistId,
        addedAt: updatedItem.addedAt.toISOString(),
        notes: updatedItem.notes,
        asset: updatedItem.asset
      },
      timestamp: new Date().toISOString(),
      meta: {
        userId: user.id,
        watchlistId,
        action: 'updated'
      }
    });

  } catch (error: any) {
    console.error(`Error updating watchlist item ${(await params).itemId}:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update watchlist item' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/watchlist/[id]/items/[itemId]
 * Remove an asset from a watchlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: watchlistId, itemId } = await params;

    // Get authenticated user (required)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if watchlist item exists and user owns the watchlist
    const watchlistItem = await prisma.watchlistItem.findFirst({
      where: {
        id: itemId,
        watchlistId,
        watchlist: {
          userId: user.id
        }
      },
      include: {
        asset: {
          select: {
            id: true,
            ticker: true,
            name: true,
            type: true
          }
        }
      }
    });

    if (!watchlistItem) {
      return NextResponse.json(
        { success: false, error: 'Watchlist item not found' },
        { status: 404 }
      );
    }

    // Delete the item
    await prisma.watchlistItem.delete({
      where: { id: itemId }
    });

    // Update watchlist timestamp
    await prisma.watchlist.update({
      where: { id: watchlistId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      message: 'Asset removed from watchlist successfully',
      data: {
        removedItemId: itemId,
        removedAsset: {
          ticker: watchlistItem.asset.ticker,
          name: watchlistItem.asset.name
        }
      },
      timestamp: new Date().toISOString(),
      meta: {
        userId: user.id,
        watchlistId,
        action: 'removed'
      }
    });

  } catch (error: any) {
    console.error(`Error removing watchlist item ${(await params).itemId}:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to remove asset from watchlist' 
      },
      { status: 500 }
    );
  }
} 