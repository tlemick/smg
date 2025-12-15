import { AssetDetailQuote } from '@/types';
import { TikTokEmbed } from '@/components/ui/TikTokEmbed';

interface FundMetricsProps {
  fund: {
    id: number;
    ticker: string;
    name: string;
    fundType: string | null;
    expenseRatio: number | null;
    minimumInvestment: number | null;
    inceptionDate: Date | null;
    totalAssets: number | null;
    category: string | null;
    investmentObjective: string | null;
  };
  quote: AssetDetailQuote;
  assetType: string;
}

export function FundMetrics({ fund, quote, assetType }: FundMetricsProps) {
  const formatNumber = (num: number | undefined | null, decimals = 2) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (num: number | undefined | null) => {
    if (num === undefined || num === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: quote.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatPercentage = (num: number | undefined | null) => {
    if (num === undefined || num === null) return 'N/A';
    return `${num.toFixed(2)}%`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const formatAssets = (assets: number | null) => {
    if (!assets) return 'N/A';
    if (assets >= 1e12) return `$${(assets / 1e12).toFixed(1)}T`;
    if (assets >= 1e9) return `$${(assets / 1e9).toFixed(1)}B`;
    if (assets >= 1e6) return `$${(assets / 1e6).toFixed(1)}M`;
    return `$${assets.toLocaleString()}`;
  };

  const getExpenseRatioColor = (ratio: number | null) => {
    if (!ratio) return 'bg-gray-100 text-gray-800';
    
    if (ratio < 0.2) return 'bg-green-100 text-green-800';
    if (ratio < 0.5) return 'bg-yellow-100 text-yellow-800';
    if (ratio < 1.0) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getExpenseRatioLabel = (ratio: number | null) => {
    if (!ratio) return 'N/A';
    if (ratio < 0.2) return 'Very Low';
    if (ratio < 0.5) return 'Low';
    if (ratio < 1.0) return 'Moderate';
    return 'High';
  };

  const getFundTypeDisplay = (fundType: string | null) => {
    if (!fundType) return assetType === 'ETF' ? 'ETF' : 'Mutual Fund';
    return fundType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const calculateYearsSinceInception = (inceptionDate: Date | null) => {
    if (!inceptionDate) return null;
    const today = new Date();
    const inception = new Date(inceptionDate);
    const years = (today.getTime() - inception.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0, years);
  };

  const yearsSinceInception = calculateYearsSinceInception(fund.inceptionDate);

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {assetType === 'ETF' ? 'ETF' : 'Fund'} Metrics
        </h3>
        <TikTokEmbed storageKey={`tiktok:asset:metrics:fund:${fund.ticker}`} topic="Portfolio Strategy" />
      </div>
      
      {/* Fund Information */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Fund Information</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Fund Type:</span>
            <span className="font-medium">{getFundTypeDisplay(fund.fundType)}</span>
          </div>
          {fund.category && (
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium">{fund.category}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Inception Date:</span>
            <span className="font-medium">{formatDate(fund.inceptionDate)}</span>
          </div>
          {yearsSinceInception !== null && (
            <div className="flex justify-between">
              <span className="text-gray-600">Fund Age:</span>
              <span className="font-medium">{yearsSinceInception.toFixed(1)} years</span>
            </div>
          )}
        </div>
      </div>

      {/* Cost & Fees */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Cost & Fees</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Expense Ratio:</span>
            <div className="flex items-center">
              <span className="font-medium mr-2">{formatPercentage(fund.expenseRatio)}</span>
              {fund.expenseRatio && (
                <span className={`text-xs px-2 py-1 rounded ${getExpenseRatioColor(fund.expenseRatio)}`}>
                  {getExpenseRatioLabel(fund.expenseRatio)}
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Minimum Investment:</span>
            <span className="font-medium">{formatCurrency(fund.minimumInvestment)}</span>
          </div>
          {fund.expenseRatio && (
            <div className="text-xs text-gray-500 mt-1">
              <p>Annual cost per $10,000 invested: {formatCurrency(fund.expenseRatio * 100)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fund Size & Liquidity */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Fund Size & Liquidity</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Assets (AUM):</span>
            <span className="font-medium">{formatAssets(fund.totalAssets)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Trading Volume:</span>
            <span className="font-medium">
              {quote.regularMarketVolume 
                ? parseInt(quote.regularMarketVolume).toLocaleString()
                : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">NAV:</span>
            <span className="font-medium">{formatCurrency(quote.regularMarketPrice)}</span>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Performance</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">52W High:</span>
            <span className="font-medium">{formatCurrency(quote.fiftyTwoWeekHigh)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">52W Low:</span>
            <span className="font-medium">{formatCurrency(quote.fiftyTwoWeekLow)}</span>
          </div>
          {quote.dividendYield && (
            <div className="flex justify-between">
              <span className="text-gray-600">Dividend Yield:</span>
              <span className="font-medium">{formatPercentage(quote.dividendYield)}</span>
            </div>
          )}
          {quote.beta && (
            <div className="flex justify-between">
              <span className="text-gray-600">Beta:</span>
              <span className="font-medium">{formatNumber(quote.beta)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Investment Objective */}
      {fund.investmentObjective && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Investment Objective</h4>
          <p className="text-sm text-gray-600">{fund.investmentObjective}</p>
        </div>
      )}

      {/* Risk Analysis */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Analysis</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Cost Risk:</span>
            <div className="flex items-center">
              {fund.expenseRatio && (
                <span className={`text-xs px-2 py-1 rounded ${getExpenseRatioColor(fund.expenseRatio)}`}>
                  {getExpenseRatioLabel(fund.expenseRatio)}
                </span>
              )}
            </div>
          </div>
          
          {fund.totalAssets && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Size Risk:</span>
              <div className="flex items-center">
                <span className={`text-xs px-2 py-1 rounded ${
                  fund.totalAssets > 1e9 ? 'bg-green-100 text-green-800' :
                  fund.totalAssets > 1e8 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {fund.totalAssets > 1e9 ? 'Low' : fund.totalAssets > 1e8 ? 'Medium' : 'High'}
                </span>
              </div>
            </div>
          )}
          
          {quote.beta && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Market Risk (Beta):</span>
              <div className="flex items-center">
                <span className={`text-xs px-2 py-1 rounded ${
                  quote.beta < 0.8 ? 'bg-green-100 text-green-800' :
                  quote.beta < 1.2 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {quote.beta < 0.8 ? 'Low' : quote.beta < 1.2 ? 'Medium' : 'High'}
                </span>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-2">
            <p>Lower expense ratios generally lead to better long-term returns.</p>
            <p>Larger funds typically have better liquidity and lower tracking error.</p>
            {assetType === 'ETF' && (
              <p>ETFs typically have lower expense ratios than mutual funds.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 