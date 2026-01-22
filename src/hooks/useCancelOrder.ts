import { useState, useCallback } from 'react';
import { ApiClient, ApiError } from '@/lib/api';

interface CancelOrderResponse {
  success: boolean;
  message?: string;
  order?: {
    id: string;
    type: 'limit';
    orderType: string;
    asset: any;
    quantity: number;
    limitPrice: number;
    status: string;
    createdAt: Date;
    cancelledAt: Date;
  };
  educationalNote?: string;
  error?: string;
}

export function useCancelOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelOrder = useCallback(async (orderId: string): Promise<CancelOrderResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await ApiClient.put<CancelOrderResponse>(
        `/api/trade/orders/${orderId}`,
        { action: 'cancel' }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel order');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : err instanceof Error 
        ? err.message 
        : 'Failed to cancel order';
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    cancelOrder,
    isLoading,
    error
  };
}
