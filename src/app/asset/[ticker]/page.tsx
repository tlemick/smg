'use client';

import { useParams } from 'next/navigation';
import { useAssetDetail } from '@/hooks/useAssetDetail';
import { AssetHeader } from '@/components/asset/AssetHeader';
import { AssetChart } from '@/components/asset/AssetChart';
import { AssetTopActions, AssetOverviewPanel, RiskMeasuresPanel, AssetNewsPanel } from '@/components/asset';
import { StockMetrics } from '@/components/asset/StockMetrics';
import { BondMetrics } from '@/components/asset/BondMetrics';
import { FundMetrics } from '@/components/asset/FundMetrics';
import { UserHoldings } from '@/components/asset/UserHoldings';
import { PageLayout } from '@/components/layout/PageLayout';

/**
 * Asset Detail Page
 * 
 * Displays comprehensive information about a specific asset (stock, ETF, bond, etc.)
 * 
 * Architecture:
 * - Uses useAssetDetail hook for data fetching (no direct fetch in component)
 * - Pure display component (no business logic)
 * - Layout orchestration only
 * 
 * Route: /asset/[ticker]
 */
export default function AssetDetailPage() {
  const params = useParams();
  const ticker = params.ticker as string;
  
  // Use centralized hook for data fetching
  const { data: assetData, isLoading, error, refetch } = useAssetDetail(ticker);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading {ticker?.toUpperCase()} data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-destructive/10 border border-destructive/40 text-destructive px-4 py-3 rounded mb-4">
            <h2 className="font-bold text-lg mb-2">Error Loading Asset</h2>
            <p>{error}</p>
          </div>
          <button 
            onClick={refetch}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!assetData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Destructure data for easier access
  const { asset, quote, typeSpecific, userHoldings, authenticated, profile, riskMeasures } = assetData;

  return (
    <PageLayout>
      <div className="space-y-4">
        {/* Full-width chart at the top */}
        <AssetChart 
          ticker={asset.ticker}
          currentPrice={quote.regularMarketPrice}
          currency={quote.currency}
        />

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Header + Top Actions + Metrics */}
          <div className="lg:col-span-7 space-y-4">
            <AssetHeader 
              asset={asset}
              quote={quote}
              hasHoldings={!!userHoldings}
              authenticated={authenticated}
              profile={profile}
            />

            {authenticated && userHoldings && (
              <UserHoldings 
                ticker={asset.ticker}
                currentPrice={quote.regularMarketPrice}
                currency={quote.currency || 'USD'}
              />
            )}

            <AssetTopActions 
              asset={asset}
              authenticated={authenticated}
              hasHoldings={!!userHoldings}
            />

            {/* Type-specific metrics */}
            {asset.type === 'STOCK' && typeSpecific.stock && (
              <StockMetrics stock={typeSpecific.stock} quote={quote} />
            )}
            {asset.type === 'BOND' && typeSpecific.bond && (
              <BondMetrics 
                bond={{
                  ...typeSpecific.bond,
                  ticker: asset.ticker,
                  name: asset.name,
                  maturityDate: typeSpecific.bond.maturityDate 
                    ? (typeSpecific.bond.maturityDate instanceof Date 
                        ? typeSpecific.bond.maturityDate 
                        : new Date(typeSpecific.bond.maturityDate))
                    : null,
                  duration: riskMeasures?.bond?.durationApprox ?? null,
                }} 
                quote={quote} 
              />
            )}
            {(asset.type === 'MUTUAL_FUND' || asset.type === 'ETF') && typeSpecific.mutualFund && (
              <FundMetrics 
                fund={{
                  ...typeSpecific.mutualFund,
                  ticker: asset.ticker,
                  name: asset.name,
                  inceptionDate: typeSpecific.mutualFund.inceptionDate
                    ? (typeSpecific.mutualFund.inceptionDate instanceof Date
                        ? typeSpecific.mutualFund.inceptionDate
                        : new Date(typeSpecific.mutualFund.inceptionDate))
                    : null,
                  totalAssets: typeSpecific.mutualFund.aum ?? null,
                  category: profile?.category ?? null,
                  investmentObjective: profile?.longBusinessSummary ?? profile?.investmentObjective ?? null,
                }} 
                quote={quote} 
                assetType={asset.type} 
              />
            )}
          </div>

          {/* Right Column: Overview, Risk, News */}
          <div className="lg:col-span-5 space-y-4">
            <AssetOverviewPanel asset={asset} quote={quote} typeSpecific={typeSpecific} profile={profile} />
            <RiskMeasuresPanel riskMeasures={assetData.riskMeasures} assetType={asset.type} />
            <AssetNewsPanel ticker={asset.ticker} assetName={asset.name} />
          </div>
        </div>

        
      </div>
    </PageLayout>
  );
}
