'use client';

import { UnifiedOrder } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Icon,
  WarningCircleIcon,
} from '@/components/ui';

interface CancelOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: UnifiedOrder;
  isLoading?: boolean;
}

export function CancelOrderDialog({
  isOpen,
  onClose,
  onConfirm,
  order,
  isLoading = false
}: CancelOrderDialogProps) {
  const formatQuantity = (quantity: number) => {
    return quantity >= 1 ? quantity.toLocaleString() : quantity.toFixed(4);
  };

  const getDisplayPrice = () => {
    if (order.limitPrice) {
      return order.limitPrice;
    } else if (order.price) {
      return order.price;
    }
    return 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon={WarningCircleIcon} size="md" className="text-destructive" />
            Cancel This Order?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The order will be permanently cancelled.
          </DialogDescription>
        </DialogHeader>

        {/* Order Details */}
        <div className="py-4 space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Order Type:</span>
              <span className="text-sm font-medium">
                {order.orderType} {formatQuantity(order.quantity)} shares
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Asset:</span>
              <span className="text-sm font-medium">
                {order.asset.ticker} - {order.asset.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Limit Price:</span>
              <span className="text-sm font-medium">
                ${getDisplayPrice().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Value:</span>
              <span className="text-sm font-medium">
                ${(getDisplayPrice() * order.quantity).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Educational Note */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs text-amber-900 dark:text-amber-200">
              <strong>What happens when you cancel:</strong>
            </p>
            <ul className="text-xs text-amber-800 dark:text-amber-300 mt-1 space-y-1 list-disc list-inside">
              <li>Your order will no longer execute even if the stock reaches your target price</li>
              <li>You can place a new order anytime with different terms</li>
              <li>Limit orders can be cancelled anytime before execution</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
