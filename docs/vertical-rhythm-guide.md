# Vertical Rhythm System

## Overview

This project uses a **4px baseline grid system** to create vertical rhythm across the UI. Vertical rhythm ensures that text elements at different sizes align horizontally, creating visual harmony and a more polished, professional appearance.

Based on principles from [A Guide to Vertical Rhythm by Steve McKinney](https://iamsteve.me/blog/a-guide-to-vertical-rhythm).

## The 4px Baseline Unit

All spacing, line heights, and element heights should be multiples of **4px** (our baseline unit).

**Why 4px?**
- Divides evenly twice: 4 ÷ 2 = 2 ÷ 2 = 1 ✓
- Aligns with Tailwind's default spacing scale (based on 0.25rem)
- Provides maximum flexibility for various font sizes
- Industry standard for modern web design

### Baseline Multiples

| Units | Pixels | Tailwind Classes |
|-------|--------|------------------|
| 1 | 4px | `p-1`, `m-1`, `gap-1` |
| 2 | 8px | `p-2`, `m-2`, `gap-2` |
| 3 | 12px | `p-3`, `m-3`, `gap-3` |
| 4 | 16px | `p-4`, `m-4`, `gap-4` |
| 5 | 20px | `leading-rhythm-5` |
| 6 | 24px | `p-6`, `leading-rhythm-6` |
| 7 | 28px | `leading-rhythm-7` |
| 8 | 32px | `p-8`, `leading-rhythm-8` |
| 10 | 40px | `p-10`, `leading-rhythm-10` |
| 12 | 48px | `p-12`, `leading-rhythm-12` |

## Typography System

### Line Heights That Maintain Rhythm

Our typography uses **unitless line-heights** that resolve to baseline multiples:

```css
/* Defined in globals.css */
.text-xs   { line-height: 1.3333; }  /* 12px font → 16px line (4 units) */
.text-sm   { line-height: 1.4286; }  /* 14px font → 20px line (5 units) */
.text-base { line-height: 1.5; }     /* 16px font → 24px line (6 units) */
.text-lg   { line-height: 1.5556; }  /* 18px font → 28px line (7 units) */
.text-xl   { line-height: 1.4; }     /* 20px font → 28px line (7 units) */
.text-2xl  { line-height: 1.3333; }  /* 24px font → 32px line (8 units) */
.text-3xl  { line-height: 1.3333; }  /* 30px font → 40px line (10 units) */
.text-4xl  { line-height: 1.3333; }  /* 36px font → 48px line (12 units) */
```

### Key Principle: Don't Be Restricted By Your Baseline

> You don't need to pick font sizes that are multiples of your baseline. Instead, pick good font sizes from a type scale, then **use line-height, margin, and padding to align back to the baseline**.

### Typography Scale Reference

| Class | Font Size | Line Height | Total Height | Baseline Units |
|-------|-----------|-------------|--------------|----------------|
| `text-xs` | 12px | 16px | 16px | 4 |
| `text-sm` | 14px | 20px | 20px | 5 |
| `text-base` | 16px | 24px | 24px | 6 |
| `text-lg` | 18px | 28px | 28px | 7 |
| `text-xl` | 20px | 28px | 28px | 7 |
| `text-2xl` | 24px | 32px | 32px | 8 |
| `text-3xl` | 30px | 40px | 40px | 10 |
| `text-4xl` | 36px | 48px | 48px | 12 |

## Making Up the Difference

When a font size doesn't naturally align to the baseline, use **margin or padding** to get back on track.

### Example: Text with Padding

If you have `text-sm` (20px line-height) with `py-2` (8px top + 8px bottom):

```
8px (padding-top) + 20px (line-height) + 8px (padding-bottom) = 36px total
36px ÷ 4px = 9 baseline units ✓
```

This is exactly what we use for sidebar navigation items!

### Example: Text with Margin

If you have a heading that's 48px but needs more space below:

```tsx
<h2 className="text-3xl mb-8">Section Title</h2>
// 40px line-height + 32px margin-bottom = 72px total (18 units) ✓
```

## Spacing Guidelines

### Vertical Spacing Rules

1. **Use padding-top and margin-bottom** to avoid collapsing margins
2. **Always use multiples of 4px** for vertical spacing
3. **Combine spacing values** to reach baseline multiples

### Recommended Spacing Patterns

```tsx
// Sections
<div className="space-y-8">  // 32px = 8 units between items

// Compact lists
<div className="space-y-2">  // 8px = 2 units between items

// Form fields  
<div className="space-y-4">  // 16px = 4 units between fields

// Large sections
<div className="space-y-12"> // 48px = 12 units between sections
```

### Watch Out for Collapsing Margins

**Problem:** Adjacent margins collapse in CSS, breaking your rhythm.

**Solution:** Use padding-top with margin-bottom instead of margin-top + margin-bottom:

```tsx
// ❌ Bad - margins can collapse
<div className="mt-4 mb-4">...</div>

// ✅ Good - padding + margin won't collapse
<div className="pt-4 mb-4">...</div>
```

## Component Patterns

### Navigation Items (Sidebar)

```tsx
<Link
  href="/dashboard"
  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
>
  <Icon icon={DashboardIcon} />
  <span>Dashboard</span>
</Link>
```

**Math:**
- `py-2` = 8px top + 8px bottom = 16px padding
- `text-sm` = 20px line-height (5 baseline units)
- **Total: 36px (9 baseline units)** ✓

### Table Rows (Dashboard)

```tsx
<TableRow className="border-0">
  <TableCell className="text-sm py-1 pl-0 pr-8">
    Portfolio Value
  </TableCell>
  <TableCell className="text-sm py-1 px-0">
    $109,476.26
  </TableCell>
</TableRow>
```

**Math:**
- `py-1` = 4px top + 4px bottom = 8px padding  
- `text-sm` = 20px line-height (5 baseline units)
- **Total: 28px (7 baseline units)** ✓

### Headings

```tsx
<h1 className="text-2xl font-mono mb-8">
  Welcome back, Mia!
</h1>
```

**Math:**
- `text-2xl` = 32px line-height (8 baseline units)
- `mb-8` = 32px margin-bottom (8 baseline units)
- **Total space: 64px (16 baseline units)** ✓

### Buttons

```tsx
<Button className="h-10 px-4">
  Submit
</Button>
```

**Math:**
- `h-10` = 40px height (10 baseline units) ✓
- Text centers vertically using flexbox

### Form Inputs

```tsx
<Input className="h-10 px-3 text-sm" />
```

**Math:**
- `h-10` = 40px height (10 baseline units) ✓
- `text-sm` = 20px line-height centers nicely

## Adjusting Line Height

### When to Adjust

Line heights may need adjustment for:
- Large headings (too much space between lines)
- Narrow columns (text feels cramped)
- Display text (needs tighter leading)

### Use Incremental Values

**Recommended:** Adjust line-height in increments of **0.25** (1.25, 1.5, 1.75, etc.)

Why? It helps maintain baseline alignment:

```
48px × 1.25 = 60px (15 units) ✓
48px × 1.5  = 72px (18 units) ✓
48px × 1.75 = 84px (21 units) ✓
```

### Custom Line Heights

We provide rhythm-specific line-height utilities:

```tsx
<h2 className="text-4xl leading-rhythm-12">
  Large Heading
</h2>
// 36px font with 48px line-height (12 units) ✓
```

## Responsive Considerations

### Breakpoint Adjustments

You can adjust your baseline at different breakpoints if needed:

```tsx
<div className="space-y-6 md:space-y-8 lg:space-y-12">
  {/* Spacing grows with viewport */}
</div>
```

### Images and Media

Images can break vertical rhythm if not sized carefully:

```tsx
// ❌ Bad - arbitrary height
<img src="..." className="w-full h-auto" />

// ✅ Good - constrain to baseline multiples
<img 
  src="..." 
  className="w-full" 
  style={{ height: '240px' }} // 60 units
/>
```

**For responsive images:** Consider an adaptive approach with specific breakpoints rather than fluid scaling.

## Testing Alignment

### Visual Verification

To check if elements align properly:

1. **Place sidebar next to content** - text baselines should align
2. **Use browser DevTools** - measure element heights (should be divisible by 4)
3. **Grid overlay tools** - visualize the 4px grid ([Baseline Overlay Extension](https://chrome.google.com/webstore/detail/baseline-overlay/kdjdkgoimdfejbphigbkljekcnnnkcph))

### Quick Check Formula

```
(padding-top + line-height + padding-bottom) % 4 === 0
```

If this equals true, you're maintaining rhythm! ✓

## Anti-Patterns

### ❌ Don't: Use odd padding values

```tsx
// BAD: py-1 with text-base breaks rhythm
<div className="py-1 text-base">
  // 4 + 24 + 4 = 32px... wait, this actually works! 
  // But py-1 is usually too tight for text-base
</div>

// BAD: Arbitrary values
<div className="py-[13px]">Content</div>
```

### ❌ Don't: Forget line-height on custom sizes

```tsx
// BAD: No line-height control
<p className="text-[22px]">Text</p>

// GOOD: Explicit rhythm-aligned line-height
<p className="text-[22px] leading-rhythm-7">Text</p>
```

### ❌ Don't: Mix baseline-breaking values

```tsx
// BAD: py-3 (12px) + text-sm (20px) = 44px (11 units - odd!)
<TableCell className="py-3 text-sm">Value</TableCell>

// GOOD: py-2 (8px) + text-sm (20px) = 36px (9 units) ✓
<TableCell className="py-2 text-sm">Value</TableCell>
```

## Custom Utilities

### Available Rhythm Utilities

Defined in `tailwind.config.ts`:

```typescript
lineHeight: {
  'rhythm-4': '1rem',    // 16px
  'rhythm-5': '1.25rem', // 20px
  'rhythm-6': '1.5rem',  // 24px
  'rhythm-7': '1.75rem', // 28px
  'rhythm-8': '2rem',    // 32px
  'rhythm-10': '2.5rem', // 40px
  'rhythm-12': '3rem',   // 48px
}
```

Usage:

```tsx
<p className="text-lg leading-rhythm-7">
  18px font with 28px line-height
</p>
```

## Migration Checklist

When updating existing components to use vertical rhythm:

- [ ] Identify current font sizes and padding
- [ ] Calculate total height (padding + line-height + padding)
- [ ] Check if total height is divisible by 4
- [ ] If not divisible by 4, adjust padding or use margin to compensate
- [ ] Test visual alignment with adjacent components
- [ ] Verify responsive behavior at different breakpoints

## Benefits

✅ **Visual harmony** - Different text sizes align horizontally  
✅ **Professional polish** - Creates a cohesive, well-designed feel  
✅ **Easier layouts** - Working within constraints simplifies design decisions  
✅ **Consistency** - All components follow the same spacing rules  
✅ **Better readability** - Proper line heights improve text legibility  
✅ **Scalable system** - Easy to maintain and extend

## Examples in Our Codebase

### Sidebar Navigation
- **File:** `src/components/navigation/Sidebar.tsx`
- **Pattern:** `py-2 text-sm` = 36px total (9 units)

### Portfolio Card
- **File:** `src/components/dashboard/PortfolioCard.tsx`
- **Heading:** `text-2xl` = 32px line-height (8 units)
- **Table rows:** `py-1 text-sm` = 28px total (7 units)

### Spacing
- **Sections:** `space-y-8` = 32px gaps (8 units)
- **Lists:** `space-y-1` = 4px gaps (1 unit)

## Resources

- [A Guide to Vertical Rhythm](https://iamsteve.me/blog/a-guide-to-vertical-rhythm) - Comprehensive explanation
- [8-Point Grid System](https://spec.fm/specifics/8-pt-grid) - Related concept using 8px
- [Tailwind Spacing Scale](https://tailwindcss.com/docs/customizing-spacing) - Default spacing reference
- [Web Typography](https://www.smashingmagazine.com/2011/03/technical-web-typography-guidelines-and-techniques/) - General typography guidelines

---

## Quick Reference Card

**Baseline:** 4px  
**Body text:** 16px with 24px line-height (6 units)  
**Spacing:** Always use multiples of 4px  
**Line height:** Use unitless values that resolve to 4px multiples  
**Formula:** (padding-top + line-height + padding-bottom) % 4 === 0  

**Remember:** Pick good font sizes first, then use spacing to align to the baseline!

