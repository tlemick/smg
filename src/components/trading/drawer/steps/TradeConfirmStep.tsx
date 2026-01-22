'use client';

import { Button } from '@/components/ui/button';
import { Formatters } from '@/lib/financial';
import { ChevronLeft } from 'lucide-react';
import type { TradeOrderData } from '@/types';

interface TradeConfirmStepProps {
  orderType: 'BUY' | 'SELL';
  orderData: Partial<TradeOrderData>;
  currentPrice: number;
  assetName: string;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

/**
 * Step 2: Confirmation
 * 
 * Displays:
 * - Order summary
 * - Estimated shares and cost
 * - Limit price (if applicable)
 * - Back and Submit buttons
 */
export function TradeConfirmStep({
  orderType,
  orderData,
  currentPrice,
  assetName,
  onBack,
  onSubmit,
  isSubmitting,
}: TradeConfirmStepProps) {
  const isBuy = orderType === 'BUY';
  const isLimit = orderData.orderType === 'LIMIT';

  return (
    <div className="space-y-6 py-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        disabled={isSubmitting}
        className="gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Order Summary Heading */}
      <div>
        <h3 className="text-xl font-semibold text-foreground">Order summary</h3>
        <p className="text-sm text-muted-foreground mt-1">{assetName}</p>
      </div>

      {/* Summary Details */}
      <div className="space-y-4 bg-muted/50 rounded-lg p-4">
        {/* Order Type */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Order Type</span>
          <span className="text-sm font-medium text-foreground">
            {orderData.orderType === 'MARKET' ? 'Market Order' : 'Limit Order'}
          </span>
        </div>

        {/* Current Market Price */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Current Market Price</span>
          <span className="text-sm font-mono font-medium text-foreground">
            {Formatters.currency(currentPrice)}
          </span>
        </div>

        {/* Limit Price (if applicable) */}
        {isLimit && orderData.limitPrice && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Limit Price</span>
            <span className="text-sm font-mono font-medium text-foreground">
              {Formatters.currency(orderData.limitPrice)}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Estimated Shares */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">
            {isBuy ? 'Shares to Buy' : 'Shares to Sell'}
          </span>
          <span className="text-base font-mono font-bold text-foreground">
            {Formatters.shares(orderData.estimatedShares || 0)}
          </span>
        </div>

        {/* Estimated Cost/Proceeds */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">
            {isBuy ? 'Estimated Cost' : 'Estimated Proceeds'}
          </span>
          <span className="text-base font-mono font-bold text-foreground">
            {Formatters.currency(orderData.estimatedCost || 0)}
          </span>
        </div>

        {/* Time in Force (for limit orders) */}
        {isLimit && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Time in Force</span>
            <span className="text-sm font-medium text-foreground">Good for day</span>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <p className="text-xs text-foreground/80">
          {isLimit
            ? `Your ${isBuy ? 'buy' : 'sell'} order will be executed when the price ${
                isBuy ? 'reaches or goes below' : 'reaches or goes above'
              } your limit price of ${Formatters.currency(orderData.limitPrice || 0)}.`
            : `Your ${isBuy ? 'buy' : 'sell'} order will be executed immediately at the current market price.`}
        </p>
      </div>

      {/* Submit Button */}
      <Button
        className={`w-full ${
          isBuy ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
        }`}
        size="lg"
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Order'}
      </Button>
    </div>
  );
}
