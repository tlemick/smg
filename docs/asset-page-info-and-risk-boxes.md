## Asset Page: Overview & Risk Panels Plan

### Goal
Add two equal-width info boxes directly below the `AssetChart` on `src/app/asset/[ticker]/page.tsx`:
- **Left: Asset Overview** — dynamic, type-aware basics (Stock, Bond, Mutual Fund/ETF/Index).
- **Right: Risk & Learning** — core risk measures (pulled/calculated from real data) with simple, teen-friendly explanations. (The explanation will come in the form of the TikTok video component that we will embed at the bottom of the info box.)

This is for a real-data simulation geared toward teens learning markets.

### Current State (as of this doc)
- `AssetDetailPage` renders `AssetChart`, `AssetHeader`, then conditional metric components and a generic "Asset Information" box.
- API: `GET /api/asset-detail/[ticker]` returns `asset`, `quote`, `typeSpecific`, `profile`, `userHoldings`, `authenticated`.
- Data sources via `src/lib/yahoo-finance-service.ts`:
  - Quotes with short TTL cache (`getAssetQuoteWithCache`)
  - `quoteSummary` for profile/beta when available (`syncAssetProfile`)
  - Direct chart data (`getChartDataDirect`) for historical series

### UX Layout
- Place a responsive 2-column grid beneath `AssetChart`.
  - On small screens: stack vertically; on md+ screens: two equal columns.
  - Each box is a card with a clear title and compact rows.
  - Each box will contain a tiktok video button at the bottom right that will trigger a popup that will explain the boxes contents.

Proposed structure on `AssetDetailPage` (conceptual):
- `AssetChart`
- Grid (2 cols):
  - Left: `AssetOverviewPanel` (type-aware)
  - Right: `RiskMeasuresPanel` (computed + sourced) Also type aware as Bonds will have different risks than Stocks, etc.

### Asset Overview (Left Box)
- Common rows: Name, Type, Market/Exchange, Currency, Fractional Shares.
- Type-specific rows:
  - **Stock**: Sector, Industry, Market Cap, Shares Outstanding (if available).
  - **ETF/Index**: Category or Index Type, AUM (if available), Expense Ratio (if available), Exchange.
  - **Mutual Fund**: Fund Family, Category, AUM/Total Assets, Expense Ratio.
  - **Bond**: Issuer, Maturity Date, Coupon, Face Value, Payment Frequency.
- Use existing `typeSpecific` data; fill gaps from `profile` and `quote` where possible.

### Risk & Learning (Right Box)
- Show simple, comparable metrics plus brief explanations and what they mean to the learner.
- Common metrics (for all types, via price series):
  - **Volatility (30D, 90D)**: Annualized from daily returns.
  - **Max Drawdown (YTD/1Y)**: Peak-to-trough percentage.
  - **52W Range Position**: Where today sits within 52W low/high.
  - **Downside Days % (90D)**: % days with negative returns.
  - **Sharpe (proxy)** with simple risk-free assumption (documented).
- Type-specific:
  - **Stock**: Beta (vs benchmark), P/E (trailing/forward), Dividend Yield.
  - **ETF/Index**: Beta (if meaningful), Expense Ratio (if available), Tracking range note (educational, no precise tracking error unless sourced).
  - **Mutual Fund**: Expense Ratio, Category Risk Note, Volatility/Drawdown.
  - **Bond**: Duration (approx), Yield to Maturity (if available), Rate Sensitivity hint ("≈ Duration% per 1% rate move").

### Data & Sources
- Yahoo Finance via `yahoo-finance2`:
  - `quote()` — price, 52W stats, PE, dividend, market cap, shares outstanding.
  - `quoteSummary()` — `defaultKeyStatistics`, `assetProfile`, `summaryProfile` for beta, book value, description, etc.
  - `chart()` (via `getChartDataDirect`) — time series for realized volatility and drawdown.
- Benchmarks for beta:
  - US Equities: `SPY` (or `^GSPC`);
  - Bonds: `AGG` (if computing beta-like correlation, otherwise skip for bonds and use duration-based risk);
  - Funds/Index: choose nearest benchmark by type.

### API/Backend Plan
- Option A (preferred): extend `GET /api/asset-detail/[ticker]` to include `riskMeasures`. USE
- Option B: new `GET /api/asset-risk/[ticker]` route consumed in parallel. DO NOT USE!

Recommended: extend existing route to keep the page to a single fetch and centralize caching. YES

Add `src/lib/risk-metrics-service.ts`:
- `getBenchmarkTickerForAsset(asset): string`
- `computeDailyReturns(series): number[]`
- `annualizeVolatility(dailyReturns): number`
- `maxDrawdown(series): { value: number; start: Date; end: Date }`
- `betaVsBenchmark(assetReturns, benchmarkReturns): number | null`
- `sharpeRatio(dailyReturns, riskFreeDaily): number | null` (document assumptions)
- `positionInRange(today, low, high): number`
- `approximateDuration(coupon, ytm, maturityYears): number | null` (fallback if bond lacks data)

