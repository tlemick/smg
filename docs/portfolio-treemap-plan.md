# Portfolio Treemap Visualization Plan

## Overview
Add a treemap visualization as the first component on the portfolio page to show portfolio allocation in a visual, space-efficient manner. Each rectangle's size represents the asset's percentage of the total portfolio.

---

## 📊 Data Source: EXISTING Infrastructure (No New APIs Needed!)

### Using Existing API
**Endpoint**: `GET /api/user/portfolio/overview` ✅ (Already exists)

**Available Data**:
```typescript
interface PortfolioOverviewResponse {
  data: {
    allocations: PortfolioAllocation[];  // We'll use this!
    totalPortfolioValue: number;
    cashBalance: number;
    // ... other fields
  }
}

interface PortfolioAllocation {
  asset: {
    id: number;
    ticker: string;
    name: string;
    type: string;        // For color coding
    logoUrl?: string;
  };
  currentValue: number;           // Treemap size
  portfolioPercent: number;       // Display value
  unrealizedPnL: number;          // For color intensity
  unrealizedPnLPercent: number;   // For tooltip
  totalQuantity: number;
  avgCostBasis: number;
}
```

### Using Existing Hook
**Hook**: `usePortfolioOverview()` ✅ (Already exists)

Returns:
- `allocations`: Array of PortfolioAllocation - Perfect for treemap!
- `loading`, `error`, `refresh`: Standard states
- `totalPortfolioValue`: For percentage calculations

---

## 🎨 Chart Library & Styling

### Recharts (Already Installed)
✅ **Package**: `recharts@^3.0.2` (already in package.json)

**Why Recharts**:
- Already used in: `AssetChart`, `PortfolioPerformanceChart`, `PortfolioCategoryChart`
- Has `Treemap` component built-in
- Consistent styling across all charts
- ResponsiveContainer for responsive design

### Treemap Component
```typescript
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
```

---

## 🎨 Existing Styling Patterns to Follow

### 1. Container Styling (from PortfolioCategoryChart.tsx)
```typescript
<div className="bg-white rounded-lg p-6">
  <div className="mb-4">
    <h2 className="text-lg font-semibold text-neutral-900">Portfolio Treemap</h2>
    <p className="text-sm text-neutral-600 mt-1">Visual breakdown of your holdings</p>
  </div>
  {/* Chart content */}
</div>
```

### 2. Chart Height (consistent across app)
- Use `h-80` (320px) for main chart area
- Matches AssetChart and other portfolio charts

### 3. Loading State (from PortfolioCategoryChart.tsx)
```typescript
{loading ? (
  <div className="h-80 flex items-center justify-center text-neutral-400">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
  </div>
) : /* chart */}
```

### 4. Empty State Pattern
```typescript
{allocations.length === 0 ? (
  <div className="h-80 flex items-center justify-center text-neutral-400">
    No holdings yet
  </div>
) : /* chart */}
```

### 5. Color System (from existing components)

**Asset Type Colors** (from PortfolioAllocation.tsx):
```typescript
const assetTypeColors = {
  STOCK: '#5C73F5',      // primary-400
  ETF: '#22C55E',        // green-500
  MUTUAL_FUND: '#A855F7', // purple-500
  BOND: '#EAB308',       // yellow-500
  CASH: '#6c757d',       // neutral-600
  INDEX: '#6366F1'       // indigo-500
};
```

**Gain/Loss Colors** (from AssetChart.tsx):
- Positive: `#10B981` (green)
- Negative: `#EF4444` (red)
- Can adjust opacity based on % gain/loss

---

## 📐 Treemap Data Structure

### Transform allocations to Recharts treemap format:
```typescript
interface TreemapData {
  name: string;        // Asset ticker
  size: number;        // currentValue (determines rectangle size)
  value: number;       // portfolioPercent (for display)
  pnlPercent: number;  // For color intensity
  type: string;        // Asset type for base color
  fullName: string;    // For tooltip
  logoUrl?: string;    // For custom rendering
}

const treemapData = allocations.map(allocation => ({
  name: allocation.asset.ticker,
  size: allocation.currentValue,
  value: allocation.portfolioPercent,
  pnlPercent: allocation.unrealizedPnLPercent,
  type: allocation.asset.type,
  fullName: allocation.asset.name,
  logoUrl: allocation.asset.logoUrl,
}));
```

---

## 🎯 Component Features

