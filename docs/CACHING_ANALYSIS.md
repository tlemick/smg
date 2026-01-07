# Caching Infrastructure Analysis

## Executive Summary

**Issue Found**: The performance chart shows flat lines after 12/29/25 because:
1. ~~Yahoo Finance v2 was deprecated and failing silently~~ ✅ **FIXED** (upgraded to v3.11.2)
2. **Historical data caching has NO TTL** - once synced, data is never refreshed
3. **Silent error handling** - `syncAssetHistoricalData` failures are swallowed with `.catch(() => {})`
4. **No incremental sync** - always syncs full date range, even if recent data exists

## Current Caching Strategy

### 1. Real-Time Quote Cache (`AssetQuoteCache`)
**Location**: Database table  
**TTL**: 10 seconds (QUOTE_CACHE_TTL in yahoo-finance-service.ts)  
**Status**: ✅ Working well

```typescript
// src/lib/yahoo-finance-service.ts:10
const QUOTE_CACHE_TTL = 10 * 1000; // 10 seconds
```

**Flow**:
```
getAssetQuoteWithCache() 
  → Check cache expiry (expiresAt > now)
  → If expired: Fetch from Yahoo → Update cache
  → If fresh: Return cached data
```

### 2. Search Results Cache (`YahooSearchCache`)
**Location**: Database table  
**TTL**: 1 hour (SEARCH_CACHE_TTL)  
**Status**: ✅ Working well

```typescript
// src/lib/yahoo-finance-service.ts:60
const SEARCH_CACHE_TTL = 60 * 60 * 1000; // 1 hour
```

**Flow**:
```
searchWithCache()
  → Check cache expiry
  → If expired: Search Yahoo → Update cache
  → On error: Return stale cache with warning
```

### 3. Historical Data Cache (`DailyAggregate`)
**Location**: Database table  
**TTL**: ❌ **NONE** - Data persists forever  
**Status**: 🔴 **BROKEN** - Never refreshes

```typescript
// src/lib/yahoo-finance-service.ts:481-545
export async function syncAssetHistoricalData(
  assetId: number,
  startDate: Date,
  endDate: Date
) {
  // Fetches from Yahoo Finance
  // Upserts to DailyAggregate table
  // NO CHECK if data already exists
  // NO TTL or expiry logic
}
```

**Flow**:
```
syncAssetHistoricalData()
  → Fetch chart data from Yahoo Finance (period1 to period2)
  → Upsert each day to DailyAggregate table
  → ❌ No check if data is stale
  → ❌ No incremental sync (always full range)
```

## Critical Issues

### Issue #1: Silent Error Handling
**Location**: `src/app/api/user/portfolio/performance-series/route.ts:58`

```typescript
// LINE 58 - SWALLOWS ALL ERRORS!
await syncAssetHistoricalData(assetId, start, end).catch(() => {});
```

**Impact**: When Yahoo Finance v2 was failing, errors were hidden. Now with v3, if rate limiting occurs, we won't know.

**Fix**: Log errors and implement retry logic

### Issue #2: No Incremental Sync
**Problem**: Always syncs entire date range, even if we have data up to yesterday

```typescript
// Current: Sync from session start to today EVERY TIME
await syncAssetHistoricalData(assetId, sessionStart, today);

// Better: Only sync missing dates
const lastKnownDate = await getLastHistoricalDate(assetId);
if (lastKnownDate < today) {
  await syncAssetHistoricalData(assetId, lastKnownDate + 1, today);
}
```

**Impact**: 
- Wastes API calls
- Slower performance
- Higher risk of rate limiting

### Issue #3: No Data Freshness Check
**Problem**: Historical data has no `lastUpdated` or `expiresAt` field

```prisma
// Current schema
model DailyAggregate {
  id            String   @id @default(cuid())
  assetId       Int
  date          DateTime
  open          Float
  high          Float
  low           Float
  close         Float
  adjustedClose Float?
  volume        BigInt
  dataSource    String?
  
  // ❌ Missing: lastUpdated DateTime @updatedAt
  // ❌ Missing: isFinal Boolean (for intraday vs EOD data)
}
```

**Fix**: Add metadata fields to track data freshness

### Issue #4: Carry-Forward Logic Hides Stale Data
**Location**: `src/app/api/user/portfolio/performance-series/route.ts:110-123`

```typescript
// Lines 110-123: Carry-forward logic
let price = 0;
for (let i = arr.length - 1; i >= 0; i--) {
  if (arr[i].date.getTime() <= dayEnd.getTime()) { 
    price = arr[i].price; 
    break; 
  }
}
```

**Problem**: If historical data stops at 12/29, all subsequent days use 12/29's price, creating flat lines.

