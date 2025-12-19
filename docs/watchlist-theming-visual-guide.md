# Watchlist Theming Visual Guide

## Color Token Mapping

### Before → After

#### Backgrounds
```
❌ bg-white dark:bg-gray-900     → ✅ bg-background
❌ bg-gray-200 dark:bg-gray-800  → ✅ bg-muted
❌ bg-white dark:bg-gray-700     → ✅ bg-card
❌ bg-gray-50 dark:bg-gray-800   → ✅ bg-accent/50
```

#### Text Colors
```
❌ text-gray-900 dark:text-gray-100  → ✅ text-foreground
❌ text-gray-600 dark:text-gray-400  → ✅ text-muted-foreground
❌ text-red-700 dark:text-red-400    → ✅ text-destructive
```

#### Borders
```
❌ border-gray-500 dark:border-gray-700  → ✅ border-border
❌ border-gray-200 dark:border-gray-600  → ✅ border-border
❌ border-gray-300 dark:border-gray-600  → ✅ border-border
```

#### Interactive States
```
❌ hover:bg-gray-50 dark:hover:bg-gray-800  → ✅ hover:bg-accent/50
❌ bg-black/50 dark:bg-black/70             → ✅ bg-background/80 backdrop-blur-sm
```

## Component Conversions

### Buttons

#### Before
```tsx
<button
  onClick={handleClose}
  className="text-black dark:text-white bg-gray-400 dark:bg-gray-700 rounded-md px-4 py-2 flex flex-row items-center gap-2 hover:bg-gray-500 dark:hover:bg-gray-600 transition-colors"
>
  <ArrowUUpLeftIcon className="h-6 w-6" />
  Return to Dashboard
</button>
```

#### After
```tsx
<Button
  onClick={handleClose}
  variant="outline"
  className="gap-2"
>
  <Icon icon={ArrowUUpLeftIcon} size="sm" />
  Return to Dashboard
</Button>
```

### Badges

#### Before
```tsx
<span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-full">
  {watchlistItems.length}
</span>
```

#### After
```tsx
<Badge variant="secondary">
  {watchlistItems.length}
</Badge>
```

### Input Fields

#### Before
```tsx
<input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search..."
  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
  autoFocus
/>
```

#### After
```tsx
<Input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search..."
  className="pl-12 h-11"
  autoFocus
/>
```

### Icons

#### Before
```tsx
<CircleNotchIcon className="animate-spin h-5 w-5" />
```

#### After
```tsx
<Icon icon={CircleNotchIcon} size="sm" className="animate-spin" />
```

## Key Improvements

### 1. Automatic Dark Mode
- No more manual `dark:` variants everywhere
- Theme handles all color transitions automatically

### 2. Semantic Naming
- `text-foreground` instead of `text-gray-900 dark:text-gray-100`
- `bg-card` instead of `bg-white dark:bg-gray-700`
- Colors are named by purpose, not appearance

### 3. Consistent Component Variants
- Buttons use `variant` prop: `outline`, `destructive`, `default`
- Badges use `variant` prop: `secondary`
- All components follow same pattern

### 4. Simplified Hover States
- `hover:bg-accent/50` instead of dual light/dark hover colors
- Consistent across all interactive elements

### 5. Better Loading States
- Use `Icon` component with proper sizing
- Consistent spinner appearance everywhere

## Layout Improvements

### Modal Backdrop
```tsx
// Enhanced backdrop with blur effect
<div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" />
```

### Card Hover Effects
```tsx
// Smooth transitions using theme colors
<div className="bg-card border border-border rounded-lg hover:bg-accent/50 transition-all">
```

## Color Palette Reference

### Light Mode
- `background`: White (#FFFFFF)
- `foreground`: Dark gray (#0A0A0B)
- `card`: White (#FFFFFF)
- `muted`: Light gray (#F5F5F6)
- `border`: Gray (#E5E5E6)

### Dark Mode (Automatic)
- `background`: Very dark gray (#0A0A0B)
- `foreground`: White (#FAFAFA)
- `card`: Very dark gray (#0A0A0B)
- `muted`: Dark gray (#2D2D30)
- `border`: Dark gray (#28282B)

## Usage Guidelines

### Do's ✅
- Use semantic tokens: `bg-card`, `text-foreground`, `border-border`
- Use shadcn components: `Button`, `Badge`, `Input`
- Use `Icon` component wrapper for consistent sizing
- Let theme handle dark mode automatically

### Don'ts ❌
- Don't use hardcoded colors: `gray-500`, `blue-600`
- Don't write manual `dark:` variants for theme colors
- Don't use raw icon components without `Icon` wrapper
- Don't use hardcoded pixel sizes for spacing (unless necessary)

## Testing Recommendations

1. **Toggle Dark Mode**: Verify all colors transition smoothly
2. **Check Hover States**: Ensure all interactive elements have proper hover feedback
3. **Test Focus States**: Verify keyboard navigation highlighting
4. **Verify Contrast**: Ensure text is readable in both themes
5. **Check Loading States**: Confirm spinners are visible in both modes

## Migration Checklist for Future Components

When creating new components or updating existing ones:

- [ ] Replace all hardcoded gray/color values with semantic tokens
- [ ] Convert custom buttons to shadcn `Button` component
- [ ] Convert badges to shadcn `Badge` component  
- [ ] Convert inputs to shadcn `Input` component
- [ ] Wrap Phosphor icons with `Icon` component
- [ ] Use `hover:bg-accent/50` for hover states
- [ ] Use `text-muted-foreground` for secondary text
- [ ] Use `border-border` for all borders
- [ ] Test in both light and dark modes
- [ ] Verify responsive behavior

