'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useTradeDrawer } from '@/hooks/useTradeDrawer';
import { useTradeExecution } from '@/hooks/useTradeExecution';
import { useToast } from '@/hooks/useToast';
import { TradeDrawerHeader } from './components/TradeDrawerHeader';
import { TradeEntryStep } from './steps/TradeEntryStep';
import { TradeConfirmStep } from './steps/TradeConfirmStep';
import { TradeExecuteStep } from './steps/TradeExecuteStep';
import { TradeCompleteStep } from './steps/TradeCompleteStep';
import { TradeOrderViewStep } from './steps/TradeOrderViewStep';
import type { TradeOrderData } from '@/types';

interface TradeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    id: number;
    ticker: string;
    name: string;
    allowFractionalShares: boolean;
  };
  currentPrice: number;
  currency?: string;
  orderType: 'BUY' | 'SELL';
  userCashBalance?: number;
  userHoldings?: {
    totalQuantity: number;
    avgCostBasis: number;
  };
}

/**
 * Main Trade Drawer Component
 * 
 * Orchestrates the 5-step trade flow:
 * 1. Entry (amount input)
 * 2. Confirmation (review order)
 * 3. Execution (animated processing)
 * 4. Complete (success message)
 * 5. Order View (detailed record)
 * 
 * Uses shadcn Sheet component for drawer UI
 */
export function TradeDrawer({
  isOpen,
  onClose,
  asset,
  currentPrice,
  currency = 'USD',
  orderType,
  userCashBalance,
  userHoldings,
}: TradeDrawerProps) {
  const {
    step,
    orderData,
    executedOrder,
    nextStep,
    previousStep,
    reset,
    updateOrderData,
    setExecutedOrder,
  } = useTradeDrawer();

  const { executeOrder, isExecuting, error } = useTradeExecution();
  const { error: showError } = useToast();

  // Market state
  const [marketState, setMarketState] = useState<string | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(true);
  const [marketStateLoading, setMarketStateLoading] = useState(false);

  // Fetch market state when drawer opens
  useEffect(() => {
    async function fetchMarketState() {
      if (!isOpen) return;
      
      try {
        setMarketStateLoading(true);
        const response = await fetch('/api/market-state');
        const data = await response.json();
        
        if (data.success) {
          setMarketState(data.marketState);
          setIsMarketOpen(data.isOpen);
        } else {
          // Default to market open if fetch fails
          setIsMarketOpen(true);
        }
      } catch (error) {
        console.error('Failed to fetch market state:', error);
        // Assume market is open if we can't fetch state
        setIsMarketOpen(true);
      } finally {
        setMarketStateLoading(false);
      }
    }

    fetchMarketState();
  }, [isOpen]);

  // Reset state when drawer is opened
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Show error toast if execution fails
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  // Handle close with reset
  const handleClose = () => {
    reset();
    onClose();
  };

  // Step 1: Handle entry data submission
  const handleEntryNext = (data: Partial<TradeOrderData>) => {
    updateOrderData({
      ...data,
      tradeType: orderType,
    } as TradeOrderData);
    nextStep();
  };

  // Step 2: Handle order submission
  const handleSubmitOrder = async () => {
    // Move to execution step
    nextStep();

    // Execute the order
    const result = await executeOrder(orderData as TradeOrderData, asset);

    if (result) {
      // Success - set executed order and move to complete step
      setExecutedOrder(result);
      nextStep();
    } else {
      // Error - go back to confirm step
      previousStep();
      previousStep();
    }
  };

  // Step 3: Execution complete (automatic)
  const handleExecutionComplete = () => {
    // This is called from TradeExecuteStep after minimum display time
    // Step is already advanced by the execution logic
  };

  // Step 4: Handle done (close drawer)
  const handleDone = () => {
    handleClose();
  };

  // Step 4: Handle view order
  const handleViewOrder = () => {
    nextStep();
  };

  // Step 5: Handle back from order view
  const handleOrderViewBack = () => {
    previousStep();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="h-[90vh] sm:h-[85vh] w-full rounded-t-2xl"
      >
        {/* Header (only show for steps 1, 2, 5) */}
        {step !== 3 && step !== 4 && (
          <SheetHeader className="pb-4">
            <SheetTitle className="sr-only">
              {orderType === 'BUY' ? 'Buy' : 'Sell'} {asset.ticker}
            </SheetTitle>
            <TradeDrawerHeader
              assetName={asset.name}
              ticker={asset.ticker}
              currentPrice={currentPrice}
              currency={currency}
            />
          </SheetHeader>
        )}

        {/* Step Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] sm:max-h-[calc(85vh-100px)] max-w-2xl mx-auto px-4 sm:px-6">
          {step === 1 && (
            <TradeEntryStep
              orderType={orderType}
              currentPrice={currentPrice}
              userCashBalance={userCashBalance}
              userHoldings={userHoldings}
              allowFractionalShares={asset.allowFractionalShares}
              marketState={marketState}
              isMarketOpen={isMarketOpen}
              onNext={handleEntryNext}
            />
          )}

          {step === 2 && (
            <TradeConfirmStep
              orderType={orderType}
              orderData={orderData}
              currentPrice={currentPrice}
              assetName={asset.name}
              onBack={previousStep}
              onSubmit={handleSubmitOrder}
              isSubmitting={isExecuting}
            />
          )}

          {step === 3 && (
            <TradeExecuteStep
              orderType={orderType}
              onComplete={handleExecutionComplete}
            />
          )}

          {step === 4 && executedOrder && (
            <TradeCompleteStep
              orderType={orderType}
              executedOrder={executedOrder}
              onDone={handleDone}
              onViewOrder={handleViewOrder}
            />
          )}

          {step === 5 && executedOrder && (
            <TradeOrderViewStep
              orderType={orderType}
              executedOrder={executedOrder}
              onBack={handleOrderViewBack}
              onClose={handleClose}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
