# Sparkline Debugging Guide

## Current Status
Added comprehensive logging to trace data flow from API to component.

## Architecture Overview

```
Component (PortfolioHighlightsCard)
  ↓
Hook (usePortfolioHighlights)
  ↓
ApiClient.post<BatchChartApiResponse>('/api/chart/batch')
  ↓
API Route (/api/chart/batch/route.ts)
  ↓
Database (AssetHistoricalData via Prisma)
```

## Data Flow & Types

### 1. ApiClient Wrapper
```typescript
ApiResponse<T> = {
  success: boolean;
  data?: T;         // <-- This is the API route's response
  error?: string;
}
```

### 2. API Route Response (`/api/chart/batch`)
```typescript
{
  success: boolean;
  results: Array<{
    ticker: string;
    success: boolean;
    data?: number[];  // Array of close prices
    error?: string;
  }>;
}
```

### 3. Complete Response Chain
```typescript
ApiClient.post<BatchChartApiResponse>('/api/chart/batch', ...) returns:
{
  success: true,                    // ApiClient wrapper
  data: {                          // API route response
    success: true,
    results: [
      { ticker: 'AAPL', success: true, data: [150.2, 151.3, ...] },
      { ticker: 'MSFT', success: true, data: [380.1, 382.5, ...] }
    ]
  }
}
```

## Debugging Steps

### Step 1: Check Browser Console
Open your browser console and look for these logs:

```
[usePortfolioHighlights] Fetching sparklines for tickers: ['AAPL', 'MSFT', ...]
[usePortfolioHighlights] Purchase dates response: {...}
[usePortfolioHighlights] Chart requests: [...]
[usePortfolioHighlights] Batch response: {...}
[usePortfolioHighlights] API data: {...}
[usePortfolioHighlights] ✓ AAPL: 30 data points
[usePortfolioHighlights] Final sparkline map: ['AAPL', 'MSFT']
[PortfolioHighlightsCard] Render: {...}
```

### Step 2: Look for Specific Error Patterns

#### Pattern A: "Skipping sparkline fetch"
**Symptoms:**
```
[usePortfolioHighlights] Skipping sparkline fetch: { hasHoldings: false, ... }
```

**Cause:** No holdings in portfolio

**Fix:** Add stock holdings to your test user's portfolio

---

#### Pattern B: "Asset not found"
**Symptoms:**
```
[usePortfolioHighlights] ✗ AAPL: Asset AAPL not found
```

**Cause:** Ticker not in database

**Fix:** Run asset seeding script:
```bash
npm run db:seed
```

---

#### Pattern C: "No price data available"
**Symptoms:**
```
[usePortfolioHighlights] ✗ AAPL: No price data available for the specified period
```

**Cause:** No historical data in database

**Fix:** The API route attempts to sync data automatically, but you can manually trigger:
```typescript
// In your seed script or admin panel
await syncAssetHistoricalData(assetId, startDate, endDate);
```

---

#### Pattern D: "ApiClient wrapper failed"
**Symptoms:**
```
[usePortfolioHighlights] ApiClient wrapper failed: Network error
```

**Cause:** Network/fetch failure

**Fix:** Check:
- Is the dev server running?
- Are there CORS issues?
- Is the API route properly defined?

---

#### Pattern E: "API response failed"
**Symptoms:**
```
[usePortfolioHighlights] API response failed: Internal server error
```

**Cause:** API route threw an error

**Fix:** Check server logs (terminal where `npm run dev` is running)

### Step 3: Run Test Script

```bash
# Install tsx if not already installed
npm install -D tsx

# Run test script
npx tsx src/scripts/test-sparklines.ts
```

This will:
1. Test the `/api/chart/batch` endpoint directly
2. Check database for assets and historical data
3. Print detailed diagnostics

### Step 4: Verify Database State

```bash
# Open Prisma Studio
npx prisma studio
```

Check:
- `Asset` table: Do your tickers exist?
- `AssetHistoricalData` table: Is there price data?
- `Holding` table: Do you have holdings?
- `Portfolio` table: Is there an active portfolio?

### Step 5: Check API Route Logs

Look at your terminal where `npm run dev` is running for:

```
Batch chart API error: ...
```

## Common Issues & Solutions

### Issue 1: Empty Sparkline Map
**Symptoms:** `Final sparkline map: []`

**Diagnosis:**
- All individual results failed
- Check individual result errors: `[usePortfolioHighlights] ✗ TICKER: error message`

**Solutions:**
- Ensure assets exist in database
- Ensure historical data exists
- Check date ranges are valid

### Issue 2: Component Shows "Loading chart..."
**Symptoms:** Sparklines show loading spinner forever

**Diagnosis:**
- `sparklineData` is `undefined` or empty array
- Check `[PortfolioHighlightsCard] sparklineKeys` log

**Solutions:**
- Verify hook is returning data
- Check `data?.sparklineDataByTicker` has keys
- Ensure ticker names match between component and hook

### Issue 3: Type Errors
**Symptoms:** TypeScript errors or runtime type mismatches

**Diagnosis:**
- Check if actual API response matches `BatchChartApiResponse` type
- Add `console.log` to see actual structure

**Solutions:**
- Verify API route returns `{ success, results }`
- Ensure `ApiClient` wraps correctly
- Check type definitions match actual responses

## Testing Checklist

- [ ] Browser console shows no errors
- [ ] Hook logs show "Fetching sparklines for tickers"
- [ ] API logs show success responses
- [ ] Sparkline map has ticker keys
- [ ] Component renders without "Loading chart..."
- [ ] Test script passes all checks
- [ ] Database has assets and historical data

## Emergency Fallback

If all else fails, temporarily revert to the old implementation to isolate whether it's:
1. A new bug introduced in the refactor
2. A pre-existing data/infrastructure issue

```bash
git diff src/hooks/usePortfolioHighlights.ts
git diff src/components/dashboard/PortfolioHighlightsCard.tsx
```

## Next Steps After Debugging

Once you identify the issue:

1. **Remove debug logs** (or gate them behind `process.env.NODE_ENV !== 'production'`)
2. **Update types** if needed
3. **Add error boundaries** if component crashes
4. **Add user-friendly error messages** instead of technical ones
5. **Write tests** to prevent regression

## Architecture Compliance Checklist

- [x] No raw `fetch()` in components ✅
- [x] Data fetching in hooks ✅
- [x] Proper type definitions ✅
- [x] Error handling at all layers ✅
- [x] Null safety checks ✅
- [x] ApiClient usage ✅
- [x] Component is pure (display only) ✅
