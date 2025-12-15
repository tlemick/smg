'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BuyOrderModalProps, 
  OrderFormData, 
  OrderValidation, 
  MarketOrderApiRequest, 
  LimitOrderApiRequest, 
  OrderApiResponse 
} from '@/types';
import { TradingGuidance } from './TradingGuidance';
import { useToast } from '@/hooks/useToast';
import { CircleNotchIcon, Icon, XIcon } from '@/components/ui';
import { createModalClasses, createModalHandlers } from '@/lib/positioning';

export function BuyOrderModal({
  isOpen,
  onClose,
  asset,
  currentPrice,
  currency,
  marketState,
  userCashBalance,
  maxPurchasePower,
  onSuccess,
  onError
}: BuyOrderModalProps) {
  const { error: showError, success: showSuccess } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>({
    orderType: 'MARKET',
    tradeType: 'BUY',
    quantityType: 'DOLLARS',
    shares: undefined,
    dollarAmount: undefined,
    limitPrice: undefined,
    notes: ''
  });
  const [validation, setValidation] = useState<OrderValidation>({
    isValid: false,
    errors: {},
    warnings: {}
  });
  const [showGuidance, setShowGuidance] = useState(true);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [estimatedShares, setEstimatedShares] = useState<number>(0);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, [currency]);

  // Format shares
  const formatShares = useCallback((shares: number) => {
    return asset.allowFractionalShares 
      ? shares.toFixed(6).replace(/\.?0+$/, '')
      : Math.floor(shares).toString();
  }, [asset.allowFractionalShares]);

  // Calculate estimated values
  useEffect(() => {
    console.log('Calculation triggered:', { formData, currentPrice, estimatedShares, estimatedCost });
    
    if (formData.quantityType === 'SHARES' && formData.shares && formData.shares > 0) {
      const price = formData.orderType === 'LIMIT' ? (formData.limitPrice || currentPrice) : currentPrice;
      const newCost = formData.shares * price;
      console.log('SHARES calculation:', { shares: formData.shares, price, newCost });
      setEstimatedCost(newCost);
      setEstimatedShares(formData.shares);
    } else if (formData.quantityType === 'DOLLARS' && formData.dollarAmount && formData.dollarAmount > 0) {
      const price = formData.orderType === 'LIMIT' ? (formData.limitPrice || currentPrice) : currentPrice;
      const shares = formData.dollarAmount / price;
      console.log('DOLLARS calculation:', { dollarAmount: formData.dollarAmount, price, shares });
      setEstimatedShares(shares);
      setEstimatedCost(formData.dollarAmount);
    } else {
      console.log('Resetting calculations');
      setEstimatedCost(0);
      setEstimatedShares(0);
    }
  }, [formData, currentPrice]);

  // Market state validation
  const isMarketClosed = marketState && marketState !== 'REGULAR';
  const shouldBlockMarketOrder = isMarketClosed && formData.orderType === 'MARKET';

  // Validate form
  const validateForm = useCallback((): OrderValidation => {
    const errors: OrderValidation['errors'] = {};
    const warnings: OrderValidation['warnings'] = {};

    // Validate quantity
    if (formData.quantityType === 'SHARES') {
      if (!formData.shares || formData.shares <= 0) {
        errors.shares = 'Please enter a valid number of shares';
      } else if (!asset.allowFractionalShares && formData.shares % 1 !== 0) {
        errors.shares = 'This asset does not support fractional shares';
      } else if (formData.shares < 0.000001) {
        errors.shares = 'Minimum purchase is 0.000001 shares';
      }
    } else {
      if (!formData.dollarAmount || formData.dollarAmount <= 0) {
        errors.dollarAmount = 'Please enter a valid dollar amount';
      } else if (formData.dollarAmount < 1) {
        errors.dollarAmount = 'Minimum purchase is $1.00';
      }
    }

    // Validate limit price
    if (formData.orderType === 'LIMIT') {
      if (!formData.limitPrice || formData.limitPrice <= 0) {
        errors.limitPrice = 'Please enter a valid limit price';
      } else if (formData.limitPrice > currentPrice * 1.1) {
        warnings.largeOrder = 'Limit price is significantly above current market price';
      }
    }

    // Validate cash balance
    if (userCashBalance !== undefined && estimatedCost > userCashBalance) {
      errors.general = `Insufficient cash. Available: ${formatCurrency(userCashBalance)}`;
    }

    // Market warnings
    if (isMarketClosed) {
      if (formData.orderType === 'MARKET') {
        errors.marketClosed = `Market orders cannot be placed when market is ${marketState?.toLowerCase()}. Please use a limit order or wait for market to open.`;
      } else {
        warnings.marketClosed = `Market is ${marketState?.toLowerCase()}. Your limit order will be active and may execute when the market reopens.`;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }, [formData, estimatedCost, userCashBalance, currentPrice, asset.allowFractionalShares, isMarketClosed, marketState, formatCurrency]);

  // Update validation when form changes
  useEffect(() => {
    setValidation(validateForm());
  }, [validateForm]);

  const handleSubmit = async () => {
    const currentValidation = validateForm();
    if (!currentValidation.isValid) {
      setValidation(currentValidation);
      return;
    }

    // Additional check to prevent market orders when market is closed
    if (shouldBlockMarketOrder) {
      setValidation({
        isValid: false,
        errors: { 
          marketClosed: `Market orders are not available when the market is ${marketState?.toLowerCase()}. Please choose a limit order instead.` 
        },
        warnings: {}
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let apiRequest: MarketOrderApiRequest | LimitOrderApiRequest;
      let endpoint: string;

      if (formData.orderType === 'MARKET') {
        apiRequest = {
          assetId: asset.id,
          orderType: 'BUY',
          ...(formData.quantityType === 'SHARES' 
            ? { shares: formData.shares } 
            : { dollarAmount: formData.dollarAmount }
          ),
          notes: formData.notes || undefined
        };
        endpoint = '/api/trade/market-order';
      } else {
        apiRequest = {
          assetId: asset.id,
          orderType: 'BUY',
          ...(formData.quantityType === 'SHARES' 
            ? { shares: formData.shares } 
            : { dollarAmount: formData.dollarAmount }
          ),
          limitPrice: formData.limitPrice!,
          notes: formData.notes || undefined
        };
        endpoint = '/api/trade/limit-order';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequest),
      });

      const result: OrderApiResponse = await response.json();

      if (result.success) {
        const successMessage = `${formData.orderType === 'MARKET' ? 'Market' : 'Limit'} buy order ${
          result.executionStatus === 'EXECUTED' ? 'executed' : 'submitted'
        } for ${formatShares(estimatedShares)} shares of ${asset.ticker}`;
        
        showSuccess(successMessage);
        onSuccess(result.message);
        onClose();
      } else {
        showError(result.error || 'Failed to submit order');
        onError?.(result.error || 'Failed to submit order');
      }
    } catch (error) {
      console.error('Error submitting buy order:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      showError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={createModalClasses().backdrop} onClick={createModalHandlers(handleClose).backdropClick}>
      <div className={createModalClasses().container}>
        <div className={`${createModalClasses().content} max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800`} onClick={createModalHandlers(handleClose).contentClick}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Buy {asset.ticker}
            </h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
                <Icon icon={XIcon} size="lg" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {asset.name} • Current Price: {formatCurrency(currentPrice)}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Order Type Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Order Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, orderType: 'MARKET', limitPrice: undefined }))}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  formData.orderType === 'MARKET'
                    ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">⚡</div>
                  <div>Market Order</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Execute immediately</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, orderType: 'LIMIT', limitPrice: currentPrice }))}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  formData.orderType === 'LIMIT'
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">🎯</div>
                  <div>Limit Order</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Set target price</div>
                </div>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Purchase Amount</label>
            
            {/* Quantity Type Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, quantityType: 'DOLLARS', shares: undefined }))}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  formData.quantityType === 'DOLLARS'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Dollar Amount
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, quantityType: 'SHARES', dollarAmount: undefined }))}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  formData.quantityType === 'SHARES'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Share Count
              </button>
            </div>

            {/* Input Field */}
            {formData.quantityType === 'DOLLARS' ? (
              <div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-900 dark:text-gray-100 font-medium">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.dollarAmount || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      dollarAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 ${
                      validation.errors.dollarAmount ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter dollar amount"
                  />
                </div>
                {validation.errors.dollarAmount && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validation.errors.dollarAmount}</p>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  min="0.000001"
                  step={asset.allowFractionalShares ? "0.000001" : "1"}
                  value={formData.shares || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    shares: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 ${
                    validation.errors.shares ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={`Enter number of shares${asset.allowFractionalShares ? ' (fractional allowed)' : ''}`}
                />
                {validation.errors.shares && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validation.errors.shares}</p>
                )}
              </div>
            )}
          </div>

          {/* Limit Price (for limit orders) */}
          {formData.orderType === 'LIMIT' && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Limit Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-900 dark:text-gray-100 font-medium">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.limitPrice || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    limitPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 ${
                    validation.errors.limitPrice ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={`Current: ${formatCurrency(currentPrice)}`}
                />
              </div>
              {validation.errors.limitPrice && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validation.errors.limitPrice}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Your order will only execute if the price reaches or goes below this limit
              </p>
            </div>
          )}

          {/* Order Summary */}
          {(() => {
            console.log('Order Summary check:', { estimatedShares, estimatedCost, shouldShow: estimatedShares > 0 });
            return estimatedShares > 0;
          })() && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Estimated Shares:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatShares(estimatedShares)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Estimated Cost:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(estimatedCost)}</span>
                </div>
                {userCashBalance !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Available Cash:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(userCashBalance)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Notes (Optional)</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={2}
              placeholder="Add notes about this trade..."
            />
          </div>

          {/* Warnings */}
          {Object.keys(validation.warnings).length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              {Object.values(validation.warnings).map((warning, index) => (
                <p key={index} className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center">
                  <span className="text-yellow-600 dark:text-yellow-400 mr-2">⚠️</span>
                  {warning}
                </p>
              ))}
            </div>
          )}

          {/* General Errors */}
          {validation.errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-300 flex items-center">
                <span className="text-red-600 dark:text-red-400 mr-2">❌</span>
                {validation.errors.general}
              </p>
            </div>
          )}

          {/* Educational Guidance */}
          {showGuidance && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Trading Guidance</h4>
                <button
                  type="button"
                  onClick={() => setShowGuidance(false)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Hide
                </button>
              </div>
              <TradingGuidance
                orderType="BUY"
                tradeType={formData.orderType}
                asset={asset}
                marketState={marketState}
                isFirstTime={false}
                showRiskWarnings={true}
              />
            </div>
          )}

          {!showGuidance && (
            <button
              type="button"
              onClick={() => setShowGuidance(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Show Trading Guidance
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!validation.isValid || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-500 border border-transparent rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Icon icon={CircleNotchIcon} size="sm" className="animate-spin -ml-1 mr-2 text-white" />
                Submitting...
              </div>
            ) : (
              `Submit ${formData.orderType === 'MARKET' ? 'Market' : 'Limit'} Buy Order`
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
} 