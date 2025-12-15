import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../../../prisma/client';


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
 * PUT /api/admin/game-sessions/[id]
 * Update or activate/deactivate a game session (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

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

    // Check if game session exists
    const existingSession = await prisma.gameSession.findUnique({
      where: { id }
    });

    if (!existingSession) {
      return NextResponse.json({
        success: false,
        error: 'Game session not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    const { name, description, startDate, endDate, startingCash, isActive } = body;

    // If activating this session, deactivate all others first
    if (isActive && !existingSession.isActive) {
      await prisma.gameSession.updateMany({
        where: { 
          isActive: true,
          id: { not: id }
        },
        data: { isActive: false }
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (startingCash !== undefined) updateData.startingCash = startingCash;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Validate dates if provided
    if (updateData.startDate && updateData.endDate && updateData.startDate >= updateData.endDate) {
      return NextResponse.json({
        success: false,
        error: 'End date must be after start date',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Update the game session
    const updatedSession = await prisma.gameSession.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { portfolios: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedSession,
      message: `Game session updated successfully${updateData.isActive ? ' and set as active' : ''}`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Update game session error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/game-sessions/[id]
 * Delete a game session (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if game session exists and get portfolio count
    const existingSession = await prisma.gameSession.findUnique({
      where: { id },
      include: {
        _count: {
          select: { portfolios: true }
        }
      }
    });

    if (!existingSession) {
      return NextResponse.json({
        success: false,
        error: 'Game session not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // Prevent deletion if session has portfolios (data integrity)
    if (existingSession._count.portfolios > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete game session with ${existingSession._count.portfolios} existing portfolios. Please move portfolios to another session first.`,
        timestamp: new Date().toISOString()
      }, { status: 409 });
    }

    // Delete the game session
    await prisma.gameSession.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: `Game session "${existingSession.name}" deleted successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Delete game session error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}