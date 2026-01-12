# Date Range Debug Analysis

## The Data Flow

Let me trace the complete flow for 1Y and 5Y timeframes:

### Step 1: Frontend Calculates Dates

**ChartDataService.calculateDateRange('1y')**:
```typescript
const config = { value: '1y', label: '1Y', interval: '1d', days: 365 };
const endDate = new Date();  // e.g., Jan 8, 2026
const startDate = new Date();
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const millisecondsToSubtract = 365 * millisecondsPerDay;
startDate.setTime(endDate.getTime() - millisecondsToSubtract);
// Result: Jan 8, 2025 (exactly 365 days ago)
```

**ChartDataService.calculateDateRange('5y')**:
```typescript
const config = { value: '5y', label: '5Y', interval: '1d', days: 1825 };
// Result: Jan 8, 2021 (exactly 1825 days ago)
```

### Step 2: Hook Sends to API

```typescript
await ApiClient.post('/api/chart', {
  ticker,
  period1: startDate.toISOString(),  // "2025-01-08T..." for 1Y
  period2: endDate.toISOString(),    // "2026-01-08T..."
  interval: '1d',
});
```

### Step 3: API Route Processes Request

```typescript
// Line 43-48: Convert ISO strings to Date objects
if (period1) {
  startDate = typeof period1 === 'string' ? new Date(period1) : new Date(period1 * 1000);
}
if (period2) {
  endDate = typeof period2 === 'string' ? new Date(period2) : new Date(period2 * 1000);
}
```

**✅ This looks correct**

```typescript
// Line 61: Calculate daysDiff
const daysDiff = endDate && startDate ? 
  Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 30;
```

For 1Y: `daysDiff = Math.ceil((2026-01-08 - 2025-01-08) / ...) = 365`
For 5Y: `daysDiff = Math.ceil((2026-01-08 - 2021-01-08) / ...) = 1825`

**✅ This should be correct**

```typescript
// Line 62: Determine if short timeframe
const isShortTimeframe = daysDiff <= 7; // 1D, 5D timeframes
```

For 1Y: `isShortTimeframe = (365 <= 7) = false`
For 5Y: `isShortTimeframe = (1825 <= 7) = false`

**✅ Correctly identified as long timeframes**

```typescript
// Line 63: Check if intraday
const useIntraday = typedInterval !== '1d' && 
  (typedInterval.toString().includes('m') || typedInterval.toString().includes('h'));
```

For both 1Y and 5Y: `useIntraday = ('1d' !== '1d') && (...) = false`

**✅ Correct - we're using daily interval**

### Step 4: Data Source Selection

```typescript
// Line 68-86: Try direct fetch if short or intraday
if (isShortTimeframe || useIntraday) {
  // For 1Y and 5Y: SKIPPED (both are false)
}
```

**For 1Y and 5Y: This block is skipped ✅**

```typescript
// Line 89-112: Try database for daily data
if (quotes.length === 0 && typedInterval === '1d') {
  try {
    // Line 92-94: Sync to database if long timeframe
    if (startDate && endDate && !isShortTimeframe) {
      await syncAssetHistoricalData(asset.id, startDate, endDate);
    }
    
    // Line 97: Get from database
    const historicalData = await getAssetHistoricalData(asset.id, startDate, endDate);
```

