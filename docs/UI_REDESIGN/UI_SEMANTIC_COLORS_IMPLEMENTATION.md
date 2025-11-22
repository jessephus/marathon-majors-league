# Semantic Colors Implementation - colorPalette Wrapper Components

**Status:** ✅ Implemented (Phase 2 Complete)  
**Date:** November 22, 2025  
**Version:** 2.2.0

## Overview

This document explains how semantic color support (`colorPalette` prop) is implemented in the Marathon Majors Fantasy League project using custom Chakra UI component wrappers.

## Problem

Chakra UI v3's `colorPalette` prop doesn't automatically work with custom colors (like `primary`, `secondary`, etc.) without proper `semanticTokens` configuration in the theme. As documented in the official Chakra UI docs:

https://chakra-ui.com/docs/theming/customization/colors

The default Button and Badge components expect either:
1. Semantic tokens properly configured in the theme
2. Built-in Chakra color palettes (like `blue`, `red`, etc.)

Our custom colors (`primary`, `secondary`, `navy`, `gold`, `success`, `warning`, `error`, `info`) weren't being recognized, causing components to render with default/gray colors.

## Solution

Created custom wrapper components that provide the clean `colorPalette` API while internally mapping to explicit color tokens that Chakra UI can render correctly.

### Architecture

```
pages/chakra-demo.tsx
  ↓ imports
components/chakra/
  ├── Button.tsx    (wrapper with colorPalette support)
  ├── Badge.tsx     (wrapper with colorPalette support)
  └── index.ts      (barrel export)
  ↓ wraps
@chakra-ui/react
  ├── Button       (base component)
  └── Badge        (base component)
```

## Implementation

### Button Component (`components/chakra/Button.tsx`)

```tsx
import { Button as ChakraButton, ButtonProps } from '@chakra-ui/react';

interface SemanticButtonProps extends Omit<ButtonProps, 'colorPalette'> {
  colorPalette?: 'primary' | 'secondary' | 'navy' | 'gold' | 'success' | 'warning' | 'error' | 'info';
  variant?: 'solid' | 'outline' | 'ghost';
}

const colorConfig = {
  primary: {
    solid: { bg: 'primary.500', color: 'white', _hover: { bg: 'primary.600' } },
    outline: { borderColor: 'primary.500', color: 'primary.500', _hover: { bg: 'primary.50' } },
    ghost: { color: 'primary.500', _hover: { bg: 'primary.50' } },
  },
  // ... other colors
};

export function Button({ colorPalette = 'primary', variant = 'solid', ...props }: SemanticButtonProps) {
  const colorProps = colorConfig[colorPalette]?.[variant] || {};
  return <ChakraButton variant={variant} {...colorProps} {...props} />;
}
```

### Badge Component (`components/chakra/Badge.tsx`)

```tsx
import { Badge as ChakraBadge, BadgeProps } from '@chakra-ui/react';

interface SemanticBadgeProps extends Omit<BadgeProps, 'colorPalette'> {
  colorPalette?: 'primary' | 'secondary' | 'navy' | 'gold' | 'success' | 'warning' | 'error' | 'info';
}

const colorConfig = {
  primary: { bg: 'primary.500', color: 'white' },
  secondary: { bg: 'secondary.500', color: 'navy.900' },
  // ... other colors
};

export function Badge({ colorPalette = 'primary', ...props }: SemanticBadgeProps) {
  const colorProps = colorConfig[colorPalette] || {};
  return <ChakraBadge {...colorProps} {...props} />;
}
```

## Usage

### Import Custom Components

```tsx
import { Button, Badge } from '@/components/chakra';
```

### Button Usage

```tsx
// Solid buttons (default)
<Button colorPalette="primary">Primary Action</Button>
<Button colorPalette="secondary">Secondary Action</Button>

// Outline variant
<Button colorPalette="primary" variant="outline">Cancel</Button>

// Ghost variant
<Button colorPalette="primary" variant="ghost">Dismiss</Button>

// Status colors
<Button colorPalette="success">Confirm</Button>
<Button colorPalette="warning">Warning</Button>
<Button colorPalette="error">Delete</Button>
<Button colorPalette="info">Information</Button>
```

### Badge Usage

```tsx
// Semantic colors
<Badge colorPalette="primary">Primary</Badge>
<Badge colorPalette="secondary">Premium</Badge>

// Status colors
<Badge colorPalette="success">Success</Badge>
<Badge colorPalette="warning">Warning</Badge>
<Badge colorPalette="error">Error</Badge>
<Badge colorPalette="info">Info</Badge>
```

## Supported Colors

