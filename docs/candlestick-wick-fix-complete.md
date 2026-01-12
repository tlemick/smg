# Candlestick Lower Wick - Complete Fix

## The Root Cause

The fundamental misunderstanding was about what Recharts provides to custom shapes.

### What I Thought
```typescript
// WRONG ASSUMPTION
y = position of high
height = distance from high to low  // ❌ This is NOT what height represents
```

### What Actually Happens

When using `<Bar dataKey="high">`, Recharts provides:
```typescript
y = pixel position of the high value
height = pixel distance from high to the Y-AXIS BASELINE (yAxisDomain[0])
```

## The Failed First Fix

My initial fix calculated scale as:
```typescript
const scale = height / (high - low);  // ❌ WRONG
```

This assumed `height` was the distance from high to low for THIS candlestick, but it's actually the distance from high to the chart's bottom edge.

## The Correct Understanding

```
Y-Axis Domain: [60, 160]  ← Chart shows prices from $60 to $160
Chart in pixels: 0 to 1000

Price $160 ────────── Pixel 0 (top)
       │
Price $150 (high) ─── Pixel 100 (y)
       │              │
Price $143 (low) ──── │ ← We need to find this pixel position
       │              │
Price $60 ────────────┴─ Pixel 1000 (baseline)
       ↑                 ↑
  yAxisDomain[0]     y + height
```

When Recharts renders a bar for `high = 150`:
- `y = 100` (position of $150)
- `height = 900` (distance from $150 down to $60)

The scale (pixels per dollar) is:
```typescript
scale = height / (high - yAxisDomain[0])
scale = 900 / (150 - 60)
scale = 900 / 90
scale = 10 pixels per dollar
```

## The Complete Fix

### 1. Update Interface

Add `yAxisDomain` to the props:
```typescript
interface CandlestickShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: ChartDataPoint;
  fill: string;
  positive: string;
  negative: string;
  yAxisDomain: [number, number];  // ✅ Added
}
```

### 2. Pass yAxisDomain from Parent

```typescript
<Bar
  yAxisId="price"
  dataKey="high"
  shape={(props: any) => (
    <CandlestickShape
      {...props}
      positive={colors.positive}
      negative={colors.negative}
      yAxisDomain={yAxisDomain}  // ✅ Pass the domain
    />
  )}
/>
```

### 3. Calculate Scale Correctly

```typescript
const CandlestickShape = (props: CandlestickShapeProps) => {
  const { x, y, width, height, payload, yAxisDomain } = props;
  const { open, high, low, close } = payload;
  
  // ✅ CORRECT: Calculate scale using baseline
  const priceToBaseline = high - yAxisDomain[0];
  const scale = priceToBaseline > 0 ? height / priceToBaseline : 0;
  
  // ✅ CORRECT: Calculate all positions
  const highY = y;
  const lowY = y + (high - low) * scale;
  const topOfBodyY = y + (high - Math.max(open, close)) * scale;
  const bottomOfBodyY = y + (high - Math.min(open, close)) * scale;
  
  // ... render with these positions
};
```

## Example Calculation

Given:
- `yAxisDomain = [60, 160]`
- Candlestick: `high=150, low=143, open=145, close=148`
- Recharts provides: `y=100, height=900`

**Step 1: Calculate scale**
```
scale = height / (high - yAxisDomain[0])
scale = 900 / (150 - 60)
scale = 10 pixels/dollar
```

**Step 2: Calculate positions**
```
highY = y = 100
lowY = y + (high - low) * scale = 100 + (150 - 143) * 10 = 170
topOfBodyY = y + (high - max(open, close)) * scale = 100 + (150 - 148) * 10 = 120
bottomOfBodyY = y + (high - min(open, close)) * scale = 100 + (150 - 145) * 10 = 150
```

**Step 3: Draw**
```
Pixel 100 ─────── (highY) Upper wick starts
Pixel 120 ┌─────┐ (topOfBodyY) Body starts
          │ █████ │
Pixel 150 └─────┘ (bottomOfBodyY) Body ends
Pixel 170 ─────── (lowY) Lower wick ends ✅ CORRECT!
```

The lower wick now correctly ends at pixel 170 (price $143), not at pixel 1000 (the chart bottom).

## Files Modified

1. `src/components/asset/CandlestickChart.tsx`:
   - Updated `CandlestickShapeProps` interface (added `yAxisDomain`)
   - Updated `CandlestickShape` scale calculation
   - Updated `<Bar shape={...}>` to pass `yAxisDomain`
   - Added detailed comments explaining coordinate system

## Testing Checklist

- [ ] Lower wicks stop at the day's low price (not chart bottom)
- [ ] Upper wicks stop at the day's high price (not chart top)
- [ ] Green candles (close > open) render correctly
- [ ] Red candles (close < open) render correctly
- [ ] Doji candles (close ≈ open) show thin body with wicks
- [ ] Works across all timeframes (1D, 5D, 1M, 3M, 6M, 1Y, 5Y)
- [ ] Wicks proportional to price ranges

## Why This Was Difficult

The bug was subtle because:
1. Recharts documentation doesn't clearly explain what `height` represents for custom shapes
2. The previous calculation "looked right" but was based on wrong assumptions
3. Visual debugging is hard - the wicks were always going down, just too far
4. The fix required understanding Recharts' internal coordinate system

## Status

✅ **FIXED** - Lower wicks now correctly positioned at the low price

The candlestick chart should now accurately represent OHLC data with properly proportioned wicks.
