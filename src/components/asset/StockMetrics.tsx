import { AssetDetailQuote } from '@/types';
import { TikTokEmbed } from '@/components/ui/TikTokEmbed';
import { Formatters } from '@/lib/financial';

interface StockMetricsProps {
  stock: {
    id: number;
    ticker: string;
    name: string;
    sector: string | null;
    industry: string | null;
  };
  quote: AssetDetailQuote;
}

export function StockMetrics({ stock, quote }: StockMetricsProps) {

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg p-6">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Metrics</h3>
        <TikTokEmbed storageKey={`tiktok:asset:metrics:stock:${stock.ticker}`} topic="Analysis Skills" />
      </div>
      
      {/* Company Information */}
      {(stock.sector || stock.industry) && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-white mb-2">Company Information</h4>
          <div className="space-y-2">
            {stock.sector && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-white">Sector:</span>
                <span className="font-semibold text-gray-900">{stock.sector}</span>
              </div>
            )}
            {stock.industry && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-white">Industry:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{stock.industry}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Valuation Metrics */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-white mb-2">Valuation</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-white">Market Cap:</span>
            <span className="font-semibold text-gray-900">{Formatters.marketCap(quote.marketCap)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-white">P/E Ratio (TTM):</span>
            <span className="font-semibold text-gray-900">{Formatters.number(quote.trailingPE, { decimals: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-white">Forward P/E:</span>
            <span className="font-semibold text-gray-900">{Formatters.number(quote.forwardPE, { decimals: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-white">Price/Book:</span>
            <span className="font-semibold text-gray-900">{Formatters.number(quote.priceToBook, { decimals: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-white mb-2">Financial</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-white">EPS (TTM):</span>
            <span className="font-semibold text-gray-900">{Formatters.currency(quote.earningsPerShare, { currency: quote.currency || 'USD' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-white">Book Value:</span>
            <span className="font-semibold text-gray-900">{Formatters.currency(quote.bookValue, { currency: quote.currency || 'USD' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-white">Dividend Yield:</span>
            <span className="font-semibold text-gray-900">{Formatters.percentage(quote.dividendYield, { multiplier: 1 })}</span>
          </div>
        </div>
      </div>

      {/* Trading Metrics */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Trading</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Volume:</span>
            <span className="font-semibold text-gray-900">{Formatters.volume(quote.regularMarketVolume)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Beta:</span>
            <span className="font-semibold text-gray-900">{Formatters.number(quote.beta, { decimals: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">52W High:</span>
            <span className="font-semibold text-gray-900">{Formatters.price(quote.fiftyTwoWeekHigh, quote.currency || 'USD')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">52W Low:</span>
            <span className="font-semibold text-gray-900">{Formatters.price(quote.fiftyTwoWeekLow, quote.currency || 'USD')}</span>
          </div>
        </div>
      </div>

      {/* Risk Indicators */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Analysis</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Volatility (Beta):</span>
            <div className="flex items-center">
              <span className="font-semibold text-gray-900 mr-2">{Formatters.number(quote.beta, { decimals: 2 })}</span>
              {quote.beta && (
                <span className={`text-xs px-2 py-1 rounded ${
                  quote.beta < 1 ? 'bg-green-100 text-green-800' :
                  quote.beta < 1.5 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {quote.beta < 1 ? 'Low' : quote.beta < 1.5 ? 'Medium' : 'High'}
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <p>Beta measures volatility relative to the market (S&P 500).</p>
            <p>Beta &lt; 1: Less volatile | Beta &gt; 1: More volatile</p>
          </div>
        </div>
      </div>


    </div>
  );
} 