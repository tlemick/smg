'use client';

import { useTradeSuggestions } from '@/hooks/useTradeSuggestions';
import { StockSuggestionCard } from './StockSuggestionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * Penny Stocks Tab - "Cheap Seats"
 * 
 * Displays penny stocks (under $5) where students can own many shares
 * Emphasizes the excitement of owning hundreds of shares
 */
export function PennyStocksTab() {
  const { data, isLoading, error, refresh } = useTradeSuggestions('penny-stocks');

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header and Description */}
      <div className="space-y-4">
      <h2 className="text-xl font-mono text-foreground">
      Penny Stocks: own hundreds of shares!
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
          There's something thrilling about owning 100 shares instead of just 1 or 2! Penny stocks 
          trade under $5, making them accessible for smaller portfolios. You can build a meaningful 
          position without breaking the bank. Just remember: lower price doesn't mean better deal—it 
          means higher volatility and risk. Perfect for learning about market dynamics with smaller 
          amounts of capital.
        </p>
      </div>

      {/* Stock Grid */}
      {data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((stock) => (
            <StockSuggestionCard key={stock.ticker} stock={stock} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No penny stocks available at the moment.</p>
            <p className="text-sm text-muted-foreground mt-2">
              This happens when we don't have stocks under $5 in our database.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
