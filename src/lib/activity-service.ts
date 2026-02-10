import { prisma } from '@/prisma/client';
import type { Order, LimitOrder, Transaction, Holding, UserActivity } from '@prisma/client';

/**
 * ActivityService - Manages creation and retrieval of user activities for the dashboard feed
 * Phase 1 Focus: Trading and Portfolio activities only
 */
export class ActivityService {
  // ================================
  // TRADING ACTIVITIES
  // ================================

  /**
   * Create activity for successful market order execution
   */
  static async createMarketOrderExecutedActivity(
    userId: string,
    order: Order,
    transaction: Transaction
  ): Promise<UserActivity> {
    const asset = await prisma.asset.findUnique({
      where: { id: order.assetId }
    });

    const action = order.type === 'BUY' ? 'Bought' : 'Sold';
    const total = order.quantity * order.price;
    
    return prisma.userActivity.create({
      data: {
        userId,
        type: 'TRADE',
        subtype: 'MARKET_ORDER_EXECUTED',
        title: `${action} ${order.quantity} shares of ${asset?.ticker || 'Unknown'} at $${order.price.toFixed(2)}`,
        description: `Market order executed for $${total.toFixed(2)}`,
        data: {
          orderId: order.id,
          transactionId: transaction.id,
          ticker: asset?.ticker,
          assetName: asset?.name,
          action: order.type,
          quantity: order.quantity,
          price: order.price,
          total: total,
          executedAt: order.createdAt
        },
        importance: 2, // Medium importance
        relatedAssetId: order.assetId,
        relatedOrderId: order.id,
        relatedTransactionId: transaction.id,
        icon: order.type === 'BUY' ? 'buy' : 'sell',
        color: order.type === 'BUY' ? 'success' : 'info',
        actionUrl: `/asset/${asset?.ticker}`
      }
    });
  }

  /**
   * Create activity for market order queued until market opens
   */
  static async createMarketOrderQueuedActivity(
    userId: string,
    orderData: { ticker: string; type: 'BUY' | 'SELL'; quantity: number; estimatedPrice: number }
  ): Promise<UserActivity> {
    const action = orderData.type === 'BUY' ? 'Buy' : 'Sell';
    const estimatedTotal = orderData.quantity * orderData.estimatedPrice;

    return prisma.userActivity.create({
      data: {
        userId,
        type: 'TRADE',
        subtype: 'MARKET_ORDER_QUEUED',
        title: `${action} order for ${orderData.quantity} shares of ${orderData.ticker} queued`,
        description: `Market order queued until market opens at 9:30 AM ET (estimated: $${estimatedTotal.toFixed(2)})`,
        data: {
          ticker: orderData.ticker,
          action: orderData.type,
          quantity: orderData.quantity,
          estimatedPrice: orderData.estimatedPrice,
          estimatedTotal: estimatedTotal,
          reason: 'MARKET_CLOSED'
        },
        importance: 2,
        icon: 'clock',
        color: 'warning',
        actionUrl: `/asset/${orderData.ticker}`
      }
    });
  }

  /**
   * Create activity for limit order placement
   */
  static async createLimitOrderPlacedActivity(
    userId: string,
    limitOrder: LimitOrder
  ): Promise<UserActivity> {
    const asset = await prisma.asset.findUnique({
      where: { id: limitOrder.assetId }
    });

    const action = limitOrder.type === 'BUY' ? 'Buy' : 'Sell';
    const total = limitOrder.quantity * limitOrder.limitPrice;

    return prisma.userActivity.create({
      data: {
        userId,
        type: 'TRADE',
        subtype: 'LIMIT_ORDER_PLACED',
        title: `Limit order placed: ${action} ${limitOrder.quantity} ${asset?.ticker || 'Unknown'} at $${limitOrder.limitPrice.toFixed(2)}`,
        description: `Good until ${limitOrder.expireAt ? new Date(limitOrder.expireAt).toLocaleDateString() : 'cancelled'}`,
        data: {
          limitOrderId: limitOrder.id,
          ticker: asset?.ticker,
          assetName: asset?.name,
          action: limitOrder.type,
          quantity: limitOrder.quantity,
          limitPrice: limitOrder.limitPrice,
          total: total,
          expireAt: limitOrder.expireAt,
          placedAt: limitOrder.createdAt
        },
        importance: 1, // Low importance
        relatedAssetId: limitOrder.assetId,
        relatedOrderId: limitOrder.id,
        icon: 'pending',
        color: 'info',
        actionUrl: `/asset/${asset?.ticker}`
      }
    });
  }

