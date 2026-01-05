# Code Compliance Audit

This document tracks compliance with the new financial architecture standards defined in:
- `.cursor/rules/financial-math.mdc`
- `.cursor/rules/service-layer.mdc`
- `.cursor/rules/component-patterns.mdc`

## Audit Status: In Progress

**Last Updated:** December 30, 2024

---

## Violation Categories

### 🔴 Critical Violations
- Native arithmetic on money values (`* / + -`)
- Inline formatters in components (`toFixed`, `toLocaleString`, `new Intl.NumberFormat`)
- Business logic in components

### 🟡 Medium Violations
- Direct fetch() calls (should use ApiClient)
- Duplicate formatting logic

### 🟢 Low Priority
- Minor formatting inconsistencies
- Console.log statements

---

## Files Requiring Updates

### ✅ Already Compliant (19 files)
- `src/components/asset/StockMetrics.tsx`
- `src/components/asset/FundMetrics.tsx`
- `src/components/asset/BondMetrics.tsx`
- `src/components/asset/AssetOverviewPanel.tsx`
- `src/components/asset/RiskMeasuresPanel.tsx`
- `src/components/portfolio/PerformanceHighlights.tsx`
- `src/lib/cash-management-service.ts`
- `src/lib/investment-calculator-service.ts`
- `src/lib/financial/financial-math.ts`
- `src/lib/financial/formatters.ts`
- `src/lib/financial/calculators.ts`
- `src/lib/api/api-client.ts`
- All rule files (`.cursor/rules/*.mdc`)
- Documentation files

### 🔴 High Priority - Formatting Violations (25 files)

#### Dashboard Components
1. **src/components/dashboard/PortfolioCard.tsx**
   - Uses: `toFixed()`, `toLocaleString()`
   - Action: Replace with `Formatters.currency()`, `Formatters.percentage()`
   
2. **src/components/dashboard/Watchlists.tsx**
   - Uses: `toLocaleString()`, inline formatters
   - Action: Import and use `Formatters` service
   
3. **src/components/dashboard/PortfolioPerformanceChart.tsx**
   - Uses: `toFixed()`
   - Action: Use `Formatters.percentage()`
   
4. **src/components/dashboard/TransactionItem.tsx**
   - Uses: `toFixed()`, `toLocaleString()`, inline formatters
   - Action: Replace with `Formatters` methods
   
5. **src/components/dashboard/ActivityItem.tsx**
   - Uses: Inline formatters
   - Action: Use `Formatters` service
   
6. **src/components/dashboard/LeaderboardCard.tsx**
   - Uses: `toFixed()`, inline function formatters
   - Action: Replace with `Formatters.percentage()`
   
7. **src/components/dashboard/Leaderboard.tsx**
   - Uses: `toFixed()`, inline function formatters
   - Action: Replace with `Formatters.percentage()`, `Formatters.currency()`
   
8. **src/components/dashboard/PortfolioCategoryChart.tsx**
   - Uses: `toLocaleString()`
   - Action: Use `Formatters.currency()`

#### Portfolio Components
9. **src/components/portfolio/PortfolioTreemap.tsx**
   - Uses: `toFixed()`, `new Intl.NumberFormat`, inline formatters
   - Action: Replace all with `Formatters` service

10. **src/components/portfolio/InvestmentProjectionsCalculator.tsx**
    - Uses: `toFixed()` (may be OK if using InvestmentCalculator service)
    - Action: Verify service usage, update if needed

#### Trading Components
11. **src/components/trading/BuyOrderModal.tsx**
    - Uses: `toFixed()`, `new Intl.NumberFormat`, inline formatters
    - Action: Replace with `Formatters`, ensure calculations use `FinancialCalculators`
    
12. **src/components/trading/SellOrderModal.tsx**
    - Uses: `toFixed()`, `new Intl.NumberFormat`, inline formatters
    - Action: Replace with `Formatters`, ensure calculations use `FinancialCalculators`
    
13. **src/components/trading/OrderManagement.tsx**
    - Uses: `new Intl.NumberFormat`, inline formatters
    - Action: Replace with `Formatters`
    
14. **src/components/trading/forms/BuyOrderForm.tsx**
    - Uses: `toFixed()`, `new Intl.NumberFormat`, inline formatters
    - Action: Replace with `Formatters`, calculations to services
    
15. **src/components/trading/forms/SellOrderForm.tsx**
    - Uses: `toFixed()`, `new Intl.NumberFormat`, inline formatters
    - Action: Replace with `Formatters`, calculations to services
    
16. **src/components/trading/layout/TradePage.tsx**
    - Uses: `toFixed()`, `new Intl.NumberFormat`, inline formatters
    - Action: Replace with `Formatters`