Caching Strategy:
- Reuse `QUOTE_CACHE_TTL` concepts for short-lived risk computations.
- Consider adding a small in-memory or persisted cache keyed by `(ticker, window)` for volatility/drawdown.

### Frontend Components
- `src/components/asset/AssetOverviewPanel.tsx` (new)
  - Props: `asset`, `quote`, `typeSpecific`, `profile`.
  - Renders type-aware rows.
- `src/components/asset/RiskMeasuresPanel.tsx` (new)
  - Props: `riskMeasures`, `assetType`.
  - Renders common + type-specific metrics with tooltips.
- Update `src/app/asset/[ticker]/page.tsx`:
  - Insert the 2-column grid below `AssetChart`.
  - If API extended: destructure `riskMeasures` from response.
  - If separate API: call in `useEffect` after asset detail fetch.

### Calculations Detail
- Volatility: daily log returns over window (30/90 sessions), annualize by `sqrt(252)`.
- Max Drawdown: iterate cumulative peaks and track troughs (windowed periods).
- Beta: regress asset daily returns on benchmark returns (OLS slope); fall back to `profile.beta` if insufficient data.
- Sharpe (optional): `(mean(dailyReturns) - rfDaily) / std(dailyReturns) * sqrt(252)` with displayed note about the assumption.
- 52W Range Position: `(price - low) / (high - low)`; clamp 0–1.
- Duration Approx (bonds): simple Macaulay/modified approximation based on coupon, YTM, maturity if provided; otherwise skip gracefully.

### Teen-Friendly Learning UX
- Use consistent color cues:
  - Higher volatility/drawdown: warn color
  - Lower volatility/drawdown: neutral/positive
- Include a small "Name explains X" button to a TikTok-style lesson (`TikTokLessons`) when available.

### Edge Cases & Fallbacks
- Missing fields from Yahoo: show "N/A" and a tooltip explaining data unavailability.
- Insufficient history: compute on the largest available window; display badge "Limited Data".
- Delisted/inactive: show a disabled state card.
- Bonds without reliable profile: show only rate-sensitivity explainer; hide duration card if not computable.

### Implementation Steps
1) Add `src/lib/risk-metrics-service.ts` with pure functions and simple tests.
2) Extend `GET /api/asset-detail/[ticker]` to fetch history + benchmark (short windows) and return `riskMeasures`.
3) Create `AssetOverviewPanel.tsx` and `RiskMeasuresPanel.tsx`.
4) Update `AssetDetailPage` layout to render the two panels beneath `AssetChart`.
5) Add educational tooltips and copy.
6) Optimize with lightweight caching / memoization.

### Proposed `riskMeasures` shape (API)
```
riskMeasures: {
  common: {
    volatility30d: number | null,
    volatility90d: number | null,
    maxDrawdown1y: number | null,
    range52wPosition: number | null,
    downsideDays90dPct: number | null,
    sharpe90d: number | null
  },
  stock?: {
    beta: number | null,
    trailingPE: number | null,
    forwardPE: number | null,
    dividendYield: number | null
  },
  fund?: {
    expenseRatio: number | null
  },
  etf?: {
    expenseRatio: number | null
  },
  index?: {},
  bond?: {
    durationApprox: number | null,
    yieldToMaturity: number | null
  }
}
```

### Testing Plan
- Unit (pure calc): `risk-metrics-service`
  - Volatility annualization correctness with known series
  - Max drawdown detection on contrived sequence
  - Beta against synthetic benchmark (known slope)
  - 52W range position clamping and edge cases
  - Duration approximation sanity checks
- API Integration: `GET /api/asset-detail/[ticker]`
  - Returns `riskMeasures` for liquid stock (e.g., AAPL)
  - Handles insufficient data gracefully (newly added tickers)
  - Falls back to `profile.beta` when regression not possible
- UI
  - Component render with full data and with missing fields
  - Tooltips presence and copy correctness
  - Responsive grid (stack on small screens, two columns on md+)
- E2E/Manual
  - Smoke test for tickers across types (Stock, ETF, Mutual Fund, Bond, Index)
  - Performance check: page load still quick (risk computations bounded)
  - Visual check: colors and labels are intuitive for teens

### Rollout & Observability
- Behind a feature flag initially if needed.
- Log timing for risk computation and cache hits.
- Monitor API error rates for `quoteSummary` and `chart` calls.

### Acceptance Criteria
- Two equal-width panels render below `AssetChart` on md+ screens (stack on small).
- `riskMeasures` present in the asset detail payload with computed values or safe nulls.
- Teen-friendly tooltips and labels present for all displayed metrics.
- Tests passing for calc utilities and API integration.


