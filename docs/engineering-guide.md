## SMG Engineering Guide: Code Organization, APIs, and Conventions

This guide orients new contributors to the Stock Market Game (SMG) codebase. It explains the overall architecture, how directories are organized, key APIs and endpoints, conventions used across the app, and step-by-step examples for adding features.

### Who this is for

- Engineers new to Next.js App Router and Prisma
- Beginners who want clear, practical explanations

---

## High-level Architecture

- Framework: Next.js 15 (App Router) with TypeScript
- Runtime: Node.js
- Database: PostgreSQL (via Prisma ORM)
- External Data: Yahoo Finance (`yahoo-finance2`)
- Styling: Tailwind CSS v4
- UI Components: Radix UI + custom components

### Layered responsibilities

- API routes (`src/app/api/...`): HTTP endpoints, validation, and orchestration
- Services (`src/lib/...`): Business logic and integrations - **CRITICAL: See Financial Math Standards below**
  - `financial/`: Precision math, formatting, and calculations (uses Decimal.js)
  - `api/`: Centralized HTTP client
  - Domain services: cash-management, market-state, risk-metrics, etc.
- Database models (`prisma/schema.prisma`): All persisted entities (users, assets, orders, etc.)
- Frontend app (`src/app/...`): Pages and layouts using the Next.js App Router
- Components (`src/components/...`): Reusable UI composed by feature area - **NO LOGIC OR FORMATTING**
- Hooks (`src/hooks/...`): Data fetching and UI logic - calls services, provides data to components
- Types (`src/types/...`): Shared request/response contracts and UI types

### Data flow (example: getting a quote)

1) UI calls `useStockApi().getQuote({ ticker })`
2) `POST /api/quote` locates/creates an `Asset` and calls `getAssetQuoteWithCache`
3) `yahoo-finance-service` fetches from Yahoo Finance, upserts cache in `AssetQuoteCache`, returns serializable data
4) API responds with `{ success, data, meta }` following `ApiResponse<T>`

---

## Directory Structure (what to look for)

- src/app/
  - Pages and routes. App Router conventions: `page.tsx` for pages, `route.ts` for API handlers, nested directories for segments.
  - Example pages: `dashboard/page.tsx`, `asset/[ticker]/page.tsx`
  - Example APIs: `api/quote/route.ts`, `api/chart/route.ts`, `api/trade/market-order/route.ts`

- src/components/
  - Grouped by domain: `asset/`, `dashboard/`, `trading/`, `ui/`, `layout/`.
  - Components use PascalCase files, e.g., `AssetHeader.tsx`, `UserHoldings.tsx`.

- src/hooks/
  - Data hooks (e.g., `useStockApi.ts`) and feature hooks (portfolio, watchlist, rankings).

- src/lib/
  - Services with focused responsibilities:
    - `yahoo-finance-service.ts`: quotes, chart data, caching, search
    - `market-state-service.ts`: interprets current market state
    - `cash-management-service.ts`: cash validation and updates
    - `order-execution-service.ts`: background processing for queued/limit orders
    - `activity-service.ts`: dashboard activity feed entries

- prisma/
  - `schema.prisma`: database models and relations
  - `migrations/`: generated migrations
  - `client.ts`: shared Prisma client

- src/types/
  - API request/response contracts (`ApiResponse<T>`, `QuoteApiRequest`, `ChartApiRequest`, etc.)

- scripts/
  - Data maintenance and utilities (logo updates, seeds, tests)

---

## Database Models (Prisma)

Key models defined in `prisma/schema.prisma`:

- User, Portfolio, GameSession: user accounts and simulation sessions
- Asset, Stock, Bond, MutualFund: tradable instruments and type-specific details
- AssetQuoteCache, AssetProfile, DailyAggregate: real-time and historical market data persistence
- Order, LimitOrder, Transaction, Holding: trading and portfolio state
- Watchlist, WatchlistItem: user watchlists
- UserActivity: dashboard activity feed items