#### Asset Components
17. **src/components/asset/AssetHeader.tsx**
    - Uses: `toFixed()`, `toLocaleString()`, `new Intl.NumberFormat`, inline formatters
    - Action: Replace with `Formatters` (likely needs significant refactoring)
    
18. **src/components/asset/AssetChart.tsx**
    - Uses: `toFixed()`, `new Intl.NumberFormat`
    - Action: Replace with `Formatters`
    
19. **src/components/asset/UserHoldings.tsx**
    - Uses: `toFixed()`, `toLocaleString()`, `new Intl.NumberFormat`, inline formatters
    - Action: Replace with `Formatters`, ensure calculations use services
    
20. **src/components/asset/AssetNewsPanel.tsx**
    - Uses: Inline function formatters
    - Action: Replace with `Formatters.date()` or `Formatters.relativeTime()`

#### Onboarding Components
21. **src/components/onboarding/TrendingAssetsList.tsx**
    - Uses: `toFixed()`, `new Intl.NumberFormat`, inline formatters
    - Action: Replace with `Formatters`
    
22. **src/components/onboarding/SimplifiedBuyForm.tsx**
    - Uses: `toFixed()`, `new Intl.NumberFormat`, inline formatters
    - Action: Replace with `Formatters`, calculations to services
    
23. **src/components/onboarding/AssetSuggestionCard.tsx**
    - Uses: `new Intl.NumberFormat`, inline formatters
    - Action: Replace with `Formatters`
    
24. **src/components/onboarding/OnboardingSidebarContent.tsx**
    - Uses: `toLocaleString()`
    - Action: Replace with `Formatters.currency()`

#### Admin Components
25. **src/components/admin/GameSessionManagement.tsx**
    - Uses: `toFixed()`, `new Intl.NumberFormat`, inline formatters
    - Action: Replace with `Formatters`
    
26. **src/components/admin/AdminDashboard.tsx**
    - Uses: Inline formatters
    - Action: Replace with `Formatters`
    
27. **src/components/admin/UserList.tsx**
    - Uses: Inline formatters
    - Action: Replace with `Formatters.date()`
    
28. **src/components/admin/UserCard.tsx**
    - Uses: Inline formatters
    - Action: Replace with `Formatters.date()`

#### Test Components
29. **src/components/test/TradingSystemTest.tsx**
    - Uses: `toFixed()`, `toLocaleString()`
    - Action: Replace with `Formatters` (test component, lower priority)

---

## Systematic Refactoring Plan

### Phase 1: Critical Trading Components (Week 1)
**Why first:** Most critical for financial accuracy
- [ ] BuyOrderForm.tsx
- [ ] SellOrderForm.tsx
- [ ] BuyOrderModal.tsx
- [ ] SellOrderModal.tsx
- [ ] OrderManagement.tsx

**Pattern:**
```typescript
// Before
const total = shares * price;
const formatted = `$${total.toFixed(2)}`;

// After
import { FinancialMath, Formatters } from '@/lib/financial';
const total = FinancialMath.multiply(shares, price);
const formatted = Formatters.currency(total);
```

### Phase 2: Dashboard & Display Components (Week 2)
**Why second:** High visibility, user-facing
- [ ] PortfolioCard.tsx
- [ ] Watchlists.tsx
- [ ] TransactionItem.tsx
- [ ] Leaderboard.tsx
- [ ] LeaderboardCard.tsx
- [ ] PortfolioPerformanceChart.tsx
- [ ] PortfolioCategoryChart.tsx
- [ ] ActivityItem.tsx

### Phase 3: Asset Detail Components (Week 3)
**Why third:** Complex but less frequently modified
- [ ] AssetHeader.tsx
- [ ] AssetChart.tsx
- [ ] UserHoldings.tsx
- [ ] AssetNewsPanel.tsx

### Phase 4: Portfolio & Analytics (Week 4)
- [ ] PortfolioTreemap.tsx
- [ ] InvestmentProjectionsCalculator.tsx

### Phase 5: Onboarding & Admin (Week 5)
**Why last:** Lower priority, less critical for core functionality
- [ ] TrendingAssetsList.tsx
- [ ] SimplifiedBuyForm.tsx
- [ ] AssetSuggestionCard.tsx
- [ ] OnboardingSidebarContent.tsx
- [ ] GameSessionManagement.tsx
- [ ] AdminDashboard.tsx
- [ ] UserList.tsx
- [ ] UserCard.tsx
- [ ] TradePage.tsx

### Phase 6: Test Components (As Needed)
- [ ] TradingSystemTest.tsx

---

## Automated Compliance Checking