**Why it happens**:
1. `syncAssetHistoricalData` fails silently (Issue #1)
2. `getAssetHistoricalData` returns data up to 12/29
3. Carry-forward uses last known price for all future dates
4. Portfolio value = (qty × stale_price) + cash = flat line

## Recommended Fixes

### Priority 1: Fix Silent Error Handling (Immediate)

```typescript
// src/app/api/user/portfolio/performance-series/route.ts:58
for (const assetId of assetIds) {
  try {
    await syncAssetHistoricalData(assetId, start, end);
  } catch (error) {
    console.error(`Failed to sync historical data for asset ${assetId}:`, error);
    // Continue with cached data, but log the issue
  }
  const hist = await getAssetHistoricalData(assetId, start, end);
  // ... rest of code
}
```

### Priority 2: Implement Incremental Sync (High Impact)

```typescript
// New function in yahoo-finance-service.ts
export async function syncAssetHistoricalDataIncremental(
  assetId: number,
  startDate: Date,
  endDate: Date
) {
  // Check what data we already have
  const existingData = await prisma.dailyAggregate.findMany({
    where: { assetId, date: { gte: startDate, lte: endDate } },
    select: { date: true },
    orderBy: { date: 'desc' },
    take: 1
  });
  
  // If we have recent data, only sync from last known date
  if (existingData.length > 0) {
    const lastDate = new Date(existingData[0].date);
    const daysSinceLastSync = Math.floor((endDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Only sync if data is more than 1 day old
    if (daysSinceLastSync < 1) {
      return { success: true, recordsUpdated: 0, cached: true };
    }
    
    // Sync only missing dates
    startDate = new Date(lastDate);
    startDate.setDate(startDate.getDate() + 1);
  }
  
  return syncAssetHistoricalData(assetId, startDate, endDate);
}
```

### Priority 3: Add Data Freshness Metadata (Medium)

```prisma
// Update schema
model DailyAggregate {
  // ... existing fields
  lastUpdated   DateTime @updatedAt
  isFinal       Boolean  @default(false) // true for EOD data, false for intraday
  syncedAt      DateTime @default(now())
  
  @@index([assetId, date, isFinal])
}
```

### Priority 4: Implement Smart Caching Strategy (Long-term)

```typescript
// Cache strategy based on data age
export function shouldRefreshHistoricalData(
  lastSyncDate: Date,
  dataDate: Date,
  isFinal: boolean
): boolean {
  const now = new Date();
  const dataAge = now.getTime() - dataDate.getTime();
  const daysSinceData = Math.floor(dataAge / (1000 * 60 * 60 * 24));
  
  // If data is for today and market is open, refresh every 15 minutes
  if (daysSinceData === 0 && !isFinal) {
    const timeSinceSync = now.getTime() - lastSyncDate.getTime();
    return timeSinceSync > 15 * 60 * 1000; // 15 minutes
  }
  
  // If data is for yesterday and after 4 PM ET, mark as final
  if (daysSinceData === 1) {
    const etHour = now.getUTCHours() - 5; // Convert to ET
    return !isFinal && etHour >= 16; // After 4 PM ET
  }
  
  // Historical data (> 1 day old) doesn't need refreshing
  return false;
}
```

## API Call Reduction Estimates

### Current State (Broken)
- **Performance series endpoint**: Syncs 5-10 assets × full date range (30-90 days) = **~500 API calls per page load**
- **Category series endpoint**: Same issue = **~500 API calls per page load**
- **Total**: ~1000 API calls every time dashboard loads

### With Incremental Sync
- **First load**: Same as current (~500 calls to populate cache)
- **Subsequent loads**: Only sync missing dates (1-2 days) = **~10 API calls**
- **Reduction**: **98% fewer API calls** after initial cache population

### With Smart Caching
- **Market closed**: No syncs needed = **0 API calls**
- **Market open**: Only sync today's data every 15 min = **~10 API calls per 15 min**
- **Reduction**: **99%+ fewer API calls** during off-hours

## Testing Checklist

- [ ] Verify yahoo-finance2 v3 works in production
- [ ] Test performance chart with fresh data
- [ ] Confirm historical data syncs past 12/29
- [ ] Monitor API call volume
- [ ] Check error logs for sync failures
- [ ] Verify incremental sync reduces API calls
- [ ] Test carry-forward logic with partial data

## Next Steps

1. ✅ **DONE**: Upgrade to yahoo-finance2 v3.11.2
2. **NOW**: Implement better error handling
3. **NEXT**: Add incremental sync logic
4. **LATER**: Add data freshness metadata to schema
5. **FUTURE**: Implement smart caching strategy
