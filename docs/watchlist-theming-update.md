# Watchlist Flow Theming Update

## Overview
Updated the entire watchlist flow to use the shadcn theming system consistently, replacing all hardcoded color values with semantic theme tokens.

## Files Updated

### 1. AddAssetToWatchlistModal.tsx
**Location:** `/src/components/asset/AddAssetToWatchlistModal.tsx`

#### Changes Made:

##### Imports
- Added shadcn components: `Button`, `Badge`, `Input`, `Icon`
- Added `Card`, `CardContent`, `Separator` from shadcn

##### Modal Structure
- **Backdrop**: `bg-background/80 backdrop-blur-sm` (was `bg-black/50 dark:bg-black/70`)
- **Container**: `bg-background` (was `bg-white dark:bg-gray-900`)
- **Header**: 
  - Background: `bg-muted/50` (was `bg-gray-200 dark:bg-gray-800`)
  - Border: `border-border` (was `border-gray-500 dark:border-gray-700`)
  - Text: `text-foreground` and `text-muted-foreground` (was `text-gray-900 dark:text-gray-100`)
  - Button: Converted to shadcn `Button` component with `variant="outline"`

##### Left Section (Current Assets)
- **Background**: `bg-muted/30` (was `bg-gray-200 dark:bg-gray-800`)
- **Border**: `border-border` (was `border-gray-500 dark:border-gray-700`)
- **Count Badge**: Converted to shadcn `Badge` with `variant="secondary"`
- **Loading State**: Uses `Icon` component with `CircleNotchIcon`
- **Empty State**: Uses semantic colors `text-foreground` and `text-muted-foreground`
- **Asset Cards**:
  - Background: `bg-card` (was `bg-white dark:bg-gray-700`)
  - Border: `border-border` (was `border-gray-200 dark:border-gray-600`)
  - Hover: `hover:bg-accent/50` (was `hover:shadow-md`)
  - Text: `text-foreground` and `text-muted-foreground`
  - Type Badge: Converted to shadcn `Badge` with `variant="secondary"`
  - Remove Button: Converted to shadcn `Button` with `variant="destructive"` and `size="sm"`

##### Right Section (Search & Results)
- **Background**: `bg-background` (was `bg-white dark:bg-gray-900`)
- **Text**: `text-foreground` and `text-muted-foreground` (was hardcoded gray values)
- **Search Input**: Converted to shadcn `Input` component
- **Error Message**: 
  - Background: `bg-destructive/10` (was `bg-red-50 dark:bg-red-900/20`)
  - Border: `border-destructive/20` (was `border-red-200 dark:border-red-800`)
  - Text: `text-destructive` (was `text-red-700 dark:text-red-400`)
- **Search Results**:
  - Cards: `border-border` with `hover:bg-accent/50`
  - Type Badge: shadcn `Badge` with `variant="secondary"`
  - "Added" Indicator: Uses `chart-positive` theme color
  - Add Button: Converted to shadcn `Button` with `variant="default"` and `size="sm"`

### 2. Watchlists.tsx
**Location:** `/src/components/dashboard/Watchlists.tsx`

#### Status
Already properly themed with shadcn system. No hardcoded colors found.

## Theme Tokens Used

### Background & Surface
- `bg-background` - Main background color
- `bg-card` - Card/surface background
- `bg-muted` - Muted/secondary background
- `bg-accent` - Accent/hover background

### Text
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary/muted text

### Borders
- `border-border` - Standard border color

### State Colors
- `bg-destructive` / `text-destructive` - Error/delete states
- `bg-[hsl(var(--chart-positive))]` - Success/positive states

### Interactive States
- `hover:bg-accent/50` - Hover states
- `bg-background/80 backdrop-blur-sm` - Backdrop overlay

## Benefits

1. **Consistent Theming**: All colors now use semantic theme tokens
2. **Dark Mode**: Automatic dark mode support without manual dark: variants
3. **Maintainable**: Changes to theme colors update entire flow automatically
4. **Accessible**: Uses proper contrast ratios defined in theme
5. **Component Reuse**: Leverages shadcn components for consistency

## Testing Checklist

- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Verify modal backdrop and blur effect
- [ ] Test hover states on all interactive elements
- [ ] Verify button variants (outline, destructive, default)
- [ ] Check badge styling consistency
- [ ] Test search input focus states
- [ ] Verify error message styling
- [ ] Check loading spinner colors
- [ ] Test empty state icon colors
- [ ] Verify asset card hover effects
- [ ] Check "Added" indicator styling

## Related Files

- `/src/app/globals.css` - Theme color definitions
- `/src/components/ui/button.tsx` - Button component
- `/src/components/ui/badge.tsx` - Badge component
- `/src/components/ui/input.tsx` - Input component
- `/src/components/ui/Icon.tsx` - Icon wrapper component

