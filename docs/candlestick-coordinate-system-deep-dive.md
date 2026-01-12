# Candlestick Coordinate System - Deep Dive

## The Core Problem

When using `<Bar dataKey="high">`, Recharts provides these props to the custom shape:
- `x`, `width`: Horizontal position and width
- `y`: Y-coordinate (pixel position) of the `high` value
- `height`: Pixel distance from `high` to the **chart baseline** (yAxisDomain[0])

## The Flawed Assumption

My previous fix assumed:
```typescript
const scale = height / (high - low);  // ❌ WRONG
```

This assumes `height` represents the pixel distance from `high` to `low`, but it doesn't! It represents the distance from `high` to the chart baseline.

## The Real Coordinate System

```
Y-Axis Domain: [60, 160] (prices)
Chart Height: 1000 pixels (example)

Pixel 0 ─────────── $160 (top of chart)
         │
         │ scale = pixels / price range
         │ scale = 1000 / (160 - 60) = 10 px/$
         │
Pixel 700 ────────── $90 (some price in middle)
         │
         │
Pixel 1000 ────────  $60 (bottom of chart/baseline)
```

When Recharts renders a bar for `dataKey="high"` with value `high = 150`:
- `y` = pixel position of 150 = `(160 - 150) * 10 = 100`
- `height` = pixels from 150 to baseline (60) = `(150 - 60) * 10 = 900`

## The Correct Calculation

To find the pixel position of `low`, I need:
1. The scale (pixels per dollar): `scale = height / (high - yAxisDomain[0])`
2. The pixel position of low: `lowY = y + (high - low) * scale`

### Example Calculation

Given:
- `yAxisDomain = [60, 160]`
- `high = 150`, `low = 143`
- `y = 100` (Recharts gives us this)
- `height = 900` (Recharts gives us this)

Calculate scale:
```
scale = height / (high - yAxisDomain[0])
scale = 900 / (150 - 60)
scale = 900 / 90
scale = 10 pixels per dollar
```

Calculate lowY:
```
lowY = y + (high - low) * scale
lowY = 100 + (150 - 143) * 10
lowY = 100 + 7 * 10
lowY = 100 + 70
lowY = 170 pixels from top
```

Verification:
- High at pixel 100 = (160 - 150) * 10 ✓
- Low at pixel 170 = (160 - 143) * 10 ✓

## The Fix

Pass `yAxisDomain` to the custom shape:

```typescript
// In the Bar component
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

Then in `CandlestickShape`:

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
  yAxisDomain: [number, number];  // ✅ Add this
}

const CandlestickShape = (props: CandlestickShapeProps) => {
  const { x, y, width, height, payload, positive, negative, yAxisDomain } = props;
  
  const { open, high, low, close } = payload;
  
  // ✅ Calculate scale using the full Y-axis domain
  const scale = height / (high - yAxisDomain[0]);
  
  // ✅ Calculate positions correctly
  const centerX = x + width / 2;
  const highY = y;
  const lowY = y + (high - low) * scale;
  const topOfBodyY = y + (high - Math.max(open, close)) * scale;
  const bottomOfBodyY = y + (high - Math.min(open, close)) * scale;
  
  // ... render candlestick
};
```

## Why This Works

The scale `height / (high - yAxisDomain[0])` gives us the conversion factor from price to pixels **in the context of the full chart**.

Once we have the correct scale, we can calculate any price's pixel position:
- `pixelPosition = y + (high - targetPrice) * scale`

This works because:
1. `y` is the pixel position of `high`
2. `(high - targetPrice)` is the price distance
3. `* scale` converts price distance to pixel distance
4. Adding to `y` gives us the absolute pixel position

## Alternative Approach: Different dataKey

Instead of using `dataKey="high"`, we could use a middle value:

```typescript
// Prepare data with midpoint
candlestickData = data.map(point => ({
  ...point,
  midpoint: (point.high + point.low) / 2
}));

// Use midpoint as dataKey
<Bar dataKey="midpoint" shape={...} />
```

Then calculate positions relative to midpoint. But this is more complex and the yAxisDomain approach is cleaner.

## Files to Update

1. `src/components/asset/CandlestickChart.tsx`:
   - Update `CandlestickShapeProps` interface to include `yAxisDomain`
   - Update Bar shape prop to pass `yAxisDomain={yAxisDomain}`
   - Update `CandlestickShape` to use correct scale calculation
