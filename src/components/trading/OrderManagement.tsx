'use client';

import { useState, useEffect, useCallback } from 'react';
import { OrderManagementProps, UnifiedOrder } from '@/types';
import { useToast } from '@/hooks/useToast';
import { CircleNotchIcon, Icon, TrayIcon } from '@/components/ui';

interface OrdersResponse {
  success: boolean;
  orders: UnifiedOrder[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  summary: {
    totalPending: number;
    totalExecuted: number;
    totalCancelled: number;
    marketOrders: number;
    limitOrders: number;
  };
  educationalInfo: {
    title: string;
    sections: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
  };
}

export function OrderManagement({ 
  userId, 
  showEducationalContent = true, 
  maxHeight = "600px",
  onOrderUpdate 
}: OrderManagementProps) {
  const { error: showError, success: showSuccess } = useToast();
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    assetId: ''
  });
  const [summary, setSummary] = useState({
    totalPending: 0,
    totalExecuted: 0,
    totalCancelled: 0,
    marketOrders: 0,
    limitOrders: 0
  });
  const [educationalInfo, setEducationalInfo] = useState<any>(null);
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(new Set());

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format shares
  const formatShares = (shares: number) => {
    return shares.toFixed(6).replace(/\.?0+$/, '');
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Load orders
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.type !== 'all') params.set('type', filters.type);
      if (filters.assetId) params.set('assetId', filters.assetId);
      params.set('limit', '50');

      const response = await fetch(`/api/trade/orders?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load orders: ${response.statusText}`);
      }

      const data: OrdersResponse = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setSummary(data.summary);
        setEducationalInfo(data.educationalInfo);
      } else {
        throw new Error('Failed to load orders');
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Cancel order
  const cancelOrder = async (orderId: string, orderType: 'market' | 'limit') => {
    setCancellingOrders(prev => new Set(prev).add(orderId));

    try {
      // Only limit orders can be cancelled
      if (orderType !== 'limit') {
        showError('Only pending limit orders can be cancelled');
        return;
      }

      const response = await fetch(`/api/trade/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel order: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        showSuccess('Order cancelled successfully');
        
        // Update the order in the list
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, status: 'CANCELLED' as const }
            : order
        ));

        // Update summary
        setSummary(prev => ({
          ...prev,
          totalPending: prev.totalPending - 1,
          totalCancelled: prev.totalCancelled + 1
        }));

        onOrderUpdate?.(orders.find(o => o.id === orderId)!);
      } else {
        throw new Error(result.error || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      showError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancellingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Load orders when component mounts or filters change
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'EXECUTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Executed</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getOrderTypeIcon = (type: string, orderType: string) => {
    if (type === 'market') {
      return orderType === 'BUY' ? '⚡🟢' : '⚡🔴';
    } else {
      return orderType === 'BUY' ? '🎯🟢' : '🎯🔴';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <Icon icon={CircleNotchIcon} size="xl" className="animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p className="mb-4">{error}</p>
          <button 
            onClick={loadOrders}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Your Orders</h3>
          <button
            onClick={loadOrders}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Refresh
          </button>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">{summary.totalPending}</div>
            <div className="text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{summary.totalExecuted}</div>
            <div className="text-gray-500">Executed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{summary.totalCancelled}</div>
            <div className="text-gray-500">Cancelled</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{summary.marketOrders}</div>
            <div className="text-gray-500">Market</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">{summary.limitOrders}</div>
            <div className="text-gray-500">Limit</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="mt-1 block text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="executed">Executed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="mt-1 block text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="BUY">Buy Orders</option>
              <option value="SELL">Sell Orders</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="overflow-hidden" style={{ maxHeight }}>
        {orders.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <Icon icon={TrayIcon} size="xl" className="mx-auto text-gray-400" />
            <h4 className="mt-2 text-lg font-medium text-gray-900">No orders found</h4>
            <p className="mt-1 text-sm text-gray-500">
              {filters.status !== 'all' || filters.type !== 'all' 
                ? 'No orders match your current filters. Try adjusting your search criteria.'
                : 'You haven\'t placed any orders yet. Start trading to see your order history here.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight }}>
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">
                          {getOrderTypeIcon(order.type, order.orderType)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {order.orderType} {order.asset.ticker}
                            </span>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {formatShares(order.quantity)} shares 
                            {order.type === 'limit' && order.limitPrice && (
                              <span> at {formatCurrency(order.limitPrice)} limit</span>
                            )}
                            {order.executedPrice && (
                              <span> • Executed at {formatCurrency(order.executedPrice)}</span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            Created: {formatDate(order.createdAt)}
                            {order.executedAt && (
                              <span> • Executed: {formatDate(order.executedAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Educational Note */}
                      {order.educationalNote && (
                        <div className="mt-2 text-xs text-blue-600 bg-blue-50 rounded p-2">
                          {order.educationalNote}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                      {order.status === 'PENDING' && order.type === 'limit' && (
                        <button
                          onClick={() => cancelOrder(order.id, order.type)}
                          disabled={cancellingOrders.has(order.id)}
                          className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {cancellingOrders.has(order.id) ? (
                            <div className="flex items-center">
                              <Icon icon={CircleNotchIcon} size="xs" className="animate-spin -ml-1 mr-1" />
                              Cancelling...
                            </div>
                          ) : (
                            'Cancel'
                          )}
                        </button>
                      )}
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {order.price ? formatCurrency(order.quantity * order.price) : 
                           order.limitPrice ? formatCurrency(order.quantity * order.limitPrice) : 
                           'Market Price'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.type === 'market' ? 'Market Order' : 'Limit Order'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Educational Content */}
      {showEducationalContent && educationalInfo && (
        <div className="px-6 py-4 bg-blue-50 border-t border-gray-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2">{educationalInfo.title}</h4>
          <div className="grid gap-2">
            {educationalInfo.sections.map((section: any, index: number) => (
              <div key={index} className="flex items-start space-x-2 text-xs text-blue-700">
                <span className="flex-shrink-0">{section.icon}</span>
                <div>
                  <span className="font-medium">{section.title}:</span>
                  <span className="ml-1">{section.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 