Notes:
- The app relies on one active `GameSession` and creates a `Portfolio` for the user in that session on demand.
- Quotes are cached with TTL and enhanced metrics when available.
- Historical daily data is stored in `DailyAggregate` for efficient charting.

---

## Services Overview

- yahoo-finance-service.ts
  - `getAssetQuoteWithCache(assetId)` returns quote data with cache metadata
  - `getWatchlistQuotes(watchlistId)` batch fetches quotes for watchlists
  - `syncAssetHistoricalData(assetId, startDate, endDate)` persists daily OHLCV
  - `getChartDataDirect(ticker, start, end, interval)` returns intraday/short-range data (no DB persist)
  - `searchWithCache(query)` caches Yahoo search results
  - `createAssetFromTicker(ticker)` creates `Asset` and initial caches/profiles

- market-state-service.ts
  - Infers current trading session using cached `marketState` (e.g., REGULAR, PRE, POST)
  - Provides educational messaging and next trading session estimates

- cash-management-service.ts
  - Validates and updates cash balances with a simple, realistic fee model
  - Resets and summarizes cash for educational use cases

- order-execution-service.ts
  - Background processing for queued market orders and pending limit orders
  - Handles expiration, cancellation, execution, and activity entries

- activity-service.ts
  - Centralizes creation of user activities for trades, portfolio changes, milestones, etc.

---

## API Design and Endpoints

All routes live under `src/app/api/...` and follow Next.js App Router `route.ts` conventions. Responses generally use `ApiResponse<T>`:

```ts
type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  cached?: boolean;
  meta?: any;
}
```

### Market Data

- POST /api/quote
  - Input: `{ ticker, startDate?, endDate?, createAssetIfMissing? }`
  - Output: quote data (cached), optional historical window from DB

- POST /api/chart
  - Input: `{ ticker, period1?, period2?, interval? }`
  - Behavior: intraday/short-range via Yahoo direct; longer 1d ranges via DB (with on-demand sync)

- POST /api/search
  - Cached Yahoo search results for tickers/news

- GET /api/asset-detail/[ticker]
  - Rich detail for an asset (quote, profile, user holdings)

### Trading

- POST /api/trade/market-order
  - Requires auth; executes immediately during REGULAR market, queues when closed

- POST /api/trade/limit-order
  - Places a PENDING limit order with optional expiry; processed by background execution

- POST /api/trade/process-orders
  - Triggers queued/limit order processing (e.g., cron or manual)

- GET /api/trade/orders
- GET /api/trade/orders/[id]
  - Order management and inspection

### Portfolio and User

- GET /api/user/me, POST /api/user/login, POST /api/user/logout
  - Simple cookie-based session under `user_session`

- GET /api/user/portfolio/overview
- GET /api/user/portfolio/performance-series
- GET /api/user/portfolio/category-series

- GET /api/user/activity
- GET /api/user/ranking

- GET /api/user/holdings/[ticker]
  - User’s holdings and P&L context for a given asset

### Watchlists

- GET /api/watchlist
- POST /api/watchlist
- GET /api/watchlist/[id]
- GET /api/watchlist/[id]/quotes
- POST /api/watchlist/[id]/items
- DELETE /api/watchlist/[id]/items/[itemId]
- GET /api/user/watchlists/for-asset/[ticker]

### Admin

- GET/POST /api/admin/users, GET/PUT/DELETE /api/admin/users/[id]
- GET/POST /api/admin/game-sessions, GET/PUT/DELETE /api/admin/game-sessions/[id]
- POST /api/admin/setup-trading

### Test Utilities

- POST /api/test-data

---

## Frontend Patterns

### Pages and routing

- App Router: nested folders represent route segments
- `page.tsx` files export React components for each route
- Dynamic segments like `asset/[ticker]/page.tsx`

### Components

- PascalCase file names (e.g., `AssetHeader.tsx`)
- Group by feature domain (`asset`, `dashboard`, `trading`, `ui`, `layout`)
- Shared UI primitives live under `components/ui` and `components/layout`

