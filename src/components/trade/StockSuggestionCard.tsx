'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Formatters } from '@/lib/financial';
import { TradeDrawer } from '@/components/trading';
import type { StockSuggestion } from '@/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockSuggestionCardProps {
  stock: StockSuggestion;
  userCashBalance?: number;
}

/**
 * Rich stock suggestion card displaying price, metrics, and action buttons
 * 
 * Features:
 * - Company logo (if available)
 * - Price with color-coded change
 * - Market cap and volume
 * - Dividend yield (for dividend stocks)
 * - Two action buttons: Buy (opens drawer) and Details
 */
export function StockSuggestionCard({ stock, userCashBalance }: StockSuggestionCardProps) {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const isPositive = stock.changePercent >= 0;
  const changeColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  
  const handleBuyClick = () => {
    setIsDrawerOpen(true);
  };
  
  const handleDetailsClick = () => {
    router.push(`/asset/${stock.ticker}`);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6 space-y-4">
        {/* Header: Logo + Ticker/Name */}
        <div className="flex items-start gap-4">
          {stock.logoUrl ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              <img 
                src={stock.logoUrl} 
                alt={`${stock.name} logo`}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-sm font-bold text-muted-foreground">
                {stock.ticker.substring(0, 2)}
              </span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-mono font-bold text-foreground leading-none mt-1 mb-2">
              {stock.ticker}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {stock.name}
            </p>
          </div>
        </div>

        {/* Price Section */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-foreground">
              {Formatters.currency(stock.price)}
            </span>
            <div className={`flex items-center gap-1 ${changeColor}`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-mono text-sm font-medium">
                {Formatters.percentage(stock.changePercent / 100, { 
                  showSign: true,
                  decimals: 2 
                })}
              </span>
            </div>
          </div>
          <p className={`text-sm font-mono ${changeColor}`}>
            {isPositive ? '+' : ''}{Formatters.currency(stock.change)}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
          {stock.marketCap && (
            <div>
              <p className="text-xs text-muted-foreground">Market Cap</p>
              <p className="text-sm font-mono font-medium text-foreground">
                {Formatters.currency(parseFloat(stock.marketCap), { compact: true })}
              </p>
            </div>
          )}
          
          {stock.volume && (
            <div>
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="text-sm font-mono font-medium text-foreground">
                {Formatters.number(parseFloat(stock.volume), { notation: 'compact' })}
              </p>
            </div>
          )}
          
          {/* Special dividend yield display for dividend stocks */}
          {stock.category === 'dividend' && stock.dividendYield !== null && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Dividend Yield</p>
              <p className="text-lg font-mono font-bold text-green-600 dark:text-green-400">
                {Formatters.percentage(stock.dividendYield, { decimals: 2 })}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleBuyClick}
            variant="neutral"
            className="flex-1"
            size="default"
          >
            Buy
          </Button>
          <Button 
            onClick={handleDetailsClick}
            variant="outline"
            className="flex-1"
            size="default"
          >
            Details
          </Button>
        </div>
      </CardContent>

      {/* Trade Drawer */}
      <TradeDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        asset={{
          id: stock.id,
          ticker: stock.ticker,
          name: stock.name,
          allowFractionalShares: true, // Default to true for most stocks
        }}
        currentPrice={stock.price}
        orderType="BUY"
        userCashBalance={userCashBalance}
      />
    </Card>
  );
}
