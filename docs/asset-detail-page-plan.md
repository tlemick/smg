# Asset Detail Page Implementation Plan

## Overview
A universal asset detail page that handles stocks, bonds, ETFs, and mutual funds with appropriate metrics and information for each asset type.

## URL Structure & Routing

```
/asset/[ticker] - Dynamic route for all security types

Examples:
- /asset/AAPL → Apple Inc. (Stock)
- /asset/BND → Vanguard Total Bond Market ETF
- /asset/VTSAX → Vanguard Total Stock Market Index Fund
- /asset/AGG → iShares Core U.S. Aggregate Bond ETF
- /asset/GOVT → iShares U.S. Treasury Bond ETF
```

## File Structure

```
src/app/asset/
├── [ticker]/
│   └── page.tsx              # Main asset detail page

src/components/asset/
├── index.ts                  # Export all asset components
├── AssetHeader.tsx           # Universal price/NAV, change, overview
├── AssetChart.tsx            # Price/NAV history chart
├── CompanyInfo.tsx           # For stocks - business description
├── BondInfo.tsx              # For bonds - yield, duration, rating
├── FundInfo.tsx              # For funds - holdings, manager, strategy
├── StockMetrics.tsx          # P/E, market cap, dividends
├── BondMetrics.tsx           # Yield, duration, credit rating
├── FundMetrics.tsx           # Expense ratio, AUM, benchmark
├── RiskAnalysis.tsx          # Universal risk component (adapts by type)
├── UserHoldings.tsx          # User's position (universal)
└── AssetActions.tsx          # Buy/Sell/Watch (adapts by type)
```

## Asset Type Detection

### Yahoo Finance Asset Types
```javascript
const assetTypeMapping = {
  quoteType: {
    'EQUITY': 'Stock',
    'ETF': 'Exchange-Traded Fund', 
    'MUTUALFUND': 'Mutual Fund',
    'BOND': 'Bond',
    'INDEX': 'Index Fund'
  }
};
```

### Component Rendering Logic
```typescript
// Detect asset type from Yahoo Finance API response
{assetType === 'EQUITY' && <StockMetrics />}
{assetType === 'BOND' && <BondMetrics />}
{['MUTUALFUND', 'ETF', 'INDEX'].includes(assetType) && <FundMetrics />}
```

## Page Layout (Vertical Scroll)

```
┌─────────────────────────────────────┐
│ Navigation (same as other pages)    │
├─────────────────────────────────────┤
│ 📊 Asset Header (Universal)         │
│ • Price/NAV, change, volume/AUM     │
│ • Asset name, type, exchange        │
│ • Action buttons (Buy/Sell/Watch)   │
├─────────────────────────────────────┤
│ 📈 Chart (Universal)                │
│ • Price/NAV history                 │
│ • Timeframe selector               │
├─────────────────────────────────────┤
│ 🏢 Asset Information (Type-Specific)│
│ • Stock: Company details            │
│ • Bond: Issuer & terms             │ 
│ • Fund: Strategy & holdings        │
├─────────────────────────────────────┤
│ 📊 Key Metrics (Type-Specific)      │
│ • Stock: P/E, Market Cap, EPS      │
│ • Bond: Yield, Duration, Rating    │
│ • Fund: Expense Ratio, Benchmark   │
├─────────────────────────────────────┤
│ ⚠️ Risk Analysis (Adapted)          │
│ • Stock: Beta, volatility          │
│ • Bond: Credit & interest rate risk│
│ • Fund: Category risk, tracking    │
├─────────────────────────────────────┤
│ 💼 Your Holdings (Universal)        │
│ • Current position, cost basis     │
│ • P&L, allocation percentage       │
└─────────────────────────────────────┘
```

## Asset-Specific Data & Metrics