### Hooks

- `useStockApi` standardizes POST calls for `/api/quote`, `/api/chart`, `/api/search`
- Other hooks encapsulate data loading patterns (portfolio, watchlist, rankings)

---

## Naming Conventions and Code Style

- Files and Folders
  - Pages: `page.tsx`; APIs: `route.ts`
  - Directories are lowercase with hyphens if needed; component files use PascalCase

- Components and Variables
  - Components: PascalCase; hooks: `useXyz`
  - Functions: verbs; variables: descriptive nouns
  - Constants (TTL, etc.): ALL_CAPS within modules

- Types
  - Centralized in `src/types/index.ts`
  - API contracts are explicit (`QuoteApiRequest`, `ChartApiRequest`, `ApiResponse<T>`) to ensure strong typing across the boundary

- Control Flow
  - Handle validation and early returns first in API handlers
  - Prefer guard clauses over deep nesting

- Error Handling
  - API handlers return `{ success: false, error }` with appropriate status codes
  - Services log errors and propagate meaningful messages

- Formatting
  - Match existing formatting and Tailwind class usage
  - Keep functions small and focused; extract service functions when logic grows

---

## Authentication and Sessions

- Cookie-based session stored under `user_session`
- Auth required for trading endpoints; anonymous access allowed for public market data
- A `Portfolio` is created on-demand for the current user within the single active `GameSession` (admin-controlled)

---

## Market Model and Education Features

- Market state derives from Yahoo Finance `marketState` (e.g., `REGULAR`, `POST`)
- Market orders execute immediately when the market is open; otherwise, they are queued
- Limit orders can execute whenever price conditions are met; expiration is supported
- Activity feed educates the user about outcomes (executed, queued, cancelled, expired) and milestones

---

## How to Add a New API Route (Example)

1) Create a folder under `src/app/api/your-endpoint` with a `route.ts`
2) Validate inputs early; return `400` for bad requests
3) Use services for business logic; keep the route thin
4) Return `NextResponse.json({ success: true, data, meta })`
5) Add types to `src/types/index.ts` for request/response

Example skeleton:

```ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // validate body here
    // call service
    return NextResponse.json({ success: true, data: { /* ... */ } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
```

---

## How to Add a New Page (Example)

1) Create a folder under `src/app/feature` with `page.tsx`
2) Compose domain components from `src/components/...`
3) Use hooks (e.g., `useStockApi`) for data fetching

Minimal page example:

```tsx
export default function ExamplePage() {
  return <div className="container">Hello, world</div>;
}
```

---

## Local Development

- Install deps: `npm install`
- Run dev server: `npm run dev`
- DB tasks:
  - Reset: `npm run db:reset`
  - Migrate: `npm run db:migrate`
  - Seed: `npm run db:seed`

Notes:
- `next.config.ts` allows builds to succeed even with ESLint/TS errors; fix issues locally before committing

---

## Common Gotchas and Tips

- Convert `bigint` to `string` for JSON serialization in API responses
- Reuse `Asset` records; route handlers often ensure the asset exists (auto-create when needed)
- Prefer batch quote APIs for watchlists to reduce external calls
- Keep API logic in services for testability and reuse

---

## Financial Math Standards

**CRITICAL:** JavaScript's native arithmetic is fundamentally flawed for financial calculations due to floating-point precision errors.

### The Problem

```javascript
// JavaScript floating-point errors:
0.1 + 0.2 = 0.30000000000000004  // NOT 0.3
100 * 0.29 = 28.999999999999996  // NOT 29
```

### The Solution: Use FinancialMath Service

**ALL financial calculations MUST use the FinancialMath service** which wraps Decimal.js for precision.

```typescript
import { FinancialMath } from '@/lib/financial';

// ❌ WRONG
const total = shares * price;
const gain = currentValue - costBasis;

// ✅ CORRECT
const total = FinancialMath.multiply(shares, price);
const gain = FinancialMath.subtract(currentValue, costBasis);
```

