# Sparkline Dual Metrics Feature

## Overview

This feature enhances the portfolio highlights sparklines to display **two distinct metrics** that teach students the critical difference between:
1. **Your personal returns** (based on when YOU bought)
2. **Market returns** (based on the time period)

## Educational Value

### The Problem We're Solving

Students often confuse "how much the stock went up" with "how much money I made." This feature clearly separates these concepts.

**Example Scenario:**
- **Day 1**: Student buys 1 share of AAPL at $260
- **Day 10**: Student buys 9 more shares at $190 (price dropped!)
- **Student's average cost**: ($260 + 9×$190) / 10 = **$197**
- **Today**: AAPL is at $248

**Result:**
- **Market movement** (Day 1 to Today): $260 → $248 = **-4.6% DOWN** 📉
- **Student's gain** (Cost basis to Today): $197 → $248 = **+25.9% UP** 📈

### What Students Learn

1. **Cost Basis Matters**: Where you buy is more important than when the market peaked
2. **Dollar-Cost Averaging**: Buying during dips lowers your average cost
3. **Timing vs. Strategy**: You can profit even when the market declined over the period
4. **Multiple Metrics**: Always look at multiple perspectives to understand performance

## Visual Design

```
┌─────────────────────────────────────────┐
│ AAPL - Apple Inc.                       │
│ ┌───────────────────────────────────┐   │
│ │     ╱───╲                         │   │ ← Actual price line (green/red)
│ │- - - - - - - - - - - - - - - - - -│   │ ← Cost basis (dashed gray line)
│ │                ╲___╱─             │   │
│ └───────────────────────────────────┘   │
│ YOUR GAIN    +24.29%  $1,247.89        │ ← Your profit/loss
│ PRICE CHANGE -4.62% (since first buy)  │ ← Market movement
└─────────────────────────────────────────┘
```

### Visual Elements

1. **Solid Line**: Actual stock price movement over time
   - Green when overall positive
   - Red when overall negative

2. **Dashed Line**: Your average cost basis
   - Shows where you bought on average
   - Horizontal reference line

3. **Your Gain**: Your unrealized P&L
   - Calculated as: `(current price - your cost basis) / cost basis × 100`
   - Shows if YOU are profitable

4. **Price Change**: Market movement
   - Calculated as: `(last price - first price in period) / first price × 100`
   - Shows how the MARKET moved

## Technical Implementation

### 1. Enhanced Sparkline Component

**File**: `src/components/ui/Sparkline.tsx`

Added `referenceLine` prop to display cost basis:
```typescript
<Sparkline 
  data={priceData}
  referenceLine={avgCostBasis}  // NEW: Shows cost basis line
  color="positive"
/>
```

### 2. Enhanced Batch Chart API

**File**: `src/app/api/chart/batch/route.ts`

Now returns additional metadata:
```typescript
{
  ticker: "AAPL",
  data: [245, 248, 250, ...],
  firstPrice: 260,              // NEW
  lastPrice: 248,               // NEW
  priceChangePercent: -4.6      // NEW
}
```

### 3. Enhanced Portfolio Highlights Hook

**File**: `src/hooks/usePortfolioHighlights.ts`

Changed from returning just data array to full metadata:
```typescript
sparklineDataByTicker: {
  "AAPL": {
    data: [260, 255, 248, ...],
    priceChangePercent: -4.6,
    firstPrice: 260,
    lastPrice: 248
  }
}
```

### 4. Enhanced Portfolio Highlights Card

**File**: `src/components/dashboard/PortfolioHighlightsCard.tsx`

Now displays both metrics:
- Your Gain (unrealized P&L %)
- Price Change (market movement %)

## Data Flow

```
1. User views dashboard
   ↓
2. usePortfolioHighlights fetches allocations
   ↓
3. For each holding, fetch sparkline data via /api/chart/batch
   - Includes: prices, first/last price, price change %
   ↓
4. Hook combines:
   - Allocation data (cost basis, current value, unrealized P&L)
   - Sparkline metadata (prices, price change %)
   ↓
5. Component displays:
   - Sparkline with cost basis reference line
   - Your Gain % (vs cost basis)
   - Price Change % (market movement)
```

## Calculations

### Your Gain (Unrealized P&L %)

**Source**: `/api/user/portfolio/overview`

```typescript
const unrealizedPnL = currentValue - totalCostBasis;
const unrealizedPnLPercent = (unrealizedPnL / totalCostBasis) * 100;
```

**What it means**: How much profit/loss you have based on what you paid

### Price Change %

**Source**: `/api/chart/batch`

```typescript
const firstPrice = closePrices[0];  // Price at start of period
const lastPrice = closePrices[closePrices.length - 1];  // Price now
const priceChangePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
```

**What it means**: How much the stock price moved during the period

## Time Periods

### Sparkline Period
- **Preferred**: From your first purchase date to now
- **Fallback**: Last 30 days if purchase date unavailable

This ensures the sparkline shows the full journey of your investment.

### Why They Can Differ

The sparkline starts at your **first purchase**, but your **cost basis** is the **average** of all purchases:

```
First Purchase:  $260  ← Sparkline starts here
Second Purchase: $190
Third Purchase:  $180
---
Average Cost:    $210  ← Dashed line shows here
```

If the current price is $220:
- **Your Gain**: +4.8% (from $210 cost basis)
- **Price Change**: -15.4% (from $260 first purchase)

## Teaching Moments

Use this feature to discuss:

1. **Dollar-Cost Averaging**
   - Buying more when prices are low reduces average cost
   - Show real examples from their portfolio

2. **Market Timing Myths**
   - You don't need to "buy at the bottom" to profit
   - Regular investing can outperform market timing

3. **Multiple Perspectives**
   - One metric alone can be misleading
   - Always consider: entry price, current price, time period

4. **Risk Management**
   - Cost basis represents your actual capital at risk
   - Price volatility vs. your position value

## Future Enhancements

Potential additions for even more educational value:

1. **Tooltip on Reference Line**
   - Hover over dashed line to see: "Your avg cost: $197"

2. **Purchase Markers**
   - Small dots on sparkline showing when you bought
   - Size of dot = size of purchase

3. **Benchmark Comparison**
   - Add S&P 500 line to show market context
   - "You: +24%, Market: +12%"

4. **Time Period Selector**
   - Toggle between: "Since first buy", "Last 30d", "YTD"
   - See how metrics change with different periods

## Code Locations

- Sparkline component: `src/components/ui/Sparkline.tsx`
- Highlights hook: `src/hooks/usePortfolioHighlights.ts`
- Highlights card: `src/components/dashboard/PortfolioHighlightsCard.tsx`
- Batch chart API: `src/app/api/chart/batch/route.ts`
- First purchase dates API: `src/app/api/user/portfolio/first-purchase-dates/route.ts`

## Testing

To test this feature:

1. Create a test user
2. Buy a stock at one price (e.g., $100)
3. Wait or adjust date
4. Buy same stock at different price (e.g., $80)
5. Check dashboard - should see:
   - Cost basis line at ~$90 (average)
   - Current price relative to that
   - Two different % values

## Summary

This dual-metric approach transforms a simple sparkline into a powerful teaching tool that helps students understand the fundamental difference between market performance and personal returns—one of the most important concepts in investing.
