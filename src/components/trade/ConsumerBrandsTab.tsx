'use client';

import { useTradeSuggestions } from '@/hooks/useTradeSuggestions';
import { StockSuggestionCard } from './StockSuggestionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * Consumer Brands Tab - "Stuff You Buy"
 * 
 * Displays recognizable consumer brand stocks that students interact with daily
 */
export function ConsumerBrandsTab() {
  const { data, isLoading, error, refresh } = useTradeSuggestions('consumer-brands');

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
          Consumer trends!
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
          Invest in the brands you know and love! These are companies behind products you use every 
          day—from your morning coffee to your favorite streaming service. When you understand the 
          product, it's easier to understand the business. Think about which brands you can't live 
          without, and consider if others feel the same way.
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
            <p className="text-muted-foreground">No consumer brands available at the moment.</p>
            <Button onClick={refresh} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Load Brands
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