  /**
   * Create activity for limit order execution
   */
  static async createLimitOrderExecutedActivity(
    userId: string,
    limitOrder: LimitOrder,
    transaction: Transaction
  ): Promise<UserActivity> {
    const asset = await prisma.asset.findUnique({
      where: { id: limitOrder.assetId }
    });

    const action = limitOrder.type === 'BUY' ? 'Bought' : 'Sold';
    const total = limitOrder.quantity * (limitOrder.executedPrice || limitOrder.limitPrice);

    return prisma.userActivity.create({
      data: {
        userId,
        type: 'TRADE',
        subtype: 'LIMIT_ORDER_EXECUTED',
        title: `Limit order executed: ${action} ${limitOrder.quantity} ${asset?.ticker || 'Unknown'} at $${(limitOrder.executedPrice || limitOrder.limitPrice).toFixed(2)}`,
        description: `Limit order filled for $${total.toFixed(2)}`,
        data: {
          limitOrderId: limitOrder.id,
          transactionId: transaction.id,
          ticker: asset?.ticker,
          assetName: asset?.name,
          action: limitOrder.type,
          quantity: limitOrder.quantity,
          limitPrice: limitOrder.limitPrice,
          executedPrice: limitOrder.executedPrice,
          total: total,
          executedAt: limitOrder.executedAt
        },
        importance: 2, // Medium importance
        relatedAssetId: limitOrder.assetId,
        relatedOrderId: limitOrder.id,
        relatedTransactionId: transaction.id,
        icon: limitOrder.type === 'BUY' ? 'buy' : 'sell',
        color: 'success',
        actionUrl: `/asset/${asset?.ticker}`
      }
    });
  }

  /**
   * Create activity for limit order cancellation
   */
  static async createLimitOrderCancelledActivity(
    userId: string,
    limitOrder: LimitOrder,
    reason: string
  ): Promise<UserActivity> {
    const asset = await prisma.asset.findUnique({
      where: { id: limitOrder.assetId }
    });

    const action = limitOrder.type === 'BUY' ? 'Buy' : 'Sell';

    return prisma.userActivity.create({
      data: {
        userId,
        type: 'TRADE',
        subtype: 'LIMIT_ORDER_CANCELLED',
        title: `Limit order cancelled: ${action} ${limitOrder.quantity} ${asset?.ticker || 'Unknown'} at $${limitOrder.limitPrice.toFixed(2)}`,
        description: reason,
        data: {
          limitOrderId: limitOrder.id,
          ticker: asset?.ticker,
          assetName: asset?.name,
          action: limitOrder.type,
          quantity: limitOrder.quantity,
          limitPrice: limitOrder.limitPrice,
          reason: reason,
          cancelledAt: new Date()
        },
        importance: 1, // Low importance
        relatedAssetId: limitOrder.assetId,
        relatedOrderId: limitOrder.id,
        icon: 'cancel',
        color: 'error',
        actionUrl: `/asset/${asset?.ticker}`
      }
    });
  }