### Core Features
1. ✅ Rectangle size = portfolio allocation percentage
2. ✅ Color by asset type (STOCK, ETF, BOND, etc.)
3. ✅ Color intensity by P&L (greener = more profit, redder = more loss)
4. ✅ Tooltip showing: ticker, name, value, %, P&L
5. ✅ Click to navigate to asset detail page
6. ✅ Responsive design using ResponsiveContainer

### Advanced Features (Optional Phase 2)
- Display ticker text on larger rectangles
- Show small logo on rectangles
- Animate on hover
- Toggle between "by value" and "by P&L" views

---

## 📁 File Structure

### New Files to Create
1. **Component**: `src/components/portfolio/PortfolioTreemap.tsx`
2. **Export**: Update `src/components/portfolio/index.ts`

### Files to Modify
1. **Page**: `src/app/portfolio/page.tsx` - Import and place as first section

---

## 🔧 Implementation Steps

### Phase 1: Basic Treemap
1. Create `PortfolioTreemap.tsx` component
2. Use `usePortfolioOverview()` hook to get data
3. Transform allocations to treemap format
4. Implement Recharts Treemap with ResponsiveContainer
5. Add loading, empty, and error states matching existing patterns
6. Apply consistent styling (bg-white, rounded-lg, p-6)
7. Add basic tooltip with ticker, value, percentage

### Phase 2: Styling & Colors
1. Implement asset type color mapping
2. Add P&L color intensity overlay
3. Style tooltip to match existing tooltips
4. Add header with title and description

### Phase 3: Interactivity
1. Add click handler to navigate to asset detail page
2. Add hover effects (opacity change or border)
3. Handle edge cases (single asset, many small assets)

### Phase 4: Integration
1. Import component in portfolio page
2. Place as first section (before performance chart)
3. Test with various portfolio states (empty, loading, single asset, many assets)

---

## 🎨 Custom Cell Renderer (Optional)

For more control over rectangle appearance:
```typescript
const CustomTreemapCell = (props: any) => {
  const { x, y, width, height, name, value, type, pnlPercent } = props;
  
  // Get base color from asset type
  const baseColor = assetTypeColors[type] || '#6c757d';
  
  // Adjust opacity or shade based on P&L
  // Positive P&L = brighter, Negative = darker or reddish tint
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={baseColor}
        opacity={0.8}
        stroke="#fff"
        strokeWidth={2}
        className="hover:opacity-100 transition-opacity cursor-pointer"
      />
      {/* Render ticker text if rectangle is large enough */}
      {width > 60 && height > 40 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={14}
          fontWeight="bold"
        >
          {name}
        </text>
      )}
    </g>
  );
};
```

---

## ✅ Advantages of This Approach

1. **No New Infrastructure**: Uses existing API and hook
2. **Consistent Styling**: Follows established patterns from other charts
3. **Same Library**: Uses Recharts like other visualizations
4. **Proven Patterns**: Loading, error, empty states match dashboard components
5. **Type Safety**: Leverages existing TypeScript interfaces
6. **Responsive**: ResponsiveContainer handles all screen sizes
7. **Fast Development**: All building blocks already exist

---

## 🧪 Testing Scenarios

1. **Empty Portfolio**: Should show empty state
2. **Single Asset**: Should fill entire treemap
3. **2-5 Assets**: Should show clear rectangles
4. **10+ Assets**: Should handle many small rectangles
5. **Loading State**: Should show spinner
6. **Error State**: Should show error with retry button
7. **Click Navigation**: Should route to `/asset/[ticker]`
8. **Responsive**: Should resize on mobile/tablet/desktop

---

## 📊 Expected Visual Result

```
┌─────────────────────────────────────────────────────┐
│ Portfolio Treemap                                   │
│ Visual breakdown of your holdings                   │
├─────────────────────────────────────────────────────┤
│ ┌──────────────────┐┌──────────┐┌────────┐         │
│ │                  ││          ││        │         │
│ │     AAPL 45%     ││ MSFT 25% ││ TSLA   │         │
│ │                  ││          ││  15%   │         │
│ │                  │└──────────┘└────────┘         │
│ │                  │┌──────────┐┌────────┐         │
│ └──────────────────┘│ GOOGL 10%││ VOO 5% │         │
│                     └──────────┘└────────┘         │
└─────────────────────────────────────────────────────┘
```

Each rectangle:
- Size = portfolio %
- Color = asset type
- Shade = P&L performance
- Click = go to asset page

---

## 🚀 Ready to Implement!

All infrastructure exists:
✅ API endpoint ready
✅ Hook ready
✅ Charting library installed
✅ Styling patterns established
✅ Type definitions complete
✅ Navigation patterns established

**Next Step**: Create `PortfolioTreemap.tsx` component!
