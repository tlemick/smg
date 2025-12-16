'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  OnboardingProgress,
  OnboardingSidebarContent,
  OnboardingSearch,
  SimplifiedBuyForm,
} from '@/components/onboarding';
import { Button, Card, CardContent, Icon } from '@/components/ui';
import { CaretLeftIcon, CaretRightIcon } from '@/components/ui';
import { OnboardingAssetSuggestion } from '@/types';

const BOND_SUGGESTIONS: OnboardingAssetSuggestion[] = [
  {
    ticker: 'AGG',
    name: 'iShares Core U.S. Aggregate Bond ETF',
    reason: 'Broad exposure to U.S. investment-grade bonds with low risk',
    category: 'Bond Fund',
  },
  {
    ticker: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    reason: 'Diversified portfolio of government and corporate bonds',
    category: 'Bond Fund',
  },
  {
    ticker: 'TLT',
    name: 'iShares 20+ Year Treasury Bond ETF',
    reason: 'Long-term U.S. government bonds for stability',
    category: 'Government',
  },
];

const RECOMMENDED_MINIMUM = 10000;

export default function OnboardingBondsPage() {
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isLoadingAsset, setIsLoadingAsset] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [cashBalance, setCashBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<'search' | 'suggestions'>('search');

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/onboarding/status');
      const data = await response.json();
      
      if (data.success) {
        // Show available cash balance
        setCashBalance(data.portfolio.cashBalance);
        // Only update hasPurchased if API confirms they have bonds
        // Don't overwrite if user just made a purchase (prevents button from disabling)
        setHasPurchased(prev => prev || data.portfolio.hasBonds);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleAssetSelect = async (ticker: string) => {
    setIsLoadingAsset(true);
    setSelectedAsset(null);

    try {
      // Get quote for the ticker (this will also create the asset if missing)
      const quoteResponse = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: ticker,
          createAssetIfMissing: true,
        }),
      });
      const quoteData = await quoteResponse.json();

      if (quoteData.success && quoteData.data) {
        setSelectedAsset({
          id: quoteData.data.asset.id,
          ticker: quoteData.data.asset.ticker,
          name: quoteData.data.asset.name,
          currentPrice: quoteData.data.quote.regularMarketPrice,
        });
      } else {
        console.error('Failed to load asset:', quoteData.error);
      }
    } catch (error) {
      console.error('Error loading asset:', error);
    } finally {
      setIsLoadingAsset(false);
    }
  };

  const handlePurchaseSuccess = () => {
    setHasPurchased(true);
    setSelectedAsset(null);
    checkOnboardingStatus();
  };

  const handleComplete = () => {
    router.push('/onboarding/complete');
  };

  const handleBack = () => {
    router.push('/onboarding/mutual-funds');
  };

  const handleSkipToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar */}
      <aside className="w-80 bg-card text-card-foreground border-r border-border flex-shrink-0 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Progress */}
          <OnboardingProgress currentStep="bonds" />

          {/* Cash Balance Only */}
          <OnboardingSidebarContent cashBalance={cashBalance} />
        </div>
      </aside>

      {/* Right Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold mb-1">
              Complete with Bonds 🏦
            </h1>
            <p className="text-muted-foreground">
              Bonds add stability to your portfolio. They're the steady foundation that balances your riskier investments!
            </p>
          </div>

          {/* Tabs */}
          <Card className="overflow-visible">
            {/* Tab Headers */}
            <div className="flex border-b border-border rounded-t-xl overflow-hidden">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'search'
                    ? 'bg-muted text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                🔍 Search
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`flex-1 px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'suggestions'
                    ? 'bg-muted text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                ⭐ Suggestions
              </button>
            </div>

            {/* Tab Content */}
            <CardContent className="p-4">
              {activeTab === 'search' && (
                <div>
                  <h3 className="text-base font-semibold mb-2">
                    Search for Bonds
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Look for government bonds or bond funds that provide stable returns.
                  </p>
                  <OnboardingSearch onSelect={handleAssetSelect} placeholder="Search for bonds (e.g., AGG, BND, TLT)..." />
                </div>
              )}

              {activeTab === 'suggestions' && (
                <div>
                  <h3 className="text-base font-semibold mb-2">
                    Safe Bond Choices
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    These bonds provide stability and reduce portfolio risk.
                  </p>
                  <div className="grid gap-3">
                    {BOND_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion.ticker}
                        onClick={() => handleAssetSelect(suggestion.ticker)}
                        className="text-left p-3 rounded-lg hover:bg-muted transition-colors border border-border"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-semibold mb-1">
                              {suggestion.ticker} - {suggestion.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {suggestion.reason}
                            </div>
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {suggestion.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Buy Form or Placeholder */}
          {isLoadingAsset ? (
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading bond details...</p>
              </CardContent>
            </Card>
          ) : selectedAsset ? (
            <SimplifiedBuyForm
              assetId={selectedAsset.id}
              ticker={selectedAsset.ticker}
              name={selectedAsset.name}
              currentPrice={selectedAsset.currentPrice}
              cashBalance={cashBalance}
              onSuccess={handlePurchaseSuccess}
            />
          ) : (
            <div className="bg-muted rounded-xl p-8 border-2 border-dashed border-border text-center">
              <div className="text-5xl mb-3">👆</div>
              <h4 className="text-lg font-semibold mb-2">
                Select a Bond Investment
              </h4>
              <p className="text-muted-foreground">
                Choose from our suggestions or search to complete your diversified portfolio
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-80 right-0 bg-card text-card-foreground border-t border-border shadow-lg z-50">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-4 justify-between">
            <Button
              onClick={handleBack}
              variant="secondary"
              className="flex items-center"
            >
              <Icon icon={CaretLeftIcon} size="sm" className="mr-2" />
              Back to Mutual Funds
            </Button>
            
            <div className="flex gap-3">
              <Button
                onClick={handleSkipToDashboard}
                variant="secondary"
              >
                Skip to Dashboard
              </Button>

              <Button
                onClick={handleComplete}
                disabled={!hasPurchased}
                className="group flex items-center"
              >
                {hasPurchased ? 'Complete Onboarding! 🎉' : 'Purchase Bonds to Finish'}
                <Icon icon={CaretRightIcon} size="md" className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

