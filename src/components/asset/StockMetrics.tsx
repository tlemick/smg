import { AssetDetailQuote } from '@/types';
import { Formatters } from '@/lib/financial';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
    <Card className="shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Stock Metrics</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
      
      {/* Company Information */}
      {(stock.sector || stock.industry) && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-2">Company Information</h4>
          <div className="space-y-2">
            {stock.sector && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sector:</span>
                <span className="font-semibold text-foreground">{stock.sector}</span>
              </div>
            )}
            {stock.industry && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Industry:</span>
                <span className="font-semibold text-foreground">{stock.industry}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Valuation Metrics */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Valuation</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Market Cap:</span>
            <span className="font-semibold text-foreground">{Formatters.marketCap(quote.marketCap)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">P/E Ratio (TTM):</span>
            <span className="font-semibold text-foreground">{Formatters.number(quote.trailingPE, { decimals: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Forward P/E:</span>
            <span className="font-semibold text-foreground">{Formatters.number(quote.forwardPE, { decimals: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price/Book:</span>
            <span className="font-semibold text-foreground">{Formatters.number(quote.priceToBook, { decimals: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Financial</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">EPS (TTM):</span>
            <span className="font-semibold text-foreground">{Formatters.currency(quote.earningsPerShare, { currency: quote.currency || 'USD' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Book Value:</span>
            <span className="font-semibold text-foreground">{Formatters.currency(quote.bookValue, { currency: quote.currency || 'USD' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dividend Yield:</span>
            <span className="font-semibold text-foreground">{Formatters.percentage(quote.dividendYield, { multiplier: 1 })}</span>
          </div>
        </div>
      </div>

      {/* Trading Metrics */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Trading</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Volume:</span>
            <span className="font-semibold text-foreground">{Formatters.volume(quote.regularMarketVolume)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Beta:</span>
            <span className="font-semibold text-foreground">{Formatters.number(quote.beta, { decimals: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">52W High:</span>
            <span className="font-semibold text-foreground">{Formatters.price(quote.fiftyTwoWeekHigh, quote.currency || 'USD')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">52W Low:</span>
            <span className="font-semibold text-foreground">{Formatters.price(quote.fiftyTwoWeekLow, quote.currency || 'USD')}</span>
          </div>
        </div>
      </div>

      {/* Risk Indicators */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Risk Analysis</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Volatility (Beta):</span>
            <div className="flex items-center">
              <span className="font-semibold text-foreground mr-2">{Formatters.number(quote.beta, { decimals: 2 })}</span>
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
          <div className="text-xs text-muted-foreground mt-2">
            <p>Beta measures volatility relative to the market (S&P 500).</p>
            <p>Beta &lt; 1: Less volatile | Beta &gt; 1: More volatile</p>
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  );
} 