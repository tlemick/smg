# Portfolio Performance Chart - Deep Analysis

## Date: March 9, 2025

## Issue Summary

The PortfolioPerformanceChart shows **identical data for Mar 5, 6, and 7**. March 8 is not displayed (expected—weekend). The user expected this to be fixed from a previous session.

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. CRON JOB (Vercel: 10 PM UTC daily)                                    │
│    POST /api/jobs/compute-performance                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. computeAllActiveSessionsPerformance()                                  │
│    → computeSessionPerformance(sessionId) for each active session        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. Pre-fetch: syncAssetHistoricalData() for ALL assets in session        │
│    → Yahoo Finance chart() API → DailyAggregate table                     │
│    → Incremental: skips if daysSinceLastData < 1                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. computeAndStorePortfolioPerformance() per portfolio                   │
│    → computePortfolioDailyValues() - uses buildTradingDayDomain()        │
│    → buildTradingDayDomain: ALL calendar days (incl. weekends)            │
│    → For each day: find price from DailyAggregate (carry-forward if none) │
│    → getSp500Series() - S&P 500 from DailyAggregate                      │
│    → Store in PortfolioPerformance table (one row per calendar day)      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. API: GET /api/user/portfolio/performance-series                        │
│    → Reads from PortfolioPerformance (no computation)                    │
│    → Returns all rows as points                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. usePortfolioPerformanceSeries hook → PortfolioPerformanceChart       │
│    → Displays points as-is (no filtering)                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Root Cause Analysis

### Issue 1: Weekend Days Create Duplicate Flat Points

**Location**: `performance-computation-service.ts` → `buildTradingDayDomain()`

```typescript
function buildTradingDayDomain(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cur = new Date(Date.UTC(...));
  while (cur <= endUtc) {
    days.push(cur.toISOString());
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;  // Returns ALL calendar days including Sat/Sun
}
```

**Behavior**: The domain includes every calendar day (Mar 5, 6, 7, 8, 9). For weekend days (Mar 8 Sat, Mar 9 Sun), there is no new market data. The computation correctly carries forward the last known price (Mar 7 Friday). Result: **Mar 8 and Mar 9 have identical values to Mar 7**.

**Impact**: The chart shows redundant flat points for weekends. This is by design but creates visual clutter and can confuse users.

**Fix**: Filter the API response to only include **trading days** (Mon–Fri) when returning points. This matches the approach used in `category-series/route.ts` which builds a trading-days-only domain.

---

### Issue 2: Mar 5, 6, 7 Showing Same Data

If three consecutive **trading days** (Wed, Thu, Fri) show identical values, the cause is one of:

#### A. Stale DailyAggregate Data

If `DailyAggregate` only has data through Mar 5, the computation will carry forward Mar 5's prices for Mar 6 and Mar 7. All three days would show the same portfolio value.

**Possible causes**:
- **Cron job not running** on Vercel (check CRON_SECRET, Vercel dashboard)
- **Cron timeout**: Job exceeds Vercel's serverless limit (10s hobby / 60s Pro)
- **Incremental sync skip**: `daysSinceLastData < 1` might skip when it shouldn't
- **Yahoo API failure**: Sync fails silently (we now log, but job might not complete)

#### B. Incremental Sync Edge Case

```typescript
// syncAssetHistoricalData - yahoo-finance-service.ts
if (lastKnownData) {
  const daysSinceLastData = Math.floor((endDate - lastDate) / 86400000);
  if (daysSinceLastData < 1) {
    return { cached: true };  // Skip sync
  }
  actualStartDate = lastDate + 1 day;
}
```

If `lastKnownData` is from a query with `date: { gte: startDate, lte: endDate }`, we get the most recent date in range. For a fresh DB, that could be Mar 5. If the cron ran on Mar 6, we'd sync Mar 6. Logic appears correct.

#### C. Timezone / Date Boundary Bug

All date handling uses UTC. `buildTradingDayDomain` and price lookups use `toISOString()` and `getTime()`. Unlikely but worth verifying in production.

---

## Current Behavior vs. Intended Behavior

| Scenario | Current | Intended |
|----------|---------|----------|
| Mar 5 (Wed) | Shown | Shown |
| Mar 6 (Thu) | Shown, same as Mar 5? | Shown, distinct value |
| Mar 7 (Fri) | Shown, same as Mar 5? | Shown, distinct value |
| Mar 8 (Sat) | Shown, same as Mar 7 | **Not shown** (weekend) |
| Mar 9 (Sun) | Shown, same as Mar 7 | **Not shown** (weekend) |

---

## Recommended Fixes

### Fix 1: Filter to Trading Days Only (API Route)

Filter `points` before returning to exclude weekend days. This removes redundant flat points and aligns with how financial charts typically display data.

```typescript
// In performance-series/route.ts, before returning:
const tradingDayPoints = points.filter((p) => {
  const d = new Date(p.date);
  const day = d.getUTCDay(); // 0=Sun, 6=Sat
  return day !== 0 && day !== 6;
});
```

### Fix 2: Verify Cron Execution

1. Check Vercel dashboard → Project → Cron Jobs
2. Ensure `CRON_SECRET` is set in environment variables
3. Verify job runs (check function logs for "Starting scheduled performance computation...")
4. If timeout: consider splitting by session or using Vercel's longer timeout

### Fix 3: Optional – Force Full Sync Periodically

Add a weekly full sync to avoid incremental sync edge cases:

```typescript
// In computeSessionPerformance, e.g. every Sunday:
const forceFullSync = new Date().getUTCDay() === 0; // Sunday
await syncAssetHistoricalData(assetId, start, end, forceFullSync);
```

### Fix 4: Add Diagnostic Endpoint (Optional)

Expose a debug endpoint (admin-only) to inspect:
- Last PortfolioPerformance date per portfolio
- Last DailyAggregate date per asset
- Whether cron ran recently

---

## Files Involved

| File | Role |
|------|------|
| `src/lib/performance-computation-service.ts` | Computes and stores performance |
| `src/app/api/user/portfolio/performance-series/route.ts` | Reads and returns performance |
| `src/app/api/jobs/compute-performance/route.ts` | Cron-triggered job |
| `src/lib/yahoo-finance-service.ts` | syncAssetHistoricalData, getAssetHistoricalData |
| `src/hooks/usePortfolioPerformanceSeries.ts` | Fetches and transforms for chart |
| `vercel.json` | Cron schedule: `0 22 * * *` (10 PM UTC daily) |

---

## Testing Checklist

- [ ] Run `scripts/compute-performance.ts` manually and verify new data in DB
- [ ] Check `PortfolioPerformance` table: `SELECT date, portfolio_percent_change FROM "PortfolioPerformance" WHERE "portfolioId" = '...' ORDER BY date DESC LIMIT 10`
- [ ] Check `DailyAggregate` for ^GSPC: `SELECT date, close FROM "DailyAggregate" WHERE "assetId" = (SELECT id FROM "Asset" WHERE ticker = '^GSPC') ORDER BY date DESC LIMIT 10`
- [ ] Verify chart shows distinct values for Mar 5, 6, 7 after fix
- [ ] Verify Mar 8, 9 (weekend) are not shown after trading-day filter
