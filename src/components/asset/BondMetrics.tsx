import { AssetDetailQuote } from '@/types';
import { TikTokEmbed } from '@/components/ui/TikTokEmbed';

interface BondMetricsProps {
  bond: {
    id: number;
    ticker: string;
    name: string;
    maturityDate: Date | null;
    couponRate: number | null;
    yieldToMaturity: number | null;
    duration: number | null;
    creditRating: string | null;
    issuer: string | null;
    bondType: string | null;
  };
  quote: AssetDetailQuote;
}

export function BondMetrics({ bond, quote }: BondMetricsProps) {
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

  const getCreditRatingColor = (rating: string | null) => {
    if (!rating) return 'bg-gray-100 text-gray-800';
    
    const ratingUpper = rating.toUpperCase();
    if (ratingUpper.startsWith('AAA') || ratingUpper.startsWith('AA')) {
      return 'bg-green-100 text-green-800';
    } else if (ratingUpper.startsWith('A') || ratingUpper.startsWith('BBB')) {
      return 'bg-blue-100 text-blue-800';
    } else if (ratingUpper.startsWith('BB') || ratingUpper.startsWith('B')) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  const getBondTypeDisplay = (bondType: string | null) => {
    if (!bondType) return 'N/A';
    return bondType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const calculateYearsToMaturity = (maturityDate: Date | null) => {
    if (!maturityDate) return null;
    const today = new Date();
    const maturity = new Date(maturityDate);
    const years = (maturity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0, years);
  };

  const yearsToMaturity = calculateYearsToMaturity(bond.maturityDate);

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">Bond Metrics</h3>
        <TikTokEmbed storageKey={`tiktok:asset:metrics:bond:${bond.ticker}`} topic="Risk Management" />
      </div>
      
      {/* Bond Information */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Bond Information</h4>
        <div className="space-y-2">
          {bond.issuer && (
            <div className="flex justify-between">
              <span className="text-gray-600">Issuer:</span>
              <span className="font-medium">{bond.issuer}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Bond Type:</span>
            <span className="font-medium">{getBondTypeDisplay(bond.bondType)}</span>
          </div>
          {bond.creditRating && (
            <div className="flex justify-between">
              <span className="text-gray-600">Credit Rating:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCreditRatingColor(bond.creditRating)}`}>
                {bond.creditRating}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Yield & Return */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Yield & Return</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Current Yield:</span>
            <span className="font-medium">{formatPercentage(quote.dividendYield)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Yield to Maturity:</span>
            <span className="font-medium">{formatPercentage(bond.yieldToMaturity)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Coupon Rate:</span>
            <span className="font-medium">{formatPercentage(bond.couponRate)}</span>
          </div>
        </div>
      </div>

      {/* Maturity & Duration */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Maturity & Duration</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Maturity Date:</span>
            <span className="font-medium">{formatDate(bond.maturityDate)}</span>
          </div>
          {yearsToMaturity !== null && (
            <div className="flex justify-between">
              <span className="text-gray-600">Years to Maturity:</span>
              <span className="font-medium">{yearsToMaturity.toFixed(1)} years</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">{formatNumber(bond.duration, 1)} years</span>
          </div>
        </div>
      </div>

      {/* Price Information */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Price Information</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Current Price:</span>
            <span className="font-medium">{formatCurrency(quote.regularMarketPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">52W High:</span>
            <span className="font-medium">{formatCurrency(quote.fiftyTwoWeekHigh)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">52W Low:</span>
            <span className="font-medium">{formatCurrency(quote.fiftyTwoWeekLow)}</span>
          </div>
        </div>
      </div>

      {/* Risk Analysis */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Analysis</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Credit Risk:</span>
            <div className="flex items-center">
              {bond.creditRating && (
                <span className={`text-xs px-2 py-1 rounded ${getCreditRatingColor(bond.creditRating)}`}>
                  {bond.creditRating.toUpperCase().startsWith('AAA') || bond.creditRating.toUpperCase().startsWith('AA') ? 'Very Low' :
                   bond.creditRating.toUpperCase().startsWith('A') || bond.creditRating.toUpperCase().startsWith('BBB') ? 'Low' :
                   bond.creditRating.toUpperCase().startsWith('BB') || bond.creditRating.toUpperCase().startsWith('B') ? 'Medium' : 'High'}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Interest Rate Risk:</span>
            <div className="flex items-center">
              {bond.duration && (
                <span className={`text-xs px-2 py-1 rounded ${
                  bond.duration < 3 ? 'bg-green-100 text-green-800' :
                  bond.duration < 7 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {bond.duration < 3 ? 'Low' : bond.duration < 7 ? 'Medium' : 'High'}
                </span>
              )}
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mt-2">
            <p>Duration measures price sensitivity to interest rate changes.</p>
            <p>Higher duration = higher interest rate risk</p>
            {bond.duration && (
              <p>A 1% rate change could move price by ~{bond.duration.toFixed(1)}%</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 