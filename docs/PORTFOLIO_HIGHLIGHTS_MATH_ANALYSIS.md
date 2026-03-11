# Portfolio Highlights Math Analysis

**Date:** March 10, 2026  
**Scope:** Top Performers / Worst Performers card — "Your Gain" vs "Price Change (since first buy)"

## Executive Summary

Verification against real app data (UNH holding) confirms:

1. **Your Gain** — Calculation is **correct**. Uses cost basis from holdings vs current quote.
2. **Price Change** — The label "(since first buy)" is **incorrect**. The value shown is actually **last 30 days** due to an auth bug in the first-purchase-dates API.
3. **Root cause of discrepancy** — Different time periods and reference prices. When auth is fixed, "since first buy" would still differ from "Your Gain" when cost basis ≠ first trading day close (e.g., adjusted vs unadjusted close, or date boundaries).

---

## Data Sources

### Your Gain (unrealized P&L)

| Source | Location | Formula |
|--------|----------|---------|
| Holdings | `Holding.quantity`, `Holding.averagePrice` | `totalCostBasis = quantity × averagePrice` |
| Current price | `AssetQuoteCache.regularMarketPrice` | `currentValue = quantity × currentPrice` |
| **Your Gain %** | `overview/route.ts` | `(currentValue - totalCostBasis) / totalCostBasis × 100` |
| **Your Gain $** | Same | `currentValue - totalCostBasis` |

### Price Change

| Source | Location | Formula |
|--------|----------|---------|
| Chart period | `usePortfolioHighlights` → `first-purchase-dates` or 30d fallback | `period1` to `period2` |
| Historical data | `chart/batch` → `DailyAggregate` | `firstPrice = closePrices[0]`, `lastPrice = closePrices[n-1]` |
| **Price Change %** | `chart/batch/route.ts` | `(lastPrice - firstPrice) / firstPrice × 100` |

---

## Verification Results (UNH)

Run `npx tsx scripts/verify-portfolio-highlights-math.ts` to reproduce.

### Sample Data (Priya Patel, UNH)

| Field | Value |
|-------|-------|
| Quantity | 9.75 shares |
| Average price (cost basis) | $330.91 |
| Total cost basis | $3,226.92 |
| Current price (quote cache) | $282.45 |
| First purchase date | 2025-12-07 |

### Your Gain — Verified Correct

```
currentValue   = 9.75 × 282.45 = $2,754.36
totalCostBasis = 9.75 × 330.91 = $3,226.92
unrealizedPnL  = 2,754.36 - 3,226.92 = -$472.57
unrealizedPnLPercent = (-472.57 / 3,226.92) × 100 = -14.64%
```

Matches UI: **-14.64%** and **-$472.57**.

### Price Change — Auth Bug

The first-purchase-dates API (`/api/user/portfolio/first-purchase-dates`) uses `auth_token` (JWT), but login only sets `user_session`. As a result:

- The API returns 401 for all requests.
- The hook catches the error and falls back to a 30-day window.
- The label "(since first buy)" is wrong; the value is for the last 30 days.

| Metric | Actual period used | Value |
|--------|--------------------|-------|
| **Displayed** | Last 30 days (Feb 8 – Mar 10) | +2.97% |
| **Intended** | Since first buy (Dec 7 – Mar 10) | -12.28% |

So the stock is up over the last 30 days (+2.97%) but down since the actual first buy (-12.28%).

### Cost Basis vs First Close

With a single buy at game start:

| Reference | Value | Notes |
|-----------|-------|-------|
| Transaction price | $330.91 | Matches `Holding.averagePrice` |
| First close on/after buy (chart) | $323.62 | From `DailyAggregate` |
| Difference | $7.29 | ~2.2% |

Possible reasons for the gap:

- **Adjusted vs unadjusted close** — Chart may use `adjustedClose`; seed may use `close`.
- **Date boundaries** — Transaction at 9:30 AM vs daily close.
- **Data refresh** — Historical data may have been updated after seeding.

---

## Seed Data Flow

From `scripts/seed-demo-investors.ts`:

1. **Price source** — `getAssetHistoricalData(assetId, dayStart, dayEnd)` from `DailyAggregate`.
2. **Selection** — Last close on or before `dayEnd` (session start day).
3. **Transaction** — `Transaction.price` = that close.
4. **Holding** — `Holding.averagePrice` = same price (single buy).

So cost basis and transaction price are consistent at seed time. Any mismatch with chart data comes from how the chart selects its first point (e.g., adjusted close, date range).

---

## Recommendations

### 1. Fix first-purchase-dates auth (high priority)

Use `user_session` like other routes instead of `auth_token`:

```typescript
// first-purchase-dates/route.ts
const sessionCookie = cookieStore.get('user_session');
if (!sessionCookie) return null;
const user = JSON.parse(sessionCookie.value);
```

This will make "Price Change" use the real first-purchase period and align the label with the calculation.

### 2. Align cost basis and chart reference price (medium priority)

To reduce divergence between "Your Gain" and "Price Change (since first buy)":

- Use the same price source for both (e.g., `close` vs `adjustedClose`).
- Or derive the chart’s first price from the transaction’s price when it exists, instead of from `DailyAggregate`.

### 3. Clarify labels (low priority)

If the 30-day fallback remains, consider:

- "(last 30 days)" when first-purchase-dates fails.
- "(since first buy)" only when the real first-purchase period is used.

---

## Verification Script

```bash
npx tsx scripts/verify-portfolio-highlights-math.ts
```

Requires:

- `DATABASE_URL` in `.env.local`
- Seeded demo data (e.g., `tsx scripts/seed-demo-investors.ts`)

The script prints:

- Raw data (holding, transaction, quote)
- Your Gain calculation
- Price Change for 30-day and first-purchase periods
- Cross-check of cost basis vs first close

---

## Appendix: Code Paths

| Metric | API | Key logic |
|--------|-----|-----------|
| Your Gain | `GET /api/user/portfolio/overview` | `unrealizedPnL = currentValue - totalCostBasis` |
| Price Change | `POST /api/chart/batch` | `priceChangePercent = (lastPrice - firstPrice) / firstPrice * 100` |
| Chart period | `POST /api/user/portfolio/first-purchase-dates` | First BUY transaction date per ticker (currently broken) |
