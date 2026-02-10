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
 * GET /api/watchlist/[id]
 * Get a specific watchlist with its items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user (required)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the watchlist
    const watchlist = await prisma.watchlist.findUnique({
      where: { 
        id,
        userId: user.id // Ensure user owns this watchlist
      },
      include: {
        items: {
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
          },
          orderBy: { addedAt: 'desc' }
        },
        _count: {
          select: { items: true }
        }
      }
    });

    if (!watchlist) {
      return NextResponse.json(
        { success: false, error: 'Watchlist not found' },
        { status: 404 }
      );
    }

    // Format response
    const response = {
      success: true,
      data: {
        id: watchlist.id,
        name: watchlist.name,
        itemCount: watchlist._count.items,
        createdAt: watchlist.createdAt.toISOString(),
        updatedAt: watchlist.updatedAt.toISOString(),
        items: watchlist.items.map(item => ({
          id: item.id,
          addedAt: item.addedAt.toISOString(),
          notes: item.notes,
          asset: item.asset
        }))
      },
      timestamp: new Date().toISOString(),
      meta: {
        userId: user.id,
        watchlistId: watchlist.id,
        itemCount: watchlist._count.items
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error(`Error fetching watchlist ${(await params).id}:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch watchlist' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/watchlist/[id]
 * Update a watchlist (name, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    const { name } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Watchlist name is required' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: 'Watchlist name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Check if watchlist exists and user owns it
    const existingWatchlist = await prisma.watchlist.findUnique({
      where: { 
        id,
        userId: user.id
      }
    });

    if (!existingWatchlist) {
      return NextResponse.json(
        { success: false, error: 'Watchlist not found' },
        { status: 404 }
      );
    }

    // Check if user already has another watchlist with this name
    const duplicateWatchlist = await prisma.watchlist.findFirst({
      where: {
        userId: user.id,
        name: name.trim(),
        id: { not: id } // Exclude current watchlist
      }
    });

    if (duplicateWatchlist) {
      return NextResponse.json(
        { success: false, error: 'A watchlist with this name already exists' },
        { status: 409 }
      );
    }

    // Update the watchlist
    const updatedWatchlist = await prisma.watchlist.update({
      where: { id },
      data: {
        name: name.trim(),
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedWatchlist.id,
        name: updatedWatchlist.name,
        itemCount: updatedWatchlist._count.items,
        createdAt: updatedWatchlist.createdAt.toISOString(),
        updatedAt: updatedWatchlist.updatedAt.toISOString()
      },
      timestamp: new Date().toISOString(),
      meta: {
        userId: user.id,
        action: 'updated'
      }
    });

  } catch (error: any) {
    console.error(`Error updating watchlist ${(await params).id}:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update watchlist' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/watchlist/[id]
 * Delete a watchlist and all its items
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user (required)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if watchlist exists and user owns it
    const watchlist = await prisma.watchlist.findUnique({
      where: { 
        id,
        userId: user.id
      },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    if (!watchlist) {
      return NextResponse.json(
        { success: false, error: 'Watchlist not found' },
        { status: 404 }
      );
    }

    // Delete the watchlist (cascade will delete all items)
    await prisma.watchlist.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Watchlist deleted successfully',
      data: {
        deletedWatchlistId: id,
        deletedItemCount: watchlist._count.items
      },
      timestamp: new Date().toISOString(),
      meta: {
        userId: user.id,
        action: 'deleted'
      }
    });

  } catch (error: any) {
    console.error(`Error deleting watchlist ${(await params).id}:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete watchlist' 
      },
      { status: 500 }
    );
  }
} 