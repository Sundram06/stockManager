# Theme System Documentation

## Overview

VittNest uses a **vibrant coral & navy blue color palette** with a hybrid theming approach that combines:
- **CSS Custom Properties** (CSS variables) for color values
- **Material-UI (MUI) theme** for component styling
- **Dark mode support** with automatic class-based switching

This architecture ensures:
- ✅ Consistent colors across all components
- ✅ No color "muddying" from MUI's automatic processing
- ✅ Easy theme customization
- ✅ Proper dark mode support

---

## Color Palette

### Light Mode
| Token | Color | Usage |
|-------|-------|-------|
| `--background` | `#e8ebed` | Page background (light gray-blue) |
| `--foreground` | `#333333` | Primary text color (dark gray) |
| `--card` | `#ffffff` | Card/paper backgrounds (white) |
| `--primary` | `#df6035` | Primary actions, CTAs (vibrant coral/orange) |
| `--secondary` | `#2f4b79` | Secondary actions, header (navy blue) |
| `--muted` | `#f9fafb` | Muted backgrounds, disabled states |
| `--accent` | `#d6e4f0` | Accent highlights (light blue) |
| `--border` | `#cccccc` | Borders, dividers (light gray) |
| `--destructive` | `#ef4444` | Error, delete actions (red) |

### Dark Mode
| Token | Color | Usage |
|-------|-------|-------|
| `--background` | `#1a1a1a` | Page background (near black) |
| `--foreground` | `#e5e5e5` | Primary text color (light gray) |
| `--card` | `#202020` | Card/paper backgrounds (dark gray) |
| `--primary` | `#df6035` | Primary actions (same vibrant coral) |
| `--secondary` | `#284167` | Secondary actions, header (darker navy) |
| `--muted` | `#2a2a2a` | Muted backgrounds |
| `--accent` | `#2a3656` | Accent highlights (dark blue) |
| `--border` | `#353535` | Borders, dividers (medium gray) |
| `--destructive` | `#ef4444` | Error, delete actions (same red) |

### Chart Colors (Both Modes)
- `--chart-1`: Blue tone
- `--chart-2`: Coral/orange (matches primary)
- `--chart-3`: Red
- `--chart-4`: Yellow/gold
- `--chart-5`: Navy

---

## Typography

The theme uses **Outfit** as the primary font family with fallbacks:

```css
--font-sans: 'Outfit', sans-serif;
--font-serif: 'Merriweather', serif;
--font-mono: 'Fira Code', monospace;
```

Fonts are loaded from Google Fonts in `frontend/index.html`.

### Font Weights
- 400: Regular (body text)
- 500: Medium (subtitles, emphasis)
- 600: Semi-bold (headings, buttons)
- 700: Bold (major headings)

---

## Border Radius System

All border radius values use **0.5rem (8px)** as the base:

```css
--radius: 0.5rem;
--radius-sm: 0.25rem;  /* Chips, small elements */
--radius-md: 0.375rem; /* Menu items */
--radius-lg: 0.5rem;   /* Cards, papers, dialogs */
--radius-xl: 0.75rem;  /* Larger containers */
```

MUI components are configured to use these values automatically.

---

## Architecture

### How It Works

1. **CSS Variables** (`frontend/src/index.css`)
   - Define all color tokens in `:root`
   - Override colors in `.dark` class for dark mode
   
2. **ThemeContext** (`frontend/src/theme/ThemeContext.jsx`)
   - Manages light/dark mode state
   - Applies `.dark` class to `<html>` element
   - Creates MUI theme object
   
3. **MUI Theme** (`frontend/src/theme/appTheme.js`)
   - References CSS variables using `var(--token-name)`
   - Configures component defaults
   - Provides theme object to components

4. **Components**
   - Use MUI's `sx` prop with theme palette references
   - OR use CSS variables directly: `var(--primary)`

### Why Hybrid?

We use CSS variables + MUI theme together because:
- **CSS Variables**: Prevent MUI from auto-processing colors (no muddying!)
- **MUI Theme**: Provides convenient component defaults and `sx` prop support
- **Best of both**: Vibrant colors + MUI component library

---

## Usage Guide

### In React Components (Recommended)

Use MUI's theme palette references:

```jsx
<Button 
  sx={{ 
    backgroundColor: 'primary.main',      // Uses --primary variable
    color: 'primary.contrastText',        // Uses --primary-foreground
    '&:hover': {
      backgroundColor: 'secondary.main',  // Uses --secondary
    }
  }}
>
  Click Me
</Button>
```

### Direct CSS Variables (When Needed)

Use CSS variables directly for custom styling:

```jsx
<Box sx={{ 
  background: 'var(--card)',
  color: 'var(--foreground)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)'
}}>
  Custom Box
</Box>
```

