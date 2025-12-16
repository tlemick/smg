'use client';

import { ReactNode } from 'react';
import { MainNavigation } from '@/components/navigation';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface TradePageProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  asset: {
    ticker: string;
    name: string;
  };
  currentPrice: number;
  currency: string;
  marketState?: string;
  quote?: {
    regularMarketPreviousClose?: number;
    regularMarketDayHigh?: number;
    regularMarketDayLow?: number;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
  };
}

export function TradePage({
  children,
  title,
  subtitle,
  asset,
  currentPrice,
  currency,
  marketState,
  quote
}: TradePageProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getMarketStateDisplay = () => {
    if (!marketState) return '';
    switch (marketState) {
      case 'REGULAR':
        return 'Market Open';
      case 'CLOSED':
        return 'Market Closed';
      case 'PRE':
        return 'Pre-Market';
      case 'POST':
        return 'After Hours';
      default:
        return marketState;
    }
  };

  const getMarketStateColor = () => {
    if (!marketState) return 'text-gray-500';
    switch (marketState) {
      case 'REGULAR':
        return 'text-green-600';
      case 'CLOSED':
        return 'text-red-600';
      case 'PRE':
      case 'POST':
        return 'text-yellow-600';
      default:
        return 'text-gray-500';
    }
  };

  const isMarketClosed = marketState && marketState !== 'REGULAR';

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <MainNavigation />

      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-semibold">{title}</h1>
                {subtitle && (
                  <p className="text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Asset Information Card */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <CardTitle className="text-xl">{asset.ticker}</CardTitle>
                    <p className="text-sm text-muted-foreground">{asset.name}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-semibold">{formatCurrency(currentPrice)}</div>
                    {quote?.regularMarketChange !== undefined && (
                      <div className={`text-sm font-medium ${quote.regularMarketChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {quote.regularMarketChange >= 0 ? '+' : ''}{formatCurrency(quote.regularMarketChange)}
                        {quote.regularMarketChangePercent !== undefined && (
                          <span> ({quote.regularMarketChangePercent >= 0 ? '+' : ''}{quote.regularMarketChangePercent.toFixed(2)}%)</span>
                        )}
                      </div>
                    )}
                    {marketState ? (
                      <div className="mt-2">
                        <Badge variant={isMarketClosed ? 'secondary' : 'default'}>
                          {getMarketStateDisplay()}
                        </Badge>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Additional Price Information */}
                {quote && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    {quote.regularMarketPreviousClose && (
                      <div>
                        <span className="text-xs text-muted-foreground">Previous Close</span>
                        <div className="text-sm font-medium">
                          {formatCurrency(quote.regularMarketPreviousClose)}
                        </div>
                      </div>
                    )}
                    {quote.regularMarketDayLow && quote.regularMarketDayHigh && (
                      <div>
                        <span className="text-xs text-muted-foreground">Day Range</span>
                        <div className="text-sm font-medium">
                          {formatCurrency(quote.regularMarketDayLow)} - {formatCurrency(quote.regularMarketDayHigh)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Market State Guidance */}
                {isMarketClosed && (
                  <div className="mt-4 rounded-lg border border-border bg-muted p-3">
                    <div className="flex items-start gap-2">
                      <svg className="mt-0.5 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Market is closed</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {marketState === 'POST' ? 'After-hours trading. ' : 'Market is closed. '}
                          Consider using limit orders to set your target price.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card>
            <CardContent className="p-6">{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}