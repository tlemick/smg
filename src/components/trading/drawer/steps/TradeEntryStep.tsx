'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberPad } from '../components/NumberPad';
import { OrderTypeToggle } from '../components/OrderTypeToggle';
import { Formatters } from '@/lib/financial';
import { FinancialMath } from '@/lib/financial';

interface TradeEntryStepProps {
  orderType: 'BUY' | 'SELL';
  currentPrice: number;
  userCashBalance?: number;
  userHoldings?: {
    totalQuantity: number;
    avgCostBasis: number;
  };
  allowFractionalShares: boolean;
  marketState?: string | null;
  isMarketOpen?: boolean;
  onNext: (data: {
    orderType: 'MARKET' | 'LIMIT';
    quantityType: 'DOLLARS' | 'SHARES';
    amount: number;
    limitPrice?: number;
    estimatedShares: number;
    estimatedCost: number;
  }) => void;
}

/**
 * Step 1: Trade Entry
 * 
 * Features:
 * - Amount entry with number pad
 * - Toggle between dollars and shares
 * - Market/Limit order type selection
 * - Real-time validation
 * - Quick sell buttons (25%, 50%, 100%)
 */
export function TradeEntryStep({
  orderType,
  currentPrice,
  userCashBalance,
  userHoldings,
  allowFractionalShares,
  marketState,
  isMarketOpen = true,
  onNext,
}: TradeEntryStepProps) {
  const [inputValue, setInputValue] = useState('');
  const [quantityType, setQuantityType] = useState<'DOLLARS' | 'SHARES'>('DOLLARS');
  const [tradeOrderType, setTradeOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState('');

  const isBuy = orderType === 'BUY';
  const isSell = orderType === 'SELL';

  // Market order availability
  const canPlaceMarketOrder = isMarketOpen;
  const marketClosedWarning = !isMarketOpen
    ? 'Market is closed. Market orders are not available. Use limit orders or wait for market to open.'
    : null;

  // Auto-switch to limit order if market is closed and user has market order selected
  useEffect(() => {
    if (!isMarketOpen && tradeOrderType === 'MARKET') {
      setTradeOrderType('LIMIT');
      setLimitPrice(currentPrice.toString());
    }
  }, [isMarketOpen, tradeOrderType, currentPrice]);

  // Calculate estimated values
  const { estimatedShares, estimatedCost, validationError } = useMemo(() => {
    const amount = parseFloat(inputValue);
    const price = tradeOrderType === 'LIMIT' && limitPrice
      ? parseFloat(limitPrice)
      : currentPrice;

    if (!inputValue || isNaN(amount) || amount <= 0) {
      return {
        estimatedShares: 0,
        estimatedCost: 0,
        validationError: null,
      };
    }

    let shares = 0;
    let cost = 0;
    let error: string | null = null;

    if (quantityType === 'DOLLARS') {
      cost = amount;
      shares = FinancialMath.divide(amount, price).toNumber();
    } else {
      shares = amount;
      cost = FinancialMath.multiply(amount, price).toNumber();
    }

    // Validation
    if (amount < 1) {
      error = `Minimum ${quantityType === 'DOLLARS' ? 'amount' : 'shares'} is 1`;
    } else if (!allowFractionalShares && quantityType === 'SHARES' && amount % 1 !== 0) {
      error = 'This asset does not support fractional shares';
    } else if (isBuy && userCashBalance !== undefined && cost > userCashBalance) {
      error = `Insufficient funds. Available: ${Formatters.currency(userCashBalance)}`;
    } else if (isSell && userHoldings && shares > userHoldings.totalQuantity) {
      error = `Insufficient shares. You own ${Formatters.shares(userHoldings.totalQuantity)}`;
    }

    return {
      estimatedShares: shares,
      estimatedCost: cost,
      validationError: error,
    };
  }, [
    inputValue,
    limitPrice,
    quantityType,
    tradeOrderType,
    currentPrice,
    userCashBalance,
    userHoldings,
    allowFractionalShares,
    isBuy,
    isSell,
  ]);

  // Quick sell actions
  const handleQuickSell = (percentage: number) => {
    if (!userHoldings) return;
    const shares = userHoldings.totalQuantity * (percentage / 100);
    setQuantityType('SHARES');
    setInputValue(shares.toString());
  };

  const handleNext = () => {
    if (validationError) return;

    const amount = parseFloat(inputValue);
    if (isNaN(amount) || amount <= 0) return;

    onNext({
      orderType: tradeOrderType,
      quantityType,
      amount,
      limitPrice: tradeOrderType === 'LIMIT' && limitPrice
        ? parseFloat(limitPrice)
        : undefined,
      estimatedShares,
      estimatedCost,
    });
  };

  const isValid = !validationError && parseFloat(inputValue) > 0;

  return (
    <div className="space-y-6 py-4">
      {/* Order Type Toggle */}
      <OrderTypeToggle
        orderType={tradeOrderType}
        onChange={(type) => {
          if (type === 'MARKET' && !canPlaceMarketOrder) {
            // Don't allow switching to market order when market is closed
            return;
          }
          setTradeOrderType(type);
        }}
        marketOrderDisabled={!canPlaceMarketOrder}
        marketOrderWarning={marketClosedWarning}
      />

      {/* Market State Warning */}
      {!isMarketOpen && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          <p className="text-sm text-foreground">
            <strong>Market Closed:</strong> {marketClosedWarning}
          </p>
        </div>
      )}

      {/* Holdings Display (for SELL) */}
      {isSell && userHoldings && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="text-sm text-muted-foreground">You own</div>
          <div className="text-2xl font-mono font-bold">
            {Formatters.shares(userHoldings.totalQuantity)} shares
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSell(25)}
            >
              Sell 25%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSell(50)}
            >
              Sell 50%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSell(100)}
            >
              Sell All
            </Button>
          </div>
        </div>
      )}

      {/* Amount Display */}
      <div className="text-center">
        <div className="text-5xl font-mono font-bold text-foreground min-h-[60px] flex items-center justify-center">
          {quantityType === 'DOLLARS' ? '$' : ''}
          {inputValue || '0'}
          {quantityType === 'SHARES' ? ' shares' : ''}
        </div>
        {estimatedShares > 0 && (
          <div className="text-sm text-muted-foreground mt-2">
            {quantityType === 'DOLLARS'
              ? `≈ ${Formatters.shares(estimatedShares)} shares`
              : `≈ ${Formatters.currency(estimatedCost)}`}
          </div>
        )}
      </div>

      {/* Quantity Type Toggle */}
      <div className="flex bg-muted rounded-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          className={`flex-1 ${
            quantityType === 'DOLLARS'
              ? 'bg-background shadow-sm'
              : 'hover:bg-background/50'
          }`}
          onClick={() => setQuantityType('DOLLARS')}
        >
          Dollars
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`flex-1 ${
            quantityType === 'SHARES'
              ? 'bg-background shadow-sm'
              : 'hover:bg-background/50'
          }`}
          onClick={() => setQuantityType('SHARES')}
        >
          Shares
        </Button>
      </div>

      {/* Number Pad */}
      <NumberPad
        value={inputValue}
        onChange={setInputValue}
        maxValue={
          isBuy && quantityType === 'DOLLARS' ? userCashBalance : undefined
        }
      />

      {/* Limit Price Input (if LIMIT order) */}
      {tradeOrderType === 'LIMIT' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Limit Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder={`Current: ${Formatters.currency(currentPrice)}`}
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="pl-6"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Order will execute when price {isBuy ? 'reaches or goes below' : 'reaches or goes above'} this limit
          </p>
        </div>
      )}

      {/* Available Funds/Holdings */}
      <div className="text-center text-sm text-muted-foreground">
        {isBuy && userCashBalance !== undefined && (
          <>{Formatters.currency(userCashBalance)} available to buy</>
        )}
        {isSell && userHoldings && (
          <>{Formatters.shares(userHoldings.totalQuantity)} shares available to sell</>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm text-destructive">{validationError}</p>
        </div>
      )}

      {/* Review Button */}
      <Button
        className={`w-full ${
          isBuy ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
        }`}
        size="lg"
        onClick={handleNext}
        disabled={!isValid}
      >
        Review {isBuy ? 'Buy' : 'Sell'} Order
      </Button>
    </div>
  );
}
