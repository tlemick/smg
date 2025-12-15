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
import { MainNavigation } from '@/components/navigation';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {ticker?.toUpperCase()} data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h2 className="font-bold text-lg mb-2">Error Loading Asset</h2>
            <p>{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!assetData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-neutral-300">No data available</p>
      </div>
    );
  }

  const { asset, quote, typeSpecific, userHoldings, authenticated, profile } = assetData;

  return (
    <div className="min-h-screen pb-10">
      <MainNavigation />
      <PageLayout>
        <div className="space-y-4">
          {/* Full-width chart at the top */}
          <AssetChart 
            ticker={asset.ticker}
            currentPrice={quote.regularMarketPrice}
            currency={quote.currency}
            assetName={asset.name}
            overlayActions={{
              asset: { id: asset.id, ticker: asset.ticker, name: asset.name, allowFractionalShares: asset.allowFractionalShares },
              authenticated: authenticated,
              hasHoldings: !!userHoldings,
            }}
          />

          

          {/* Two-column info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AssetOverviewPanel 
              asset={asset}
              quote={quote}
              typeSpecific={typeSpecific}
              profile={profile}
            />

            <RiskMeasuresPanel 
              riskMeasures={assetData.riskMeasures}
              assetType={asset.type}
            />
          </div>

          {/* News panel - responsive layout */}
          <div className="w-full">
            <AssetNewsPanel 
              ticker={asset.ticker}
              assetName={asset.name}
            />
          </div>

        </div>
      </PageLayout>
    </div>
  );
} 