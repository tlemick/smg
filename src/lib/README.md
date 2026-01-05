# Service Layer Documentation

This directory contains all business logic services for the application. Services are organized by domain and provide reusable, testable functionality that is completely decoupled from UI concerns.

## Architecture Overview

```
/src/lib/
├── financial/          # Financial calculations & formatting
│   ├── financial-math.ts    # Precision arithmetic with Decimal.js
│   ├── formatters.ts        # Display formatting (currency, %, numbers)
│   ├── calculators.ts       # Complex financial calculations
│   └── index.ts             # Barrel export
├── api/                # API communication
│   └── api-client.ts        # Centralized HTTP client
└── [domain services]   # Other services (cash-management, etc.)
```

## Core Principles

### 1. Services are Pure or Static
Services do not use React hooks and have no side effects (other than API calls). They are either:
- **Pure functions**: Input → Output, no side effects
- **Static class methods**: Organized functionality, no instance state

### 2. Single Responsibility
Each service handles one domain:
- `FinancialMath`: Precision arithmetic
- `Formatters`: Display formatting
- `FinancialCalculators`: Complex calculations
- `ApiClient`: HTTP communication

### 3. Testable Without Mocking React
All services can be unit tested without mocking React or any UI framework.

## Services Reference

### Financial Services

#### FinancialMath
**Purpose:** Provides precision arithmetic for financial calculations using Decimal.js

**When to use:**
- Any money-related calculation
- Order cost calculations
- P&L calculations
- Portfolio value aggregation

**Example:**
```typescript
import { FinancialMath } from '@/lib/financial';

// Instead of: total = shares * price
const total = FinancialMath.multiply(shares, price);

// Instead of: gain = current - cost
const gain = FinancialMath.subtract(currentValue, costBasis);
```

**Key Methods:**
- `add(a, b)` - Add two numbers with precision
- `subtract(a, b)` - Subtract with precision
- `multiply(a, b)` - Multiply with precision
- `divide(a, b)` - Divide with precision (throws on zero)
- `calculateCost(shares, price)` - Calculate order cost
- `calculateGain(current, cost)` - Calculate P&L
- `calculateROI(invested, current)` - Calculate return on investment
- `sum(values[])` - Sum array of values

#### Formatters
**Purpose:** Centralized formatting for all display values

**When to use:**
- Displaying currency values
- Formatting percentages
- Formatting numbers for display
- Date formatting

**Example:**
```typescript
import { Formatters } from '@/lib/financial';

// Currency
Formatters.currency(1234.56) // "$1,234.56"
Formatters.currency(1234.56, { compact: true }) // "$1.23K"

// Percentage
Formatters.percentage(0.1234, { showSign: true }) // "+12.34%"

// Number
Formatters.number(1234567, { notation: 'compact' }) // "1.23M"

// Shares (smart decimal handling)
Formatters.shares(100) // "100"
Formatters.shares(100.5) // "100.5"
```

**Key Methods:**
- `currency(amount, options?)` - Format as currency
- `percentage(value, options?)` - Format as percentage
- `number(value, options?)` - Format number with locale
- `shares(value)` - Format shares/quantities
- `marketCap(value)` - Format market cap (1.2T, 5.3M)
- `volume(value)` - Format trading volume
- `date(date, format?)` - Format dates
- `price(value, currency?)` - Smart price formatting

#### FinancialCalculators
**Purpose:** Complex financial calculations for portfolios and positions

**When to use:**
- Portfolio metrics calculations
- Position P&L calculations
- Allocation breakdowns
- Order cost with fees

**Example:**
```typescript
import { FinancialCalculators } from '@/lib/financial';

// Portfolio metrics
const metrics = FinancialCalculators.calculatePortfolioMetrics(
  holdings,
  cashBalance
);
// Returns: { totalValue, investedValue, unrealizedPnL, ... }

// Position metrics
const position = FinancialCalculators.calculatePositionMetrics(
  holding,
  currentPrice
);
// Returns: { currentValue, unrealizedPnL, unrealizedPnLPercent, ... }

// Order cost
const cost = FinancialCalculators.calculateOrderCost(
  shares,
  price,
  'BUY'
);
// Returns: { subtotal, fees, total, breakdown }
```

### API Client

#### ApiClient
**Purpose:** Centralized HTTP communication with error handling and retry logic

**When to use:**
- All API calls from frontend
- Replace raw `fetch()` calls

**Example:**
```typescript
import { ApiClient } from '@/lib/api/api-client';

// GET request
const data = await ApiClient.get<PortfolioData>('/api/portfolio/overview');

// POST request
const result = await ApiClient.post<OrderResponse>(
  '/api/trade/market-order',
  orderData
);

// Error handling
try {
  const data = await ApiClient.get('/api/data');
} catch (error) {
  if (ApiClient.isApiError(error)) {
    console.error('API Error:', error.message);
  }
}
```

**Features:**
- Automatic timeout handling (30s default)
- Retry logic with exponential backoff
- Consistent error handling
- TypeScript generic support

## Usage Patterns

### Pattern 1: Hooks Call Services

