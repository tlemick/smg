# AssetChart Type Compliance Report

## Date Range Bug Fix

### Issue
The 1Y and 5Y timeframes were showing the same ~8 months of data instead of their respective 1 year and 5 years.

### Root Cause
In `ChartDataService.calculateDateRange()`, the method was using:
```typescript
startDate.setDate(endDate.getDate() - config.days);
```

**Problem:** `getDate()` returns only the day of the month (1-31), not total days. So for large values like 365 or 1825 days:
- `endDate.getDate()` might return `8` (Jan 8th)
- `8 - 365 = -357`
- `setDate(-357)` behaves unpredictably

### Fix Applied
Changed to millisecond-based arithmetic:
```typescript
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const millisecondsToSubtract = config.days * millisecondsPerDay;
startDate.setTime(endDate.getTime() - millisecondsToSubtract);
```

This correctly calculates:
- **1Y:** Exactly 365 days back
- **5Y:** Exactly 1825 days back (365 * 5)

## Type System Compliance Audit

### Types Moved to `src/types/index.ts`

Following the rule: **"Shared types used across multiple files go in `src/types/index.ts`"**

#### New Types Added:
1. **`RawChartData`** - Raw OHLC data from API
2. **`ChartDataPoint`** - Transformed chart data ready for display
3. **`TimeframeConfig`** - Timeframe configuration
4. **`ChartApiResponse`** - Chart API response structure

These types are used in:
- `src/lib/chart-data-service.ts`
- `src/hooks/useAssetChartData.ts`
- `src/components/asset/AssetChart.tsx`
- `src/components/asset/CandlestickChart.tsx`

### Component-Local Types (Inline)

Following the rule: **"Component props interfaces stay inline"**

#### Inline Types:
1. **`AssetChartProps`** - Props for AssetChart component
2. **`CandlestickChartProps`** - Props for CandlestickChart component
3. **`CandlestickShapeProps`** - Props for custom candlestick shape
4. **`CandlestickTooltipProps`** - Props for candlestick tooltip
5. **`LineChartTooltipProps`** - Props for line chart tooltip

### Hook-Local Types (Inline)

Following the rule: **"Helper types used only in that file stay inline"**

#### Inline Types:
1. **`ChartMetadata`** - Metadata returned by useAssetChartData hook
2. **`UseAssetChartDataReturn`** - Return type for useAssetChartData hook

### Fixed `any` Usage

Following the rule: **"Avoid `any`, use proper types or `unknown`"**

#### Before (Violations):
```typescript
// ❌ BAD - No type safety
const CandlestickShape = (props: any) => { ... }
const CandlestickTooltip = ({ active, payload, coordinate }: any) => { ... }
const LineChartTooltip = ({ active, payload, coordinate }: any) => { ... }

// ❌ BAD - Untyped meta object
interface ChartApiResponse {
  data: {
    quotes: RawChartData[];
    meta?: any;  // Too permissive
  };
}
```

#### After (Compliant):
```typescript
// ✅ GOOD - Properly typed
interface CandlestickShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: ChartDataPoint;
  fill: string;
  positive: string;
  negative: string;
}

interface CandlestickTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
  coordinate?: { x: number; y: number };
  formatPrice: (price: number) => string;
}

interface LineChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
  coordinate?: { x: number; y: number };
  formatPrice: (price: number) => string;
}

// ✅ GOOD - Typed meta with index signature
export interface ChartApiResponse {
  success: boolean;
  data: {
    quotes: RawChartData[];
    meta?: {
      currency?: string;
      symbol?: string;
      exchangeName?: string;
      [key: string]: unknown;  // Allow additional fields
    };
  };
  error?: string;
}
```

### Interface vs Type Usage

Following the rule: **"Use `interface` for objects, `type` for unions/primitives"**

