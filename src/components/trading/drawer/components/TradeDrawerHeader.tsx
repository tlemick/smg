'use client';

import { Formatters } from '@/lib/financial';

interface TradeDrawerHeaderProps {
  assetName: string;
  ticker: string;
  currentPrice: number;
  currency?: string;
}

/**
 * Minimal header for trade drawer
 * 
 * Displays:
 * - Asset name
 * - Ticker symbol
 * - Current price (formatted)
 */
export function TradeDrawerHeader({
  assetName,
  ticker,
  currentPrice,
  currency = 'USD',
}: TradeDrawerHeaderProps) {
  return (
    <div className="text-center space-y-1">
      <h3 className="text-lg font-semibold text-foreground">{assetName}</h3>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span className="font-mono font-medium">{ticker}</span>
        <span>•</span>
        <span className="font-mono">{Formatters.currency(currentPrice, { currency })}</span>
      </div>
    </div>
  );
}
