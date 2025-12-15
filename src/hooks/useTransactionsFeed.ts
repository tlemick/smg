import { useState, useEffect, useCallback, useRef } from 'react';
import { UnifiedOrder } from '@/types';

interface OrdersApiResponse {
  success: boolean;
  orders: UnifiedOrder[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  summary: {
    totalPending: number;
    totalExecuted: number;
    totalCancelled: number;
    marketOrders: number;
    limitOrders: number;
    transactions: number;
  };
  error?: string;
}

interface UseTransactionsFeedOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface TransactionsFeedData {
  pendingOrders: UnifiedOrder[];
  completedOrders: UnifiedOrder[];
  stats: {
    pending: number;
    executed: number;
    cancelled: number;
    total: number;
  };
}

export function useTransactionsFeed(options: UseTransactionsFeedOptions = {}) {
  const {
    limit = 20,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [data, setData] = useState<TransactionsFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all orders (both pending and executed)
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('status', 'all'); // Get all statuses
      params.set('type', 'all'); // Get both BUY and SELL

      const response = await fetch(`/api/trade/orders?${params.toString()}`);
      const result: OrdersApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch transactions');
      }

      // Separate orders by status
      const pendingOrders = result.orders
        .filter(order => order.status === 'PENDING')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const completedOrders = result.orders
        .filter(order => order.status === 'EXECUTED' || order.status === 'CANCELLED')
        .sort((a, b) => {
          // Sort completed orders by execution date if available, otherwise creation date
          const aDate = a.executedAt ? new Date(a.executedAt) : new Date(a.createdAt);
          const bDate = b.executedAt ? new Date(b.executedAt) : new Date(b.createdAt);
          return bDate.getTime() - aDate.getTime();
        });

      setData({
        pendingOrders,
        completedOrders,
        stats: {
          pending: result.summary?.totalPending || 0,
          executed: result.summary?.totalExecuted || 0,
          cancelled: result.summary?.totalCancelled || 0,
          total: result.orders?.length || 0
        }
      });
      setLastFetch(new Date());
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const refresh = useCallback(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const isStale = useCallback((maxAgeMinutes: number = 5) => {
    if (!lastFetch) return true;
    const now = new Date();
    const diffMinutes = (now.getTime() - lastFetch.getTime()) / (1000 * 60);
    return diffMinutes > maxAgeMinutes;
  }, [lastFetch]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const startAutoRefresh = () => {
        refreshTimeoutRef.current = setTimeout(() => {
          if (!document.hidden) { // Only refresh if tab is visible
            refresh();
          }
          startAutoRefresh(); // Schedule next refresh
        }, refreshInterval);
      };

      startAutoRefresh();

      return () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, refresh]);

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Helper functions
  const getPendingCount = useCallback(() => {
    return data?.pendingOrders.length || 0;
  }, [data]);

  const getCompletedCount = useCallback(() => {
    return data?.completedOrders.length || 0;
  }, [data]);

  const getMostRecentPending = useCallback((maxItems: number = 5) => {
    return data?.pendingOrders.slice(0, maxItems) || [];
  }, [data]);

  const getMostRecentCompleted = useCallback((maxItems: number = 7) => {
    return data?.completedOrders.slice(0, maxItems) || [];
  }, [data]);

  return {
    // Core data
    data,
    pendingOrders: data?.pendingOrders || [],
    completedOrders: data?.completedOrders || [],
    loading,
    error,
    lastFetch,

    // Actions
    refresh,

    // Utility functions
    isStale,
    getPendingCount,
    getCompletedCount,
    getMostRecentPending,
    getMostRecentCompleted,

    // Stats
    stats: data?.stats || { pending: 0, executed: 0, cancelled: 0, total: 0 },
    
    // Helper getters
    hasTransactions: (data?.pendingOrders.length || 0) + (data?.completedOrders.length || 0) > 0,
    hasPending: (data?.pendingOrders.length || 0) > 0,
    hasCompleted: (data?.completedOrders.length || 0) > 0
  };
}