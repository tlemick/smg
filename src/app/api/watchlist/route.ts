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
 * GET /api/watchlist
 * Get all watchlists for the authenticated user
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeItems = searchParams.get('include') === 'items';

    // Get user's watchlists
    const watchlists = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: {
        items: includeItems ? {
          include: {
            asset: {
              select: {
                id: true,
                ticker: true,
                name: true,
                type: true,
                market: true,
                logoUrl: true
              }
            }
          },
          orderBy: { addedAt: 'desc' }
        } : false,
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
      createdAt: watchlist.createdAt.toISOString(),
      updatedAt: watchlist.updatedAt.toISOString(),
      ...(includeItems && { items: watchlist.items })
    }));

    return NextResponse.json({
      success: true,
      data: formattedWatchlists,
      timestamp: new Date().toISOString(),
      meta: {
        userId: user.id,
        count: watchlists.length,
        totalAssets: watchlists.reduce((sum, w) => sum + w._count.items, 0),
        includeItems
      }
    });

  } catch (error: any) {
    console.error('Error fetching watchlists:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch watchlists' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/watchlist
 * Create a new watchlist for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
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

    // Check if user already has a watchlist with this name
    const existingWatchlist = await prisma.watchlist.findFirst({
      where: {
        userId: user.id,
        name: name.trim()
      }
    });

    if (existingWatchlist) {
      return NextResponse.json(
        { success: false, error: 'A watchlist with this name already exists' },
        { status: 409 }
      );
    }

    // Create the watchlist
    const watchlist = await prisma.watchlist.create({
      data: {
        name: name.trim(),
        userId: user.id
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
        id: watchlist.id,
        name: watchlist.name,
        itemCount: watchlist._count.items,
        createdAt: watchlist.createdAt.toISOString(),
        updatedAt: watchlist.updatedAt.toISOString()
      },
      timestamp: new Date().toISOString(),
      meta: {
        userId: user.id,
        action: 'created'
      }
    });

  } catch (error: any) {
    console.error('Error creating watchlist:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create watchlist' 
      },
      { status: 500 }
    );
  }
} 