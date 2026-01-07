'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserHoldingsApiResponse, UserHoldingsData } from '@/types';
import { useToast } from '@/hooks/useToast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UserHoldingsProps {
  ticker: string;
  currentPrice: number;
  currency: string;
}

export function UserHoldings({ ticker, currentPrice, currency }: UserHoldingsProps) {
  const { success: _success } = useToast();
  const router = useRouter();
  const [detailedHoldings, setDetailedHoldings] = useState<UserHoldingsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetailedHoldings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/user/holdings/${ticker}`);
        const result: UserHoldingsApiResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch holdings');
        }

        setDetailedHoldings(result);
      } catch (err) {
        console.error('Error fetching detailed holdings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load holdings');
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedHoldings();
  }, [ticker]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatShares = (shares: number) => {
    return shares.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
  };

  // Trading handlers
  const handleBuyClick = () => {
    const returnUrl = `/asset/${ticker}`;
    router.push(`/trade/buy/${ticker}?returnTo=${encodeURIComponent(returnUrl)}`);
  };

  const handleSellClick = () => {
    const returnUrl = `/asset/${ticker}`;
    router.push(`/trade/sell/${ticker}?returnTo=${encodeURIComponent(returnUrl)}`);
  };

  if (loading) {
    return (
      <Card className="shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Your Holdings</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Your Holdings</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
        <div className="text-center text-destructive">
          <p>Failed to load holdings</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm text-blue-600 hover:text-blue-800 mt-2"
          >
            Try again
          </button>
        </div>
        </CardContent>
      </Card>
    );
  }

  if (!detailedHoldings?.data?.hasHoldings) {
    return (
      <Card className="shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Your Holdings</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
        <div className="text-center text-muted-foreground">
          <p className="text-sm text-muted-foreground">
            You don&apos;t currently own any shares of {ticker}. 
            Start building your position today.
          </p>
          <Button 
            onClick={handleBuyClick}
            className="mt-4"
          >
            Buy {ticker}
          </Button>
        </div>
        </CardContent>
      </Card>
    );
  }

  const holdings = detailedHoldings.data;
  const summary = holdings.summary;
  const totalUnrealized = summary?.unrealizedPnL || 0;
  const totalUnrealizedPercent = summary?.unrealizedPnLPercent || 0;
  const isPositive = totalUnrealized >= 0;

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Your Holdings</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
      
      {/* Portfolio Summary */}
      <div className="bg-muted rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Total Shares</label>
            <p className="text-lg font-semibold text-foreground">
              {formatShares(summary?.totalQuantity || 0)}
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Market Value</label>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(summary?.currentValue || 0)}
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Total Cost</label>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(summary?.totalCostBasis || 0)}
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Unrealized P&L</label>
            <p className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalUnrealized)}
            </p>
            <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(totalUnrealizedPercent)}
            </p>
          </div>
        </div>
      </div>

      {/* Average Cost Basis */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Cost Basis</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Average Cost:</span>
            <span className="font-medium text-foreground">{formatCurrency(summary?.avgCostBasis || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Price:</span>
            <span className="font-medium text-foreground">{formatCurrency(currentPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gain/Loss per Share:</span>
            <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(currentPrice - (summary?.avgCostBasis || 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Portfolio Breakdown */}
      {holdings.holdings && holdings.holdings.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-2">Portfolio Breakdown</h4>
          <div className="space-y-3">
            {holdings.holdings.map((holding, index) => (
              <div key={index} className="border border-border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-foreground">{holding.portfolio.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatShares(holding.quantity)} shares
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {holding.portfolio.gameSession.name || 'Default Game'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {formatCurrency(holding.currentValue)}
                    </p>
                    <p className={`text-sm ${holding.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(holding.unrealizedPnL)} ({formatPercentage(holding.unrealizedPnLPercent)})
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Cost: {formatCurrency(holding.costBasis)}</span>
                    <span>Avg: {formatCurrency(holding.averagePrice)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Realized P&L */}
      {summary?.realizedPnL !== undefined && summary.realizedPnL !== 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-2">Realized P&L</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Realized Gain/Loss:</span>
              <span className={`font-medium ${summary.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.realizedPnL)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Return:</span>
              <span className={`font-medium ${(summary.realizedPnL + totalUnrealized) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.realizedPnL + totalUnrealized)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 border-t border-border">
        <div className="flex gap-3">
          <Button 
            onClick={handleBuyClick}
            className="flex-1"
          >
            Buy More
          </Button>
          <Button 
            onClick={handleSellClick}
            variant="destructive"
            className="flex-1"
          >
            Sell
          </Button>
        </div>
        <Button variant="outline" className="w-full mt-2">
          View Transaction History
        </Button>
      </div>
      </CardContent>
    </Card>
  );
} 