import { prisma } from '../../prisma/client';
import { getAssetQuoteWithCache } from './yahoo-finance-service';
import { MarketStateService } from './market-state-service';
import { CashManagementService } from './cash-management-service';
import { ActivityService } from './activity-service';


export interface OrderExecutionResult {
  success: boolean;
  ordersProcessed: number;
  ordersExecuted: number;
  ordersExpired: number;
  errors: string[];
}

export class OrderExecutionService {
  
  /**
   * Main entry point for processing all pending orders
   * This should be called by a background job/cron task
   */
  static async processAllPendingOrders(): Promise<OrderExecutionResult> {
    const result: OrderExecutionResult = {
      success: true,
      ordersProcessed: 0,
      ordersExecuted: 0,
      ordersExpired: 0,
      errors: []
    };

    try {
      console.log('Starting order processing...');
      
      // Check if market allows order execution
      const marketState = await MarketStateService.getCurrentMarketState();
      
      // Process queued market orders if market is open
      if (marketState.canExecuteOrders) {
        const queuedResult = await this.processQueuedMarketOrders();
        result.ordersProcessed += queuedResult.ordersProcessed;
        result.ordersExecuted += queuedResult.ordersExecuted;
        result.errors.push(...queuedResult.errors);
      }
      
      // Always process limit orders (they can execute in any market state if price is met)
      const limitResult = await this.processLimitOrders();
      result.ordersProcessed += limitResult.ordersProcessed;
      result.ordersExecuted += limitResult.ordersExecuted;
      result.ordersExpired += limitResult.ordersExpired;
      result.errors.push(...limitResult.errors);
      
      console.log(`Order processing complete: ${result.ordersExecuted} executed, ${result.ordersExpired} expired`);
      
    } catch (error) {
      console.error('Error in processAllPendingOrders:', error);
      result.success = false;
      result.errors.push(`Critical error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Process all pending limit orders
   */
  static async processLimitOrders(): Promise<OrderExecutionResult> {
    const result: OrderExecutionResult = {
      success: true,
      ordersProcessed: 0,
      ordersExecuted: 0,
      ordersExpired: 0,
      errors: []
    };

    try {
      // Get all pending limit orders
      const pendingOrders = await prisma.limitOrder.findMany({
        where: { 
          status: 'PENDING' 
        },
        include: {
          asset: true,
          user: true
        },
        orderBy: { createdAt: 'asc' } // Process oldest orders first
      });

      console.log(`Found ${pendingOrders.length} pending limit orders to process`);

      for (const order of pendingOrders) {
        result.ordersProcessed++;
        
        try {
          // Check if order has expired
          if (order.expireAt && new Date() > order.expireAt) {
            await this.expireLimitOrder(order);
            result.ordersExpired++;
            continue;
          }

          // Get current price for the asset
          const quote = await getAssetQuoteWithCache(order.assetId);
          const currentPrice = quote.regularMarketPrice;

          if (!currentPrice) {
            result.errors.push(`Unable to get price for asset ${order.asset.ticker} (order ${order.id})`);
            continue;
          }

          // Check if execution conditions are met
          const shouldExecute = this.shouldExecuteLimitOrder(order, currentPrice);
          
          if (shouldExecute) {
            await this.executeLimitOrder(order, currentPrice);
            result.ordersExecuted++;
            console.log(`Executed limit order ${order.id} for ${order.asset.ticker} at $${currentPrice}`);
          }

        } catch (orderError) {
          const errorMessage = `Error processing order ${order.id}: ${orderError instanceof Error ? orderError.message : 'Unknown error'}`;
          console.error(errorMessage);
          result.errors.push(errorMessage);
        }
      }

    } catch (error) {
      console.error('Error in processLimitOrders:', error);
      result.success = false;
      result.errors.push(`Error processing limit orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Process queued market orders (when market opens)
   */
  static async processQueuedMarketOrders(): Promise<OrderExecutionResult> {
    const result: OrderExecutionResult = {
      success: true,
      ordersProcessed: 0,
      ordersExecuted: 0,
      ordersExpired: 0,
      errors: []
    };

    try {
      // Get all pending market orders (these were queued when market was closed)
      const queuedOrders = await prisma.order.findMany({
        where: { 
          status: 'PENDING' 
        },
        include: {
          asset: true,
          user: true
        },
        orderBy: { createdAt: 'asc' }
      });

      console.log(`Found ${queuedOrders.length} queued market orders to execute`);

      for (const order of queuedOrders) {
        result.ordersProcessed++;
        
        try {
          // Get current market price
          const quote = await getAssetQuoteWithCache(order.assetId);
          const currentPrice = quote.regularMarketPrice;

          if (!currentPrice) {
            result.errors.push(`Unable to get current price for asset ${order.asset.ticker} (order ${order.id})`);
            continue;
          }

          // Execute the market order at current price
          await this.executeQueuedMarketOrder(order, currentPrice);
          result.ordersExecuted++;
          console.log(`Executed queued market order ${order.id} for ${order.asset.ticker} at $${currentPrice}`);

        } catch (orderError) {
          const errorMessage = `Error executing queued order ${order.id}: ${orderError instanceof Error ? orderError.message : 'Unknown error'}`;
          console.error(errorMessage);
          result.errors.push(errorMessage);
        }
      }

    } catch (error) {
      console.error('Error in processQueuedMarketOrders:', error);
      result.success = false;
      result.errors.push(`Error processing queued market orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Determine if a limit order should execute based on current price
   */
  private static shouldExecuteLimitOrder(order: any, currentPrice: number): boolean {
    const limitPrice = Number(order.limitPrice);
    
    if (order.type === 'BUY') {
      // Buy limit order executes when current price is at or below the limit price
      return currentPrice <= limitPrice;
    } else {
      // Sell limit order executes when current price is at or above the limit price  
      return currentPrice >= limitPrice;
    }
  }

  /**
   * Execute a limit order when conditions are met
   */
  private static async executeLimitOrder(limitOrder: any, executionPrice: number): Promise<void> {
    try {
      // Get user's portfolio
      const portfolio = await prisma.portfolio.findFirst({
        where: { userId: limitOrder.userId }
      });

      if (!portfolio) {
        throw new Error(`Portfolio not found for user ${limitOrder.userId}`);
      }

      // Validate the order can still be executed (cash/shares available)
      const isValid = await this.validateOrderExecution(limitOrder, portfolio);
      if (!isValid) {
        // Cancel the order if it can't be executed
        await this.cancelLimitOrder(limitOrder, 'Insufficient funds or shares');
        return;
      }

      // Execute the order using a transaction to ensure consistency
      await prisma.$transaction(async (tx) => {
        // Update the limit order status
        await tx.limitOrder.update({
          where: { id: limitOrder.id },
          data: {
            status: 'EXECUTED',
            executedPrice: executionPrice,
            executedAt: new Date()
          }
        });

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            portfolioId: portfolio.id,
            assetId: limitOrder.assetId,
            type: limitOrder.type,
            quantity: Number(limitOrder.quantity),
            price: executionPrice,
            total: Number(limitOrder.quantity) * executionPrice,
            userId: limitOrder.userId,
            assetType: limitOrder.assetType,
          }
        });

        // Update cash balance
        if (limitOrder.type === 'BUY') {
          await CashManagementService.deductCashForPurchase(
            limitOrder.userId,
            Number(limitOrder.quantity),
            executionPrice,
            transaction.id
          );
        } else {
          await CashManagementService.addCashFromSale(
            limitOrder.userId,
            Number(limitOrder.quantity),
            executionPrice,
            transaction.id
          );
        }

        // Update or create holding
        if (limitOrder.type === 'BUY') {
          // Add to holdings
          await tx.holding.upsert({
            where: {
              portfolioId_assetId: {
                portfolioId: portfolio.id,
                assetId: limitOrder.assetId
              }
            },
            update: {
              quantity: {
                increment: Number(limitOrder.quantity)
              },
              averagePrice: executionPrice, // Simplified - should calculate weighted average
            },
            create: {
              portfolioId: portfolio.id,
              assetId: limitOrder.assetId,
              assetType: limitOrder.assetType,
              quantity: Number(limitOrder.quantity),
              averagePrice: executionPrice,
            }
          });
        } else {
          // Reduce holdings
          const holding = await tx.holding.findUnique({
            where: {
              portfolioId_assetId: {
                portfolioId: portfolio.id,
                assetId: limitOrder.assetId
              }
            }
          });

          if (holding) {
            const newQuantity = Number(holding.quantity) - Number(limitOrder.quantity);
            
            if (newQuantity <= 0.001) {
              // Delete holding if quantity reaches 0
              await tx.holding.delete({
                where: {
                  portfolioId_assetId: {
                    portfolioId: portfolio.id,
                    assetId: limitOrder.assetId
                  }
                }
              });
            } else {
              // Update quantity
              await tx.holding.update({
                where: {
                  portfolioId_assetId: {
                    portfolioId: portfolio.id,
                    assetId: limitOrder.assetId
                  }
                },
                data: {
                  quantity: newQuantity
                }
              });
            }
          }
        }

        // Generate activity notification
        try {
          const updatedLimitOrder = await tx.limitOrder.findUnique({
            where: { id: limitOrder.id },
            include: { asset: true }
          });
          
          if (updatedLimitOrder) {
            await ActivityService.createLimitOrderExecutedActivity(
              limitOrder.userId,
              updatedLimitOrder,
              transaction
            );
          }
        } catch (activityError) {
          // Log but don't fail the transaction if activity generation fails
          console.error('Failed to create limit order executed activity:', activityError);
        }
      });

    } catch (error) {
      console.error(`Failed to execute limit order ${limitOrder.id}:`, error);
      throw error;
    }
  }

  /**
   * Execute a queued market order
   */
  private static async executeQueuedMarketOrder(order: any, currentPrice: number): Promise<void> {
    try {
      // Get user's portfolio
      const portfolio = await prisma.portfolio.findFirst({
        where: { userId: order.userId }
      });

      if (!portfolio) {
        throw new Error(`Portfolio not found for user ${order.userId}`);
      }

      // Validate the order can still be executed (cash/shares available)
      const isValid = await this.validateQueuedOrderExecution(order, portfolio, currentPrice);
      if (!isValid) {
        // Cancel the order if it can't be executed
        await this.cancelQueuedOrder(order, 'Insufficient funds or shares at market open');
        return;
      }

      // Execute the order using a transaction to ensure consistency
      await prisma.$transaction(async (tx) => {
        // Update the order with current price and mark as completed
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'COMPLETED',
            price: currentPrice
          }
        });

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            portfolioId: portfolio.id,
            assetId: order.assetId,
            type: order.type,
            quantity: Number(order.quantity),
            price: currentPrice,
            total: Number(order.quantity) * currentPrice,
            userId: order.userId,
            assetType: order.assetType,
          }
        });

        // Update cash balance
        if (order.type === 'BUY') {
          await CashManagementService.deductCashForPurchase(
            order.userId,
            Number(order.quantity),
            currentPrice,
            transaction.id
          );
        } else {
          await CashManagementService.addCashFromSale(
            order.userId,
            Number(order.quantity),
            currentPrice,
            transaction.id
          );
        }

        // Update or create holding
        if (order.type === 'BUY') {
          // Add to holdings
          await tx.holding.upsert({
            where: {
              portfolioId_assetId: {
                portfolioId: portfolio.id,
                assetId: order.assetId
              }
            },
            update: {
              quantity: {
                increment: Number(order.quantity)
              },
              averagePrice: currentPrice, // Simplified - should calculate weighted average
            },
            create: {
              portfolioId: portfolio.id,
              assetId: order.assetId,
              assetType: order.assetType,
              quantity: Number(order.quantity),
              averagePrice: currentPrice,
            }
          });
        } else {
          // Reduce holdings
          const holding = await tx.holding.findUnique({
            where: {
              portfolioId_assetId: {
                portfolioId: portfolio.id,
                assetId: order.assetId
              }
            }
          });

          if (holding) {
            const newQuantity = Number(holding.quantity) - Number(order.quantity);
            
            if (newQuantity <= 0.001) {
              // Delete holding if quantity reaches 0
              await tx.holding.delete({
                where: {
                  portfolioId_assetId: {
                    portfolioId: portfolio.id,
                    assetId: order.assetId
                  }
                }
              });
            } else {
              // Update quantity
              await tx.holding.update({
                where: {
                  portfolioId_assetId: {
                    portfolioId: portfolio.id,
                    assetId: order.assetId
                  }
                },
                data: {
                  quantity: newQuantity
                }
              });
            }
          }
        }

        // Generate activity notification
        try {
          const orderData = {
            id: order.id,
            assetId: order.assetId,
            type: order.type,
            quantity: Number(order.quantity),
            price: currentPrice,
            createdAt: new Date(),
            userId: order.userId,
            status: 'EXECUTED',
            assetType: order.assetType,
            priceType: 'MARKET'
          };
          
          await ActivityService.createMarketOrderExecutedActivity(
            order.userId,
            orderData,
            transaction
          );
        } catch (activityError) {
          // Log but don't fail the transaction if activity generation fails
          console.error('Failed to create market order executed activity:', activityError);
        }
      });

    } catch (error) {
      console.error(`Failed to execute queued market order ${order.id}:`, error);
      throw error;
    }
  }

  /**
   * Validate that an order can still be executed
   */
  private static async validateOrderExecution(order: any, portfolio: any): Promise<boolean> {
    try {
      if (order.type === 'BUY') {
        // Check if user still has enough cash
        const cashValidation = await CashManagementService.validateCashForPurchase(
          order.userId,
          Number(order.quantity),
          Number(order.limitPrice)
        );
        return cashValidation.isValid;
      } else {
        // Check if user still has enough shares
        const holding = await prisma.holding.findFirst({
          where: {
            portfolioId: portfolio.id,
            assetId: order.assetId
          }
        });
        return holding ? Number(holding.quantity) >= Number(order.quantity) : false;
      }
    } catch (error) {
      console.error('Error validating order execution:', error);
      return false;
    }
  }

  /**
   * Expire a limit order that has passed its expiration date
   */
  private static async expireLimitOrder(order: any): Promise<void> {
    try {
      await prisma.limitOrder.update({
        where: { id: order.id },
        data: { status: 'EXPIRED' }
      });

      // Generate activity notification for expiration
      try {
        await ActivityService.createLimitOrderExpiredActivity(order.userId, order);
      } catch (activityError) {
        console.error('Failed to create limit order expired activity:', activityError);
      }

      console.log(`Expired limit order ${order.id}`);
    } catch (error) {
      console.error(`Failed to expire limit order ${order.id}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a limit order with a reason
   */
  private static async cancelLimitOrder(order: any, reason: string): Promise<void> {
    try {
      await prisma.limitOrder.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' }
      });

      // Generate activity notification for cancellation
      try {
        await ActivityService.createLimitOrderCancelledActivity(order.userId, order, reason);
      } catch (activityError) {
        console.error('Failed to create limit order cancelled activity:', activityError);
      }

      console.log(`Cancelled limit order ${order.id}: ${reason}`);
    } catch (error) {
      console.error(`Failed to cancel limit order ${order.id}:`, error);
      throw error;
    }
  }

  /**
   * Validate that a queued market order can still be executed
   */
  private static async validateQueuedOrderExecution(order: any, portfolio: any, currentPrice: number): Promise<boolean> {
    try {
      if (order.type === 'BUY') {
        // Check if user still has enough cash at current market price
        const cashValidation = await CashManagementService.validateCashForPurchase(
          order.userId,
          Number(order.quantity),
          currentPrice
        );
        return cashValidation.isValid;
      } else {
        // Check if user still has enough shares
        const holding = await prisma.holding.findFirst({
          where: {
            portfolioId: portfolio.id,
            assetId: order.assetId
          }
        });
        return holding ? Number(holding.quantity) >= Number(order.quantity) : false;
      }
    } catch (error) {
      console.error('Error validating queued order execution:', error);
      return false;
    }
  }

  /**
   * Cancel a queued market order with a reason
   */
  private static async cancelQueuedOrder(order: any, reason: string): Promise<void> {
    try {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' }
      });

      // Log the cancellation (activity creation for cancelled queued orders can be added later if needed)
      console.log(`Queued market order cancelled: ${order.type} ${Number(order.quantity)} shares of ${order.asset?.ticker || 'Unknown'} - ${reason}`);

      console.log(`Cancelled queued market order ${order.id}: ${reason}`);
    } catch (error) {
      console.error(`Failed to cancel queued market order ${order.id}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup old and invalid orders
   * This method handles various cleanup scenarios beyond just expiration
   */
  static async cleanupOrders(): Promise<{ cleaned: number; errors: string[] }> {
    const result: { cleaned: number; errors: string[] } = { cleaned: 0, errors: [] };

    try {
      // 1. Expire limit orders that have passed their expiration date
      const expiredLimitOrders = await prisma.limitOrder.findMany({
        where: {
          status: 'PENDING',
          expireAt: {
            lt: new Date()
          }
        },
        include: { asset: true }
      });

      for (const order of expiredLimitOrders) {
        try {
          await this.expireLimitOrder(order);
          result.cleaned++;
        } catch (error) {
          const errorMessage = `Failed to expire limit order ${order.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMessage);
        }
      }

      // 2. Cancel very old pending market orders (older than 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const oldQueuedOrders = await prisma.order.findMany({
        where: {
          status: 'PENDING',
          createdAt: {
            lt: sevenDaysAgo
          }
        },
        include: { asset: true }
      });

      for (const order of oldQueuedOrders) {
        try {
          await this.cancelQueuedOrder(order, 'Order too old - cancelled after 7 days');
          result.cleaned++;
        } catch (error) {
          const errorMessage = `Failed to cancel old queued order ${order.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMessage);
        }
      }

      // 3. Handle limit orders without expiration that are very old (older than 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const veryOldLimitOrders = await prisma.limitOrder.findMany({
        where: {
          status: 'PENDING',
          expireAt: null,
          createdAt: {
            lt: ninetyDaysAgo
          }
        },
        include: { asset: true }
      });

      for (const order of veryOldLimitOrders) {
        try {
          await this.cancelLimitOrder(order, 'Order cancelled - exceeded 90 day limit for orders without expiration');
          result.cleaned++;
        } catch (error) {
          const errorMessage = `Failed to cancel very old limit order ${order.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMessage);
        }
      }

      console.log(`Order cleanup completed: ${result.cleaned} orders processed, ${result.errors.length} errors`);

    } catch (error) {
      console.error('Error during order cleanup:', error);
      const errorMessage = `Cleanup process error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMessage);
    }

    return result;
  }

  /**
   * Get order processing statistics
   */
  static async getOrderProcessingStats(): Promise<{
    pendingLimitOrders: number;
    pendingMarketOrders: number;
    expiredOrders: number;
    totalProcessed: number;
  }> {
    try {
      const [pendingLimitOrders, pendingMarketOrders, expiredOrders, executedLimitOrders, completedMarketOrders] = await Promise.all([
        prisma.limitOrder.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.limitOrder.count({ where: { status: 'EXPIRED' } }),
        prisma.limitOrder.count({ where: { status: 'EXECUTED' } }),
        prisma.order.count({ where: { status: 'COMPLETED' } })
      ]);

      const totalProcessed = executedLimitOrders + completedMarketOrders;

      return {
        pendingLimitOrders,
        pendingMarketOrders,
        expiredOrders,
        totalProcessed
      };
    } catch (error) {
      console.error('Error getting order processing stats:', error);
      return {
        pendingLimitOrders: 0,
        pendingMarketOrders: 0,
        expiredOrders: 0,
        totalProcessed: 0
      };
    }
  }
} 