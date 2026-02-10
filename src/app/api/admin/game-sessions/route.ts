import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/prisma/client';


// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session');
    
    if (!sessionCookie) {
      return { success: false, error: 'Authentication required' };
    }

    const user = JSON.parse(sessionCookie.value);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: 'Invalid session' };
  }
}

// Helper function to check admin permissions
function requireAdmin(user: any): boolean {
  return user && user.role === 'ADMIN';
}

/**
 * GET /api/admin/game-sessions
 * Get all game sessions (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({
        success: false,
        error: authResult.error || 'Authentication required',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // Check admin permissions
    if (!requireAdmin(authResult.user)) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    const gameSessions = await prisma.gameSession.findMany({
      include: {
        _count: {
          select: { portfolios: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: gameSessions,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Get game sessions error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/game-sessions
 * Create a new game session (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({
        success: false,
        error: authResult.error || 'Authentication required',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // Check admin permissions
    if (!requireAdmin(authResult.user)) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON format',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const { name, description, startDate, endDate, startingCash, makeActive } = body;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return NextResponse.json({
        success: false,
        error: 'Name, start date, and end date are required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json({
        success: false,
        error: 'End date must be after start date',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // If making this session active, deactivate all others first
    if (makeActive) {
      await prisma.gameSession.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    // Create the new game session
    const gameSession = await prisma.gameSession.create({
      data: {
        name,
        description: description || null,
        startDate: start,
        endDate: end,
        startingCash: startingCash || 100000,
        isActive: makeActive || false,
      },
      include: {
        _count: {
          select: { portfolios: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: gameSession,
      message: `Game session "${name}" created successfully${makeActive ? ' and set as active' : ''}`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Create game session error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}