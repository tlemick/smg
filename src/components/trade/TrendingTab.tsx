'use client';

import { useTradeSuggestions } from '@/hooks/useTradeSuggestions';
import { StockSuggestionCard } from './StockSuggestionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * Trending Tab - "Hype Train"
 * 
 * Displays currently trending and viral stocks from Yahoo Finance
 */
export function TrendingTab() {
  const { data, isLoading, error, refresh } = useTradeSuggestions('trending');

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
      Trending and viral!
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
          These are the stocks everyone's talking about right now. They're trending on social media, 
          making headlines, and seeing massive trading volume. Hype stocks can be exciting, but 
          remember—what goes up fast can come down just as quickly. Always do your research before 
          jumping on the hype train!
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
            <p className="text-muted-foreground">No trending stocks available at the moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
