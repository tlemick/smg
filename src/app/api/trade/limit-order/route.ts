import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/prisma/client';
import { MarketStateService } from '@/lib/market-state-service';
import { CashManagementService } from '@/lib/cash-management-service';
import { getAssetQuoteWithCache } from '@/lib/yahoo-finance-service';
import { ActivityService } from '@/lib/activity-service';


interface LimitOrderRequest {
  assetId: number;
  orderType: 'BUY' | 'SELL';
  shares: number;
  limitPrice: number;
  validUntil?: Date; // Optional expiration date
  notes?: string;
}

interface LimitOrderResponse {
  success: boolean;
  orderId?: string;
  message: string;
  orderDetails: {
    asset: any;
    orderType: 'BUY' | 'SELL';
    shares: number;
    limitPrice: number;
    currentPrice: number;
    estimatedValue: number;
    fees: number;
    validUntil?: Date;
    status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  };
  educationalNote: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = JSON.parse(sessionCookie.value);
    const userId = user.id;
    const body: LimitOrderRequest = await request.json();

    // Validate request
    const validation = validateLimitOrderRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Get asset information
    const asset = await prisma.asset.findUnique({
      where: { id: body.assetId },
      include: { stock: true, bond: true, mutualFund: true }
    });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Get current quote
    const quote = await getAssetQuoteWithCache(body.assetId);
    const currentPrice = quote.regularMarketPrice;

    if (!currentPrice) {
      return NextResponse.json(
        { success: false, error: 'Unable to get current price for asset' },
        { status: 400 }
      );
    }

    // Get or create user portfolio
    let portfolio = await prisma.portfolio.findFirst({
      where: { userId },
      include: { gameSession: true }
    });

    if (!portfolio) {
      // Find the active game session
      const activeSession = await prisma.gameSession.findFirst({
        where: { isActive: true }
      });

      if (!activeSession) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No active trading session available. Please contact an administrator to start a new trading session.' 
          },
          { status: 404 }
        );
      }

      // Create portfolio for user in the active session
      const user = await prisma.user.findUnique({ where: { id: userId } });
      portfolio = await prisma.portfolio.create({
        data: {
          name: `${user?.name || 'User'}'s Portfolio`,
          userId: userId,
          sessionId: activeSession.id,
          cash_balance: activeSession.startingCash,
        },
        include: { gameSession: true }
      });
    }

    // Validate order conditions
    const validationResult = await validateLimitOrder(
      userId,
      body,
      currentPrice,
      asset,
      portfolio
    );

    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    // Create limit order
    const limitOrder = await createLimitOrder(
      userId,
      body,
      asset,
      currentPrice,
      portfolio
    );

    // Generate trading activity for limit order placement
    try {
      await ActivityService.createLimitOrderPlacedActivity(userId, limitOrder);
    } catch (activityError) {
      // Log but don't fail the trade if activity generation fails
      console.error('Failed to create limit order placed activity:', activityError);
    }

    const response: LimitOrderResponse = {
      success: true,
      orderId: limitOrder.id,
      message: `Limit order placed successfully!`,
      orderDetails: {
        asset,
        orderType: body.orderType,
        shares: body.shares,
        limitPrice: body.limitPrice,
        currentPrice,
        estimatedValue: body.shares * body.limitPrice,
        fees: CashManagementService.calculateOrderCost(body.shares, body.limitPrice, body.orderType).estimatedFees,
        validUntil: body.validUntil,
        status: 'PENDING',
      },
      educationalNote: generateEducationalNote(body, currentPrice),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Limit order API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error processing limit order',
        message: 'An unexpected error occurred. Please try again.',
        orderDetails: {} as any,
        educationalNote: 'Limit orders can fail due to technical issues, invalid prices, or insufficient funds/shares.'
      },
      { status: 500 }
    );
  }
}

function validateLimitOrderRequest(body: LimitOrderRequest): { isValid: boolean; error?: string } {
  if (!body.assetId) {
    return { isValid: false, error: 'Asset ID is required' };
  }

  if (!['BUY', 'SELL'].includes(body.orderType)) {
    return { isValid: false, error: 'Order type must be BUY or SELL' };
  }

  if (!body.shares || body.shares <= 0) {
    return { isValid: false, error: 'Shares must be greater than 0' };
  }

  if (!body.limitPrice || body.limitPrice <= 0) {
    return { isValid: false, error: 'Limit price must be greater than 0' };
  }

  // Validate expiration date if provided
  if (body.validUntil) {
    const expirationDate = new Date(body.validUntil);
    if (expirationDate <= new Date()) {
      return { isValid: false, error: 'Expiration date must be in the future' };
    }

    // Limit to maximum 1 year ahead
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (expirationDate > oneYearFromNow) {
      return { isValid: false, error: 'Expiration date cannot be more than 1 year in the future' };
    }
  }

  return { isValid: true };
}

