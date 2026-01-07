'use client';

import React from 'react';
import { InfoIcon } from '@/components/ui/Icon';
import type { AssetDetailData } from '@/types';
import { LessonButton } from '@/components/ui/LessonButton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Formatters } from '@/lib/financial';

interface Props {
  asset: AssetDetailData['asset'];
  quote: AssetDetailData['quote'];
  typeSpecific: AssetDetailData['typeSpecific'];
  profile?: AssetDetailData['profile'];
}

// Helper wrappers for backward compatibility (can be removed if all usages are updated)
function formatNumber(value: number | undefined | null, decimals = 2): string {
  return Formatters.number(value, { decimals });
}

function formatPercentage(value: number | undefined | null, decimals = 2): string {
  return Formatters.percentage(value, { decimals });
}

function formatCurrency(value: number | undefined | null, decimals = 2): string {
  return Formatters.currency(value, { decimals });
}

function formatMarketCap(value: string | undefined | null): string {
  return Formatters.marketCap(value);
}

function getConsensusColor(consensus?: string): string {
  switch (consensus) {
    case 'Strong Buy': return 'text-emerald-700';
    case 'Buy': return 'text-emerald-600';
    case 'Hold': return 'text-amber-600';
    case 'Sell': return 'text-red-600';
    case 'Strong Sell': return 'text-red-700';
    default: return 'text-neutral-900 dark:text-white';
  }
}