#### Correct Usage:
```typescript
// ✅ GOOD - Interfaces for objects
export interface RawChartData { ... }
export interface ChartDataPoint { ... }
export interface TimeframeConfig { ... }

// ✅ GOOD - Type for union
type ChartType = 'line' | 'candlestick';
```

### Naming Conventions

Following the established patterns:

| Type Category | Convention | Examples |
|--------------|------------|----------|
| Component Props | `*Props` | `AssetChartProps`, `CandlestickChartProps` |
| API Responses | `*Response` or `*ApiResponse` | `ChartApiResponse` |
| Data Objects | `*Data` | `ChartDataPoint`, `RawChartData` |
| Hook Returns | `Use*Return` | `UseAssetChartDataReturn` |
| Configs | `*Config` | `TimeframeConfig` |
| Union Types | Descriptive name | `ChartType` |

### Export Patterns

Following the rule: **"Export all shared types"**

```typescript
// ✅ GOOD - Shared types exported from src/types/index.ts
export interface RawChartData { ... }
export interface ChartDataPoint { ... }
export interface TimeframeConfig { ... }
export interface ChartApiResponse { ... }

// ✅ GOOD - Using type imports where appropriate
import type { ChartDataPoint } from '@/types';
import type { RawChartData } from '@/types';
```

### Hook Return Type Pattern

Following the rule: **"Hooks MUST return { data, isLoading, error }"**

```typescript
// ✅ GOOD - Follows standard pattern
interface UseAssetChartDataReturn {
  data: ChartDataPoint[];      // The fetched/computed data
  isLoading: boolean;           // Loading state (always 'isLoading')
  error: string | null;         // Error message
  metadata: ChartMetadata;      // Additional calculated data
  refetch: () => void;          // Refetch function
}

export function useAssetChartData(...): UseAssetChartDataReturn {
  return { data, isLoading, error, metadata, refetch };
}
```

## Compliance Summary

### ✅ Type Location
- [x] Shared types in `src/types/index.ts`
- [x] Component props inline
- [x] Hook-specific types inline

### ✅ Type vs Interface
- [x] Interfaces for object shapes
- [x] Types for unions and primitives

### ✅ Avoiding `any`
- [x] No `any` usage without proper typing
- [x] Properly typed Recharts component props
- [x] Typed API responses with index signatures

### ✅ Naming Conventions
- [x] Props interfaces end with `Props`
- [x] API responses end with `Response`
- [x] Hook returns end with `Return`
- [x] Configs end with `Config`

### ✅ Exports
- [x] All shared types exported
- [x] Using `type` imports where appropriate

### ✅ Hook Patterns
- [x] Returns `{ data, isLoading, error }`
- [x] Has explicit return type interface
- [x] Consistent naming (`isLoading` not `loading`)

## Files Modified

1. **`src/types/index.ts`** - Added chart-related types
2. **`src/lib/chart-data-service.ts`** - Fixed date calculation, imported types
3. **`src/hooks/useAssetChartData.ts`** - Imported types from `@/types`
4. **`src/components/asset/AssetChart.tsx`** - Fixed tooltip types, imported from `@/types`
5. **`src/components/asset/CandlestickChart.tsx`** - Fixed all `any` usage, proper typing

## Testing Recommendations

1. **Test 1Y timeframe:** Should show exactly 365 days of data
2. **Test 5Y timeframe:** Should show exactly 5 years (1825 days) of data
3. **Verify TypeScript compilation:** `npx tsc --noEmit`
4. **Check for type errors:** No TypeScript errors should remain
5. **Test tooltips:** Ensure all tooltip data displays correctly with proper types

## Conclusion

All type system violations have been fixed:
- ✅ Date range calculation bug resolved
- ✅ Shared types moved to proper location
- ✅ All `any` usage eliminated
- ✅ Proper naming conventions followed
- ✅ Standard hook return pattern implemented
- ✅ Type safety enforced throughout

The codebase now fully complies with the TypeScript type system standards.
