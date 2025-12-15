'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, CircleNotchIcon, CurrencyDollarIcon, Icon, TrendUpIcon } from '@/components/ui';
import { useToast } from '@/hooks/useToast';

interface SimplifiedBuyFormProps {
  assetId: number;
  ticker: string;
  name: string;
  currentPrice: number;
  cashBalance: number;
  onSuccess: () => void;
}

export function SimplifiedBuyForm({
  assetId,
  ticker,
  name,
  currentPrice,
  cashBalance,
  onSuccess,
}: SimplifiedBuyFormProps) {
  const { success: showSuccess, error: showError } = useToast();
  const [dollarAmount, setDollarAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess2, setShowSuccess2] = useState(false);
  const [estimatedShares, setEstimatedShares] = useState<number>(0);

  // Calculate estimated shares
  useEffect(() => {
    const amount = parseFloat(dollarAmount);
    if (amount > 0 && currentPrice > 0) {
      setEstimatedShares(amount / currentPrice);
    } else {
      setEstimatedShares(0);
    }
  }, [dollarAmount, currentPrice]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatShares = (shares: number) => {
    return shares.toFixed(4).replace(/\.?0+$/, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(dollarAmount);
    if (!amount || amount <= 0) {
      showError('Please enter a valid dollar amount');
      return;
    }

    if (amount > cashBalance) {
      showError(`Insufficient cash. Available: ${formatCurrency(cashBalance)}`);
      return;
    }

    if (amount < 1) {
      showError('Minimum purchase amount is $1.00');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/trade/market-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId,
          orderType: 'BUY',
          dollarAmount: amount,
          notes: 'Onboarding purchase',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowSuccess2(true);
        showSuccess(`Successfully purchased ${formatShares(estimatedShares)} shares of ${ticker}!`);
        
        // Reset form after short delay
        setTimeout(() => {
          setDollarAmount('');
          setShowSuccess2(false);
          onSuccess();
        }, 1500);
      } else {
        showError(result.error || 'Failed to complete purchase');
      }
    } catch (error) {
      console.error('Error purchasing asset:', error);
      showError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [1000, 5000, 10000, 15000];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-blue-200 dark:border-gray-700 shadow-lg">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          Buy {ticker}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{name}</p>
        <div className="mt-2 flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Current Price:</span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(currentPrice)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dollar Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            How much would you like to invest?
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Icon icon={CurrencyDollarIcon} size="md" className="text-gray-400" />
            </div>
            <input
              type="number"
              min="1"
              step="0.01"
              value={dollarAmount}
              onChange={(e) => setDollarAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter amount"
              disabled={isSubmitting || showSuccess2}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Available cash: {formatCurrency(cashBalance)}
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick amounts:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setDollarAmount(amount.toString())}
                disabled={isSubmitting || showSuccess2 || amount > cashBalance}
                className="px-3 py-2 text-sm font-medium bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-900 dark:text-gray-100"
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>
        </div>

        {/* Estimated Shares */}
        {estimatedShares > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon icon={TrendUpIcon} size="sm" className="text-green-600 dark:text-green-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">You'll receive:</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatShares(estimatedShares)} shares
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!dollarAmount || isSubmitting || showSuccess2}
          className="w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg hover:from-green-600 hover:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <Icon icon={CircleNotchIcon} size="md" className="animate-spin mr-2" />
              Processing...
            </>
          ) : showSuccess2 ? (
            <>
              <Icon icon={CheckCircleIcon} size="md" className="mr-2" />
              Purchase Complete!
            </>
          ) : (
            `Buy ${ticker}`
          )}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          💡 <strong>Pro tip:</strong> This is a market order - it executes immediately at the current market price. Perfect for getting started!
        </p>
      </div>
    </div>
  );
}

