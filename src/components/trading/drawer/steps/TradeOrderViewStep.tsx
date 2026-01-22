'use client';

import { Button } from '@/components/ui/button';
import { Formatters } from '@/lib/financial';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import type { ExecutedTradeOrder } from '@/types';
import Link from 'next/link';

interface TradeOrderViewStepProps {
  orderType: 'BUY' | 'SELL';
  executedOrder: ExecutedTradeOrder;
  onBack: () => void;
  onClose: () => void;
}

/**
 * Step 5: Order View
 * 
 * Comprehensive order details for record-keeping:
 * - Asset information
 * - Order status
 * - Entry details (dollars/shares)
 * - Execution details
 * - Link to asset page
 */
export function TradeOrderViewStep({
  orderType,
  executedOrder,
  onBack,
  onClose,
}: TradeOrderViewStepProps) {
  const isBuy = orderType === 'BUY';
  const statusColor =
    executedOrder.status === 'EXECUTED'
      ? 'text-green-600 dark:text-green-400'
      : executedOrder.status === 'PENDING'
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-red-600 dark:text-red-400';

  const statusLabel =
    executedOrder.status === 'EXECUTED'
      ? 'Filled'
      : executedOrder.status === 'PENDING'
      ? 'Pending'
      : 'Failed';

  return (
    <div className="space-y-6 py-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Asset Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-foreground">
            {executedOrder.asset.name}
          </h3>
          <Link
            href={`/asset/${executedOrder.asset.ticker}`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
            onClick={onClose}
          >
            View {executedOrder.asset.ticker}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Order Details */}
      <div className="space-y-4">
        {/* Order Status */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Order Status</span>
            <span className={`text-sm font-semibold ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Entry Details */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Entry Details</h4>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Entered in</span>
            <span className="text-sm font-medium text-foreground">Dollars</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Time in force</span>
            <span className="text-sm font-medium text-foreground">
              {executedOrder.timeInForce === 'DAY' ? 'Good for day' : 'Good till canceled'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Submitted</span>
            <span className="text-sm font-mono text-foreground">
              {new Date(executedOrder.executedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Entered amount</span>
            <span className="text-sm font-mono font-medium text-foreground">
              {Formatters.currency(executedOrder.filledNotional)}
            </span>
          </div>
        </div>

        {/* Filled Details */}
        {executedOrder.status === 'EXECUTED' && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Filled Details</h4>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Filled</span>
              <span className="text-sm font-mono text-foreground">
                {new Date(executedOrder.executedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                at{' '}
                {new Date(executedOrder.executedAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Filled quantity</span>
              <span className="text-sm font-mono font-medium text-foreground">
                {Formatters.shares(executedOrder.filledShares)} shares at{' '}
                {Formatters.currency(executedOrder.filledPrice)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Filled notional</span>
              <span className="text-sm font-mono font-bold text-foreground">
                {Formatters.currency(executedOrder.filledNotional)}
              </span>
            </div>
          </div>
        )}

        {/* Order ID (for reference) */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Order ID</span>
            <span className="text-xs font-mono text-foreground">
              {executedOrder.orderId}
            </span>
          </div>
          {executedOrder.transactionId && (
            <div className="flex justify-between mt-2">
              <span className="text-sm text-muted-foreground">Transaction ID</span>
              <span className="text-xs font-mono text-foreground">
                {executedOrder.transactionId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Close Button */}
      <Button
        variant="outline"
        className="w-full"
        size="lg"
        onClick={onClose}
      >
        Close
      </Button>
    </div>
  );
}