export function AssetOverviewPanel({ asset, quote, typeSpecific, profile }: Props) {
  // For stocks, show financial metrics; for others, show basic asset info
  if (asset.type === 'STOCK') {
    return (
      <Card className="shadow-none h-full flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-normal">Financial Metrics</CardTitle>
        </CardHeader>

        <CardContent className="flex-1 pt-0">
          <div className="divide-y divide-border">
            {/* Sector */}
            <div className="py-3 flex items-center justify-between" title="Industry sector classification">
              <span className="text-muted-foreground text-sm">Sector</span>
              <span className="text-sm text-foreground">{typeSpecific.stock?.sector || 'N/A'}</span>
            </div>

            {/* Industry */}
            <div className="py-3 flex items-center justify-between" title="Specific industry within sector">
              <span className="text-muted-foreground text-sm">Industry</span>
              <span className="text-sm text-foreground">{typeSpecific.stock?.industry || 'N/A'}</span>
            </div>

            {/* Market Cap */}
            <div className="py-3 flex items-center justify-between" title="Total market value of all outstanding shares">
              <span className="text-muted-foreground text-sm">Market Capitalization</span>
              <span className="text-sm text-foreground">{formatMarketCap(quote.marketCap)}</span>
            </div>

            {/* P/E Ratio */}
            <div className="py-3 flex items-center justify-between" title="Price-to-Earnings ratio (trailing twelve months)">
              <span className="text-muted-foreground text-sm">P/E Ratio (TTM)</span>
              <span className="text-sm text-foreground">{formatNumber(quote.trailingPE, 1)}</span>
            </div>

            {/* Dividend Yield */}
            <div className="py-3 flex items-center justify-between" title="Annual dividend payments as percentage of stock price">
              <span className="text-muted-foreground text-sm">Dividend Yield</span>
              <span className="text-sm text-foreground">{formatPercentage(quote.dividendYield)}</span>
            </div>

            {/* EPS */}
            <div className="py-3 flex items-center justify-between" title="Earnings per share (trailing twelve months)">
              <span className="text-muted-foreground text-sm">Earnings Per Share (TTM)</span>
              <span className="text-sm text-foreground">{formatCurrency(quote.earningsPerShare)}</span>
            </div>

            {/* Analyst Consensus */}
            {quote.analystConsensus && quote.analystConsensus.totalAnalysts && quote.analystConsensus.totalAnalysts > 0 && (
              <div className="py-3 flex items-center justify-between" title={`Based on ${quote.analystConsensus.totalAnalysts} analyst recommendations`}>
                <span className="text-muted-foreground text-sm">Analyst Consensus</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${getConsensusColor(quote.analystConsensus.consensus)}`}>
                    {quote.analystConsensus.consensus}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({quote.analystConsensus.totalAnalysts})
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <div className="flex justify-end px-6 pb-6">
          <LessonButton
            text="Understanding Financial Metrics"
            topics={['Financial Analysis', 'Stock Valuation']}
            maxItems={2}
            modalLayout="dual"
            modalContent={
              <div className="flex flex-col gap-4 p-8">
                <h3 className="text-lg font-semibold text-foreground">Financial Metrics Explained</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-foreground">Market Cap</h4>
                    <p className="text-sm text-muted-foreground">Shows company size. Large-cap (&gt;$10B) are typically more stable, small-cap (&lt;$2B) more volatile.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">P/E Ratio</h4>
                    <p className="text-sm text-muted-foreground">Price relative to earnings. Lower P/E may indicate value; higher P/E may indicate growth expectations.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Dividend Yield</h4>
                    <p className="text-sm text-muted-foreground">Income return from owning the stock. Higher yields may indicate mature companies or distressed situations.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Analyst Consensus</h4>
                    <p className="text-sm text-muted-foreground">Professional analysts' average recommendation. Consider alongside your own research.</p>
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </Card>
    );
  }

  // For non-stocks, show traditional asset overview
  const rows: Array<{ label: string; value: React.ReactNode; tooltip?: string }> = [
    { label: 'Full Name', value: asset.name, tooltip: 'Official legal name of the financial instrument' },
    { label: 'Type', value: asset.type.replace('_', ' '), tooltip: 'Category of financial instrument' },
    { label: 'Market/Exchange', value: asset.primaryExchange || quote.exchangeName || asset.market || 'N/A', tooltip: 'Where this asset is traded' },
    { label: 'Currency', value: asset.currencyName || quote.currency || 'USD', tooltip: 'Currency denomination' },
  ];

  if (asset.type === 'ETF' || asset.type === 'INDEX') {
    rows.push(
      { label: 'Category/Index', value: 'N/A', tooltip: 'Investment category or tracked index' },
      { label: 'Expense Ratio', value: 'N/A', tooltip: 'Annual fee as percentage of assets' }
    );
  }

  if (asset.type === 'MUTUAL_FUND' && typeSpecific.mutualFund) {
    rows.push(
      { label: 'Fund Family', value: typeSpecific.mutualFund.fundFamily || 'N/A', tooltip: 'Investment company managing the fund' },
      { label: 'Category', value: typeSpecific.mutualFund.fundType || 'N/A', tooltip: 'Investment style and objective' },
      { label: 'AUM', value: typeSpecific.mutualFund.aum ? `$${typeSpecific.mutualFund.aum.toLocaleString()}` : 'N/A', tooltip: 'Total assets under management' },
      { label: 'Expense Ratio', value: typeSpecific.mutualFund.expenseRatio != null ? `${(typeSpecific.mutualFund.expenseRatio * 100).toFixed(2)}%` : 'N/A', tooltip: 'Annual management fee' }
    );
  }

  if (asset.type === 'BOND' && typeSpecific.bond) {
    rows.push(
      { label: 'Issuer', value: typeSpecific.bond.issuer || 'N/A', tooltip: 'Entity that issued the bond' },
      { label: 'Maturity Date', value: typeSpecific.bond.maturityDate ? new Date(typeSpecific.bond.maturityDate).toLocaleDateString() : 'N/A', tooltip: 'When principal is repaid' },
      { label: 'Coupon Rate', value: typeSpecific.bond.couponRate != null ? `${typeSpecific.bond.couponRate.toFixed(2)}%` : 'N/A', tooltip: 'Annual interest rate' },
      { label: 'Face Value', value: typeSpecific.bond.faceValue != null ? `$${typeSpecific.bond.faceValue.toLocaleString()}` : 'N/A', tooltip: 'Principal amount at maturity' }
    );
  }

  return (
    <Card className="shadow-none h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Asset Overview</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <div className="divide-y divide-border">
          {rows.map((row, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between" title={row.tooltip}>
              <span className="text-muted-foreground text-sm">{row.label}</span>
              <span className="text-sm text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <div className="flex justify-end px-6 pb-6">
        <LessonButton
          text="What is this?"
          topics={[asset.type === 'MUTUAL_FUND' ? 'Mutual Funds' : asset.type === 'BOND' ? 'Fixed Income' : 'Investment Types']}
          maxItems={1}
          modalLayout="dual"
            modalContent={
              <div className="flex flex-col gap-2 p-8">
                <h3 className="text-lg font-semibold text-foreground">About {asset.type.replace('_', ' ')}s</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-prose">
                  Learn about different types of financial assets and how to understand their key characteristics. Each asset type has unique features that affect how it behaves in your portfolio.
                </p>
                <p className="mt-2 text-sm text-muted-foreground max-w-prose">
                  Understanding what you're investing in is the first step to making informed decisions. Look at the asset overview to see key information about this financial instrument.
                </p>
              </div>
            }
          />
        </div>
      </Card>
    );
  }