### 📈 Stocks (EQUITY)
- **Price Data**: Current price, market cap, P/E ratio, EPS
- **Risk Metrics**: Beta, volatility, sector correlation
- **Fundamentals**: Revenue, profit margins, debt ratios
- **Dividends**: Yield, payout ratio, ex-dividend dates
- **Company Info**: Business description, sector, industry
- **Trading**: Volume, 52-week range, average volume

### 🏦 Bonds (BOND)
- **Price Data**: Current price, yield to maturity, duration
- **Risk Metrics**: Credit rating, interest rate sensitivity
- **Details**: Maturity date, coupon rate, issuer information
- **Credit Analysis**: Default probability, sector risk
- **Bond Specifics**: Accrued interest, call features

### 📊 Mutual Funds/ETFs
- **Price Data**: NAV, expense ratio, assets under management
- **Risk Metrics**: Category risk, fund volatility vs benchmark
- **Holdings**: Top holdings, sector allocation, geographic distribution
- **Performance**: 1Y/3Y/5Y returns vs benchmark, fund manager tenure
- **Fund Details**: Investment objective, strategy, minimum investment

## Data Sources & API Integration

### 1. Yahoo Finance API (Real-time)
- Current price/NAV, volume, market data
- Historical price data for charts
- Company/fund fundamentals and ratios
- Asset type detection (quoteType field)

### 2. Our Database
- Stored asset information
- User's current holdings for this ticker
- User transaction history

### 3. New API Endpoints Needed

```
GET /api/asset-detail/[ticker]
  - Comprehensive asset data combining Yahoo + DB
  - Response varies by asset type
  
GET /api/user/holdings/[ticker]
  - User's position in this asset
  - Cost basis, quantity, P&L
```

## Navigation Integration

### From Search Results
```typescript
// In OverviewSection.tsx search results
<Link href={`/asset/${quote.symbol}`}>
  <div>
    <h4>{quote.symbol} - {quote.shortname}</h4>
    <span className="text-xs text-gray-500">{quote.quoteType}</span>
  </div>
</Link>
```

### From Watchlists/Portfolio
```typescript
// In WatchlistsPreview.tsx  
<Link href={`/asset/${stock.symbol}`}>
  <h3>{stock.symbol}</h3>
  <p>{stock.name}</p>
</Link>
```

### From Direct URLs
- Users can bookmark `/asset/AAPL`
- Share links to specific assets
- SEO-friendly URLs

## Implementation Phases

### Phase 1: Basic Structure ✅ COMPLETE
- [x] Create `/asset/[ticker]` dynamic route ✅
- [x] Build AssetHeader component with universal data ✅
- [x] Integrate with existing Yahoo Finance API ✅
- [x] Built comprehensive component suite (AssetChart, StockMetrics, BondMetrics, FundMetrics, UserHoldings) ✅
- [x] Test with stocks (AAPL loading successfully) ✅

**Components Implemented:**
- `AssetHeader` - Universal price display with action buttons, market status, quick stats
- `AssetChart` - Interactive price history with timeframe selection (simplified version)
- `StockMetrics` - P/E ratios, market cap, dividends, beta, sector/industry info
- `BondMetrics` - Yield, duration, credit rating, maturity analysis
- `FundMetrics` - Expense ratios, AUM, fund manager info, risk analysis
- `UserHoldings` - Position tracking, P&L calculations, portfolio breakdown

### Phase 1.5: Missing API Endpoints ✅ COMPLETE 
**Reasoning**: Before building frontend components, we need clean, purpose-built API endpoints that aggregate existing services. This prevents tight coupling between frontend and multiple backend services, provides better error handling, and creates a unified data interface for the asset detail page.

- [x] **Create `/api/asset-detail/[ticker]/route.ts`** - Comprehensive asset detail endpoint ✅
  - Combines `createAssetFromTicker()` + `getAssetQuoteWithCache()` + asset relations
  - Single call provides all asset data needed for the detail page
  - Handles authentication to include user holdings
  - Returns standardized response format for frontend consumption
  
