'use client';

import { Button } from '@/components/ui/button';
import { Formatters } from '@/lib/financial';
import { CheckCircle2 } from 'lucide-react';
import type { ExecutedTradeOrder } from '@/types';

interface TradeCompleteStepProps {
  orderType: 'BUY' | 'SELL';
  executedOrder: ExecutedTradeOrder;
  onDone: () => void;
  onViewOrder: () => void;
}

/**
 * Step 4: Complete
 * 
 * Features:
 * - Success message
 * - Order summary (shares, price, total)
 * - Two actions: Done or View Order
 * - Celebration animation
 */
export function TradeCompleteStep({
  orderType,
  executedOrder,
  onDone,
  onViewOrder,
}: TradeCompleteStepProps) {
  const isBuy = orderType === 'BUY';
  const isPending = executedOrder.status === 'PENDING';

  return (
    <div className="space-y-6 py-4">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div
          className={`rounded-full p-4 ${
            isPending
              ? 'bg-blue-100 dark:bg-blue-900/30'
              : isBuy
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
          }`}
        >
          <CheckCircle2
            className={`h-12 w-12 ${
              isPending
                ? 'text-blue-600 dark:text-blue-400'
                : isBuy
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          />
        </div>
      </div>

      {/* Success Message */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground">
          {isPending ? 'Limit order placed!' : 'Order complete!'}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          {isPending
            ? `Your limit order will execute when ${executedOrder.asset.ticker} reaches your target price`
            : `Your ${isBuy ? 'purchase' : 'sale'} has been executed successfully`}
        </p>
      </div>

      {/* Order Details */}
      <div className="space-y-3 bg-muted/50 rounded-lg p-4">
        {isPending && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              This order will be processed automatically when the market price meets your limit. Check the 
              &quot;Pending&quot; section of your dashboard to track its status.
            </p>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">
            {isPending ? 'Order value' : isBuy ? 'Amount invested' : 'Proceeds'}
          </span>
          <span className="text-base font-mono font-bold text-foreground">
            {Formatters.currency(executedOrder.filledNotional)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">
            Share(s) {isPending ? 'to' : ''} {isBuy ? 'purchase' : 'sell'}
          </span>
          <span className="text-base font-mono font-bold text-foreground">
            {Formatters.shares(executedOrder.filledShares)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">
            {isPending ? 'Limit price' : 'Price per share'}
          </span>
          <span className="text-base font-mono font-bold text-foreground">
            {Formatters.currency(executedOrder.filledPrice)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          className="w-full"
          size="lg"
          onClick={onDone}
        >
          Done
        </Button>
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={onViewOrder}
        >
          View order details
        </Button>
      </div>
    </div>
  );
}
