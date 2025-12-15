'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  OnboardingProgress,
  OnboardingSidebarContent,
  OnboardingSearch,
  SimplifiedBuyForm,
} from '@/components/onboarding';
import { CaretRightIcon, Icon } from '@/components/ui';
import { OnboardingAssetSuggestion } from '@/types';

const STOCK_SUGGESTIONS: OnboardingAssetSuggestion[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    reason: 'Leading technology company known for iPhone, Mac, and innovative products',
    category: 'Technology',
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    reason: 'Software giant behind Windows, Office, and growing cloud services',
    category: 'Technology',
  },
  {
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    reason: 'Healthcare leader with consumer products, pharmaceuticals, and medical devices',
    category: 'Healthcare',
  },
  {
    ticker: 'KO',
    name: 'The Coca-Cola Company',
    reason: 'Global beverage icon with strong brand recognition and steady dividends',
    category: 'Consumer',
  },
];

const RECOMMENDED_MINIMUM = 10000;

export default function OnboardingStocksPage() {
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isLoadingAsset, setIsLoadingAsset] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [cashBalance, setCashBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<'search' | 'suggestions'>('search');

  // Check if user already has stocks
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/onboarding/status');
      const data = await response.json();
      
      if (data.success) {
        // Show actual portfolio cash balance
        setCashBalance(data.portfolio.cashBalance || 0);
        // Only update hasPurchased if API confirms they have stocks
        // Don't overwrite if user just made a purchase (prevents button from disabling)
        setHasPurchased(prev => prev || data.portfolio.hasStocks);
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
    checkOnboardingStatus(); // Refresh balance
  };

  const handleContinue = () => {
    router.push('/onboarding/mutual-funds');
  };

  const handleSkipToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar */}
      <aside className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Progress */}
          <OnboardingProgress currentStep="stocks" />

          {/* Cash Balance Only */}
          <OnboardingSidebarContent cashBalance={cashBalance} />
        </div>
      </aside>

      {/* Right Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              Let's Start with Stocks 📈
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Stocks are the foundation of most investment portfolios. Let's find some companies you believe in!
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-visible">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 rounded-t-xl overflow-hidden">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'search'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                🔍 Search
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`flex-1 px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'suggestions'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                ⭐ Suggestions
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'search' && (
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Search for Any Stock
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Type a company name or ticker symbol to find stocks.
                  </p>
                  <OnboardingSearch onSelect={handleAssetSelect} placeholder="Search for stocks (e.g., Apple, TSLA)..." />
                </div>
              )}

              {activeTab === 'suggestions' && (
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Popular Picks for Beginners
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    These companies are well-known and great for starting your portfolio.
                  </p>
                  <div className="grid gap-3">
                    {STOCK_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion.ticker}
                        onClick={() => handleAssetSelect(suggestion.ticker)}
                        className="text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                              {suggestion.ticker} - {suggestion.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {suggestion.reason}
                            </div>
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
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
            </div>
          </div>

          {/* Buy Form or Placeholder */}
          {isLoadingAsset ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading asset details...</p>
            </div>
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
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
              <div className="text-5xl mb-3">👆</div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                Select a Stock to Get Started
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Click on any stock from the sidebar or search to begin investing
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-80 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-4 justify-end">
            <button
              onClick={handleSkipToDashboard}
              className="px-5 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Skip to Dashboard
            </button>

            <button
              onClick={handleContinue}
              disabled={!hasPurchased}
              className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {hasPurchased ? 'Continue to Mutual Funds' : 'Purchase a Stock to Continue'}
              <Icon icon={CaretRightIcon} size="md" className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

