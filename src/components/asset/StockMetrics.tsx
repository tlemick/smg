'use client';

import { Bank } from '@phosphor-icons/react';
import { AssetDetailQuote } from '@/types';
import { Formatters } from '@/lib/financial';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/Icon';

interface StockMetricsProps {
  stock: {
    id: number;
    ticker: string;
    name: string;
    sector: string | null;
    industry: string | null;
  };
  quote: AssetDetailQuote;
}

export function StockMetrics({ stock, quote }: StockMetricsProps) {

  return (
    <Card className="shadow-none h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-normal flex items-center gap-2">
          <Icon icon={Bank} size="sm" />
          Stock Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="divide-y divide-border">
          <div className="py-3 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Forward P/E</span>
            <span className="text-sm text-foreground">{Formatters.number(quote.forwardPE, { decimals: 2 })}</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Price/Book</span>
            <span className="text-sm text-foreground">{Formatters.number(quote.priceToBook, { decimals: 2 })}</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Book Value</span>
            <span className="text-sm text-foreground">{Formatters.currency(quote.bookValue, { currency: quote.currency || 'USD' })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 