async function validateLimitOrder(
  userId: string,
  orderRequest: LimitOrderRequest,
  currentPrice: number,
  asset: any,
  portfolio: any
): Promise<{ isValid: boolean; error?: string }> {
  
  // Validate price reasonableness (within 50% of current price for educational purposes)
  const priceVarianceThreshold = 0.5; // 50%
  const maxPriceUp = currentPrice * (1 + priceVarianceThreshold);
  const minPriceDown = currentPrice * (1 - priceVarianceThreshold);

  if (orderRequest.limitPrice > maxPriceUp || orderRequest.limitPrice < minPriceDown) {
    return {
      isValid: false,
      error: `Limit price must be within 50% of current price ($${minPriceDown.toFixed(2)} - $${maxPriceUp.toFixed(2)})`
    };
  }

  // For buy orders, validate cash
  if (orderRequest.orderType === 'BUY') {
    const cashValidation = await CashManagementService.validateCashForPurchase(
      userId,
      orderRequest.shares,
      orderRequest.limitPrice
    );

    if (!cashValidation.isValid) {
      return {
        isValid: false,
        error: cashValidation.errorMessage
      };
    }
  }

  // For sell orders, validate holdings
  if (orderRequest.orderType === 'SELL') {
    const holding = await prisma.holding.findFirst({
      where: {
        portfolioId: portfolio.id,
        assetId: orderRequest.assetId
      }
    });

    if (!holding || Number(holding.quantity) < orderRequest.shares) {
      return {
        isValid: false,
        error: `Insufficient shares. You own ${holding ? Number(holding.quantity) : 0} shares.`
      };
    }
  }

  // Check for conflicting orders (simplified - in production, you'd want more sophisticated logic)
  const existingOrders = await prisma.limitOrder.count({
    where: {
      userId,
      assetId: orderRequest.assetId,
      type: orderRequest.orderType,
      status: 'PENDING'
    }
  });

  if (existingOrders >= 5) {
    return {
      isValid: false,
      error: 'You can have a maximum of 5 pending limit orders per asset and order type.'
    };
  }

  return { isValid: true };
}

async function createLimitOrder(
  userId: string,
  orderRequest: LimitOrderRequest,
  asset: any,
  currentPrice: number,
  portfolio: any
) {
  // Set default expiration to 30 days if not provided
  const validUntil = orderRequest.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return await prisma.limitOrder.create({
    data: {
      userId: userId,
      assetId: asset.id,
      assetType: asset.type,
      type: orderRequest.orderType,
      quantity: orderRequest.shares,
      limitPrice: orderRequest.limitPrice,
      expireAt: validUntil,
      status: 'PENDING',
      notes: orderRequest.notes || null,
    }
  });
}

function generateEducationalNote(orderRequest: LimitOrderRequest, currentPrice: number): string {
  const orderType = orderRequest.orderType;
  const limitPrice = orderRequest.limitPrice;
  const isAboveMarket = limitPrice > currentPrice;
  const percentDiff = Math.abs((limitPrice - currentPrice) / currentPrice * 100);

  if (orderType === 'BUY') {
    if (isAboveMarket) {
      return `📈 Your buy limit order is set ABOVE the current market price by ${percentDiff.toFixed(1)}%. This order will execute immediately if the market is open, as you're willing to pay more than the current price. Consider using a market order instead for immediate execution.`;
    } else {
      return `📉 Your buy limit order is set BELOW the current market price by ${percentDiff.toFixed(1)}%. This order will only execute if the stock price drops to $${limitPrice.toFixed(2)} or lower. You're trying to get a better deal than the current market price!`;
    }
  } else { // SELL
    if (isAboveMarket) {
      return `📈 Your sell limit order is set ABOVE the current market price by ${percentDiff.toFixed(1)}%. This order will only execute if the stock price rises to $${limitPrice.toFixed(2)} or higher. You're aiming to sell at a profit or better price than current market!`;
    } else {
      return `📉 Your sell limit order is set BELOW the current market price by ${percentDiff.toFixed(1)}%. This order will execute immediately if the market is open, as you're willing to accept less than the current price. Consider using a market order instead for immediate execution.`;
    }
  }
} 