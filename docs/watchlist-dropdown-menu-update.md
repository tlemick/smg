# Watchlist Dropdown Menu Update

## Overview
Replaced the "Add / Remove Assets" button and trash icon with a cleaner dropdown menu using the DotsThreeVertical icon from Phosphor.

## Changes Made

### Before
```tsx
<div className="flex items-center space-x-3">
  <Button variant="outline" size="sm">
    + Add / Remove Assets
  </Button>
  <Button variant="destructive" size="icon">
    <Icon icon={TrashIcon} size="sm" />
  </Button>
</div>
```

### After
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Icon icon={DotsThreeVerticalIcon} size="lg" />
      <span className="sr-only">Open menu</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>
      <Icon icon={PencilSimpleIcon} size="sm" className="mr-2" />
      Manage Assets
    </DropdownMenuItem>
    <DropdownMenuItem className="text-destructive focus:text-destructive">
      <Icon icon={TrashIcon} size="sm" className="mr-2" />
      Delete Watchlist
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Files Updated

### 1. Icon.tsx
**Location:** `/src/components/ui/Icon.tsx`

- Added `DotsThreeVerticalIcon` to imports
- Added `DotsThreeVerticalIcon` to exports
- Icon is now available throughout the application

### 2. Watchlists.tsx
**Location:** `/src/components/dashboard/Watchlists.tsx`

#### New Imports
- `DotsThreeVerticalIcon` - Three dots menu icon
- `PencilSimpleIcon` - Manage assets icon
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` - Shadcn dropdown components

#### UI Changes
- Replaced two separate buttons with single dropdown menu trigger
- Menu trigger uses `variant="ghost"` for subtle appearance
- Menu items have proper icons and labels
- Delete option styled with `text-destructive` color

## Benefits

### 1. **Cleaner UI**
- Single icon instead of two buttons
- Less visual clutter on each watchlist row
- More modern and professional appearance

### 2. **Better Space Utilization**
- Frees up horizontal space in the watchlist header
- Scales better on smaller screens
- Consistent with modern UI patterns

### 3. **Improved Accessibility**
- `sr-only` label for screen readers
- Proper keyboard navigation support
- Clear action descriptions in menu

### 4. **Enhanced UX**
- Actions are grouped logically
- Delete action is clearly destructive (red text)
- Hover states work automatically from shadcn theme

## Menu Structure

```
┌─────────────────────────────┐
│ ⋮ (DotsThreeVertical)       │  ← Trigger Button
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ ✏️  Manage Assets           │  ← Opens modal
├─────────────────────────────┤
│ 🗑️  Delete Watchlist        │  ← Opens delete dialog (Red text)
└─────────────────────────────┘
```

## Styling Details

### Trigger Button
- **Variant**: `ghost` - No background, subtle hover
- **Size**: `icon` - 8x8 (32px)
- **Icon**: DotsThreeVertical at `md` size (20px)

### Dropdown Menu
- **Alignment**: `end` - Aligns to right side of trigger
- **Background**: Uses `bg-popover` from theme
- **Border**: Uses `border` color from theme
- **Shadow**: Automatic shadow from shadcn

### Menu Items
- **Height**: Auto (1.5rem padding)
- **Gap**: 2 units (8px) between icon and text
- **Hover**: `bg-accent` background
- **Destructive Item**: `text-destructive` with persistent color on focus

## Interaction Flow

1. **Click trigger**: Three dots icon button
2. **Menu opens**: Smooth animation (fade + zoom in)
3. **Select action**:
   - **Manage Assets**: Opens full-screen modal
   - **Delete Watchlist**: Opens confirmation dialog
4. **Menu closes**: Automatic after selection

## Event Handling

### Click Propagation
```tsx
onClick={(e) => e.stopPropagation()}
```
- Prevents watchlist collapse/expand when clicking menu
- Each menu item also stops propagation
- Ensures only the intended action occurs

### Action Handlers
- **Manage Assets**: Opens `AddAssetToWatchlistModal`
- **Delete Watchlist**: Sets `deletingWatchlist` state to show confirmation dialog

## Responsive Behavior

- Menu automatically positions to stay within viewport
- On mobile, menu still accessible with same trigger
- Touch-friendly target size (32px minimum)
- No horizontal overflow on small screens

## Theme Integration

### Light Mode
- Menu background: White
- Menu text: Dark gray
- Hover: Light gray background
- Delete text: Red (#DC2626)

### Dark Mode
- Menu background: Dark gray
- Menu text: Light gray
- Hover: Slightly lighter gray
- Delete text: Light red (#EF4444)

## Keyboard Navigation

- **Tab**: Focus trigger button
- **Enter/Space**: Open menu
- **Arrow Down/Up**: Navigate menu items
- **Enter**: Select highlighted item
- **Escape**: Close menu

## Testing Checklist

- [ ] Click dots icon opens menu
- [ ] Menu appears aligned to right
- [ ] "Manage Assets" opens modal correctly
- [ ] "Delete Watchlist" opens confirmation dialog
- [ ] Delete option shows in red
- [ ] Menu closes after selection
- [ ] Clicking outside closes menu
- [ ] Keyboard navigation works
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Test hover states
- [ ] Test on mobile/tablet
- [ ] Verify click doesn't collapse watchlist
- [ ] Screen reader announces button purpose

## Future Enhancements

Possible additional menu items:
- **Rename Watchlist**
- **Duplicate Watchlist**
- **Export as CSV**
- **Share Watchlist**
- **Set as Default**

To add new items:
```tsx
<DropdownMenuItem onClick={(e) => {
  e.stopPropagation();
  handleYourAction();
}}>
  <Icon icon={YourIcon} size="sm" className="mr-2" />
  Your Action Label
</DropdownMenuItem>
```

## Related Components

- **DropdownMenu**: `/src/components/ui/dropdown-menu.tsx`
- **Button**: `/src/components/ui/button.tsx`
- **Icon**: `/src/components/ui/Icon.tsx`
- **Watchlists**: `/src/components/dashboard/Watchlists.tsx`

## Accessibility Notes

- Trigger button has hidden label: "Open menu"
- Menu items have clear, descriptive text
- Icons are decorative (not announced by screen readers)
- Color is not the only indicator (icons + text provide context)
- Proper ARIA attributes from Radix UI primitives