All wrapper components support these `colorPalette` values:

| Value | Maps To | Use Case |
|-------|---------|----------|
| `primary` | Navy (primary.500) | Main actions, primary buttons |
| `secondary` | Gold (secondary.500) | Accent actions, highlights |
| `navy` | Brand navy (navy.500) | Explicit brand color usage |
| `gold` | Brand gold (gold.500) | Explicit brand color usage |
| `success` | Green (success.500) | Confirmations, positive feedback |
| `warning` | Amber (warning.500) | Cautions, warnings |
| `error` | Red (error.500) | Errors, destructive actions |
| `info` | Blue (info.500) | Information, neutral messages |

## Color Mapping Details

### Button Variants

#### Solid (default)
- **Background**: `{color}.500`
- **Text**: `white` (or `navy.900` for gold/secondary)
- **Hover**: `{color}.600`

#### Outline
- **Border**: `{color}.500`
- **Text**: `{color}.500`
- **Hover Background**: `{color}.50`

#### Ghost
- **Text**: `{color}.500`
- **Hover Background**: `{color}.50`

### Badge
- **Background**: `{color}.500`
- **Text**: `white` (or `navy.900` for gold/secondary)

## Benefits

### Clean API
✅ Semantic color names: `colorPalette="primary"` instead of `bg="primary.500" color="white"`  
✅ Consistent interface across components  
✅ Self-documenting code  

### Maintainability
✅ Color mappings centralized in wrapper components  
✅ Easy to update color schemes without touching every component  
✅ TypeScript support with autocomplete  

### Reliability
✅ Guaranteed to render colors correctly in Chakra UI v3  
✅ No dependency on Chakra's internal semantic token system  
✅ Works consistently across all browsers  

## Alternative Approaches (Not Used)

### 1. SemanticTokens Configuration
Could configure `theme.semanticTokens.colors.colorPalette` to map shades:

**Pros**: Uses Chakra's built-in system  
**Cons**: Complex configuration, requires mapping every shade, doesn't support multiple palettes easily

### 2. Custom Recipes
Could create custom recipe configurations for each component:

**Pros**: Deeply integrated with Chakra  
**Cons**: Very complex, TypeScript issues, harder to maintain

### 3. Direct Color Props Everywhere
Could use `bg`, `color`, `borderColor`, `_hover` props directly:

**Pros**: Simple, no wrappers needed  
**Cons**: Verbose, repetitive, not maintainable, no clean semantic API

## Migration Guide

If you have existing code using Chakra's Button/Badge directly:

### Before
```tsx
import { Button, Badge } from '@chakra-ui/react';

// These won't render colors correctly:
<Button colorPalette="primary">Text</Button>
<Badge colorPalette="success">Text</Badge>
```

### After
```tsx
import { Button, Badge } from '@/components/chakra';

// These render correctly with proper colors:
<Button colorPalette="primary">Text</Button>
<Badge colorPalette="success">Text</Badge>
```

Just change the import - the API stays the same!

## Future Enhancements

Potential improvements for future phases:

1. **Add More Components**: Create wrappers for other Chakra components (Input, Select, etc.)
2. **Theme Integration**: Once Chakra v4 is released, evaluate if semantic tokens work better
3. **Color Utilities**: Add helper functions for color manipulation
4. **Dark Mode**: Extend color mappings to support dark mode variants

## Testing

### Manual Testing
1. Navigate to `/chakra-demo`
2. Verify Status Colors badges show proper colors (green, amber, red, blue)
3. Verify Primary/Secondary buttons show navy/gold colors
4. Test button variants (solid, outline, ghost)
5. Test hover states

### Build Verification
```bash
npm run build
# Should complete successfully with no warnings about Button/Badge
```

## References

- **Chakra UI v3 Color Theming**: https://chakra-ui.com/docs/theming/customization/colors
- **Theme Configuration**: `theme/colors.ts`, `theme/index.ts`
- **Design System**: `docs/CORE_DESIGN_GUIDELINES.md`
- **Color Validation**: `docs/UI_COLOR_CONTRAST_VALIDATION.md`
- **Roadmap**: `docs/UI_REDESIGN_ROADMAP.md` (Phase 2)

## Commit History

- `74513ce`: Implement colorPalette with custom component wrappers
- `cdffd8c`: Enable colorPalette prop with globalCss configuration (insufficient)
- `a33ee34`: Configure Chakra UI v3 color palettes properly (insufficient)

## Support

For questions or issues with semantic colors:
1. Check this document first
2. Review component implementation in `components/chakra/`
3. Test with `/chakra-demo` page
4. Verify color tokens in `theme/colors.ts`