### Script 1: Find Formatting Violations
```bash
# Find all toFixed() usage in components
grep -r "toFixed(" src/components/ --include="*.tsx" | wc -l

# Find all toLocaleString() usage
grep -r "toLocaleString(" src/components/ --include="*.tsx" | wc -l

# Find all Intl.NumberFormat usage
grep -r "new Intl.NumberFormat" src/components/ --include="*.tsx" | wc -l

# Find inline formatter functions
grep -r "const format[A-Z].*=" src/components/ --include="*.tsx" | wc -l
```

### Script 2: Verify Formatters Import
```bash
# Check files that should import Formatters
grep -L "from '@/lib/financial'" src/components/**/*.tsx
```

### Script 3: Find Native Math on Money
```bash
# This is harder to detect automatically, requires code review
# Look for patterns like: price * quantity, total + fee, etc.
```

---

## Compliance Checklist

For each file being refactored, verify:

- [ ] ✅ No `toFixed()` calls
- [ ] ✅ No `toLocaleString()` calls
- [ ] ✅ No `new Intl.NumberFormat()` calls
- [ ] ✅ No inline formatter functions
- [ ] ✅ Imports `Formatters` from `@/lib/financial`
- [ ] ✅ No arithmetic operators on money values
- [ ] ✅ Uses `FinancialMath` for calculations
- [ ] ✅ No `fetch()` calls (use `ApiClient` if needed)
- [ ] ✅ No business logic (moved to services)
- [ ] ✅ Passes linter
- [ ] ✅ Component renders correctly
- [ ] ✅ Tests pass (if applicable)

---

## Testing Strategy

### Unit Tests
- All services already have tests
- Add tests for refactored components if they contain logic

### Integration Tests
1. Test trading flows (buy/sell)
2. Test portfolio displays
3. Test formatting in all themes
4. Test edge cases (zero, negative, large numbers)

### Manual Testing
1. Visual inspection of all formatted values
2. Check precision (no 0.30000000000000004)
3. Verify no NaN or undefined displays
4. Test in different locales (if supported)

---

## Progress Tracking

### Current Status
- **Compliant Files:** 19 / 48 (40%)
- **Files Remaining:** 29
- **Critical Files Remaining:** 5 (trading components)

### Velocity Target
- **Goal:** 5-6 files per week
- **Timeline:** 5-6 weeks to full compliance
- **Priority:** Trading components completed in Week 1

---

## Common Refactoring Patterns

### Pattern 1: Simple Formatting
```typescript
// Before
{price.toFixed(2)}

// After
import { Formatters } from '@/lib/financial';
{Formatters.currency(price)}
```

### Pattern 2: Percentage with Sign
```typescript
// Before
{value >= 0 ? '+' : ''}{value.toFixed(2)}%

// After
{Formatters.percentage(value / 100, { showSign: true })}
```

### Pattern 3: Calculation + Formatting
```typescript
// Before
const total = shares * price;
const formatted = `$${total.toFixed(2)}`;

// After
const total = FinancialMath.multiply(shares, price);
const formatted = Formatters.currency(total);
```

### Pattern 4: Inline Formatter Function
```typescript
// Before
const formatCurrency = (val: number) => `$${val.toFixed(2)}`;
<div>{formatCurrency(price)}</div>

// After
import { Formatters } from '@/lib/financial';
<div>{Formatters.currency(price)}</div>
```

### Pattern 5: Market Cap / Large Numbers
```typescript
// Before
const formatMarketCap = (val: number) => {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  // ...
};

// After
{Formatters.marketCap(value)}
```

---

## Notes

- **Backward Compatibility:** Some files (like `AssetOverviewPanel.tsx`) use wrapper functions for backward compatibility. This is acceptable as a transitional pattern.
- **Test Components:** Lower priority but should still be updated for consistency.
- **Date Formatting:** Use `Formatters.date()` or `Formatters.relativeTime()` for consistency.
- **Admin Components:** Can be updated last as they're internal-facing.

---

## Next Actions

1. **Immediate:** Start with Phase 1 (Critical Trading Components)
2. **Create PR Template:** Include compliance checklist in PR template
3. **Add Linter Rules:** Configure ESLint to warn on `toFixed`, `toLocaleString` in components
4. **Documentation:** Add refactoring examples to engineering guide
5. **Code Review:** Ensure all new PRs follow the patterns

---

## Success Metrics

- ✅ Zero inline formatters in components
- ✅ Zero native arithmetic on money values
- ✅ All formatting uses `Formatters` service
- ✅ All calculations use `FinancialMath` or `FinancialCalculators`
- ✅ Consistent formatting across entire app
- ✅ No precision errors in displays
- ✅ Tests passing
- ✅ Linter passing with new rules
