import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/prisma/client';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'No session' },
        { status: 401 }
      );
    }

    const cookieData = JSON.parse(sessionCookie.value);
    
    // Fetch fresh user data from database to get current onboarding status
    const user = await prisma.user.findUnique({
      where: { id: cookieData.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hasCompletedOnboarding: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Session invalid' },
      { status: 401 }
    );
  }
} 