# Vertical Rhythm Testing Guide

## What Changed

We've implemented a mathematically sound vertical rhythm system based on industry best practices. The key changes:

### 1. **Tailwind Configuration** (`tailwind.config.ts`)
- Added `fontSize` overrides with explicit line-heights
- This ensures proper CSS specificity (Tailwind config > globals.css)
- All text sizes now have guaranteed 4px-multiple line-heights

### 2. **Typography Reset** (`src/app/globals.css`)
- Removed line-height overrides on text utility classes (moved to Tailwind config)
- Added critical typography resets for consistent rendering
- Normalized box model and text rendering across elements

### 3. **PortfolioCard Component** 
- **Heading**: Removed `h-9 flex items-center`, now uses `pt-2 pb-1` for baseline alignment
- **Table Cells**: Removed nested `<div className="flex items-center h-full">` wrappers
- Now uses simple `py-2 text-sm` pattern (8px + 20px + 8px = 36px = 9 units)

### 4. **Sidebar Navigation**
- Removed `items-center` from navigation links
- Now uses `flex gap-3 px-3 py-2 text-sm` pattern
- Icons are 20px (size="md") to match text-sm line-height

### 5. **Visual Debug Tool**
- Added `BaselineGrid` component for development
- Toggle with **Ctrl+Shift+G** (or **Cmd+Shift+G** on Mac)
- Shows 4px grid overlay to verify alignment

## Why These Changes Fix Vertical Rhythm

### The Core Problem: Flexbox `items-center`

**Before:**
```tsx
<div className="h-9 flex items-center">
  <span className="text-sm">Portfolio Value</span>
</div>
```

When you use `flex items-center`, it vertically centers the **content box**, not the text baseline. This causes:
- Text baselines at different vertical positions
- Misalignment between sidebar and main content
- Broken horizontal rhythm

**After:**
```tsx
<TableCell className="py-2 text-sm">
  Portfolio Value
</TableCell>
```

With padding (`py-2`) and no flexbox centering:
- Text naturally sits on its baseline
- `py-2` (8px top + 8px bottom) + `text-sm` line-height (20px) = 36px total
- All 36px-tall elements with same padding have aligned baselines

### The Math

```
Sidebar nav item:
  py-2 (8px) + text-sm line-height (20px) + py-2 (8px) = 36px (9 baseline units)

PortfolioCard table row:
  py-2 (8px) + text-sm line-height (20px) + py-2 (8px) = 36px (9 baseline units)

Both at 36px with identical padding → baselines align horizontally ✓
```

## Testing Instructions

### Step 1: Start the Development Server

```bash
npm run dev
```

### Step 2: Open Dashboard

Navigate to `/dashboard` and ensure you can see:
- Sidebar navigation on the left
- PortfolioCard with the stats table in the main content area

### Step 3: Visual Baseline Grid Test

1. Press **Ctrl+Shift+G** (or **Cmd+Shift+G** on Mac) to toggle the baseline grid overlay
2. You should see red horizontal lines every 4px
3. Look for:
   - All text baselines sitting on the red grid lines
   - Element heights being exact multiples of 4px
   - Consistent spacing between sections

### Step 4: Browser DevTools Verification

#### Check Line Heights

1. Open DevTools (F12)
2. Inspect a sidebar navigation item (e.g., "Dashboard" link)
3. In the Computed tab, verify:
   ```
   font-size: 14px (0.875rem)
   line-height: 20px (1.25rem)  ← Should be exactly 20px
   padding-top: 8px
   padding-bottom: 8px
   Total height: 36px (8 + 20 + 8)
   ```

4. Inspect a PortfolioCard table cell (e.g., "Portfolio Value")
5. Verify same dimensions:
   ```
   font-size: 14px
   line-height: 20px  ← Should match sidebar
   padding-top: 8px
   padding-bottom: 8px
   Total height: 36px
   ```

#### Check Baseline Alignment

1. With DevTools open, hover over a sidebar nav item
2. Note the vertical position of the text baseline
3. Hover over the corresponding row in PortfolioCard table (same vertical level)
4. **The text baselines should align horizontally** ✓

### Step 5: Measure Element Heights

All elements should have heights divisible by 4:

```bash
# In DevTools Console, you can run:
document.querySelectorAll('*').forEach(el => {
  const height = el.offsetHeight;
  if (height > 0 && height % 4 !== 0) {
    console.warn('Element not on baseline:', el, height + 'px');
  }
});
```

This will flag any elements that break the 4px rhythm.

### Step 6: Test Different Text Sizes

Navigate through the app and verify:

- **Headings** (`text-2xl`): 32px line-height (8 units)
- **Body text** (`text-base`): 24px line-height (6 units)
- **Small text** (`text-sm`): 20px line-height (5 units)
- **Extra small** (`text-xs`): 16px line-height (4 units)

