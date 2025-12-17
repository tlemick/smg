'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { BuyOrderForm, TradePage } from '@/components/trading';

interface AssetDetails {
  id: number;
  ticker: string;
  name: string;
  type: string;
  allowFractionalShares: boolean;
  currencyName?: string | null;
}

interface StockQuote {
  regularMarketPrice: number;
  currency: string;
  marketState: string;
  regularMarketPreviousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
}

interface UserCashData {
  cashBalance: number;
}

export default function BuyTradePageWrapper() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useUser();
  const ticker = params.ticker as string;
  const returnTo = searchParams.get('returnTo') || `/asset/${ticker}`;

  const [asset, setAsset] = useState<AssetDetails | null>(null);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [userCash, setUserCash] = useState<UserCashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);

  // Fetch asset details and quote
  useEffect(() => {
    if (!ticker || !user) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch asset details
        const assetResponse = await fetch(`/api/asset-detail/${ticker}`);
        if (!assetResponse.ok) {
          throw new Error('Asset not found');
        }
        const assetData = await assetResponse.json();

        // Fetch current quote
        const quoteResponse = await fetch('/api/quote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticker: ticker,
            useCache: true,
            createAssetIfMissing: false
          }),
        });
        
        if (!quoteResponse.ok) {
          throw new Error('Failed to fetch quote');
        }
        
        const quoteResult = await quoteResponse.json();
        if (!quoteResult.success) {
          throw new Error(quoteResult.error || 'Failed to fetch quote');
        }
        
        const quoteData = quoteResult.data;

        // Fetch user cash balance
        try {
          const portfolioResponse = await fetch('/api/user/portfolio/overview');
          
          if (portfolioResponse.ok) {
            const portfolioData = await portfolioResponse.json();
            
            if (portfolioData.success && portfolioData.data) {
              const cashBalance = portfolioData.data.cashBalance || 0;
              setUserCash({ cashBalance });
            } else {
              // If no portfolio exists, it will be created on first trade with default starting cash
              setUserCash({ cashBalance: 100000 }); // Default starting cash
            }
          } else {
            // Set default starting cash when API fails
            setUserCash({ cashBalance: 100000 });
          }
        } catch (cashError) {
          console.error('Error fetching cash balance:', cashError);
          // Set default starting cash on error
          setUserCash({ cashBalance: 100000 });
        }

        setAsset(assetData.data.asset);
        setQuote(quoteData.quote);
      } catch (err) {
        console.error('Error fetching trade data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load trading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker, user]);

  // Show loading while checking authentication or fetching data
  if (isLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg text-gray-600">Loading trading page...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !asset || !quote) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold font-mono text-gray-900 mb-2">
            Unable to Load Trading Page
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'The asset data could not be loaded. Please try again.'}
          </p>
          <div className="space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push(returnTo)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TradePage
      title={`Buy ${asset.ticker}`}
      subtitle="Place a buy order for this asset"
      asset={{
        ticker: asset.ticker,
        name: asset.name
      }}
      currentPrice={quote.regularMarketPrice}
      currency={quote.currency || 'USD'}
      marketState={quote.marketState}
      quote={{
        regularMarketPreviousClose: quote.regularMarketPreviousClose,
        regularMarketDayHigh: quote.regularMarketDayHigh,
        regularMarketDayLow: quote.regularMarketDayLow,
        regularMarketChange: quote.regularMarketChange,
        regularMarketChangePercent: quote.regularMarketChangePercent
      }}
    >
      <BuyOrderForm
        asset={{
          id: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          type: asset.type,
          allowFractionalShares: asset.allowFractionalShares,
          currencyName: asset.currencyName
        }}
        currentPrice={quote.regularMarketPrice}
        currency={quote.currency || 'USD'}
        marketState={quote.marketState}
        userCashBalance={userCash?.cashBalance}
        returnTo={returnTo}
        onSuccess={(message) => {
          console.log('Buy order success:', message);
        }}
        onError={(error) => {
          console.error('Buy order error:', error);
        }}
      />
    </TradePage>
  );
}