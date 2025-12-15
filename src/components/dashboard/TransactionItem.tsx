'use client';

import { TransactionItemProps } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { CompanyLogo } from '@/components/ui';

// Simplified status indicator with Lucide icons


export function TransactionItem({ 
  order, 
  showTimestamp = true, 
  compact = false,
  onOrderClick
}: TransactionItemProps) {
  
  const handleClick = () => {
    if (onOrderClick) {
      onOrderClick(order.id);
    }
  };

  const formatDate = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getDisplayPrice = () => {
    if (order.status === 'EXECUTED' && order.executedPrice) {
      return order.executedPrice;
    } else if (order.limitPrice) {
      return order.limitPrice;
    } else if (order.price) {
      return order.price;
    }
    return 0;
  };

  const getPriceLabel = () => {
    if (order.status === 'EXECUTED' && order.executedPrice) {
      return 'Executed at';
    } else if (order.type === 'limit') {
      return 'Limit price';
    } else {
      return 'Estimated';
    }
  };

  const formatQuantity = (quantity: number) => {
    // Show whole numbers for quantities >= 1, decimals for fractional shares
    return quantity >= 1 ? quantity.toLocaleString() : quantity.toFixed(4);
  };

  return (
    <div
      className={`
        relative flex items-center justify-between py-3 
        transition-all duration-200 bg-white dark:bg-gray-800
        ${onOrderClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
      `}
      onClick={handleClick}
    >
      {/* Left side: Logo, Status, and Order Info */}
      <div className="flex items-center space-x-3">
        {/* Company Logo */}
        <CompanyLogo 
          ticker={order.asset.ticker}
          companyName={order.asset.name}
          logoUrl={order.asset.logoUrl}
          size="sm"
        />

        {/* Status Indicator */}

        {/* Order Details */}
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              {order.orderType} {formatQuantity(order.quantity)} {order.asset.ticker}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              @ ${getDisplayPrice().toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {order.status === 'EXECUTED' && order.executedAt 
              ? formatDate(order.executedAt)
              : order.status === 'PENDING' 
              ? 'Good until 8/14/2025'
              : formatDate(order.createdAt)
            }
          </div>
        </div>
      </div>

      {/* Right side: Total Value and Status */}
      <div className="flex flex-col items-end">
        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
          ${(getDisplayPrice() * order.quantity).toFixed(2)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {order.status.toLowerCase()}
        </span>
      </div>
    </div>
  );
}