  /**
   * Create activity for limit order expiration
   */
  static async createLimitOrderExpiredActivity(
    userId: string,
    limitOrder: LimitOrder
  ): Promise<UserActivity> {
    const asset = await prisma.asset.findUnique({
      where: { id: limitOrder.assetId }
    });

    const action = limitOrder.type === 'BUY' ? 'Buy' : 'Sell';

    return prisma.userActivity.create({
      data: {
        userId,
        type: 'TRADE',
        subtype: 'LIMIT_ORDER_EXPIRED',
        title: `Limit order expired: ${action} ${limitOrder.quantity} ${asset?.ticker || 'Unknown'} at $${limitOrder.limitPrice.toFixed(2)}`,
        description: `Order expired on ${limitOrder.expireAt ? new Date(limitOrder.expireAt).toLocaleDateString() : 'schedule'}`,
        data: {
          limitOrderId: limitOrder.id,
          ticker: asset?.ticker,
          assetName: asset?.name,
          action: limitOrder.type,
          quantity: limitOrder.quantity,
          limitPrice: limitOrder.limitPrice,
          expiredAt: limitOrder.expireAt
        },
        importance: 1, // Low importance
        relatedAssetId: limitOrder.assetId,
        relatedOrderId: limitOrder.id,
        icon: 'expired',
        color: 'warning',
        actionUrl: `/asset/${asset?.ticker}`
      }
    });
  }

  // ================================
  // PORTFOLIO ACTIVITIES
  // ================================

  /**
   * Create activity for portfolio value milestones
   */
  static async createPortfolioValueMilestoneActivity(
    userId: string,
    portfolioId: string,
    value: number,
    milestone: string
  ): Promise<UserActivity> {
    const startingValue = 100000; // Default starting value
    const changePercent = ((value - startingValue) / startingValue) * 100;
    const changeDirection = changePercent >= 0 ? '+' : '';

    return prisma.userActivity.create({
      data: {
        userId,
        type: 'PORTFOLIO',
        subtype: 'VALUE_MILESTONE',
        title: `Portfolio reached $${value.toLocaleString()}`,
        description: `${changeDirection}${changePercent.toFixed(1)}% from starting balance`,
        data: {
          portfolioId,
          currentValue: value,
          startingValue,
          changeAmount: value - startingValue,
          changePercent,
          milestone
        },
        importance: 3, // High importance
        icon: 'milestone',
        color: changePercent >= 0 ? 'success' : 'warning',
        actionUrl: '/portfolio'
      }
    });
  }

  /**
   * Create activity for position changes (new holdings, increases, decreases, exits)
   */
  static async createPositionChangeActivity(
    userId: string,
    holding: Holding,
    change: 'INCREASED' | 'DECREASED' | 'EXITED' | 'NEW_POSITION',
    previousQuantity?: number
  ): Promise<UserActivity> {
    const asset = await prisma.asset.findUnique({
      where: { id: holding.assetId }
    });

    let title: string;
    let description: string;
    let icon: string;
    let color: string;

    switch (change) {
      case 'NEW_POSITION':
        title = `New position: ${holding.quantity} shares of ${asset?.ticker || 'Unknown'}`;
        description = `Average cost: $${holding.averagePrice.toFixed(2)}`;
        icon = 'new';
        color = 'success';
        break;
      case 'INCREASED':
        const increased = holding.quantity - (previousQuantity || 0);
        title = `${asset?.ticker} position increased to ${holding.quantity} shares`;
        description = `Added ${increased} shares (avg cost: $${holding.averagePrice.toFixed(2)})`;
        icon = 'increase';
        color = 'success';
        break;
      case 'DECREASED':
        const decreased = (previousQuantity || 0) - holding.quantity;
        title = `${asset?.ticker} position decreased to ${holding.quantity} shares`;
        description = `Sold ${decreased} shares (avg cost: $${holding.averagePrice.toFixed(2)})`;
        icon = 'decrease';
        color = 'info';
        break;
      case 'EXITED':
        title = `Completely exited ${asset?.ticker} position`;
        description = `Sold all ${previousQuantity || 0} shares`;
        icon = 'exit';
        color = 'warning';
        break;
    }

    return prisma.userActivity.create({
      data: {
        userId,
        type: 'PORTFOLIO',
        subtype: 'POSITION_CHANGE',
        title,
        description,
        data: {
          holdingId: holding.id,
          portfolioId: holding.portfolioId,
          ticker: asset?.ticker,
          assetName: asset?.name,
          currentQuantity: holding.quantity,
          previousQuantity,
          averagePrice: holding.averagePrice,
          changeType: change
        },
        importance: 2, // Medium importance
        relatedAssetId: holding.assetId,
        icon,
        color,
        actionUrl: `/asset/${asset?.ticker}`
      }
    });
  }

