import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/prisma/client';

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user_session');

    if (!userCookie) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userData = JSON.parse(userCookie.value);
    const userId = userData.id;

    // Update user's onboarding status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        hasCompletedOnboarding: true,
        onboardingCompletedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hasCompletedOnboarding: true,
        onboardingCompletedAt: true,
      },
    });

    // Update the session cookie with the new onboarding status
    cookieStore.set('user_session', JSON.stringify({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      hasCompletedOnboarding: updatedUser.hasCompletedOnboarding
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete onboarding',
      },
      { status: 500 }
    );
  }
}