All should be exact multiples of 4px.

### Step 7: Responsive Testing

1. Resize browser window to different breakpoints
2. Check that vertical rhythm is maintained
3. Spacing might change at different breakpoints, but should remain 4px multiples

## Expected Results

### ✅ Success Criteria

- [ ] Text in sidebar aligns horizontally with text in PortfolioCard
- [ ] All element heights are divisible by 4px
- [ ] DevTools shows line-height: 20px for `.text-sm` (not Tailwind's default)
- [ ] No flexbox `items-center` on text containers
- [ ] Baseline grid overlay shows text sitting on grid lines
- [ ] Visual harmony - different sections feel cohesive

### ❌ If Something's Wrong

#### Issue: Line-heights are wrong in DevTools

**Check:**
```bash
# Verify Tailwind config is being used
npm run dev
# Then inspect element - should see 20px line-height, not 1.42857 (Tailwind default)
```

**Fix:** Clear Next.js cache and rebuild:
```bash
rm -rf .next
npm run dev
```

#### Issue: Baselines still don't align

**Check:**
- Are there any remaining `flex items-center` on text containers?
- Are padding values correct (`py-2` for 36px total with `text-sm`)?

**Debug:**
```bash
# Search for problematic patterns
grep -r "items-center.*text-sm" src/
```

#### Issue: Some elements break the 4px rhythm

**Identify:**
- Use the Console script from Step 5 to find offending elements
- Check for arbitrary values like `h-[37px]`
- Look for elements without proper padding

## Common Patterns Reference

### Navigation Items (36px total, 9 units)
```tsx
<Link className="flex gap-3 px-3 py-2 text-sm">
  <Icon icon={DashboardIcon} size="md" /> {/* 20px */}
  <span>Dashboard</span>
</Link>
```

### Table Cells (36px total, 9 units)
```tsx
<TableCell className="py-2 text-sm">
  Portfolio Value
</TableCell>
```

### Buttons (40px, 10 units)
```tsx
<Button className="h-10 px-4 text-sm">
  Submit
</Button>
```

### Headings with Spacing
```tsx
<div className="pt-2 pb-1">
  <h1 className="text-2xl font-mono">Welcome back!</h1>
</div>
{/* pt-2 (8px) + text-2xl (32px) + pb-1 (4px) = 44px = 11 units */}
```

## Mathematical Formula

For any text element to maintain vertical rhythm:

```javascript
(paddingTop + lineHeight + paddingBottom) % 4 === 0
```

Examples:
- `py-2 text-sm`: (8 + 20 + 8) % 4 = 0 ✓
- `py-1 text-sm`: (4 + 20 + 4) % 4 = 0 ✓  
- `py-3 text-base`: (12 + 24 + 12) % 4 = 0 ✓
- `pt-2 pb-1 text-2xl`: (8 + 32 + 4) % 4 = 0 ✓

## Key Insights from Industry Research

1. **Baseline grid increment = body line-height**: We use 4px (not 8px) for maximum flexibility
2. **Don't restrict font sizes to baseline multiples**: Use good type scale, then align with spacing
3. **Line-heights must be exact multiples**: Achieved via Tailwind fontSize config
4. **Padding makes up the difference**: Use `py-*` utilities to reach baseline multiples
5. **Flexbox items-center breaks baselines**: Use padding for vertical alignment instead
6. **Consistency over perfection**: Focus on main content alignment; images/media can have flexibility

## Resources

- **Industry Best Practices**: [Search results on vertical rhythm](https://creativepro.com/finding-your-typographic-rhythm/)
- **Type Scale**: [Modular Scale Calculator](https://www.modularscale.com/)
- **Tailwind Docs**: [Typography Plugin](https://tailwindcss.com/docs/font-size)
- **Our Docs**: `docs/vertical-rhythm-guide.md` for detailed component examples

## Troubleshooting

### Grid overlay not appearing

```tsx
// Make sure you're in development mode
console.log(process.env.NODE_ENV); // should be "development"

// Try toggling:
// Mac: Cmd + Shift + G
// Windows/Linux: Ctrl + Shift + G
```

### Custom components still misaligned

Check for:
1. `align-items: center` in custom CSS
2. Fixed heights that aren't 4px multiples
3. Line-height overrides in component styles
4. Missing padding that should make up baseline difference

---

## Summary

Your vertical rhythm should now be working correctly because:

1. ✅ **Line-heights are controlled** - Tailwind config ensures consistency
2. ✅ **No flexbox centering** - Text sits on natural baselines
3. ✅ **Proper padding** - Elements align to 4px grid via py-* utilities
4. ✅ **Mathematical harmony** - All heights are baseline multiples

If you follow this testing guide and all checks pass, your vertical rhythm system is functioning perfectly! 🎉

