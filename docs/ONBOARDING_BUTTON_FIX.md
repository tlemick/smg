# Onboarding Button Fix - Race Condition

## Problem
After purchasing an asset (stock, mutual fund, or bond) during onboarding, the "Continue" button would:
1. Become active for ~1 second ✅
2. Then immediately become inactive again ❌
3. User couldn't proceed even though they made a valid purchase

## Root Cause

**Race Condition in State Management**

The `handlePurchaseSuccess()` function was doing this:
```typescript
const handlePurchaseSuccess = () => {
  setHasPurchased(true);        // ✅ Button active
  setSelectedAsset(null);
  checkOnboardingStatus();      // ❌ This overwrites hasPurchased!
};
```

And `checkOnboardingStatus()` was:
```typescript
setHasPurchased(data.portfolio.hasMutualFunds);  // Returns false!
```

### Why it returned false:
- Purchase transaction commits to database
- `checkOnboardingStatus()` queries database immediately
- Database query might not see new holding yet due to timing
- OR query completes before transaction commits
- Sets `hasPurchased = false` → Button becomes inactive

## Solution

Changed state update logic to **preserve user action** even if API hasn't caught up:

```typescript
// BEFORE (BAD)
setHasPurchased(data.portfolio.hasMutualFunds);

// AFTER (GOOD)  
setHasPurchased(prev => prev || data.portfolio.hasMutualFunds);
```

This means:
- If user just made a purchase (`prev = true`), keep it `true`
- If API confirms they have holdings, set it `true`
- Never overwrite a successful purchase with a false negative

## Files Fixed

All three onboarding pages had this issue:

1. ✅ `src/app/onboarding/stocks/page.tsx` - Line 68
2. ✅ `src/app/onboarding/mutual-funds/page.tsx` - Line 59
3. ✅ `src/app/onboarding/bonds/page.tsx` - Line 59

## Behavior Now

1. User purchases asset → `hasPurchased = true` ✅
2. Button becomes active ✅
3. `checkOnboardingStatus()` is called
4. Even if API returns `false` (timing), button **stays active** ✅
5. Next time page loads, API will confirm holdings and show correct state ✅
6. User can proceed with onboarding flow ✅

## Testing

Test each onboarding step:

1. **Stocks Page:**
   - Purchase any stock
   - Button should stay active
   - Can click "Continue to Mutual Funds"

2. **Mutual Funds Page:**
   - Purchase any mutual fund
   - Button should stay active
   - Can click "Continue to Bonds"

3. **Bonds Page:**
   - Purchase any bond
   - Button should stay active
   - Can click "Complete Onboarding"

## Date Fixed
October 28, 2025

