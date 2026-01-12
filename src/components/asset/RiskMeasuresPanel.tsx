'use client';

import React from 'react';
import { Meteor } from '@phosphor-icons/react';
import type { RiskMeasures } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Formatters } from '@/lib/financial';
import { Icon } from '@/components/ui/Icon';

interface RiskMeasuresPanelProps {
  riskMeasures?: RiskMeasures;
  assetType: string;
}

/**
 * Helper function: Format percentage
 */
function formatPct(value: number | null | undefined, digits: number = 2): string {
  return Formatters.percentage(value, { decimals: digits });
}

/**
 * Helper function: Format number
 */
function formatNumber(value: number | null | undefined, digits: number = 2): string {
  return Formatters.number(value, { decimals: digits });
}

export function RiskMeasuresPanel({ riskMeasures, assetType }: RiskMeasuresPanelProps) {
  const common = riskMeasures?.common;
  const bondYtmPct = (riskMeasures?.bond?.yieldToMaturity != null)
    ? (riskMeasures.bond.yieldToMaturity as number) / 100
    : null;

  // Risk helpers
  function riskLevelToClasses(level: 'low' | 'medium' | 'high'): string {
    if (level === 'low') return 'bg-emerald-100 text-emerald-900 border-emerald-200';
    if (level === 'high') return 'bg-rose-100 text-rose-900 border-rose-200';
    return 'bg-amber-100 text-amber-900 border-amber-200';
  }

  function getVolRisk(vol?: number | null): { level: 'low' | 'medium' | 'high'; label: string } | null {
    if (vol == null || Number.isNaN(vol)) return null;
    const pct = vol * 100;
    if (pct < 10) return { level: 'low', label: `${Formatters.number(pct, { decimals: 0 })}% Low` };
    if (pct < 20) return { level: 'medium', label: `${Formatters.number(pct, { decimals: 0 })}% Medium` };
    return { level: 'high', label: `${Formatters.number(pct, { decimals: 0 })}% High` };
  }

  function getBetaRisk(beta?: number | null): { level: 'low' | 'medium' | 'high'; label: string } | null {
    if (beta == null || Number.isNaN(beta)) return null;
    if (beta < 0.9) return { level: 'low', label: `${Formatters.number(beta, { decimals: 1 })} Low` };
    if (beta <= 1.1) return { level: 'medium', label: `${Formatters.number(beta, { decimals: 1 })} Medium` };
    return { level: 'high', label: `${Formatters.number(beta, { decimals: 1 })} High` };
  }

  return (
    <Card className="shadow-none h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-normal flex items-center gap-2">
          <Icon icon={Meteor} size="sm" />
          Risk Factors
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        {!common ? (
          <p className="text-sm text-muted-foreground">Risk data unavailable.</p>
        ) : (
          <div className="divide-y divide-border">
            {/* Beta (stocks only) */}
            {assetType === 'STOCK' && (
              <div className="py-3 flex items-center justify-between" title="Sensitivity vs the market (≈ SPY). 1.0 moves with market, 1.2 moves 20% more.">
                <span className="text-muted-foreground text-sm">Beta</span>
                <div className="flex items-center gap-3">
                  {/* <span className="text-sm text-gray-900">{formatNumber(riskMeasures?.stock?.beta)}</span> */}
                  {(() => {
                    const badge = getBetaRisk(riskMeasures?.stock?.beta ?? null);
                    if (!badge) return null;
                    return (
                      <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${riskLevelToClasses(badge.level)}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Volatility (90D preferred for badge), show both */}
            <div className="py-3 flex items-center justify-between" title="Annualized from daily returns (last 90 sessions).">
              <span className="text-muted-foreground text-sm">Standard Deviation (Total Volatility)</span>
              <div className="flex items-center gap-3">
                {/* <span className="text-sm text-gray-900">{formatPct(common.volatility90d)}</span> */}
                {(() => {
                  const badge = getVolRisk(common.volatility90d);
                  if (!badge) return null;
                  return (
                    <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${riskLevelToClasses(badge.level)}`}>
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="py-3 flex items-center justify-between" title="Return per unit of risk using a simple risk-free assumption.">
              <span className="text-muted-foreground text-sm">Sharpe Ratio (90D)</span>
              <span className="text-sm text-foreground">{formatNumber(common.sharpe90d)}</span>
            </div>

            <div className="py-3 flex items-center justify-between" title="Worst peak-to-trough drop over the last year.">
              <span className="text-muted-foreground text-sm">Max Drawdown (1Y)</span>
              <span className="text-sm text-foreground">{formatPct(common.maxDrawdown1y)}</span>
            </div>

            <div className="py-3 flex items-center justify-between" title="Where today's price sits between 52-week low and high.">
              <span className="text-muted-foreground text-sm">52W Range Position</span>
              <span className="text-sm text-foreground">{formatPct(common.range52wPosition)}</span>
            </div>

            <div className="py-3 flex items-center justify-between" title="Percent of days with negative returns in last 90 trading days.">
              <span className="text-muted-foreground text-sm">Downside Days (90D)</span>
              <span className="text-sm text-foreground">{formatPct(common.downsideDays90dPct)}</span>
            </div>

            {assetType === 'BOND' && riskMeasures?.bond && (
              <>
                <div className="py-3 flex items-center justify-between" title="Rate sensitivity: ≈ duration% price move for a 1% rate change.">
                  <span className="text-muted-foreground text-sm">Duration (approx)</span>
                  <span className="text-sm text-foreground">{formatNumber(riskMeasures.bond.durationApprox)}</span>
                </div>
                <div className="py-3 flex items-center justify-between" title="Total return if held to maturity, annualized.">
                  <span className="text-muted-foreground text-sm">Yield to Maturity</span>
                  <span className="text-sm text-foreground">{formatPct(bondYtmPct)}</span>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    );
  }


