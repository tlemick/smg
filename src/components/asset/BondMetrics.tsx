'use client';

import { Bank } from '@phosphor-icons/react';
import { AssetDetailQuote } from '@/types';
import { Formatters } from '@/lib/financial';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/Icon';

interface BondMetricsProps {
  bond: {
    id: number;
    ticker: string;
    name: string;
    maturityDate: Date | null;
    couponRate: number | null;
    yieldToMaturity: number | null;
    duration: number | null;
    creditRating: string | null;
    issuer: string | null;
    bondType: string | null;
  };
  quote: AssetDetailQuote;
}

export function BondMetrics({ bond, quote }: BondMetricsProps) {

  const getCreditRatingColor = (rating: string | null) => {
    if (!rating) return 'bg-gray-100 text-gray-800';
    
    const ratingUpper = rating.toUpperCase();
    if (ratingUpper.startsWith('AAA') || ratingUpper.startsWith('AA')) {
      return 'bg-green-100 text-green-800';
    } else if (ratingUpper.startsWith('A') || ratingUpper.startsWith('BBB')) {
      return 'bg-blue-100 text-blue-800';
    } else if (ratingUpper.startsWith('BB') || ratingUpper.startsWith('B')) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  const getBondTypeDisplay = (bondType: string | null) => {
    if (!bondType) return 'N/A';
    return bondType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const calculateYearsToMaturity = (maturityDate: Date | null) => {
    if (!maturityDate) return null;
    const today = new Date();
    const maturity = new Date(maturityDate);
    const years = (maturity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0, years);
  };

  const yearsToMaturity = calculateYearsToMaturity(bond.maturityDate);

  return (
    <Card className="shadow-none h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-normal flex items-center gap-2">
          <Icon icon={Bank} size="sm" />
          Bond Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="divide-y divide-border">
          <div className="py-3 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Bond Type</span>
            <span className="text-sm text-foreground">{getBondTypeDisplay(bond.bondType)}</span>
          </div>
          {bond.creditRating && (
            <div className="py-3 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Credit Rating</span>
              <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${getCreditRatingColor(bond.creditRating)}`}>
                {bond.creditRating}
              </span>
            </div>
          )}
          {yearsToMaturity !== null && (
            <div className="py-3 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Years to Maturity</span>
              <span className="text-sm text-foreground">{Formatters.number(yearsToMaturity, { decimals: 1 })} years</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 