### In CSS/Module CSS Files

```css
.myComponent {
  background-color: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

/* Dark mode auto-handled */
```

---

## Key Design Decisions

### Header Always Dark
The header uses `--secondary` (navy blue) in both light and dark modes:
- Light mode: Navy blue (#2f4b79)
- Dark mode: Slightly darker navy (#284167)
- Text always white for contrast

This creates consistent branding and avoids harsh white headers.

### Primary Color Stays Vibrant
The primary coral/orange color (`#df6035`) is **identical in both modes**. This ensures:
- Strong brand identity
- High-impact CTAs
- No desaturation in dark mode

We prevent MUI from dulling this color by:
```js
containedPrimary: {
  backgroundColor: getCSSVar('--primary'),
  color: getCSSVar('--primary-foreground'),
  '&:hover': {
    backgroundColor: getCSSVar('--primary'),
    filter: 'brightness(0.92)', // Subtle darkening on hover
  },
}
```

### Reduced Border Radius
Changed from `1rem` (16px) to `0.5rem` (8px) for:
- More modern, refined appearance
- Better alignment with contemporary design trends
- Matches reference design aesthetics

---

## Customization

### Changing Colors

1. **Edit CSS variables** in `frontend/src/index.css`:
   ```css
   :root {
     --primary: #your-new-color;
   }
   
   .dark {
     --primary: #your-dark-mode-color;
   }
   ```

2. Colors automatically propagate throughout the app
3. No need to update component code

### Adding New Colors

1. Add to `:root` and `.dark` in `index.css`
2. Optionally add to MUI theme's `palette.custom` in `appTheme.js`
3. Use in components via `var(--your-token)` or `theme.palette.custom.yourToken`

### Changing Fonts

1. Update Google Fonts import in `frontend/index.html`
2. Update `--font-sans` variable in `index.css`
3. Font automatically applied via `appTheme.js`

---

## Testing Dark Mode

### Manual Toggle
Click the sun/moon icon in the header to switch modes.

### System Preference
The app respects system dark mode preference on first load.

### Persistence
Theme choice is saved to `localStorage` as `vittnest-theme-mode`.

---

## Common Patterns

### Modal/Dialog Headers
```jsx
<Box sx={{ 
  backgroundColor: 'primary.main',
  color: 'primary.contrastText',
  px: 2,
  py: 1.5 
}}>
  <Typography variant="h6">Modal Title</Typography>
</Box>
```

### Cards with Theme-Aware Shadows
```jsx
<Card
  elevation={2}
  sx={{
    p: 3,
    // Background auto-handled by MUI theme
    // Shadow auto-handled by elevation
  }}
>
  Content
</Card>
```

### Conditional Styling by Mode
```jsx
<Box sx={{
  background: (theme) => 
    theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.02)'
}}>
  Mode-aware content
</Box>
```

---

## Troubleshooting

### Colors Look Washed Out
- ✅ Check that `.dark` class is applied to `<html>` in dark mode
- ✅ Verify CSS variables are defined in `index.css`
- ✅ Ensure component isn't using hardcoded colors

### Dark Mode Not Working
- ✅ Verify `ThemeContext` is wrapping the app
- ✅ Check browser console for errors
- ✅ Clear localStorage and refresh page

### Component Doesn't Match Theme
- ✅ Replace hardcoded colors with `theme.palette.*` or `var(--*)`
- ✅ Check if component has inline styles overriding theme
- ✅ Use MUI's `sx` prop instead of `style` prop when possible

---

## Files Reference

| File | Purpose |
|------|---------|
| `frontend/src/index.css` | CSS variable definitions |
| `frontend/src/theme/appTheme.js` | MUI theme configuration |
| `frontend/src/theme/ThemeContext.jsx` | Theme state management |
| `frontend/src/theme/useTheme.js` | Theme hook (if exists) |
| `frontend/index.html` | Font imports |

---

## Migration Notes

If updating components from the old theme:

### Replace Hardcoded Colors
```jsx
// ❌ Old
<Box sx={{ backgroundColor: '#ffffff' }}>

// ✅ New
<Box sx={{ backgroundColor: 'background.paper' }}>
// OR
<Box sx={{ backgroundColor: 'var(--card)' }}>
```

### Update Border Radius
```jsx
// ❌ Old
borderRadius: '1rem'

// ✅ New
borderRadius: '0.5rem'
// OR let MUI handle it automatically
```

### Update Font References
```jsx
// ❌ Old
fontFamily: '"DM Sans", sans-serif'

// ✅ New
fontFamily: 'var(--font-sans)'
// OR let theme handle it (default)
```

---

## Credits

Theme inspired by **AstroVista** design from tweakcn with custom refinements for VittNest branding.
