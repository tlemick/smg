# Dark Mode Implementation Guide

## ✅ Completed Implementation

### Infrastructure (Complete)
- ✅ Installed `next-themes` package
- ✅ Updated `globals.css` with class-based dark mode support
- ✅ Created `ThemeProvider` context wrapper
- ✅ Updated `layout.tsx` with ThemeProvider and `suppressHydrationWarning`
- ✅ Created `ThemeToggle` component with icon and dropdown variants

### How It Works

#### 1. CSS Variable System
Your existing CSS variables now support both light and dark modes:

```css
/* Light mode (default) */
:root {
  --color-background: var(--color-neutral-50);  /* white */
  --color-foreground: var(--color-neutral-900);  /* black */
}

/* Dark mode (.dark class applied to <html>) */
.dark {
  --color-background: var(--color-neutral-950);  /* black */
  --color-foreground: var(--color-neutral-50);   /* white */
}
```

#### 2. Theme Provider
The `ThemeProvider` wraps your app and:
- Detects system preference (light/dark)
- Allows manual override
- Persists choice in localStorage
- Prevents flash of wrong theme on page load

#### 3. Theme Toggle
Users can switch between:
- **Light**: Force light mode
- **Dark**: Force dark mode  
- **System**: Follow OS preference (auto-switches)

### Using Dark Mode in Components

#### Basic Pattern
```tsx
// Before:
className="bg-white text-gray-900"

// After:
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
```

#### Best Practices

1. **Use Tailwind's `dark:` variant** for all color classes:
   ```tsx
   text-gray-900 dark:text-gray-100
   bg-white dark:bg-gray-800
   border-gray-200 dark:border-gray-700
   ```

2. **Semantic colors** automatically adapt via CSS variables:
   ```tsx
   bg-[var(--color-background)]  // Auto-switches with theme
   text-[var(--color-foreground)]
   ```

3. **Interactive states** need dark variants too:
   ```tsx
   hover:bg-gray-50 dark:hover:bg-gray-700
   focus:ring-blue-500 dark:focus:ring-blue-400
   ```

4. **Text on images** - Use white with drop-shadow for consistency:
   ```tsx
   text-white drop-shadow-lg  // Works in both themes
   ```

### Theme Toggle Locations
- **Desktop**: Main navigation (icon next to notifications)
- **Mobile**: Accessible via same location

### Completed Components

#### Navigation ✅
- `MainNavigation` - Full dark mode support including mobile menu
- `ThemeToggle` - Icon cycle and dropdown variants

#### Dashboard ✅  
- `Overview` - Cards, metrics, buttons
- `Leaderboard` - Podium, avatars, rankings

#### Portfolio ✅
- `ExploreWinningPortfolios` - Background overlays optimized

### In Progress Components

#### Dashboard
- TransactionsFeed
- Watchlists  
- TikTokLessons
- PortfolioCharts

#### Trading
- BuyOrderModal - Partially complete (some classes updated)
- SellOrderModal
- OrderManagement

#### Asset Pages
- AssetHeader
- AssetChart
- AssetNewsPanel
- AssetMetrics components

### Color Mapping Reference

| Light Mode | Dark Mode | Usage |
|------------|-----------|-------|
| `gray-50` | `gray-900` | Lightest backgrounds |
| `gray-100` | `gray-800` | Surface backgrounds |
| `gray-200` | `gray-700` | Borders, dividers |
| `gray-300` | `gray-600` | Subtle borders |
| `gray-600` | `gray-400` | Muted text |
| `gray-700` | `gray-300` | Secondary text |
| `gray-900` | `gray-100` | Primary text |
| `white` | `gray-800` | Cards, modals |
| `black` | `gray-100` | Emphasis text |

### Brand Colors (Consistent)
These work well in both themes without modification:
- **Highlight**: `#FEF100` (bright yellow)
- **Success**: `#409F57` (green)
- **Danger**: `#AE3E3E` (red)
- **Primary**: Blue shades (automatically adjust)

### Testing Dark Mode

1. **Toggle in UI**: Click sun/moon icon in navigation
2. **System Preference**: Change OS dark mode setting
3. **Persistence**: Refresh page - choice should persist

### Common Patterns

#### Cards/Containers
```tsx
bg-white dark:bg-gray-800 
border border-gray-200 dark:border-gray-700
```

#### Text Hierarchy
```tsx
// Headings
text-gray-900 dark:text-gray-100

// Body text
text-gray-700 dark:text-gray-300

// Muted/secondary
text-gray-600 dark:text-gray-400
```

#### Input Fields
```tsx
bg-white dark:bg-gray-800
border-gray-300 dark:border-gray-600
text-gray-900 dark:text-gray-100
placeholder-gray-400 dark:placeholder-gray-500
```

#### Buttons (Primary)
```tsx
bg-blue-600 dark:bg-blue-500
hover:bg-blue-700 dark:hover:bg-blue-600
text-white
```

#### Buttons (Secondary)
```tsx
bg-gray-100 dark:bg-gray-700
hover:bg-gray-200 dark:hover:bg-gray-600
text-gray-700 dark:text-gray-300
```

### Next Steps

Continue adding `dark:` variants to remaining components following the patterns above. Priority order:
1. High-traffic pages (Dashboard, Portfolio, Trade)
2. Core UI components (modals, forms, inputs)
3. Secondary pages (News, Watchlists, Asset details)
4. Admin pages

### Troubleshooting

**Flash of wrong theme on load?**
- Ensure `suppressHydrationWarning` is on `<html>` tag
- ThemeProvider wraps entire app

**Colors not changing?**
- Check if using hardcoded colors (`text-black`) instead of variants (`text-gray-900 dark:text-gray-100`)
- CSS variables update automatically, Tailwind classes need explicit `dark:` variants

**Theme not persisting?**
- Check browser localStorage
- Ensure ThemeProvider has `enableSystem` prop

**Can't see toggle?**
- Import added to `src/components/ui/index.ts`
- Imported in MainNavigation

