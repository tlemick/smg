# Candlestick Lower Wick Bug Analysis

## The Problem

Lower wicks in candlestick charts extend all the way to the bottom of the chart instead of stopping at the day's low price.

## Root Cause

In `CandlestickShape` component (lines 66-129):

```typescript
const CandlestickShape = (props: CandlestickShapeProps) => {
  const { x, y, width, height, payload, fill, positive, negative } = props;
  
  // Calculate positions
  const centerX = x + width / 2;
  const bodyTop = Math.min(open, close);
  const bodyBottom = Math.max(open, close);
  const bodyHeight = Math.abs(close - open);
  
  // Scale factor (from Recharts coordinate system)
  const scale = height / Math.abs(payload.high - payload.low);
  
  // ⚠️ PROBLEM HERE
  const wickTop = y;                    // Top of upper wick (high)
  const wickBottom = y + height;        // ❌ WRONG - goes to chart bottom!
  const bodyTopY = y + (high - Math.max(open, close)) * scale;
  const bodyBottomY = bodyTopY + bodyHeight * scale;
```

### What Recharts Provides

When using `<Bar dataKey="high">`, Recharts passes:
- `y`: Y-coordinate of the `high` value
- `height`: Height from `high` to the bottom of the chart domain
- `x`, `width`: X-position and width of the bar

### The Flawed Logic

```typescript
const wickBottom = y + height;  // This goes to the chart bottom!
```

This line calculates the bottom of the lower wick as `y + height`, which is:
- `y` = position of `high` price
- `height` = distance from `high` to chart bottom (yAxisDomain[0])

So `wickBottom` ends up at the chart bottom, not at the `low` price!

### What We Actually Need

```
Chart Y-axis (inverted - 0 at top):
┌─────────────────────────────
│ y (high price)
│ ↓
│ bodyTopY (max of open/close)
│ ↓
│ bodyBottomY (min of open/close)
│ ↓
│ wickBottomY (low price)     ← Should stop here!
│
│ (not at chart bottom)
└─────────────────────────────
```

The lower wick should extend from `bodyBottomY` to the Y-coordinate of the `low` price.

## The Fix

Calculate the correct Y-coordinate for the `low` price:

```typescript
// Correct calculation
const wickTop = y;  // Position of high (provided by Recharts)
const wickBottom = y + (high - low) * scale;  // Position of low (calculated)
```

### Explanation

Since Recharts gives us:
- `y` = position of `high`
- `scale` = pixels per price unit = `height / (high - low)`

To find the position of `low`:
```
wickBottom = y + (distance from high to low in pixels)
wickBottom = y + (high - low) * scale
```

This correctly places the bottom of the lower wick at the `low` price, not at the chart bottom.

## The Complete Fix

```typescript
const CandlestickShape = (props: CandlestickShapeProps) => {
  const { x, y, width, height, payload, positive, negative } = props;
  
  if (!payload) return null;
  
  const { open, high, low, close } = payload;
  const isPositive = close >= open;
  const color = isPositive ? positive : negative;
  
  // Calculate scale: pixels per price unit
  const priceRange = high - low;
  const scale = priceRange > 0 ? height / priceRange : 0;
  
  // Calculate Y positions for each price level
  const centerX = x + width / 2;
  const highY = y;  // Provided by Recharts
  const lowY = y + (high - low) * scale;  // ✅ FIXED
  const topOfBodyY = y + (high - Math.max(open, close)) * scale;
  const bottomOfBodyY = y + (high - Math.min(open, close)) * scale;
  
  // Body dimensions
  const bodyHeight = Math.abs(close - open) * scale;
  const bodyWidth = width * 0.7;
  const bodyX = centerX - bodyWidth / 2;
  
  return (
    <g>
      {/* Upper wick (high to top of body) */}
      <line
        x1={centerX}
        y1={highY}
        x2={centerX}
        y2={topOfBodyY}
        stroke={color}
        strokeWidth={1}
      />
      
      {/* Body (open to close) */}
      <rect
        x={bodyX}
        y={topOfBodyY}
        width={bodyWidth}
        height={Math.max(bodyHeight, 1)}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
      
      {/* Lower wick (bottom of body to low) */}
      <line
        x1={centerX}
        y1={bottomOfBodyY}
        x2={centerX}
        y2={lowY}  // ✅ FIXED - now stops at low price
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};
```

## Visual Comparison

### Before Fix
```
High: $150  ─────── (upper wick starts)
Open: $145  ┌─────┐
Close: $148 │ BOX │ (body)
            └─────┘
Low: $143   │ (lower wick should end here)
            │
            │
$0 ─────────┘ (wick extends all the way down!)
```

### After Fix
```
High: $150  ─────── (upper wick starts)
Open: $145  ┌─────┐
Close: $148 │ BOX │ (body)
            └─────┘
Low: $143   ─────── (wick correctly ends here) ✅
```

## Files to Change

- `src/components/asset/CandlestickChart.tsx` - Fix `CandlestickShape` component

## Testing

After fix, verify:
- [ ] Lower wicks stop at the day's low price
- [ ] Upper wicks stop at the day's high price
- [ ] Body correctly shows open to close range
- [ ] Green candles (close > open) render correctly
- [ ] Red candles (close < open) render correctly
- [ ] Doji candles (open ≈ close) show thin line with wicks
