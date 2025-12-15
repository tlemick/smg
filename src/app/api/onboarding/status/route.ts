import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../../prisma/client';

export async function GET(request: NextRequest) {
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

    // Get user with onboarding status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        portfolios: {
          include: {
            holdings: {
              include: {
                asset: {
                  select: {
                    type: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the active portfolio (assuming first one or most recent)
    const portfolio = user.portfolios[0];
    const holdings = portfolio?.holdings || [];

    // Calculate values by asset type
    const stocksValue = holdings
      .filter((h: any) => h.asset.type === 'STOCK')
      .reduce((sum: number, h: any) => sum + (h.quantity * h.averagePrice), 0);
    
    const mutualFundsValue = holdings
      .filter((h: any) => h.asset.type === 'MUTUALFUND')
      .reduce((sum: number, h: any) => sum + (h.quantity * h.averagePrice), 0);
    
    const bondsValue = holdings
      .filter((h: any) => h.asset.type === 'BOND')
      .reduce((sum: number, h: any) => sum + (h.quantity * h.averagePrice), 0);

    // Determine what asset types user has
    const hasStocks = stocksValue > 0;
    const hasMutualFunds = mutualFundsValue > 0;
    const hasBonds = bondsValue > 0;

    // Determine current step based on holdings
    let currentStep: string | null = null;
    if (!(user as any).hasCompletedOnboarding) {
      if (!hasStocks) {
        currentStep = 'stocks';
      } else if (!hasMutualFunds) {
        currentStep = 'mutual-funds';
      } else if (!hasBonds) {
        currentStep = 'bonds';
      } else {
        currentStep = 'complete';
      }
    }

    return NextResponse.json({
      success: true,
      hasCompletedOnboarding: (user as any).hasCompletedOnboarding,
      currentStep,
      portfolio: {
        cashBalance: portfolio?.cash_balance || 0,
        hasStocks,
        hasMutualFunds,
        hasBonds,
        stocksValue,
        mutualFundsValue,
        bondsValue,
        totalValue: stocksValue + mutualFundsValue + bondsValue + (portfolio?.cash_balance || 0),
        totalHoldings: holdings.length,
      },
    });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch onboarding status',
      },
      { status: 500 }
    );
  }
}