**For 1Y and 5Y:**
- `quotes.length === 0` ✅ (no data yet)
- `typedInterval === '1d'` ✅
- `!isShortTimeframe` ✅ (it's false, so !false = true)

**So it SHOULD call syncAssetHistoricalData with the correct dates!**

## The Real Problem

### Hypothesis 1: Yahoo Finance API Limitations

Yahoo Finance's `chart()` API might have its own date range limits. Let me check Yahoo Finance documentation:

**Known Yahoo Finance Limits:**
- The `chart()` function may have undocumented limits on how far back it will fetch data
- For some stocks, historical data may not be available for the full requested range
- The API may silently truncate the date range without error

### Hypothesis 2: syncAssetHistoricalData Incremental Logic

Look at line 506-529 in yahoo-finance-service.ts:

```typescript
if (!forceFullSync) {
  const lastKnownData = await prisma.dailyAggregate.findFirst({
    where: { 
      assetId,
      date: { gte: startDate, lte: endDate }  // ⚠️ PROBLEM HERE?
    },
    orderBy: { date: 'desc' },
  });
  
  if (lastKnownData) {
    // ... Only sync from day after last known data
    actualStartDate = new Date(lastDate);
    actualStartDate.setDate(actualStartDate.getDate() + 1);
  }
}
```

**POTENTIAL ISSUE:** The incremental sync logic checks if there's ANY data in the requested range. If it finds data, it only fetches from that point forward. But what if:

1. User previously viewed 1M timeframe (last 30 days)
2. Database now has data for last 30 days
3. User switches to 1Y timeframe
4. Query finds lastKnownData (from that 30-day period)
5. Sets actualStartDate to day after that recent data
6. Only fetches ~1-2 days of new data instead of the full year!

**This would explain why 1Y and 5Y show the same ~8 months of data!**

### The Bug

The incremental sync logic is looking for ANY data within the range, not data at the START of the range. So if you have recent data, it only fetches from that point, ignoring your requested start date.

## The Fix

The `syncAssetHistoricalData` function needs to:
1. Check if we have data at the START of the requested range
2. If not, fetch from the requested startDate
3. If yes, only do incremental sync from the last known date

```typescript
// FIXED VERSION
if (!forceFullSync) {
  // Check if we already have recent data (within last day)
  const mostRecentData = await prisma.dailyAggregate.findFirst({
    where: { assetId },
    orderBy: { date: 'desc' },
    select: { date: true }
  });
  
  if (mostRecentData) {
    const lastDate = new Date(mostRecentData.date);
    const daysSinceLastData = Math.floor((endDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If we have very recent data, only fetch new data
    if (daysSinceLastData < 1) {
      return { success: true, recordsUpdated: 0, cached: true };
    }
    
    // If our most recent data is after the requested start date,
    // only sync from where we left off
    if (lastDate >= startDate) {
      actualStartDate = new Date(lastDate);
      actualStartDate.setDate(actualStartDate.getDate() + 1);
    }
    // Otherwise, use the requested start date (we don't have that historical data)
  }
}
```

## Additional Issue: getAssetHistoricalData

Even if sync works correctly, the `getAssetHistoricalData` function might not return all data if some is missing:

```typescript
const data = await prisma.dailyAggregate.findMany({
  where: {
    assetId,
    date: {
      gte: startDate,
      lte: endDate,
    }
  },
  orderBy: { date: 'asc' }
});
```

If the database only has recent data (last 30 days), this query will only return those 30 days even if you request 1 year.

## Solution Options

### Option 1: Force Full Sync for New Date Ranges (Recommended)

When the requested date range goes beyond what we have in the database, force a full sync:

```typescript
// In API route, before calling syncAssetHistoricalData
const oldestData = await prisma.dailyAggregate.findFirst({
  where: { assetId: asset.id },
  orderBy: { date: 'asc' },
  select: { date: true }
});

const needsHistoricalData = !oldestData || new Date(oldestData.date) > startDate;
const forceFullSync = needsHistoricalData;

await syncAssetHistoricalData(asset.id, startDate, endDate, forceFullSync);
```

### Option 2: Always Use Direct Fetch for Long Historical Ranges

For timeframes > 3 months, bypass the database and fetch directly:

```typescript
const daysDiff = endDate && startDate ? 
  Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 30;

// Use direct fetch for: short timeframes, intraday, OR long historical ranges
const useDirect = isShortTimeframe || useIntraday || daysDiff > 90;

if (useDirect) {
  const directData = await getChartDataDirect(upperTicker, startDate!, endDate!, typedInterval);
  // ...
}
```

### Option 3: Fix the Incremental Sync Logic (Best Long-term)

Modify `syncAssetHistoricalData` to properly handle requests for historical data we don't have yet.
