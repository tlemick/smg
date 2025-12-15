import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../../prisma/client';


export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'executed', 'cancelled', or 'all'
    const orderType = searchParams.get('type'); // 'BUY', 'SELL', or 'all'
    const assetId = searchParams.get('assetId'); // specific asset filter
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filter conditions
    const whereConditions: any = { userId };

    if (status && status !== 'all') {
      if (status === 'pending') {
        whereConditions.status = 'PENDING';
      } else if (status === 'executed') {
        whereConditions.status = 'EXECUTED';
      } else if (status === 'cancelled') {
        whereConditions.status = 'CANCELLED';
      }
    }

    if (orderType && orderType !== 'all') {
      whereConditions.type = orderType.toUpperCase();
    }

    if (assetId) {
      whereConditions.assetId = parseInt(assetId);
    }

    // Get both regular orders, limit orders, and completed transactions
    const [orders, limitOrders, transactions, totalOrders, totalLimitOrders, totalTransactions] = await Promise.all([
      // Regular orders (from Order model - these are typically queued market orders)
      prisma.order.findMany({
        where: whereConditions,
        include: {
          asset: {
            include: {
              stock: true,
              bond: true,
              mutualFund: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      
      // Limit orders (from LimitOrder model)
      prisma.limitOrder.findMany({
        where: whereConditions,
        include: {
          asset: {
            include: {
              stock: true,
              bond: true,
              mutualFund: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),

      // Completed transactions (from Transaction model - immediate executions)
      prisma.transaction.findMany({
        where: {
          userId,
          ...(orderType && orderType !== 'all' ? { type: orderType.toUpperCase() } : {}),
          ...(assetId ? { assetId: parseInt(assetId) } : {})
        },
        include: {
          asset: {
            include: {
              stock: true,
              bond: true,
              mutualFund: true
            }
          }
        },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset
      }),

      // Count totals for pagination
      prisma.order.count({ where: whereConditions }),
      prisma.limitOrder.count({ where: whereConditions }),
      prisma.transaction.count({ 
        where: {
          userId,
          ...(orderType && orderType !== 'all' ? { type: orderType.toUpperCase() } : {}),
          ...(assetId ? { assetId: parseInt(assetId) } : {})
        }
      })
    ]);

    // Transform orders to unified format
    const unifiedOrders = [
      ...orders.map(order => ({
        id: order.id,
        type: 'market',
        orderType: order.type,
        assetId: order.assetId,
        asset: order.asset,
        quantity: Number(order.quantity),
        price: Number(order.price),
        limitPrice: null,
        status: order.status,
        createdAt: order.createdAt,
        expireAt: null,
        executedAt: order.createdAt, // Order model uses createdAt as execution time
        executedPrice: Number(order.price), // Order model uses price field
        notes: null, // Order model doesn't have notes
        isMarketOrder: true,
        educationalNote: generateMarketOrderNote(order)
      })),
      
      ...limitOrders.map(limitOrder => ({
        id: limitOrder.id,
        type: 'limit',
        orderType: limitOrder.type,
        assetId: limitOrder.assetId,
        asset: limitOrder.asset,
        quantity: Number(limitOrder.quantity),
        price: null,
        limitPrice: Number(limitOrder.limitPrice),
        status: limitOrder.status,
        createdAt: limitOrder.createdAt,
        expireAt: limitOrder.expireAt,
        executedAt: limitOrder.executedAt,
        executedPrice: limitOrder.executedPrice ? Number(limitOrder.executedPrice) : null,
        notes: limitOrder.notes,
        isMarketOrder: false,
        educationalNote: generateLimitOrderNote(limitOrder)
      })),
      
      // Add completed transactions as "executed" orders
      ...transactions.map(transaction => ({
        id: transaction.id,
        type: 'transaction',
        orderType: transaction.type,
        assetId: transaction.assetId,
        asset: transaction.asset,
        quantity: Number(transaction.quantity),
        price: Number(transaction.price),
        limitPrice: null,
        status: 'EXECUTED',
        createdAt: transaction.date,
        expireAt: null,
        executedAt: transaction.date,
        executedPrice: Number(transaction.price),
        notes: null,
        isMarketOrder: true,
        educationalNote: `This ${transaction.type.toLowerCase()} transaction was executed immediately at market price of $${Number(transaction.price).toFixed(2)} per share.`
      }))
    ];

    // Sort by creation date (most recent first)
    unifiedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply limit after combining and sorting
    const finalOrders = unifiedOrders.slice(0, limit);

    const response = {
      success: true,
      orders: finalOrders,
      pagination: {
        total: totalOrders + totalLimitOrders + totalTransactions,
        limit,
        offset,
        hasMore: (totalOrders + totalLimitOrders + totalTransactions) > (offset + limit)
      },
      summary: {
        totalPending: unifiedOrders.filter(o => o.status === 'PENDING').length,
        totalExecuted: unifiedOrders.filter(o => o.status === 'EXECUTED').length,
        totalCancelled: unifiedOrders.filter(o => o.status === 'CANCELLED').length,
        marketOrders: orders.length,
        limitOrders: limitOrders.length,
        transactions: transactions.length
      },
      educationalInfo: {
        title: 'Understanding Your Orders',
        sections: [
          {
            title: 'Market Orders',
            description: 'Execute immediately at current market price (when market is open) or queue for market open.',
            icon: '⚡'
          },
          {
            title: 'Limit Orders', 
            description: 'Execute only when the stock reaches your specified price target.',
            icon: '🎯'
          },
          {
            title: 'Order Status',
            description: 'PENDING (waiting), EXECUTED (completed), CANCELLED (stopped before execution).',
            icon: '📊'
          }
        ]
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve orders' },
      { status: 500 }
    );
  }
}

function generateMarketOrderNote(order: any): string {
  const status = order.status;
  const orderType = order.type;
  
  if (status === 'PENDING') {
    return `🕐 This ${orderType.toLowerCase()} market order is queued and will execute when the market opens at the then-current market price.`;
  } else if (status === 'EXECUTED') {
    const executedPrice = order.executedPrice || order.price;
    return `✅ This ${orderType.toLowerCase()} market order was executed at $${Number(executedPrice).toFixed(2)} per share.`;
  } else if (status === 'CANCELLED') {
    return `❌ This ${orderType.toLowerCase()} market order was cancelled before execution.`;
  }
  
  return `📋 Market order for ${orderType.toLowerCase()}ing ${Number(order.quantity)} shares.`;
}

function generateLimitOrderNote(limitOrder: any): string {
  const status = limitOrder.status;
  const orderType = limitOrder.type;
  const limitPrice = Number(limitOrder.limitPrice);
  
  if (status === 'PENDING') {
    const expiry = limitOrder.expireAt ? new Date(limitOrder.expireAt).toLocaleDateString() : 'no expiration';
    return `⏳ This ${orderType.toLowerCase()} limit order will execute when the price ${orderType === 'BUY' ? 'drops to' : 'rises to'} $${limitPrice.toFixed(2)} or better. Expires: ${expiry}.`;
  } else if (status === 'EXECUTED') {
    const executedPrice = limitOrder.executedPrice || limitPrice;
    return `✅ This ${orderType.toLowerCase()} limit order was executed at $${Number(executedPrice).toFixed(2)} per share (target was $${limitPrice.toFixed(2)}).`;
  } else if (status === 'CANCELLED') {
    return `❌ This ${orderType.toLowerCase()} limit order was cancelled before reaching the target price of $${limitPrice.toFixed(2)}.`;
  } else if (status === 'EXPIRED') {
    return `⏰ This ${orderType.toLowerCase()} limit order expired before reaching the target price of $${limitPrice.toFixed(2)}.`;
  }
  
  return `🎯 Limit order for ${orderType.toLowerCase()}ing ${Number(limitOrder.quantity)} shares at $${limitPrice.toFixed(2)}.`;
} 