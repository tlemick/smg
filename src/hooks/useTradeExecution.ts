import { useState, useCallback } from 'react';
import type { 
  TradeOrderData, 
  MarketOrderApiRequest, 
  LimitOrderApiRequest, 
  OrderApiResponse,
  ExecutedTradeOrder 
} from '@/types';

interface Asset {
  id: number;
  ticker: string;
  name: string;
}

/**
 * Hook for executing trade orders
 * 
 * Handles:
 * - API calls to market-order and limit-order endpoints
 * - Loading and error states
 * - Response transformation to ExecutedTradeOrder
 * 
 * @returns Execute function, loading state, and error
 */
export function useTradeExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeOrder = useCallback(
    async (
      orderData: TradeOrderData,
      asset: Asset
    ): Promise<ExecutedTradeOrder | null> => {
      setIsExecuting(true);
      setError(null);

      try {
        // Determine endpoint based on order type
        const endpoint =
          orderData.orderType === 'LIMIT'
            ? '/api/trade/limit-order'
            : '/api/trade/market-order';

        // Build API request based on order type
        let apiRequest: MarketOrderApiRequest | LimitOrderApiRequest;

        const baseRequest = {
          assetId: asset.id,
          orderType: orderData.tradeType,
          notes: orderData.notes,
        };

        if (orderData.quantityType === 'SHARES') {
          apiRequest = {
            ...baseRequest,
            shares: orderData.amount,
          };
        } else {
          apiRequest = {
            ...baseRequest,
            dollarAmount: orderData.amount,
          };
        }

        // Add limit price for limit orders
        if (orderData.orderType === 'LIMIT' && orderData.limitPrice) {
          (apiRequest as LimitOrderApiRequest).limitPrice = orderData.limitPrice;
        }

        // Execute the order
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiRequest),
        });

        const result: OrderApiResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to execute order');
        }

        // Transform API response to ExecutedTradeOrder
        // Handle PENDING status for limit orders (not executed yet)
        const executedOrder: ExecutedTradeOrder = {
          orderId: result.orderId || '',
          transactionId: result.transactionId,
          status: result.executionStatus,
          filledShares: result.orderDetails.shares,
          // For PENDING orders, use limitPrice; for EXECUTED orders, use actual execution price
          filledPrice: result.orderDetails.pricePerShare || orderData.limitPrice || 0,
          filledNotional: result.orderDetails.totalValue,
          executedAt: result.orderDetails.executedAt
            ? new Date(result.orderDetails.executedAt)
            : new Date(),
          timeInForce: 'DAY', // Default for now, can be extended later
          asset: {
            ticker: asset.ticker,
            name: asset.name,
          },
        };

        return executedOrder;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Network error. Please check your connection and try again.';
        setError(errorMessage);
        return null;
      } finally {
        setIsExecuting(false);
      }
    },
    []
  );

  return {
    executeOrder,
    isExecuting,
    error,
  };
}