  /**
   * Create activity for daily P&L updates
   */
  static async createDailyPnLActivity(
    userId: string,
    portfolioId: string,
    pnl: number,
    percentage: number
  ): Promise<UserActivity> {
    const direction = pnl >= 0 ? 'up' : 'down';
    const sign = pnl >= 0 ? '+' : '';
    
    return prisma.userActivity.create({
      data: {
        userId,
        type: 'PORTFOLIO',
        subtype: 'DAILY_PNL',
        title: `Daily P&L: ${sign}$${Math.abs(pnl).toFixed(2)} (${sign}${percentage.toFixed(2)}%)`,
        description: `Portfolio ${direction} ${sign}${percentage.toFixed(2)}% today`,
        data: {
          portfolioId,
          pnlAmount: pnl,
          pnlPercentage: percentage,
          date: new Date().toISOString().split('T')[0]
        },
        importance: 2, // Medium importance
        icon: direction === 'up' ? 'trending_up' : 'trending_down',
        color: pnl >= 0 ? 'success' : 'error',
        actionUrl: '/portfolio'
      }
    });
  }

  /**
   * Create activity for cash balance changes
   */
  static async createCashBalanceChangeActivity(
    userId: string,
    portfolioId: string,
    newBalance: number,
    change: number
  ): Promise<UserActivity> {
    const direction = change >= 0 ? 'increased' : 'decreased';
    const action = change >= 0 ? 'deposit' : 'trade';
    
    return prisma.userActivity.create({
      data: {
        userId,
        type: 'PORTFOLIO',
        subtype: 'CASH_BALANCE_CHANGE',
        title: `Cash balance ${direction} to $${newBalance.toLocaleString()}`,
        description: `${Math.abs(change).toFixed(2)} from ${action}`,
        data: {
          portfolioId,
          newBalance,
          changeAmount: change,
          previousBalance: newBalance - change
        },
        importance: 1, // Low importance
        icon: 'cash',
        color: 'info',
        actionUrl: '/portfolio'
      }
    });
  }

  // ================================
  // UTILITY METHODS
  // ================================

  /**
   * Get recent activities for a user with optional filtering
   */
  static async getRecentActivities(
    userId: string,
    limit: number = 20,
    categories?: string[]
  ): Promise<UserActivity[]> {
    return prisma.userActivity.findMany({
      where: {
        userId,
        ...(categories && categories.length > 0 && {
          type: {
            in: categories
          }
        })
      },
      include: {
        relatedAsset: {
          select: {
            id: true,
            ticker: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
  }

  /**
   * Mark activities as read
   */
  static async markActivitiesAsRead(
    userId: string,
    activityIds: string[]
  ): Promise<void> {
    await prisma.userActivity.updateMany({
      where: {
        userId,
        id: {
          in: activityIds
        }
      },
      data: {
        read: true
      }
    });
  }

  /**
   * Clean up old activities (older than specified days)
   */
  static async cleanupOldActivities(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.userActivity.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        importance: 1 // Only cleanup low importance activities
      }
    });

    return result.count;
  }

  /**
   * Get activity count by type for a user
   */
  static async getActivityStats(userId: string): Promise<Record<string, number>> {
    const stats = await prisma.userActivity.groupBy({
      by: ['type'],
      where: {
        userId
      },
      _count: {
        id: true
      }
    });

    return stats.reduce((acc: Record<string, number>, stat) => {
      acc[stat.type] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);
  }
} 