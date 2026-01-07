import { AssetDetailQuote } from '@/types';
import { Formatters } from '@/lib/financial';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
    <Card className="shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Bond Metrics</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
      
      {/* Bond Information */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Bond Information</h4>
        <div className="space-y-2">
          {bond.issuer && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issuer:</span>
              <span className="font-medium text-foreground">{bond.issuer}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bond Type:</span>
            <span className="font-medium text-foreground">{getBondTypeDisplay(bond.bondType)}</span>
          </div>
          {bond.creditRating && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credit Rating:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCreditRatingColor(bond.creditRating)}`}>
                {bond.creditRating}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Yield & Return */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Yield & Return</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Yield:</span>
            <span className="font-medium text-foreground">{Formatters.percentage(quote.dividendYield, { multiplier: 1 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Yield to Maturity:</span>
            <span className="font-medium text-foreground">{Formatters.percentage(bond.yieldToMaturity, { multiplier: 1 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coupon Rate:</span>
            <span className="font-medium text-foreground">{Formatters.percentage(bond.couponRate, { multiplier: 1 })}</span>
          </div>
        </div>
      </div>

      {/* Maturity & Duration */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Maturity & Duration</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Maturity Date:</span>
            <span className="font-medium text-foreground">{Formatters.date(bond.maturityDate)}</span>
          </div>
          {yearsToMaturity !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Years to Maturity:</span>
              <span className="font-medium text-foreground">{yearsToMaturity.toFixed(1)} years</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium text-foreground">{Formatters.number(bond.duration, { decimals: 1 })} years</span>
          </div>
        </div>
      </div>

      {/* Price Information */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Price Information</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Price:</span>
            <span className="font-medium text-foreground">{Formatters.price(quote.regularMarketPrice, quote.currency || 'USD')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">52W High:</span>
            <span className="font-medium text-foreground">{Formatters.price(quote.fiftyTwoWeekHigh, quote.currency || 'USD')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">52W Low:</span>
            <span className="font-medium text-foreground">{Formatters.price(quote.fiftyTwoWeekLow, quote.currency || 'USD')}</span>
          </div>
        </div>
      </div>

      {/* Risk Analysis */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">Risk Analysis</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Credit Risk:</span>
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
            <span className="text-muted-foreground">Interest Rate Risk:</span>
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
          
          <div className="text-xs text-muted-foreground mt-2">
            <p>Duration measures price sensitivity to interest rate changes.</p>
            <p>Higher duration = higher interest rate risk</p>
            {bond.duration && (
              <p>A 1% rate change could move price by ~{bond.duration.toFixed(1)}%</p>
            )}
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  );
} 