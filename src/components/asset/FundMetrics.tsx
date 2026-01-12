'use client';

import { Bank } from '@phosphor-icons/react';
import { AssetDetailQuote } from '@/types';
import { Formatters } from '@/lib/financial';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/Icon';

interface FundMetricsProps {
  fund: {
    id: number;
    ticker: string;
    name: string;
    fundType: string | null;
    expenseRatio: number | null;
    minimumInvestment: number | null;
    inceptionDate: Date | null;
    totalAssets: number | null;
    category: string | null;
    investmentObjective: string | null;
  };
  quote: AssetDetailQuote;
  assetType: string;
}

export function FundMetrics({ fund, quote, assetType }: FundMetricsProps) {

  const getExpenseRatioColor = (ratio: number | null) => {
    if (!ratio) return 'bg-gray-100 text-gray-800';
    
    if (ratio < 0.2) return 'bg-green-100 text-green-800';
    if (ratio < 0.5) return 'bg-yellow-100 text-yellow-800';
    if (ratio < 1.0) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getExpenseRatioLabel = (ratio: number | null) => {
    if (!ratio) return 'N/A';
    if (ratio < 0.2) return 'Very Low';
    if (ratio < 0.5) return 'Low';
    if (ratio < 1.0) return 'Moderate';
    return 'High';
  };

  const getFundTypeDisplay = (fundType: string | null) => {
    if (!fundType) return assetType === 'ETF' ? 'ETF' : 'Mutual Fund';
    return fundType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const calculateYearsSinceInception = (inceptionDate: Date | null) => {
    if (!inceptionDate) return null;
    const today = new Date();
    const inception = new Date(inceptionDate);
    const years = (today.getTime() - inception.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0, years);
  };

  const yearsSinceInception = calculateYearsSinceInception(fund.inceptionDate);

  return (
    <Card className="shadow-none h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-normal flex items-center gap-2">
          <Icon icon={Bank} size="sm" />
          {assetType === 'ETF' ? 'ETF' : 'Fund'} Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="divide-y divide-border">
          <div className="py-3 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Fund Type</span>
            <span className="text-sm text-foreground">{getFundTypeDisplay(fund.fundType)}</span>
          </div>
          {fund.category && (
            <div className="py-3 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Category</span>
              <span className="text-sm text-foreground">{fund.category}</span>
            </div>
          )}
          <div className="py-3 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Inception Date</span>
            <span className="text-sm text-foreground">{Formatters.date(fund.inceptionDate)}</span>
          </div>
          {yearsSinceInception !== null && (
            <div className="py-3 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Fund Age</span>
              <span className="text-sm text-foreground">{Formatters.number(yearsSinceInception, { decimals: 1 })} years</span>
            </div>
          )}
          <div className="py-3 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Expense Ratio</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">{Formatters.percentage(fund.expenseRatio, { multiplier: 1 })}</span>
              {fund.expenseRatio && (
                <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${getExpenseRatioColor(fund.expenseRatio)}`}>
                  {getExpenseRatioLabel(fund.expenseRatio)}
                </span>
              )}
            </div>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Minimum Investment</span>
            <span className="text-sm text-foreground">{Formatters.currency(fund.minimumInvestment, { currency: quote.currency || 'USD' })}</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Total Assets (AUM)</span>
            <span className="text-sm text-foreground">{Formatters.marketCap(fund.totalAssets)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 