### Financial Services Overview

1. **FinancialMath** (`src/lib/financial/financial-math.ts`)
   - Precision arithmetic operations
   - Financial calculations (ROI, P&L, cost basis)
   - All operations use Decimal.js internally

2. **Formatters** (`src/lib/financial/formatters.ts`)
   - Display formatting for currency, percentages, numbers
   - Consolidates all formatting logic
   - Replaces inline `toFixed()`, `toLocaleString()`, etc.

3. **FinancialCalculators** (`src/lib/financial/calculators.ts`)
   - Complex calculations (portfolio metrics, position P&L)
   - Order cost calculations with fees
   - Allocation breakdowns

### Rules

1. **Never use native operators for money:** No `+`, `-`, `*`, `/` on currency values
2. **Never format in components:** Use `Formatters` service
3. **Backend handles complex math:** CAGR, Beta, moving averages stay in Python
4. **Round consistently:** Currency = 2 decimals, Percentages = 2 decimals

See [`.cursor/rules/financial-math.mdc`](/.cursor/rules/financial-math.mdc) for complete standards.

---

## Service Layer Architecture

Services provide reusable business logic completely decoupled from UI. They are:
- **Pure functions** or **static class methods**
- **Never use React hooks**
- **Unit testable** without mocking React

### Service Directory Structure

```
src/lib/
├── financial/               # Financial operations
│   ├── financial-math.ts    # Precision math
│   ├── formatters.ts        # Display formatting
│   ├── calculators.ts       # Complex calculations
│   └── index.ts             # Barrel export
├── api/                     # HTTP communication
│   └── api-client.ts        # Centralized fetch wrapper
└── [domain services]        # cash-management, market-state, etc.
```

### Data Flow

```
API Route → Hook → Service → Hook → Component
                   ↑
            (Business Logic)
```

**Example:**
```typescript
// Hook calls service
export function usePortfolioMetrics() {
  const [data, setData] = useState(null);
  
  useEffect(async () => {
    const raw = await ApiClient.get('/api/portfolio');
    
    // Service does calculations
    const metrics = FinancialCalculators.calculatePortfolioMetrics(
      raw.holdings,
      raw.cash
    );
    
    // Service does formatting
    const formatted = {
      total: Formatters.currency(metrics.totalValue),
      return: Formatters.percentage(metrics.unrealizedPnLPercent, { showSign: true })
    };
    
    setData({ raw: metrics, formatted });
  }, []);
  
  return data;
}

// Component just displays
export function PortfolioCard() {
  const { formatted } = usePortfolioMetrics();
  return <div>Total: {formatted.total}</div>;
}
```

See [`.cursor/rules/service-layer.mdc`](/.cursor/rules/service-layer.mdc) and [`src/lib/README.md`](/src/lib/README.md) for complete architecture.

---

## Component Patterns

**The Golden Rule:** Components are for UI rendering and user interaction ONLY.

### What Components SHOULD Do
- Render JSX
- Handle user events (onClick, onChange)
- Manage local UI state (modal open/closed, selected tab)
- Call hooks to get data

### What Components MUST NOT Do
- Perform calculations (not even `value1 + value2`)
- Format values (no `toFixed()`, `toLocaleString()`, etc.)
- Fetch data directly (no `fetch()` calls)
- Contain business logic

### Example: Before & After

**❌ BEFORE (Bad):**
```typescript
export function OrderModal({ shares, price }) {
  // BAD: Calculation in component
  const total = shares * price;
  
  // BAD: Inline formatting
  const formatted = `$${total.toFixed(2)}`;
  
  return <div>Total: {formatted}</div>;
}
```

**✅ AFTER (Good):**
```typescript
import { FinancialCalculators, Formatters } from '@/lib/financial';

export function OrderModal({ shares, price }) {
  // Service handles calculation
  const cost = FinancialCalculators.calculateOrderCost(shares, price, 'BUY');
  
  // Service handles formatting
  const formatted = Formatters.currency(cost.total);
  
  return <div>Total: {formatted}</div>;
}
```

