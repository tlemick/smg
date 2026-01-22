'use client';

import { useState } from 'react';
import { TransactionItemProps } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { CompanyLogo, Icon, XCircleIcon, StrategyIcon } from '@/components/ui';
import { useCancelOrder } from '@/hooks/useCancelOrder';
import { useToast } from '@/hooks/useToast';
import { CancelOrderDialog } from './CancelOrderDialog';

export function TransactionItem({ 
  order, 
  showTimestamp = true, 
  compact = false,
  onOrderClick,
  onCancelSuccess
}: TransactionItemProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { cancelOrder, isLoading: isCancelling } = useCancelOrder();
  const { success, error: showError } = useToast();
  
  const handleClick = () => {
    if (onOrderClick) {
      onOrderClick(order.id);
    }
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await cancelOrder(order.id);
      success('Order cancelled successfully');
      setShowCancelDialog(false);
      if (onCancelSuccess) {
        onCancelSuccess();
      }
    } catch (err) {
      showError('Failed to cancel order');
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
        relative flex items-center justify-between py-4
        transition-colors duration-200 border-b border-border
        ${onOrderClick ? 'cursor-pointer hover:bg-accent' : ''}
      `}
      onClick={handleClick}
    >
      {/* Left side: Logo and Order Info */}
      <div className="flex items-center gap-4">
        {/* Company Logo */}
        <CompanyLogo 
          ticker={order.asset.ticker}
          companyName={order.asset.name}
          logoUrl={order.asset.logoUrl}
          size="sm"
        />

        {/* Order Details */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground text-sm">
              {order.orderType} {formatQuantity(order.quantity)} {order.asset.ticker}
            </span>
            <span className="text-xs text-muted-foreground">
              @ ${getDisplayPrice().toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {order.status === 'EXECUTED' && order.executedAt 
              ? formatDate(order.executedAt)
              : order.status === 'PENDING' && order.expireAt
              ? `Good until ${new Date(order.expireAt).toLocaleDateString()}`
              : order.status === 'PENDING'
              ? 'Good until cancelled'
              : formatDate(order.createdAt)
            }
          </div>
        </div>
      </div>

      {/* Right side: Total Value, Status, and Action Button */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-1">
          <span className="font-medium text-foreground text-sm">
            ${(getDisplayPrice() * order.quantity).toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {order.status.toLowerCase()}
          </span>
        </div>
        
        {/* Action button (cancel or strategy icon) */}
        {order.status === 'PENDING' ? (
          <button
            onClick={handleCancelClick}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            disabled={isCancelling}
            title="Cancel order"
          >
            <Icon icon={XCircleIcon} size="sm" />
          </button>
        ) : (
          <div className="text-muted-foreground opacity-50 p-1" title="Order details">
            <Icon icon={StrategyIcon} size="sm" />
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <CancelOrderDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        order={order}
        isLoading={isCancelling}
      />
    </div>
  );
}