- [x] **Create `/api/user/holdings/[ticker]/route.ts`** - User position summary ✅
  - Queries user's `Holding` records for specific asset
  - Calculates P&L using current market price vs cost basis
  - Aggregates across portfolios if user has multiple
  - Returns position summary with unrealized gains/losses

**API Endpoints Implemented & Tested:**
- `GET /api/asset-detail/[ticker]` - Complete asset data + user holdings if authenticated ✅
- `GET /api/user/holdings/[ticker]` - Detailed user position summary with P&L calculations ✅

**Test Results:**
- ✅ Asset creation from ticker works (tested with AAPL)
- ✅ Real-time quote data integration working
- ✅ Type-specific asset data (stock/bond/fund) loading correctly
- ✅ User authentication detection working
- ✅ User holdings calculation working (returns empty when not authenticated)
- ✅ Comprehensive TypeScript types added
- ✅ Resolved Next.js dynamic route conflict (moved from `/api/asset/[ticker]` to `/api/asset-detail/[ticker]`)

### Phase 2: Asset Type Detection
- [ ] Implement asset type detection from Yahoo API
- [ ] Create type-specific metric components
- [ ] Test with different asset types:
  - Stocks: AAPL, TSLA
  - ETFs: BND, SPY  
  - Mutual Funds: VTSAX, FXNAX

### Phase 3: Charts & Visualization
- [ ] Implement AssetChart component
- [ ] Add timeframe selector (1D, 1W, 1M, 1Y, 5Y)
- [ ] Handle different data frequencies
- [ ] Test chart rendering for all asset types

### Phase 4: User Holdings Integration
- [ ] Create database schema for user holdings
- [ ] Build UserHoldings component
- [ ] Implement holdings API endpoints
- [ ] Show user's position, cost basis, P&L

### Phase 5: Risk Analysis
- [ ] Implement RiskAnalysis component
- [ ] Asset-specific risk calculations:
  - Stocks: Beta, volatility
  - Bonds: Duration, credit risk
  - Funds: Tracking error, category risk

### Phase 6: Advanced Features
- [ ] News integration for assets
- [ ] Price alerts functionality
- [ ] Historical performance comparison
- [ ] Technical indicators (optional)

## Testing Strategy

### Asset Type Coverage
```
Stocks to test:
- AAPL (Large cap tech)
- KO (Dividend stock)
- TSLA (High volatility)

ETFs to test:
- SPY (S&P 500)
- BND (Bond ETF)
- VTI (Total market)

Mutual Funds to test:
- VTSAX (Index fund)
- FXNAX (Mutual fund)

Bonds to test:
- Individual Treasury bonds
- Corporate bonds (if available)
```

### User Experience Testing
- [ ] Navigation flow from search → asset page
- [ ] Loading states and error handling
- [ ] Mobile responsiveness
- [ ] Data accuracy verification
- [ ] Performance with different asset types

## Technical Considerations

### Performance
- Cache Yahoo Finance API responses
- Optimize chart rendering for mobile
- Lazy load community data
- Progressive loading of asset details

### Error Handling
- Invalid ticker symbols
- Yahoo Finance API failures
- Missing asset type data
- Network timeouts

### SEO & Accessibility
- Meta tags for each asset page
- Proper heading structure
- Alt tags for charts/graphics
- Keyboard navigation support

## Future Enhancements

### Advanced Analytics
- Technical analysis tools
- Fundamental analysis metrics
- Peer comparison features
- Risk-adjusted returns

### Social Features
- User comments/notes on assets
- Community sentiment indicators
- Social trading insights
- Following other users' holdings

### Portfolio Integration
- "Add to Portfolio" simulation
- Impact analysis on portfolio
- Diversification suggestions
- Rebalancing recommendations

## Notes
- Start with Phase 1 and test thoroughly before moving to Phase 2
- Focus on data accuracy and user experience over advanced features initially
- Consider rate limiting for Yahoo Finance API calls
- Plan for caching strategy from the beginning 