# Dark Mode Implementation Guide for Restaurant Details Page

## Summary
The restaurant details page (`/restaurants/[id]`) needs comprehensive dark mode support. Below are all the className updates needed:

## Booking Modal Dark Mode Classes

### Modal Container & Background
- `bg-white` → `bg-white dark:bg-gray-800`
- `bg-indigo-600` → `bg-indigo-600 dark:bg-indigo-700`
- `text-white` (keep as is)

### Labels & Text
- `text-gray-700` → `text-gray-700 dark:text-gray-300`
- `text-gray-600` → `text-gray-600 dark:text-gray-400`
- `text-gray-900` → `text-gray-900 dark:text-white`

### Borders
- `border-gray-200` → `border-gray-200 dark:border-gray-700`
- `border-gray-300` → `border-gray-300 dark:border-gray-600`

### Backgrounds
- `bg-gray-50` → `bg-gray-50 dark:bg-gray-700/50`
- `bg-gray-100` → `bg-gray-100 dark:bg-gray-700`
- `bg-indigo-50` → `bg-indigo-50 dark:bg-indigo-900/30`
- `bg-red-50` → `bg-red-50 dark:bg-red-900/20`
- `bg-green-100` → `bg-green-100 dark:bg-green-900/30`

### Interactive Elements (Buttons)
- `bg-indigo-600` → `bg-indigo-600 dark:bg-indigo-500`
- `hover:bg-indigo-700` → `hover:bg-indigo-700 dark:hover:bg-indigo-600`
- `bg-gray-100` → `bg-gray-100 dark:bg-gray-700`
- `hover:bg-gray-200` → `hover:bg-gray-200 dark:hover:bg-gray-600`

### Status Colors
- `text-green-600` → `text-green-600 dark:text-green-400`
- `text-red-600` → `text-red-600 dark:text-red-400`
- `text-indigo-600` → `text-indigo-600 dark:text-indigo-400`

## Main Page Dark Mode Classes

### Page Background
- `bg-gray-50` → `bg-gray-50 dark:bg-gray-900`

### Loading State
- `bg-gray-50` → `bg-gray-50 dark:bg-gray-900`
- `text-indigo-600` → `text-indigo-600 dark:text-indigo-400`

### Hero Section
- Background gradients need dark mode variants

### Content Cards
- `bg-white` → `bg-white dark:bg-gray-800`
- `border-gray-200` → `border-gray-200 dark:border-gray-700`

### Tabs
- `bg-white` → `bg-white dark:bg-gray-800`
- `bg-indigo-600` → `bg-indigo-600 dark:bg-indigo-500`
- `text-gray-600` → `text-gray-600 dark:text-gray-400`

### Menu Items
- Card backgrounds, borders, text all need dark variants

### Input Fields
- `bg-white` → `bg-white dark:bg-gray-800`
- `border-gray-300` → `border-gray-300 dark:border-gray-600`
- `focus:ring-indigo-500` → `focus:ring-indigo-500 dark:focus:ring-indigo-400`

## Implementation Status
✅ Bookings page - Complete
✅ Profile page - Complete  
✅ Restaurants listing - Complete
⚠️ Restaurant details - Needs implementation

## Next Steps
1. Apply all dark mode classes to BookingModal component
2. Apply dark mode classes to main restaurant details page
3. Test in both light and dark modes
4. Verify all interactive states work correctly
