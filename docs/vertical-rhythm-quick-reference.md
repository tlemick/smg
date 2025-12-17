# Vertical Rhythm Quick Reference

## The Golden Rule

> **All heights and spacing must be divisible by 4px**

## Formula

```
(padding-top + line-height + padding-bottom) % 4 === 0
```

## Typography Scale

| Text Class | Font | Line Height | Units | Use For |
|------------|------|-------------|-------|---------|
| `text-xs` | 12px | 16px | 4 | Captions, labels |
| `text-sm` | 14px | 20px | 5 | Body, nav items, tables |
| `text-base` | 16px | 24px | 6 | Default body text |
| `text-lg` | 18px | 28px | 7 | Emphasized text |
| `text-xl` | 20px | 28px | 7 | Small headings |
| `text-2xl` | 24px | 32px | 8 | Section headings |
| `text-3xl` | 30px | 40px | 10 | Large headings |
| `text-4xl` | 36px | 48px | 12 | Page titles |

## Common Patterns

### Navigation Items
```tsx
className="py-2 text-sm"  // 8 + 20 + 8 = 36px (9 units) ✓
```

### Table Cells
```tsx
className="py-1 text-sm"  // 4 + 20 + 4 = 28px (7 units) ✓
```

### Buttons
```tsx
className="h-10"          // 40px (10 units) ✓
className="h-8"           // 32px (8 units) ✓
```

### Form Inputs
```tsx
className="h-10 text-sm"  // 40px (10 units) ✓
```

### Section Spacing
```tsx
className="space-y-8"     // 32px gaps (8 units) ✓
className="space-y-6"     // 24px gaps (6 units) ✓
className="space-y-4"     // 16px gaps (4 units) ✓
```

### Card Padding
```tsx
className="p-6"           // 24px (6 units) ✓
className="p-4"           // 16px (4 units) ✓
```

## Spacing Scale (Multiples of 4)

| Class | Pixels | Units | Use |
|-------|--------|-------|-----|
| `1` | 4px | 1 | Tight spacing |
| `2` | 8px | 2 | Compact padding |
| `3` | 12px | 3 | Medium padding |
| `4` | 16px | 4 | Standard padding |
| `6` | 24px | 6 | Comfortable padding |
| `8` | 32px | 8 | Section spacing |
| `10` | 40px | 10 | Large spacing |
| `12` | 48px | 12 | Extra large spacing |

## Custom Line Heights

```tsx
leading-rhythm-4   // 16px (4 units)
leading-rhythm-5   // 20px (5 units)
leading-rhythm-6   // 24px (6 units)
leading-rhythm-7   // 28px (7 units)
leading-rhythm-8   // 32px (8 units)
leading-rhythm-10  // 40px (10 units)
leading-rhythm-12  // 48px (12 units)
```

## Do's ✅

```tsx
✅ py-2 text-sm              // 36px (9 units)
✅ py-1 text-sm              // 28px (7 units)
✅ py-3 text-base            // 36px (9 units)
✅ h-10                      // 40px (10 units)
✅ space-y-8                 // 32px gaps
✅ mb-6                      // 24px margin
```

## Don'ts ❌

```tsx
❌ py-[13px]                 // Arbitrary value
❌ text-[19px]               // No line-height control
❌ h-[37px]                  // Not divisible by 4
❌ space-y-[18px]            // Breaks rhythm
❌ margin-top with margin-bottom  // Use pt + mb instead
```

## Testing Checklist

- [ ] Element height divisible by 4?
- [ ] Line height is a baseline multiple?
- [ ] Padding + line-height + padding = 4px multiple?
- [ ] Using pt + mb instead of mt + mb?
- [ ] Text baselines align visually?

## Component Examples

### Sidebar Nav
**File:** `src/components/navigation/Sidebar.tsx`
```tsx
<Link className="px-3 py-2 text-sm">
  Dashboard
</Link>
// 8 + 20 + 8 = 36px (9 units) ✓
```

### Portfolio Table
**File:** `src/components/dashboard/PortfolioCard.tsx`
```tsx
<TableCell className="py-1 text-sm">
  Portfolio Value
</TableCell>
// 4 + 20 + 4 = 28px (7 units) ✓
```

### Heading
```tsx
<h1 className="text-2xl mb-8">
  Welcome back!
</h1>
// 32px line + 32px margin = 64px (16 units) ✓
```

## Resources

- **Main Guide:** `docs/vertical-rhythm-guide.md`
- **Visual Example:** `docs/vertical-rhythm-visual-example.md`
- **CSS:** `src/app/globals.css` (line-height definitions)
- **Tailwind:** `tailwind.config.ts` (custom utilities)

## Key Concept

> You don't need elements to be the same size. You just need them to use multiples of 4px. Different heights can still create harmony when they follow the same baseline rhythm.

## When in Doubt

1. Pick your font size from the scale
2. Check its line-height (auto-applied via globals.css)
3. Add padding in multiples of 4px
4. Verify: `(padding + line-height + padding) % 4 === 0`
5. If not, adjust padding by 4px increments

---

**Remember:** Vertical rhythm is about **mathematical harmony**, not uniformity!

