import { prisma } from '../../prisma/client';

export interface CashValidationResult {
  isValid: boolean;
  currentCashBalance: number;
  requestedAmount: number;
  remainingCash: number;
  errorMessage?: string;
}

export interface OrderCostCalculation {
  orderValue: number;
  estimatedFees: number;
  totalCost: number;
  breakdown: {
    shares: number;
    pricePerShare: number;
    commissionFee: number;
    regulatoryFees: number;
  };
}

/**
 * Cash Management Service for educational trading
 * Handles cash balance validation, order cost calculations, and portfolio updates
 */
export class CashManagementService {
  
  /**
   * Get current cash balance for a user's portfolio
   */
  static async getCurrentCashBalance(userId: string): Promise<number> {
    let portfolio = await prisma.portfolio.findFirst({
      where: { userId }
    });
    
    if (!portfolio) {
      // Find the active game session
      const activeSession = await prisma.gameSession.findFirst({
        where: { isActive: true }
      });

      if (!activeSession) {
        throw new Error(`No active trading session available for user ${userId}`);
      }

      // Create portfolio for user in the active session
      const user = await prisma.user.findUnique({ where: { id: userId } });
      portfolio = await prisma.portfolio.create({
        data: {
          name: `${user?.name || 'User'}'s Portfolio`,
          userId: userId,
          sessionId: activeSession.id,
          cash_balance: activeSession.startingCash,
        }
      });
    }
    
    return Number(portfolio.cash_balance);
  }
  
  /**
   * Calculate the total cost of an order including fees
   * For educational purposes, we'll simulate realistic fees
   */
  static calculateOrderCost(
    shares: number, 
    pricePerShare: number, 
    orderType: 'BUY' | 'SELL' = 'BUY'
  ): OrderCostCalculation {
    const orderValue = shares * pricePerShare;
    
    // Educational fee structure (simplified)
    const commissionFee = 0; // Most modern brokers are commission-free
    const regulatoryFees = orderType === 'SELL' ? orderValue * 0.0000229 : 0; // SEC fee for sells only
    
    const estimatedFees = commissionFee + regulatoryFees;
    const totalCost = orderValue + estimatedFees;
    
    return {
      orderValue,
      estimatedFees,
      totalCost,
      breakdown: {
        shares,
        pricePerShare,
        commissionFee,
        regulatoryFees,
      }
    };
  }
  
  /**
   * Validate if a user has sufficient cash for a buy order
   */
  static async validateCashForPurchase(
    userId: string,
    shares: number,
    pricePerShare: number
  ): Promise<CashValidationResult> {
    try {
      const currentCash = await this.getCurrentCashBalance(userId);
      const orderCost = this.calculateOrderCost(shares, pricePerShare, 'BUY');
      
      const isValid = currentCash >= orderCost.totalCost;
      const remainingCash = currentCash - orderCost.totalCost;
      
      if (!isValid) {
        return {
          isValid: false,
          currentCashBalance: currentCash,
          requestedAmount: orderCost.totalCost,
          remainingCash: currentCash,
          errorMessage: `Insufficient funds. You need $${orderCost.totalCost.toFixed(2)} but only have $${currentCash.toFixed(2)} available.`
        };
      }
      
      return {
        isValid: true,
        currentCashBalance: currentCash,
        requestedAmount: orderCost.totalCost,
        remainingCash,
      };
      
    } catch (error) {
      console.error('Error validating cash for purchase:', error);
      return {
        isValid: false,
        currentCashBalance: 0,
        requestedAmount: 0,
        remainingCash: 0,
        errorMessage: 'Unable to validate cash balance. Please try again.',
      };
    }
  }
  