**✅ BEST (Hook provides everything):**
```typescript
// Hook
export function useOrderCost(shares: number, price: number) {
  return useMemo(() => {
    const cost = FinancialCalculators.calculateOrderCost(shares, price, 'BUY');
    return {
      raw: cost.total,
      formatted: Formatters.currency(cost.total)
    };
  }, [shares, price]);
}

// Component
export function OrderModal({ shares, price }) {
  const { formatted } = useOrderCost(shares, price);
  return <div>Total: {formatted}</div>;
}
```

See [`.cursor/rules/component-patterns.mdc`](/.cursor/rules/component-patterns.mdc) for complete guidelines.

---

## Common Pitfalls to Avoid

### 1. JavaScript Floating-Point Math
```typescript
// ❌ WRONG - Accumulates errors
let total = 0;
holdings.forEach(h => total += h.shares * h.price);

// ✅ CORRECT - Uses precision math
let total = new Decimal(0);
holdings.forEach(h => {
  const value = FinancialMath.multiply(h.shares, h.price);
  total = FinancialMath.add(total, value);
});
```

### 2. Inline Formatters
```typescript
// ❌ WRONG - Duplicated across files
const formatCurrency = (val) => `$${val.toFixed(2)}`;

// ✅ CORRECT - Use service
import { Formatters } from '@/lib/financial';
Formatters.currency(val);
```

### 3. Business Logic in Components
```typescript
// ❌ WRONG
export function Component({ data }) {
  const isHighRisk = data.volatility > 0.2 ? 'high' : 'low';
  return <Badge>{isHighRisk}</Badge>;
}

// ✅ CORRECT - Logic in service
export class RiskCalculator {
  static getRiskLevel(volatility: number): 'low' | 'medium' | 'high' {
    if (volatility > 0.2) return 'high';
    if (volatility > 0.1) return 'medium';
    return 'low';
  }
}
```

### 4. Services Using Hooks
```typescript
// ❌ WRONG - Services can't use hooks
export class BadService {
  static doSomething() {
    const user = useUser(); // ERROR!
    return user.id;
  }
}

// ✅ CORRECT - Pass data as parameters
export class GoodService {
  static doSomething(userId: string) {
    return userId;
  }
}
```

---

## Testing

### Service Tests (Easy)
```typescript
// tests/financial-math.test.ts
import { FinancialMath } from '@/lib/financial/financial-math';

test('handles floating point precision', () => {
  const result = FinancialMath.add(0.1, 0.2);
  expect(result.toNumber()).toBe(0.3);
});
```

### Component Tests (Focus on UI)
```typescript
// Don't test business logic in components
// Test that they display data correctly

test('displays formatted currency', () => {
  render(<PortfolioCard formatted={{ total: '$1,234.56' }} />);
  expect(screen.getByText('$1,234.56')).toBeInTheDocument();
});
```

---

## Where to Read More

- `docs/architecture.md`: deeper dive into data flows and caching
- `src/lib/yahoo-finance-service.ts`: market data integration details
- `src/lib/order-execution-service.ts`: queued and limit order processing
- `src/types/index.ts`: API contracts and UI types
- **`src/lib/README.md`**: Complete service layer documentation
- **`.cursor/rules/financial-math.mdc`**: Financial math standards
- **`.cursor/rules/service-layer.mdc`**: Service architecture patterns
- **`.cursor/rules/component-patterns.mdc`**: Component best practices

---

## Glossary

- Asset: A tradable instrument with a unique ticker (e.g., AAPL)
- Quote: Real-time snapshot including price and volume
- DailyAggregate: Stored OHLCV for end-of-day charting
- Order: Market or limit instruction to buy/sell
- Holding: Position within a portfolio for an asset
- GameSession: Simulation period and starting cash configuration
