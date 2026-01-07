import { AssetDetailQuote } from '@/types';
import { Formatters } from '@/lib/financial';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
    <Card className="shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">
          {assetType === 'ETF' ? 'ETF' : 'Fund'} Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
      
      {/* Fund Information */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Fund Information</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fund Type:</span>
            <span className="font-medium text-foreground">{getFundTypeDisplay(fund.fundType)}</span>
          </div>
          {fund.category && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium text-foreground">{fund.category}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Inception Date:</span>
            <span className="font-medium text-foreground">{Formatters.date(fund.inceptionDate)}</span>
          </div>
          {yearsSinceInception !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fund Age:</span>
              <span className="font-medium text-foreground">{yearsSinceInception.toFixed(1)} years</span>
            </div>
          )}
        </div>
      </div>

      {/* Cost & Fees */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Cost & Fees</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Expense Ratio:</span>
            <div className="flex items-center">
              <span className="font-medium mr-2 text-foreground">{Formatters.percentage(fund.expenseRatio, { multiplier: 1 })}</span>
              {fund.expenseRatio && (
                <span className={`text-xs px-2 py-1 rounded ${getExpenseRatioColor(fund.expenseRatio)}`}>
                  {getExpenseRatioLabel(fund.expenseRatio)}
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Minimum Investment:</span>
            <span className="font-medium text-foreground">{Formatters.currency(fund.minimumInvestment, { currency: quote.currency || 'USD' })}</span>
          </div>
          {fund.expenseRatio && (
            <div className="text-xs text-muted-foreground mt-1">
              <p>Annual cost per $10,000 invested: {Formatters.currency((fund.expenseRatio || 0) * 100, { currency: quote.currency || 'USD' })}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fund Size & Liquidity */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Fund Size & Liquidity</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Assets (AUM):</span>
            <span className="font-medium text-foreground">{Formatters.marketCap(fund.totalAssets)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trading Volume:</span>
            <span className="font-medium text-foreground">
              {quote.regularMarketVolume 
                ? parseInt(quote.regularMarketVolume).toLocaleString()
                : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">NAV:</span>
            <span className="font-medium text-foreground">{Formatters.price(quote.regularMarketPrice, quote.currency || 'USD')}</span>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Performance</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">52W High:</span>
            <span className="font-medium text-foreground">{Formatters.price(quote.fiftyTwoWeekHigh, quote.currency || 'USD')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">52W Low:</span>
            <span className="font-medium text-foreground">{Formatters.price(quote.fiftyTwoWeekLow, quote.currency || 'USD')}</span>
          </div>
          {quote.dividendYield && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dividend Yield:</span>
              <span className="font-medium text-foreground">{Formatters.percentage(quote.dividendYield, { multiplier: 1 })}</span>
            </div>
          )}
          {quote.beta && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Beta:</span>
              <span className="font-medium text-foreground">{Formatters.number(quote.beta, { decimals: 2 })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Investment Objective */}
      {fund.investmentObjective && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-2">Investment Objective</h4>
          <p className="text-sm text-muted-foreground">{fund.investmentObjective}</p>
        </div>
      )}

      {/* Risk Analysis */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">Risk Analysis</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Cost Risk:</span>
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
              <span className="text-muted-foreground">Size Risk:</span>
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
              <span className="text-muted-foreground">Market Risk (Beta):</span>
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
          
          <div className="text-xs text-muted-foreground mt-2">
            <p>Lower expense ratios generally lead to better long-term returns.</p>
            <p>Larger funds typically have better liquidity and lower tracking error.</p>
            {assetType === 'ETF' && (
              <p>ETFs typically have lower expense ratios than mutual funds.</p>
            )}
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  );
} 