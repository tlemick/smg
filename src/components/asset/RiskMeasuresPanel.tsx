'use client';

import React from 'react';
import { InfoIcon } from '@/components/ui/Icon';
import type { RiskMeasures } from '@/types';
import { LessonButton } from '@/components/ui/LessonButton';

interface Props {
  riskMeasures?: RiskMeasures;
  assetType: string;
}

function formatPct(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return 'N/A';
  return `${(value * 100).toFixed(digits)}%`;
}

function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return 'N/A';
  return value.toFixed(digits);
}

export function RiskMeasuresPanel({ riskMeasures, assetType }: Props) {
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
    if (pct < 10) return { level: 'low', label: `${pct.toFixed(0)}% Low` };
    if (pct < 20) return { level: 'medium', label: `${pct.toFixed(0)}% Medium` };
    return { level: 'high', label: `${pct.toFixed(0)}% High` };
  }

  function getBetaRisk(beta?: number | null): { level: 'low' | 'medium' | 'high'; label: string } | null {
    if (beta == null || Number.isNaN(beta)) return null;
    if (beta < 0.9) return { level: 'low', label: `${beta.toFixed(1)} Low` };
    if (beta <= 1.1) return { level: 'medium', label: `${beta.toFixed(1)} Medium` };
    return { level: 'high', label: `${beta.toFixed(1)} High` };
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-0">
        <h4 className="text-sm font-normal text-neutral-900 dark:text-white">Risk Factors</h4>
      </div>

      <div className="flex-1">
        {!common ? (
          <p className="text-sm text-gray-600 dark:text-white">Risk data unavailable.</p>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {/* Beta (stocks only) */}
            {assetType === 'STOCK' && (
              <div className="py-3 flex items-center justify-between" title="Sensitivity vs the market (≈ SPY). 1.0 moves with market, 1.2 moves 20% more.">
                <span className="text-neutral-700 dark:text-white text-sm">Beta</span>
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
              <span className="text-gray-700 dark:text-white text-sm">Standard Deviation (Total Volatility)</span>
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
              <span className="text-neutral-700 dark:text-white text-sm">Sharpe Ratio (90D)</span>
              <span className="text-sm text-neutral-900 dark:text-white">{formatNumber(common.sharpe90d)}</span>
            </div>

            <div className="py-3 flex items-center justify-between" title="Worst peak-to-trough drop over the last year.">
              <span className="text-neutral-700 dark:text-white text-sm">Max Drawdown (1Y)</span>
              <span className="text-sm text-neutral-900 dark:text-white">{formatPct(common.maxDrawdown1y)}</span>
            </div>

            <div className="py-3 flex items-center justify-between" title="Where today's price sits between 52-week low and high.">
              <span className="text-neutral-700 dark:text-white text-sm">52W Range Position</span>
              <span className="text-sm text-neutral-900 dark:text-white">{formatPct(common.range52wPosition)}</span>
            </div>

            <div className="py-3 flex items-center justify-between" title="Percent of days with negative returns in last 90 trading days.">
              <span className="ttext-neutral-700 dark:text-white text-sm">Downside Days (90D)</span>
              <span className="text-sm text-neutral-900 dark:text-white">{formatPct(common.downsideDays90dPct)}</span>
            </div>

            {assetType === 'BOND' && riskMeasures?.bond && (
              <>
                <div className="py-3 flex items-center justify-between" title="Rate sensitivity: ≈ duration% price move for a 1% rate change.">
                  <span className="text-neutral-700 dark:text-white text-sm">Duration (approx)</span>
                  <span className="text-sm text-neutral-900 dark:text-white">{formatNumber(riskMeasures.bond.durationApprox)}</span>
                </div>
                <div className="py-3 flex items-center justify-between" title="Total return if held to maturity, annualized.">
                  <span className="text-neutral-700 dark:text-white text-sm">Yield to Maturity</span>
                  <span className="text-sm text-neutral-900 dark:text-white">{formatPct(bondYtmPct)}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end mt-4">
        <LessonButton
          text="Kelly Talks about Risk"
          topics={["Risk Management"]}
          maxItems={1}
          modalLayout="dual"
          modalContent={
            <div className="flex flex-col gap-2 p-8">
              <h3 className="text-lg font-semibold text-gray-900">Understanding Risk</h3>
              <p className="mt-2 text-sm text-gray-600 max-w-prose">
                Beta and volatility help you compare how bumpy a ride an asset can be. Higher numbers mean larger ups and downs.
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
}