  /**
   * Update cash balance after a buy order execution
   */
  static async deductCashForPurchase(
    userId: string,
    shares: number,
    pricePerShare: number,
    transactionId?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
      const orderCost = this.calculateOrderCost(shares, pricePerShare, 'BUY');
      
      // Validate again before deducting (safety check)
      const validation = await this.validateCashForPurchase(userId, shares, pricePerShare);
      if (!validation.isValid) {
        return {
          success: false,
          newBalance: validation.currentCashBalance,
          error: validation.errorMessage,
        };
      }
      
      // Update portfolio cash balance
      const updatedPortfolio = await prisma.portfolio.updateMany({
        where: { userId },
        data: {
          cash_balance: {
            decrement: orderCost.totalCost
          }
        }
      });
      
      if (updatedPortfolio.count === 0) {
        throw new Error('Portfolio not found or update failed');
      }
      
      const newBalance = await this.getCurrentCashBalance(userId);
      
      console.log(`✅ Cash deducted for user ${userId}: $${orderCost.totalCost.toFixed(2)} (Transaction: ${transactionId})`);
      
      return {
        success: true,
        newBalance,
      };
      
    } catch (error) {
      console.error('Error deducting cash for purchase:', error);
      return {
        success: false,
        newBalance: 0,
        error: 'Failed to update cash balance',
      };
    }
  }
  
  /**
   * Add cash back after a sell order execution
   */
  static async addCashFromSale(
    userId: string,
    shares: number,
    pricePerShare: number,
    transactionId?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
      const orderCost = this.calculateOrderCost(shares, pricePerShare, 'SELL');
      const netProceeds = orderCost.orderValue - orderCost.estimatedFees;
      
      // Update portfolio cash balance
      const updatedPortfolio = await prisma.portfolio.updateMany({
        where: { userId },
        data: {
          cash_balance: {
            increment: netProceeds
          }
        }
      });
      
      if (updatedPortfolio.count === 0) {
        throw new Error('Portfolio not found or update failed');
      }
      
      const newBalance = await this.getCurrentCashBalance(userId);
      
      console.log(`✅ Cash added for user ${userId}: $${netProceeds.toFixed(2)} (Transaction: ${transactionId})`);
      
      return {
        success: true,
        newBalance,
      };
      
    } catch (error) {
      console.error('Error adding cash from sale:', error);
      return {
        success: false,
        newBalance: 0,
        error: 'Failed to update cash balance',
      };
    }
  }
  
  /**
   * Get cash position summary for educational purposes
   */
  static async getCashSummary(userId: string): Promise<{
    currentCash: number;
    startingCash: number;
    totalSpent: number;
    availableForTrading: number;
    cashUtilization: number; // percentage
  }> {
    try {
      let portfolio = await prisma.portfolio.findFirst({
        where: { userId },
        include: {
          gameSession: true
        }
      });
      
      if (!portfolio) {
        // Find the active game session
        const activeSession = await prisma.gameSession.findFirst({
          where: { isActive: true }
        });

        if (!activeSession) {
          throw new Error(`No active trading session available for user ${userId}`);
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
          include: {
            gameSession: true
          }
        });
      }
      
      if (!portfolio.gameSession) {
        throw new Error('Game session not found for portfolio');
      }
      
      const currentCash = Number(portfolio.cash_balance);
      const startingCash = Number(portfolio.gameSession.startingCash);
      const totalSpent = startingCash - currentCash;
      const cashUtilization = ((totalSpent / startingCash) * 100);
      
      return {
        currentCash,
        startingCash,
        totalSpent,
        availableForTrading: currentCash,
        cashUtilization: Math.max(0, cashUtilization), // Ensure non-negative
      };
      
    } catch (error) {
      console.error('Error getting cash summary:', error);
      // Return safe defaults
      return {
        currentCash: 0,
        startingCash: 100000,
        totalSpent: 0,
        availableForTrading: 0,
        cashUtilization: 0,
      };
    }
  }
  
  /**
   * Educational helper: Explain fee structure to students
   */
  static getEducationalFeeBreakdown(): {
    description: string;
    feeTypes: Array<{
      name: string;
      description: string;
      calculation: string;
      when: string;
    }>;
  } {
    return {
      description: 'Understanding trading fees helps you make informed investment decisions',
      feeTypes: [
        {
          name: 'Commission Fee',
          description: 'Fee charged by broker for executing trades',
          calculation: '$0 (Most modern brokers are commission-free)',
          when: 'Both buy and sell orders',
        },
        {
          name: 'SEC Fee',
          description: 'Regulatory fee charged by Securities and Exchange Commission',
          calculation: '0.00229% of sale value',
          when: 'Sell orders only',
        },
        {
          name: 'FINRA Fee',
          description: 'Trading Activity Fee (TAF) charged by FINRA',
          calculation: 'Included in SEC fee calculation for simplicity',
          when: 'Sell orders only',
        },
      ],
    };
  }
  
  /**
   * Reset cash balance to starting amount (for educational resets)
   */
  static async resetCashBalance(userId: string): Promise<{ success: boolean; newBalance: number }> {
    try {
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
          throw new Error(`No active trading session available for user ${userId}`);
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
          include: {
            gameSession: true
          }
        });
      }
      
      if (!portfolio.gameSession) {
        throw new Error('Game session not found for portfolio');
      }
      
      const startingCash = Number(portfolio.gameSession.startingCash);
      
      await prisma.portfolio.updateMany({
        where: { userId },
        data: {
          cash_balance: startingCash
        }
      });
      
      console.log(`✅ Cash balance reset for user ${userId} to $${startingCash}`);
      
      return {
        success: true,
        newBalance: startingCash,
      };
      
    } catch (error) {
      console.error('Error resetting cash balance:', error);
      return {
        success: false,
        newBalance: 0,
      };
    }
  }
} 