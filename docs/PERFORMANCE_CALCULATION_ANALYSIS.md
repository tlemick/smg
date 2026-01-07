# Performance Chart Calculation Analysis

## Current Calculation Logic

### `toPercentSeries` Function (lines 155-180)

```typescript
function toPercentSeries(domain: string[], values: Array<{ date: string; value: number }>, baseOverride?: number | null): Array<number | null> {
  // Map date->value with carry-forward
  const map = new Map<string, number>();
  for (const v of values) {
    const key = v.date.slice(0, 10);
    map.set(key, v.value);
  }
  // find base (first non-null)
  let last: number | null = null;
  let base: number | null = baseOverride ?? null;
  const result: Array<number | null> = [];
  for (const iso of domain) {
    const key = iso.slice(0, 10);
    const val = map.has(key) ? (map.get(key) as number) : null;
    if (val !== null) {
      last = val;
      if (base === null) base = val;
    }
    if (last === null || base === null || base === 0) {
      result.push(null);
    } else {
      result.push(((last / base) - 1) * 100);  // LINE 176 - THE CALCULATION
    }
  }
  return result;
}
```

## What This SHOULD Calculate

### Formula Breakdown (Line 176)
```typescript
((last / base) - 1) * 100
```

Where:
- **`base`**: Starting value (game session startingCash, e.g., $100,000)
- **`last`**: Current day's portfolio value (e.g., $105,000)
- **Result**: `((105000 / 100000) - 1) * 100 = 5%`

### This IS Cumulative Return Since Game Start! ✅

**Example Timeline**:
```
Game Start: $100,000 (starting cash)
Day 1: Portfolio = $100,000 → (100k/100k - 1) * 100 = 0.00%
Day 2: Portfolio = $102,000 → (102k/100k - 1) * 100 = 2.00%
Day 3: Portfolio = $105,000 → (105k/100k - 1) * 100 = 5.00%
Day 4: Portfolio = $103,500 → (103.5k/100k - 1) * 100 = 3.50%
```

This shows **cumulative returns from game start**, not daily changes!

## How It's Being Called

### User Portfolio (Line 209)
```typescript
const youValuesRaw = await computePortfolioDailyValues(portfolio.id, start, end);
const youSeries = toPercentSeries(
  domain, 
  youValuesRaw.map(p => ({ date: p.date, value: p.total })),
  Number(portfolio.gameSession.startingCash)  // ✅ Base = starting cash
);
```

### Leader Portfolio (Line 243)
```typescript
const leaderValuesRaw = await computePortfolioDailyValues(leaderPortfolioId, start, end);
leaderSeries = toPercentSeries(
  domain,
  leaderValuesRaw.map(p => ({ date: p.date, value: p.total })),
  Number(portfolio.gameSession.startingCash)  // ✅ Base = starting cash
);
```

### S&P 500 (Line 249)
```typescript
const spRaw = await getSp500Series(start, end);
const spMapValues = spRaw.map(p => ({ date: p.date, value: p.close }));
const spSeries = toPercentSeries(
  domain,
  spMapValues,
  null  // ⚠️ Base = first S&P value in range
);
```

## Potential Issues

### Issue #1: S&P 500 Base Value
The S&P 500 uses `null` as `baseOverride`, so its base is the **first value in the date range**, not the game start value.

**Problem**: If the game starts on Jan 1 but S&P 500 data starts on Jan 2, the S&P base will be Jan 2's value, not Jan 1's.

**Impact**: S&P 500 returns might not align properly with portfolio returns.

### Issue #2: Portfolio Value Calculation
The `computePortfolioDailyValues` function calculates:
```
portfolioValue = (quantity × historicalPrice) + cashBalance
```

**Potential Problem**: If historical prices are wrong or carried forward incorrectly, the portfolio values will be wrong, making returns appear incorrect.

### Issue #3: Carry-Forward During Missing Data
When historical data is missing for a day, the function uses carry-forward:
```typescript
let last: number | null = null;
// ...
if (val !== null) {
  last = val;  // Update last
}
// ...
result.push(((last / base) - 1) * 100);  // Uses carried-forward 'last'
```

**Impact**: On weekends/holidays with no trading, it repeats the previous day's return percentage.

## What User Might Be Seeing vs Expected

### If User Sees Daily Changes (WRONG):
```
Day 1: 0.00%
Day 2: 2.00%  (should be 2% cumulative)
Day 3: 2.94%  (this would be 105k/102k - 1 = daily change)
```

### What They SHOULD See (Cumulative):
```
Day 1: 0.00%
Day 2: 2.00%  (cumulative from start)
Day 3: 5.00%  (cumulative from start)
```

## Debugging Steps

### 1. Check Raw Portfolio Values
Add logging to see what `computePortfolioDailyValues` returns:

```typescript
console.log('Raw portfolio values:', youValuesRaw);
// Should show: [{ date: '2025-12-20', total: 100000 }, { date: '2025-12-21', total: 102000 }, ...]
```

### 2. Check Starting Cash
```typescript
console.log('Starting cash (base):', Number(portfolio.gameSession.startingCash));
// Should show: 100000 (or whatever the actual starting amount is)
```

### 3. Check Calculated Percentages
```typescript
console.log('You series percentages:', youSeries);
// Should show: [0, 2, 5, ...] (cumulative from start)
```

### 4. Check Final Output
```typescript
console.log('Final points:', points.slice(0, 5));
// Should show first 5 days with cumulative returns
```

## Hypothesis: The Calculation IS Correct

Based on code analysis, the calculation **IS computing cumulative returns since game start**.

**If the user is seeing daily changes instead**, the issue is likely:
1. **Frontend display issue** - Chart component misinterpreting the data
2. **Data issue** - `computePortfolioDailyValues` returning incorrect values
3. **Base value issue** - `startingCash` is not what we think it is
4. **Misunderstanding** - User might be comparing wrong things

## Next Steps

1. **Add debug logging** to see actual values being calculated
2. **Check the frontend** - Verify `PortfolioPerformanceChart` isn't modifying the data
3. **Test with known values** - Create a test case with specific portfolio values and verify calculations
4. **Check database** - Verify `gameSession.startingCash` is correct

## Code Confidence: HIGH ✅

The calculation logic appears **correct for cumulative returns**. The issue is likely elsewhere:
- Data being fed into the function
- Frontend interpretation
- User expectation vs actual behavior
