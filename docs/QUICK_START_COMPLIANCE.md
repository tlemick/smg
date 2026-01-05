# Quick Start: Making Your Code Compliant

This guide shows you exactly how to refactor files to comply with the new financial architecture standards.

## TL;DR - The Rules

1. **NO native math on money:** Use `FinancialMath` service
2. **NO inline formatting:** Use `Formatters` service  
3. **NO business logic in components:** Move to services
4. **IMPORT correctly:** `import { FinancialMath, Formatters } from '@/lib/financial'`

---

## Quick Reference: Common Fixes

### Fix 1: Currency Formatting

```typescript
// ❌ BEFORE
<div>${price.toFixed(2)}</div>
<div>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>

// ✅ AFTER
import { Formatters } from '@/lib/financial';
<div>{Formatters.currency(price)}</div>
<div>{Formatters.currency(total)}</div>
```

### Fix 2: Percentage Formatting

```typescript
// ❌ BEFORE
<div>{(value * 100).toFixed(2)}%</div>
<div>{value >= 0 ? '+' : ''}{value.toFixed(2)}%</div>

// ✅ AFTER
import { Formatters } from '@/lib/financial';
<div>{Formatters.percentage(value)}</div>
<div>{Formatters.percentage(value, { showSign: true })}</div>
```

### Fix 3: Number Formatting

```typescript
// ❌ BEFORE
<div>{shares.toFixed(0)}</div>
<div>{shares.toFixed(2)}</div>

// ✅ AFTER
import { Formatters } from '@/lib/financial';
<div>{Formatters.shares(shares)}</div>  // Smart: "100" or "100.5"
<div>{Formatters.number(shares, { decimals: 2 })}</div>
```

### Fix 4: Market Cap / Large Numbers

```typescript
// ❌ BEFORE
const formatMarketCap = (val: number) => {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  return `$${val.toLocaleString()}`;
};

// ✅ AFTER
import { Formatters } from '@/lib/financial';
Formatters.marketCap(value)  // "1.2T", "500M", etc.
```

### Fix 5: Calculations

```typescript
// ❌ BEFORE
const total = shares * price;
const gain = currentValue - costBasis;
const percent = (gain / costBasis) * 100;

// ✅ AFTER
import { FinancialMath } from '@/lib/financial';
const total = FinancialMath.multiply(shares, price);
const gain = FinancialMath.subtract(currentValue, costBasis);
const percent = FinancialMath.calculateGainPercent(gain, costBasis);
```

### Fix 6: Inline Formatter Functions

```typescript
// ❌ BEFORE
const formatCurrency = (num: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatPercentage = (num: number) => {
  return `${num.toFixed(2)}%`;
};

// ✅ AFTER
import { Formatters } from '@/lib/financial';
// Just use Formatters.currency() and Formatters.percentage() directly!
```

---

## Step-by-Step: Refactoring a Component

### Example: Refactoring a Trading Component

**File: `src/components/trading/BuyOrderModal.tsx`**

#### Step 1: Import the Services

```typescript
// Add at the top of the file
import { FinancialMath, Formatters } from '@/lib/financial';
```

#### Step 2: Find and Replace Inline Formatters

Search for:
- `toFixed(`
- `toLocaleString(`
- `new Intl.NumberFormat`
- `const format` or `function format`

Replace with appropriate `Formatters` methods.

#### Step 3: Find and Replace Calculations

Search for money-related math operations:
- `* price`
- `+ fee`
- `- cost`
- `/ total`

Replace with `FinancialMath` methods.

#### Step 4: Remove Inline Functions

Delete any inline formatter functions completely.

#### Step 5: Test

```bash
# Run the compliance checker
./scripts/check-compliance.sh

# Verify the component renders
npm run dev

# Check for TypeScript errors
npm run type-check
```

---

## Before & After Example

### Complete Component Refactor

**BEFORE:**
```typescript
export function OrderSummary({ shares, price, fee }: Props) {
  // ❌ Inline formatter
  const formatCurrency = (val: number) => `$${val.toFixed(2)}`;
  
  // ❌ Native math
  const subtotal = shares * price;
  const total = subtotal + fee;
  
  return (
    <div>
      <p>Shares: {shares.toFixed(0)}</p>
      <p>Price: {formatCurrency(price)}</p>
      <p>Subtotal: {formatCurrency(subtotal)}</p>
      <p>Fee: {formatCurrency(fee)}</p>
      <p>Total: {formatCurrency(total)}</p>
    </div>
  );
}
```

**AFTER:**
```typescript
import { FinancialMath, Formatters } from '@/lib/financial';

export function OrderSummary({ shares, price, fee }: Props) {
  // ✅ Use service for calculations
  const subtotal = FinancialMath.multiply(shares, price);
  const total = FinancialMath.add(subtotal, fee);
  
  return (
    <div>
      <p>Shares: {Formatters.shares(shares)}</p>
      <p>Price: {Formatters.currency(price)}</p>
      <p>Subtotal: {Formatters.currency(subtotal)}</p>
      <p>Fee: {Formatters.currency(fee)}</p>
      <p>Total: {Formatters.currency(total)}</p>
    </div>
  );
}
```

---

## Formatters Service Cheat Sheet

