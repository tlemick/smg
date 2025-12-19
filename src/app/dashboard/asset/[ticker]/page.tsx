'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AssetDetailApiResponse, AssetDetailData } from '@/types';
import { AssetHeader } from '@/components/asset/AssetHeader';
import { AssetChart } from '@/components/asset/AssetChart';
import { AssetTopActions, AssetOverviewPanel, RiskMeasuresPanel, AssetNewsPanel } from '@/components/asset';
import { StockMetrics } from '@/components/asset/StockMetrics';
import { BondMetrics } from '@/components/asset/BondMetrics';
import { FundMetrics } from '@/components/asset/FundMetrics';
import { UserHoldings } from '@/components/asset/UserHoldings';
import { PageLayout } from '@/components/layout/PageLayout';
import { TikTokLessons } from '@/components/dashboard/TikTokLessons';

export default function AssetDetailPage() {
  const params = useParams();
  const ticker = params.ticker as string;
  const [assetData, setAssetData] = useState<AssetDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    const fetchAssetData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/asset-detail/${ticker.toUpperCase()}`);
        const result: AssetDetailApiResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch asset data');
        }

        setAssetData(result.data || null);
      } catch (err) {
        console.error('Error fetching asset data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAssetData();
  }, [ticker]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading {ticker?.toUpperCase()} data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-destructive/10 border border-destructive/40 text-destructive px-4 py-3 rounded mb-4">
            <h2 className="font-bold text-lg mb-2">Error Loading Asset</h2>
            <p>{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!assetData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const { asset, quote, typeSpecific, userHoldings, authenticated, profile } = assetData;

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
              ticker={asset.ticker}
              name={asset.name}
              type={asset.type}
              quote={quote}
              profile={profile}
            />

            {authenticated && userHoldings && (
              <UserHoldings holdings={userHoldings} />
            )}

            <AssetTopActions 
              ticker={asset.ticker}
              name={asset.name}
              authenticated={authenticated}
            />

            {/* Type-specific metrics */}
            {asset.type === 'STOCK' && typeSpecific && (
              <StockMetrics stock={typeSpecific} />
            )}
            {asset.type === 'BOND' && typeSpecific && (
              <BondMetrics bond={typeSpecific} />
            )}
            {(asset.type === 'MUTUAL_FUND' || asset.type === 'ETF') && typeSpecific && (
              <FundMetrics fund={typeSpecific} />
            )}
          </div>

          {/* Right Column: Overview, Risk, News */}
          <div className="lg:col-span-5 space-y-4">
            <AssetOverviewPanel asset={asset} quote={quote} profile={profile} />
            <RiskMeasuresPanel asset={asset} quote={quote} profile={profile} />
            <AssetNewsPanel ticker={asset.ticker} name={asset.name} />
          </div>
        </div>

        {/* Full-width lessons at the bottom */}
        <div className="mt-8">
          <TikTokLessons />
        </div>
      </div>
    </PageLayout>
  );
}

