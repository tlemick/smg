# Leaderboard Return Calculation Debug

## Issue
Leaderboard is showing wildly inflated returns:
- Marcus L.: +794.00%
- Oliver R.: +759.00%
- Dimitrios A.: +313.00%

## Formula (Correct)
```typescript
const returnPercent = ((totalPortfolioValue / startingCash) - 1) * 100
```

## Possible Causes

### 1. Wrong Starting Cash in Game Session
If the game session has starting cash set too low, it will inflate returns.

**Example:**
- If startingCash = $10,000 (instead of $100,000)
- User has $89,400 portfolio value
- Return = ((89,400 / 10,000) - 1) * 100 = 794%

**What it should be:**
- If startingCash = $100,000 
- User has $89,400 portfolio value
- Return = ((89,400 / 100,000) - 1) * 100 = -10.6%

### 2. Portfolio Value Calculation Issue
The total portfolio value might be calculated incorrectly:
```typescript
let total = Number(pf.cash_balance) || 0;
for (const h of pf.holdings) {
  const price = priceMap.get(h.assetId) || 0;
  total += Number(h.quantity) * price;
}
```

### 3. Multiple Portfolios Per User
If users have multiple portfolios, the code multiplies starting cash:
```typescript
const base = sessionStartingCash * Math.max(1, u.portfolioCount);
```

This is correct IF users should have multiple portfolios with separate starting cash allocations.
But if it's ONE portfolio per user, and they accidentally have multiple, this would divide their returns.

## Diagnostic Steps

### Step 1: Check Game Session Starting Cash on Vercel

Run this query on your Vercel Postgres database:
```sql
SELECT id, name, "startingCash", "isActive", "startDate", "endDate" 
FROM "GameSession" 
WHERE "isActive" = true;
```

Expected: `startingCash = 100000`
If it shows `10000` or `1000`, that's the problem.

### Step 2: Check Sample Portfolio Values

```sql
SELECT 
  u.name,
  u.email,
  p.cash_balance,
  (
    SELECT SUM(h.quantity * COALESCE(qc."regularMarketPrice", 0))
    FROM "Holding" h
    LEFT JOIN "AssetQuoteCache" qc ON qc."assetId" = h."assetId"
    WHERE h."portfolioId" = p.id
  ) as holdings_value,
  (
    p.cash_balance + 
    COALESCE(
      (
        SELECT SUM(h.quantity * COALESCE(qc."regularMarketPrice", 0))
        FROM "Holding" h
        LEFT JOIN "AssetQuoteCache" qc ON qc."assetId" = h."assetId"
        WHERE h."portfolioId" = p.id
      ),
      0
    )
  ) as total_portfolio_value
FROM "Portfolio" p
INNER JOIN "User" u ON u.id = p."userId"
WHERE p."sessionId" = (SELECT id FROM "GameSession" WHERE "isActive" = true LIMIT 1)
ORDER BY total_portfolio_value DESC
LIMIT 5;
```

This will show you the actual portfolio values.

### Step 3: Check for Multiple Portfolios Per User

```sql
SELECT 
  u.name,
  u.email,
  COUNT(p.id) as portfolio_count
FROM "User" u
INNER JOIN "Portfolio" p ON p."userId" = u.id
WHERE p."sessionId" = (SELECT id FROM "GameSession" WHERE "isActive" = true LIMIT 1)
GROUP BY u.id, u.name, u.email
HAVING COUNT(p.id) > 1;
```

If this returns rows, users have multiple portfolios (which may be intentional or a bug).

## Fix Options

### Fix 1: Update Game Session Starting Cash (if wrong)

```sql
UPDATE "GameSession" 
SET "startingCash" = 100000 
WHERE "isActive" = true;
```

Then re-run the performance computation cron:
```bash
curl -X POST https://smg-rose.vercel.app/api/jobs/compute-performance \
  -H "Authorization: Bearer YOUR_ORDER_PROCESSING_API_KEY"
```

### Fix 2: Delete Duplicate Portfolios (if unintentional)

If users should only have ONE portfolio but have multiple:
```sql
-- First, check which portfolios to keep (usually the oldest one)
SELECT 
  u.email,
  p.id,
  p."createdAt",
  ROW_NUMBER() OVER (PARTITION BY p."userId" ORDER BY p."createdAt" ASC) as rn
FROM "Portfolio" p
INNER JOIN "User" u ON u.id = p."userId"
WHERE p."sessionId" = (SELECT id FROM "GameSession" WHERE "isActive" = true LIMIT 1);

-- Then delete duplicates (keep rn = 1, delete rn > 1)
-- BE CAREFUL - This will delete data!
-- Make a backup first!
```

### Fix 3: Correct the Base Calculation (if multiple portfolios are intentional)

If users SHOULD have multiple portfolios but with ONE shared starting cash allocation:
```typescript
// Change this line in both files:
// - src/app/api/user/ranking/route.ts (line 211)
// - src/lib/performance-computation-service.ts (line 421)

// FROM:
const base = sessionStartingCash * Math.max(1, u.portfolioCount);

// TO:
const base = sessionStartingCash; // Don't multiply by portfolio count
```

## Most Likely Cause

Based on the return percentages shown (+794%, +759%, +313%), the most likely cause is:

**Game session starting cash is set to $10,000 or $12,500 instead of $100,000**

To calculate what starting cash is being used:
- Marcus L. at +794% means: portfolioValue / startingCash = 8.94
- If portfolioValue ≈ $89,400, then startingCash = $89,400 / 8.94 ≈ **$10,000**

This suggests the game session was created with $10,000 starting cash instead of the default $100,000.

## Action Required

1. **Check Vercel database**: Verify the `startingCash` value in the active `GameSession`
2. **If wrong**: Update it to $100,000 (or whatever the intended value is)
3. **Re-run computation**: Trigger the performance computation job to recalculate rankings
4. **Add validation**: Consider adding a migration or seed script to ensure game sessions always have the correct starting cash

## Quick Verification on Vercel

Add this to your page to show the starting cash value:
```typescript
// In your dashboard or admin panel
const { data } = useRankings();
console.log('Session starting cash:', data?.meta?.startingCash);
```

Or check the API response:
```bash
curl "https://smg-rose.vercel.app/api/user/ranking" | jq '.data.meta.startingCash'
```