```typescript
import { Formatters } from '@/lib/financial';

// Currency
Formatters.currency(1234.56)                              // "$1,234.56"
Formatters.currency(1234.56, { currency: 'EUR' })         // "€1,234.56"
Formatters.currency(1234567, { compact: true })           // "$1.23M"
Formatters.currency(1234.56, { hideSymbol: true })        // "1,234.56"

// Percentage
Formatters.percentage(0.1234)                             // "12.34%"
Formatters.percentage(0.1234, { showSign: true })         // "+12.34%"
Formatters.percentage(12.34, { multiplier: 1 })           // "12.34%" (already %)

// Numbers
Formatters.number(1234567)                                // "1,234,567"
Formatters.number(1234567, { notation: 'compact' })       // "1.23M"
Formatters.number(1234.5678, { decimals: 2 })             // "1,234.57"

// Shares (smart decimal handling)
Formatters.shares(100)                                    // "100"
Formatters.shares(100.5)                                  // "100.5"
Formatters.shares(100.532145)                             // "100.532145"

// Large Numbers
Formatters.marketCap(1234567890000)                       // "$1.23T"
Formatters.marketCap(5000000000)                          // "$5.00B"
Formatters.volume(15300000)                               // "15.3M"

// Prices (smart decimal handling based on magnitude)
Formatters.price(123.45)                                  // "$123.45"
Formatters.price(0.0012)                                  // "$0.0012" (penny stock)

// Dates
Formatters.date(new Date(), 'short')                      // "12/29/24"
Formatters.date(new Date(), 'long')                       // "December 29, 2024"
Formatters.relativeTime(new Date(Date.now() - 3600000))  // "1 hour ago"

// P&L with color
const { value, colorClass } = Formatters.pnl(1234.56);
// value: "+$1,234.56", colorClass: "text-chart-positive"
```

---

## FinancialMath Service Cheat Sheet

```typescript
import { FinancialMath } from '@/lib/financial';

// Basic Operations
FinancialMath.add(0.1, 0.2)                    // Decimal(0.3) - NOT 0.30000000000000004!
FinancialMath.subtract(1.0, 0.9)               // Decimal(0.1)
FinancialMath.multiply(100, 0.29)              // Decimal(29) - NOT 28.999999999999996!
FinancialMath.divide(10, 3)                    // Decimal(3.333...)

// Financial Operations
FinancialMath.calculateCost(100, 29.99)                          // Order cost
FinancialMath.calculateGain(1500, 1000)                          // P&L
FinancialMath.calculateROI(1000, 1500)                           // Return %
FinancialMath.calculatePortfolioPercent(3000, 10000)             // Allocation %

// Aggregation
FinancialMath.sum([1, 2, 3, 4, 5])             // Sum array
FinancialMath.min(5, 2, 8, 1, 9)               // Find minimum
FinancialMath.max(5, 2, 8, 1, 9)               // Find maximum

// Comparison
FinancialMath.equals(0.1 + 0.2, 0.3)           // true (precise!)
FinancialMath.greaterThan(5, 3)                // true
FinancialMath.lessThan(3, 5)                   // true

// Conversion
const decimal = FinancialMath.multiply(100, 0.29);
decimal.toNumber()                              // Convert to JS number
FinancialMath.toCurrency(decimal)              // "29.00"
```

---

## Common Patterns by Component Type

### Trading Components
```typescript
import { FinancialMath, FinancialCalculators, Formatters } from '@/lib/financial';

// Calculate order cost
const cost = FinancialCalculators.calculateOrderCost(shares, price, 'BUY');
const formatted = Formatters.currency(cost.total);

// Calculate max affordable shares
const maxShares = FinancialCalculators.calculateMaxShares(
  cashBalance,
  price,
  allowFractional
);
```

### Portfolio Components
```typescript
import { FinancialCalculators, Formatters } from '@/lib/financial';

// Calculate portfolio metrics
const metrics = FinancialCalculators.calculatePortfolioMetrics(
  holdings,
  cashBalance
);

// Format for display
const display = {
  total: Formatters.currency(metrics.totalValue),
  return: Formatters.percentage(metrics.unrealizedPnLPercent, { showSign: true }),
  cash: Formatters.currency(metrics.cashValue)
};
```

### Dashboard Components
```typescript
import { Formatters } from '@/lib/financial';

// Just display pre-calculated values
<div>{Formatters.currency(portfolioValue)}</div>
<div>{Formatters.percentage(returnPercent, { showSign: true })}</div>
<div>{Formatters.number(rank)} / {Formatters.number(totalUsers)}</div>
```

---

## Tools to Help

### 1. Compliance Checker Script
```bash
./scripts/check-compliance.sh
```
Shows violations and tracks progress.

### 2. ESLint Configuration
The `.eslintrc-financial.json` file contains rules to warn about violations.

### 3. Documentation
- `.cursor/rules/financial-math.mdc` - Comprehensive standards
- `.cursor/rules/component-patterns.mdc` - Component guidelines
- `src/lib/README.md` - Service documentation
- `COMPLIANCE_AUDIT.md` - Full file-by-file audit

---

## Need Help?

1. **See examples:** Look at already-refactored files:
   - `src/components/asset/StockMetrics.tsx`
   - `src/components/asset/FundMetrics.tsx`
   - `src/components/portfolio/PerformanceHighlights.tsx`

2. **Read the docs:**
   - `src/lib/README.md` - Complete service documentation
   - `.cursor/rules/*.mdc` - Detailed standards

3. **Run the checker:**
   - `./scripts/check-compliance.sh` - See violations

4. **Check tests:**
   - `tests/financial-math.test.ts` - See service examples

---

## Priority Order

Focus on these in order:

1. **🔴 Critical: Trading components** (calculations must be precise)
2. **🟡 High: Dashboard components** (high visibility)
3. **🟢 Medium: Asset detail pages** (complex but less frequently modified)
4. **⚪ Low: Admin/onboarding** (internal-facing)

---

## Success = Zero Violations

Run `./scripts/check-compliance.sh` after each refactor.  
Goal: "🎉 All checks passed! Codebase is compliant."
