import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../../prisma/client';
import { MarketStateService } from '@/lib/market-state-service';
import { CashManagementService } from '@/lib/cash-management-service';
import { getAssetQuoteWithCache } from '@/lib/yahoo-finance-service';
import { ActivityService } from '@/lib/activity-service';


interface MarketOrderRequest {
  assetId: number;
  orderType: 'BUY' | 'SELL';
  shares?: number;
  dollarAmount?: number;
  notes?: string;
}

interface MarketOrderResponse {
  success: boolean;
  orderId?: string;
  transactionId?: string;
  executionStatus: 'EXECUTED' | 'QUEUED' | 'FAILED';
  message: string;
  orderDetails: {
    asset: any;
    orderType: 'BUY' | 'SELL';
    shares: number;
    pricePerShare: number;
    totalValue: number;
    fees: number;
    netAmount: number;
    marketState: string;
    executedAt?: Date;
    queuedUntil?: Date;
  };
  portfolioUpdate?: {
    previousCash: number;
    newCash: number;
    newHolding?: any;
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
    const body: MarketOrderRequest = await request.json();

    // Validate request
    const validation = validateOrderRequest(body);
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

    // Calculate shares and validate
    let shares: number;
    if (body.shares) {
      shares = body.shares;
    } else if (body.dollarAmount) {
      shares = body.dollarAmount / currentPrice;
    } else {
      return NextResponse.json(
        { success: false, error: 'Either shares or dollarAmount must be specified' },
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

    // For sell orders, validate user has enough shares
    if (body.orderType === 'SELL') {
      const holding = await prisma.holding.findFirst({
        where: {
          portfolioId: portfolio.id,
          assetId: body.assetId
        }
      });

      if (!holding || Number(holding.quantity) < shares) {
        return NextResponse.json(
          { success: false, error: `Insufficient shares. You own ${holding ? Number(holding.quantity) : 0} shares.` },
          { status: 400 }
        );
      }
    }

    // For buy orders, validate cash
    if (body.orderType === 'BUY') {
      const cashValidation = await CashManagementService.validateCashForPurchase(
        userId,
        shares,
        currentPrice
      );

      if (!cashValidation.isValid) {
        return NextResponse.json(
          { success: false, error: cashValidation.errorMessage },
          { status: 400 }
        );
      }
    }

    // Get market state
    const marketState = await MarketStateService.getCurrentMarketState();
    const shouldExecuteImmediately = marketState.canExecuteOrders;

    // Calculate order details
    const orderCost = CashManagementService.calculateOrderCost(shares, currentPrice, body.orderType);

    let orderResponse: MarketOrderResponse;

    if (shouldExecuteImmediately) {
      // Execute immediately
      orderResponse = await executeOrderImmediately(
        userId,
        asset,
        body.orderType,
        shares,
        currentPrice,
        orderCost,
        marketState,
        body.notes,
        portfolio
      );
    } else {
      // Queue for later execution
      orderResponse = await queueOrderForExecution(
        userId,
        asset,
        body.orderType,
        shares,
        currentPrice,
        orderCost,
        marketState,
        body.notes,
        portfolio
      );
    }

    return NextResponse.json(orderResponse);

  } catch (error) {
    console.error('Market order API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error processing order',
        executionStatus: 'FAILED' as const,
        message: 'An unexpected error occurred. Please try again.',
        orderDetails: {} as any,
        educationalNote: 'Orders can fail due to technical issues, market conditions, or insufficient funds.'
      },
      { status: 500 }
    );
  }
}

function validateOrderRequest(body: MarketOrderRequest): { isValid: boolean; error?: string } {
  if (!body.assetId) {
    return { isValid: false, error: 'Asset ID is required' };
  }

  if (!['BUY', 'SELL'].includes(body.orderType)) {
    return { isValid: false, error: 'Order type must be BUY or SELL' };
  }

  if (!body.shares && !body.dollarAmount) {
    return { isValid: false, error: 'Either shares or dollarAmount must be specified' };
  }

  if (body.shares && body.shares <= 0) {
    return { isValid: false, error: 'Shares must be greater than 0' };
  }

  if (body.dollarAmount && body.dollarAmount <= 0) {
    return { isValid: false, error: 'Dollar amount must be greater than 0' };
  }

  return { isValid: true };
}

async function executeOrderImmediately(
  userId: string,
  asset: any,
  orderType: 'BUY' | 'SELL',
  shares: number,
  pricePerShare: number,
  orderCost: any,
  marketState: any,
  notes?: string,
  portfolio?: any
): Promise<MarketOrderResponse> {
  
  const previousCash = await CashManagementService.getCurrentCashBalance(userId);

  // Create transaction record
  const transaction = await prisma.transaction.create({
    data: {
      portfolioId: portfolio!.id,
      assetId: asset.id,
      type: orderType,
      quantity: shares,
      price: pricePerShare,
      total: orderCost.orderValue,
      userId: userId,
      assetType: asset.type,
    }
  });

  // Update cash balance
  let cashResult;
  if (orderType === 'BUY') {
    cashResult = await CashManagementService.deductCashForPurchase(
      userId,
      shares,
      pricePerShare,
      transaction.id
    );
  } else {
    cashResult = await CashManagementService.addCashFromSale(
      userId,
      shares,
      pricePerShare,
      transaction.id
    );
  }

  if (!cashResult.success) {
    throw new Error(`Cash update failed: ${cashResult.error}`);
  }

  // Update or create holding
  let newHolding;
  if (orderType === 'BUY') {
    // Add to holdings
    newHolding = await prisma.holding.upsert({
      where: {
        portfolioId_assetId: {
          portfolioId: portfolio!.id,
          assetId: asset.id
        }
      },
      update: {
        quantity: {
          increment: shares
        },
        averagePrice: pricePerShare, // Simplified - should calculate weighted average
      },
      create: {
        portfolioId: portfolio!.id,
        assetId: asset.id,
        assetType: asset.type,
        quantity: shares,
        averagePrice: pricePerShare,
      },
      include: {
        asset: true
      }
    });
  } else {
    // Reduce holdings
    newHolding = await prisma.holding.update({
      where: {
        portfolioId_assetId: {
          portfolioId: portfolio!.id,
          assetId: asset.id
        }
      },
      data: {
        quantity: {
          decrement: shares
        },
      },
      include: {
        asset: true
      }
    });

    // Delete holding if quantity reaches 0
    if (Number(newHolding.quantity) <= 0.001) { // Account for floating point precision
      await prisma.holding.delete({
        where: {
          portfolioId_assetId: {
            portfolioId: portfolio!.id,
            assetId: asset.id
          }
        }
      });
      newHolding = null;
    }
  }

  // Generate trading activity
  try {
    // Create an order-like object for the activity service
    const orderData = {
      id: transaction.id, // Use transaction ID as reference
      assetId: asset.id,
      type: orderType,
      quantity: shares,
      price: pricePerShare,
      createdAt: new Date(),
      userId,
      status: 'EXECUTED',
      assetType: asset.type,
      priceType: 'MARKET'
    };
    
    await ActivityService.createMarketOrderExecutedActivity(
      userId,
      orderData,
      transaction
    );
  } catch (activityError) {
    // Log but don't fail the trade if activity generation fails
    console.error('Failed to create market order activity:', activityError);
  }

  // Generate portfolio activity for position changes
  try {
    if (newHolding) {
      // Determine the type of position change based on whether this was an upsert create or update
      let changeType: 'INCREASED' | 'DECREASED' | 'EXITED' | 'NEW_POSITION';
      let previousQuantity: number | undefined;

      if (orderType === 'BUY') {
        // For buy orders, check if quantity equals our purchase (new position) or greater (increased)
        if (Number(newHolding.quantity) === shares) {
          changeType = 'NEW_POSITION';
        } else {
          changeType = 'INCREASED';
          previousQuantity = Number(newHolding.quantity) - shares;
        }
      } else {
        // SELL order - always a decrease since newHolding exists
        changeType = 'DECREASED';
        previousQuantity = Number(newHolding.quantity) + shares;
      }

      await ActivityService.createPositionChangeActivity(
        userId,
        newHolding,
        changeType,
        previousQuantity
      );
    } else if (orderType === 'SELL') {
      // Position was completely exited (newHolding is null)
      const exitedHolding = {
        id: `exited-${asset.id}`,
        portfolioId: portfolio!.id,
        assetId: asset.id,
        assetType: asset.type,
        quantity: 0,
        averagePrice: pricePerShare,
        createdAt: new Date(),
        updatedAt: new Date(),
        asset: asset
      };
      
      await ActivityService.createPositionChangeActivity(
        userId,
        exitedHolding as any,
        'EXITED',
        shares
      );
    }
  } catch (activityError) {
    // Log but don't fail the trade if activity generation fails
    console.error('Failed to create position change activity:', activityError);
  }

  // Generate cash balance change activity
  try {
    await ActivityService.createCashBalanceChangeActivity(
      userId,
      portfolio!.id,
      cashResult.newBalance,
      cashResult.newBalance - previousCash
    );
  } catch (activityError) {
    // Log but don't fail the trade if activity generation fails
    console.error('Failed to create cash balance change activity:', activityError);
  }

  // Check for portfolio value milestones
  try {
    // Calculate total portfolio value (cash + holdings value)
    const allHoldings = await prisma.holding.findMany({
      where: { portfolioId: portfolio!.id },
      include: { asset: true }
    });

    let totalHoldingsValue = 0;
    for (const holding of allHoldings) {
      try {
        const holdingQuote = await getAssetQuoteWithCache(holding.assetId);
        const currentPrice = holdingQuote.regularMarketPrice || Number(holding.averagePrice);
        totalHoldingsValue += Number(holding.quantity) * currentPrice;
      } catch (quoteError) {
        // Fallback to average price if quote fails
        totalHoldingsValue += Number(holding.quantity) * Number(holding.averagePrice);
      }
    }

    const totalPortfolioValue = cashResult.newBalance + totalHoldingsValue;
    
    // Define milestones (every $5K starting from $105K)
    const baseMilestone = 105000; // $105K
    const milestoneIncrement = 5000; // $5K
    
    // Find the highest milestone reached
    const milestonesReached = Math.floor((totalPortfolioValue - baseMilestone) / milestoneIncrement) + 1;
    const previousValue = totalPortfolioValue - (orderType === 'BUY' ? orderCost.orderValue : -orderCost.orderValue);
    const previousMilestonesReached = Math.floor((previousValue - baseMilestone) / milestoneIncrement) + 1;
    
    // Check if we crossed a new milestone
    if (milestonesReached > previousMilestonesReached && milestonesReached > 0) {
      const milestoneValue = baseMilestone + ((milestonesReached - 1) * milestoneIncrement);
      await ActivityService.createPortfolioValueMilestoneActivity(
        userId,
        portfolio!.id,
        totalPortfolioValue,
        `$${(milestoneValue / 1000).toFixed(0)}K`
      );
    }
  } catch (activityError) {
    // Log but don't fail the trade if activity generation fails
    console.error('Failed to create portfolio milestone activity:', activityError);
  }

  return {
    success: true,
    transactionId: transaction.id,
    executionStatus: 'EXECUTED',
    message: `${orderType === 'BUY' ? 'Purchase' : 'Sale'} executed successfully at market price!`,
    orderDetails: {
      asset,
      orderType,
      shares,
      pricePerShare,
      totalValue: orderCost.orderValue,
      fees: orderCost.estimatedFees,
      netAmount: orderType === 'BUY' ? -orderCost.totalCost : (orderCost.orderValue - orderCost.estimatedFees),
      marketState: marketState.marketState,
      executedAt: new Date(),
    },
    portfolioUpdate: {
      previousCash,
      newCash: cashResult.newBalance,
      newHolding,
    },
    educationalNote: `✅ Your ${orderType === 'BUY' ? 'buy' : 'sell'} order was executed immediately because the market is open. You ${orderType === 'BUY' ? 'purchased' : 'sold'} ${shares.toFixed(6)} shares at $${pricePerShare.toFixed(2)} per share.`
  };
}

async function queueOrderForExecution(
  userId: string,
  asset: any,
  orderType: 'BUY' | 'SELL',
  shares: number,
  pricePerShare: number,
  orderCost: any,
  marketState: any,
  notes?: string,
  portfolio?: any
): Promise<MarketOrderResponse> {

  // Create order record for queued execution
  const order = await prisma.order.create({
    data: {
      assetId: asset.id,
      type: orderType,
      quantity: shares,
      price: pricePerShare, // This will be the reference price
      userId: userId,
      assetType: asset.type,
      status: 'PENDING', // Override default for queued orders
    }
  });

  // Generate trading activity for queued order
  try {
    await ActivityService.createMarketOrderQueuedActivity(
      userId,
      {
        ticker: asset.ticker,
        type: orderType,
        quantity: shares,
        estimatedPrice: pricePerShare
      }
    );
  } catch (activityError) {
    // Log but don't fail the trade if activity generation fails
    console.error('Failed to create market order queued activity:', activityError);
  }

  return {
    success: true,
    orderId: order.id,
    executionStatus: 'QUEUED',
    message: `Order queued for execution when market opens!`,
    orderDetails: {
      asset,
      orderType,
      shares,
      pricePerShare,
      totalValue: orderCost.orderValue,
      fees: orderCost.estimatedFees,
      netAmount: orderType === 'BUY' ? -orderCost.totalCost : (orderCost.orderValue - orderCost.estimatedFees),
      marketState: marketState.marketState,
      queuedUntil: marketState.nextTradingSession,
    },
    educationalNote: `📋 Your ${orderType === 'BUY' ? 'buy' : 'sell'} order has been queued because the market is ${marketState.marketState.toLowerCase()}. It will execute as a market order when the market opens at the then-current price, which may differ from the current quote of $${pricePerShare.toFixed(2)}.`
  };
} 