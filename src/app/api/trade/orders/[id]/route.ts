import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/prisma/client';
import { ActivityService } from '@/lib/activity-service';


// GET /api/trade/orders/[id] - Get specific order details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const orderId = params.id;

    // Try to find the order in both Order and LimitOrder tables
    const [order, limitOrder] = await Promise.all([
      prisma.order.findFirst({
        where: { id: orderId, userId },
        include: {
          asset: {
            include: {
              stock: true,
              bond: true,
              mutualFund: true
            }
          }
        }
      }),
      prisma.limitOrder.findFirst({
        where: { id: orderId, userId },
        include: {
          asset: {
            include: {
              stock: true,
              bond: true,
              mutualFund: true
            }
          }
        }
      })
    ]);

    if (!order && !limitOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Format the response based on which type of order was found
    let orderDetails;
    
    if (order) {
      orderDetails = {
        id: order.id,
        type: 'market',
        orderType: order.type,
        assetId: order.assetId,
        asset: order.asset,
        quantity: Number(order.quantity),
        price: Number(order.price),
        status: order.status,
        createdAt: order.createdAt,
        executedAt: order.createdAt,
        isMarketOrder: true,
        canCancel: false, // Market orders that are in Order table are already executed
        educationalNote: `This market order for ${order.type.toLowerCase()}ing ${Number(order.quantity)} shares was executed at $${Number(order.price).toFixed(2)} per share.`
      };
    } else if (limitOrder) {
      const canCancel = limitOrder.status === 'PENDING';
      orderDetails = {
        id: limitOrder.id,
        type: 'limit',
        orderType: limitOrder.type,
        assetId: limitOrder.assetId,
        asset: limitOrder.asset,
        quantity: Number(limitOrder.quantity),
        limitPrice: Number(limitOrder.limitPrice),
        status: limitOrder.status,
        createdAt: limitOrder.createdAt,
        expireAt: limitOrder.expireAt,
        executedAt: limitOrder.executedAt,
        executedPrice: limitOrder.executedPrice ? Number(limitOrder.executedPrice) : null,
        notes: limitOrder.notes,
        isMarketOrder: false,
        canCancel,
        educationalNote: generateLimitOrderEducationalNote(limitOrder, canCancel)
      };
    }

    return NextResponse.json({
      success: true,
      order: orderDetails
    });

  } catch (error) {
    console.error('Get order API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve order' },
      { status: 500 }
    );
  }
}

// PUT /api/trade/orders/[id] - Cancel a pending order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const orderId = params.id;
    const body = await request.json();

    // Only support cancellation for now
    if (body.action !== 'cancel') {
      return NextResponse.json(
        { success: false, error: 'Only cancellation action is supported' },
        { status: 400 }
      );
    }

    // Try to find and cancel the order
    // First check if it's a regular Order (these can't be cancelled as they're already executed)
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId }
    });

    if (order) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Market orders cannot be cancelled as they are already executed',
          educationalNote: 'Market orders execute immediately when placed during market hours, so they cannot be cancelled. Use limit orders if you want the ability to cancel before execution.'
        },
        { status: 400 }
      );
    }

    // Check if it's a LimitOrder
    const limitOrder = await prisma.limitOrder.findFirst({
      where: { id: orderId, userId },
      include: { asset: true }
    });

    if (!limitOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if the order can be cancelled
    if (limitOrder.status !== 'PENDING') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot cancel order with status: ${limitOrder.status}`,
          educationalNote: 'Only pending limit orders can be cancelled. Orders that have already been executed, expired, or previously cancelled cannot be modified.'
        },
        { status: 400 }
      );
    }

    // Cancel the limit order
    const cancelledOrder = await prisma.limitOrder.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: { asset: true }
    });

    // Generate trading activity for limit order cancellation
    try {
      await ActivityService.createLimitOrderCancelledActivity(
        userId, 
        cancelledOrder, 
        'Order cancelled by user'
      );
    } catch (activityError) {
      // Log but don't fail the cancellation if activity generation fails
      console.error('Failed to create limit order cancelled activity:', activityError);
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        id: cancelledOrder.id,
        type: 'limit',
        orderType: cancelledOrder.type,
        asset: cancelledOrder.asset,
        quantity: Number(cancelledOrder.quantity),
        limitPrice: Number(cancelledOrder.limitPrice),
        status: cancelledOrder.status,
        createdAt: cancelledOrder.createdAt,
        cancelledAt: new Date()
      },
      educationalNote: `Your ${cancelledOrder.type.toLowerCase()} limit order for ${Number(cancelledOrder.quantity)} shares of ${cancelledOrder.asset.name} at $${Number(cancelledOrder.limitPrice).toFixed(2)} has been cancelled. The order will no longer execute even if the stock reaches your target price.`
    });

  } catch (error) {
    console.error('Cancel order API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}

function generateLimitOrderEducationalNote(limitOrder: any, canCancel: boolean): string {
  const orderType = limitOrder.type;
  const status = limitOrder.status;
  const limitPrice = Number(limitOrder.limitPrice);
  const quantity = Number(limitOrder.quantity);

  if (status === 'PENDING') {
    const direction = orderType === 'BUY' ? 'drops to' : 'rises to';
    const expiry = limitOrder.expireAt 
      ? ` This order will expire on ${new Date(limitOrder.expireAt).toLocaleDateString()}.`
      : '';
    
    return `⏳ This ${orderType.toLowerCase()} limit order for ${quantity} shares will execute when the price ${direction} $${limitPrice.toFixed(2)} or better.${expiry}${canCancel ? ' You can cancel this order anytime before it executes.' : ''}`;
  } else if (status === 'EXECUTED') {
    const executedPrice = limitOrder.executedPrice || limitPrice;
    return `✅ This ${orderType.toLowerCase()} limit order was successfully executed at $${Number(executedPrice).toFixed(2)} per share (your target was $${limitPrice.toFixed(2)}).`;
  } else if (status === 'CANCELLED') {
    return `❌ This ${orderType.toLowerCase()} limit order was cancelled before execution. The order never reached your target price of $${limitPrice.toFixed(2)}.`;
  } else if (status === 'EXPIRED') {
    return `⏰ This ${orderType.toLowerCase()} limit order expired before reaching your target price of $${limitPrice.toFixed(2)}. The stock never traded at your desired price within the time limit.`;
  }

  return `📋 Limit order details for ${orderType.toLowerCase()}ing ${quantity} shares at $${limitPrice.toFixed(2)}.`;
} 