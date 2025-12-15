import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ActivityService } from '@/lib/activity-service';

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
 * GET /api/user/activity
 * Fetch user activities with pagination and optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const categories = searchParams.get('categories')?.split(',').filter(Boolean);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate limit
    if (limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Limit cannot exceed 100' },
        { status: 400 }
      );
    }

    // Get activities
    const activities = await ActivityService.getRecentActivities(
      user.id,
      limit,
      categories
    );

    // Get activity stats for additional context
    const stats = await ActivityService.getActivityStats(user.id);

    return NextResponse.json({
      success: true,
      data: {
        activities,
        pagination: {
          limit,
          offset,
          total: activities.length,
          hasMore: activities.length === limit
        },
        stats
      },
      meta: {
        userId: user.id,
        categoriesFilter: categories || null,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching user activities:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch activities',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/activity
 * Mark activities as read
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, activityIds } = body;

    // Validate request
    if (action !== 'mark_read') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Only "mark_read" is supported' },
        { status: 400 }
      );
    }

    if (!Array.isArray(activityIds) || activityIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'activityIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Mark activities as read
    await ActivityService.markActivitiesAsRead(user.id, activityIds);

    return NextResponse.json({
      success: true,
      data: {
        markedAsRead: activityIds.length,
        activityIds
      },
      meta: {
        userId: user.id,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error marking activities as read:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to mark activities as read',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 