```typescript
// Hook: usePortfolioMetrics.ts
export function usePortfolioMetrics() {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  
  useEffect(() => {
    const rawData = await ApiClient.get('/api/portfolio');
    
    // Use services to calculate and format
    const calculated = FinancialCalculators.calculatePortfolioMetrics(
      rawData.holdings,
      rawData.cash
    );
    
    const formatted = {
      totalValue: Formatters.currency(calculated.totalValue),
      return: Formatters.percentage(calculated.unrealizedPnLPercent, { showSign: true })
    };
    
    setMetrics({ raw: calculated, formatted });
  }, []);
  
  return metrics;
}
```

### Pattern 2: Components Display Pre-Computed Values

```typescript
// Component: PortfolioCard.tsx
export function PortfolioCard() {
  const metrics = usePortfolioMetrics();
  
  if (!metrics) return <Skeleton />;
  
  // Just display - no logic
  return (
    <div>
      <p>Total: {metrics.formatted.totalValue}</p>
      <p>Return: {metrics.formatted.return}</p>
    </div>
  );
}
```

### Pattern 3: Services Chain Together

```typescript
// Service uses another service
export class AdvancedCalculator {
  static calculateComplexMetric(data: Data) {
    // Use FinancialMath for precision
    const subtotal = FinancialMath.multiply(data.quantity, data.price);
    const withFees = FinancialMath.add(subtotal, data.fees);
    
    // Use Formatters for display
    return {
      value: withFees.toNumber(),
      formatted: Formatters.currency(withFees)
    };
  }
}
```

## Anti-Patterns (What NOT to Do)

### ❌ Don't: Services Using Hooks
```typescript
// BAD
export class BadService {
  static doSomething() {
    const user = useUser(); // ERROR: Services can't use hooks
    return user.id;
  }
}
```

### ❌ Don't: Inline Formatting in Components
```typescript
// BAD
function Component({ price }) {
  return <div>${price.toFixed(2)}</div>;
}

// GOOD
function Component({ price }) {
  return <div>{Formatters.currency(price)}</div>;
}
```

### ❌ Don't: Native Math for Money
```typescript
// BAD
const total = shares * price;
const gain = current - cost;

// GOOD
const total = FinancialMath.multiply(shares, price);
const gain = FinancialMath.subtract(current, cost);
```

### ❌ Don't: Duplicate Logic Across Files
```typescript
// BAD - Defined in multiple components
const formatCurrency = (val) => `$${val.toFixed(2)}`;

// GOOD - Use centralized service
import { Formatters } from '@/lib/financial';
Formatters.currency(val);
```

## Testing Services

All services should have comprehensive unit tests:

```typescript
// financial-math.test.ts
import { FinancialMath } from '@/lib/financial/financial-math';

describe('FinancialMath', () => {
  test('handles floating point precision', () => {
    const result = FinancialMath.add(0.1, 0.2);
    expect(result.toNumber()).toBe(0.3); // Not 0.30000000000000004
  });
  
  test('calculates order cost accurately', () => {
    const cost = FinancialMath.calculateCost(100, 29.99);
    expect(cost.toNumber()).toBe(2999.00); // Exactly
  });
});
```

## Migration Guide

### Refactoring Existing Code

1. **Find Inline Formatters:**
   Search for: `toFixed`, `toLocaleString`, `Intl.NumberFormat`
   Replace with: `Formatters` service calls

2. **Find Inline Math:**
   Search for: `* / + -` operators with money values
   Replace with: `FinancialMath` service calls

3. **Find Duplicated Logic:**
   Search for: Similar functions across multiple files
   Extract to: Appropriate service

### Example Refactoring

**Before:**
```typescript
export function OrderModal({ shares, price }) {
  const total = shares * price;
  const formatted = `$${total.toFixed(2)}`;
  const fee = total * 0.001;
  const finalCost = total + fee;
  
  return <div>Total: {formatted}</div>;
}
```

**After:**
```typescript
import { FinancialCalculators, Formatters } from '@/lib/financial';

export function OrderModal({ shares, price }) {
  const cost = FinancialCalculators.calculateOrderCost(shares, price, 'BUY');
  const formatted = Formatters.currency(cost.total);
  
  return <div>Total: {formatted}</div>;
}
```

## Quick Reference

| Task | Service | Method |
|------|---------|--------|
| Add money values | `FinancialMath` | `add(a, b)` |
| Calculate order cost | `FinancialCalculators` | `calculateOrderCost(...)` |
| Format currency | `Formatters` | `currency(amount)` |
| Format percentage | `Formatters` | `percentage(value)` |
| Format shares | `Formatters` | `shares(value)` |
| API GET request | `ApiClient` | `get<T>(endpoint)` |
| API POST request | `ApiClient` | `post<T>(endpoint, data)` |
| Calculate P&L | `FinancialMath` | `calculateGain(current, cost)` |
| Calculate ROI % | `FinancialMath` | `calculateROI(invested, current)` |

## Additional Resources

- [Financial Math Standards](/.cursor/rules/financial-math.mdc) - Detailed rules for financial calculations
- [Service Layer Architecture](/.cursor/rules/service-layer.mdc) - Architecture patterns and guidelines
- [Component Patterns](/.cursor/rules/component-patterns.mdc) - How components should use services
- [Engineering Guide](/docs/engineering-guide.md) - Full engineering standards

## Contributing

When adding new services:

1. **Follow the patterns** - Look at existing services for consistency
2. **Write tests** - All services must be unit tested
3. **Document** - Add JSDoc comments and examples
4. **Pure functions** - No side effects except for API calls
5. **Single responsibility** - One service, one domain
6. **TypeScript** - Strict typing, no `any` types
