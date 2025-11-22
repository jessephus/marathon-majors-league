# Design System Examples

This directory contains practical, copy-paste ready examples for implementing the Marathon Majors Fantasy League design system with Chakra UI.

## Directory Structure

```
examples/design-system/
├── README.md                    (this file)
├── before-after-examples.md     (Legacy → Chakra migration examples)
├── button-examples.tsx          (All button variations)
├── form-examples.tsx            (Form component patterns)
├── card-examples.tsx            (Card layouts and patterns)
├── modal-examples.tsx           (Modal and dialog patterns)
├── navigation-examples.tsx      (Header and navigation components)
├── data-display-examples.tsx    (Tables, badges, stats)
└── layout-examples.tsx          (Page layouts and containers)
```

## Quick Links

- **[Before/After Examples](./before-after-examples.md)** - See how legacy components migrate to Chakra
- **[Button Examples](./button-examples.tsx)** - Primary, secondary, icon buttons
- **[Form Examples](./form-examples.tsx)** - Inputs, selects, validation
- **[Card Examples](./card-examples.tsx)** - Athlete cards, team cards, stats
- **[Modal Examples](./modal-examples.tsx)** - Dialogs, drawers, alerts
- **[Navigation Examples](./navigation-examples.tsx)** - Headers, tabs, breadcrumbs
- **[Data Display Examples](./data-display-examples.tsx)** - Tables, badges, avatars
- **[Layout Examples](./layout-examples.tsx)** - Page templates, grids, stacks

## How to Use

Each example file is a standalone, copy-paste ready TypeScript/TSX file that you can:

1. **Copy the entire component** into your project
2. **Extract specific patterns** you need
3. **Customize** colors, sizes, spacing to your needs
4. **Test** in your local environment

## Example Format

Each example follows this structure:

```tsx
/**
 * Component Name
 * 
 * Description: What this component does
 * Used in: Where it's typically used
 * Props: Key props and their purposes
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 * 
 * Accessibility:
 * - WCAG AA compliant
 * - Keyboard navigable
 * - Screen reader compatible
 */

import { Button, Box } from '@chakra-ui/react';

export function ExampleComponent() {
  return (
    <Button colorPalette="primary">
      Example
    </Button>
  );
}

// Usage example
<ExampleComponent />
```

## Before/After Migration Examples

See **[before-after-examples.md](./before-after-examples.md)** for side-by-side comparisons showing:

- Legacy vanilla CSS/HTML
- Chakra UI equivalent
- Benefits of migration
- Common pitfalls to avoid

## Testing Examples

All examples are designed to be:

- ✅ **Mobile-responsive** (tested at 320px, 768px, 1024px+)
- ✅ **Keyboard accessible** (Tab, Enter, Escape navigation)
- ✅ **Screen reader friendly** (proper ARIA labels)
- ✅ **WCAG AA compliant** (color contrast 4.5:1+)
- ✅ **Theme-compatible** (uses design tokens)

## Contributing New Examples

When adding new examples:

1. Follow the existing format structure
2. Include accessibility notes
3. Add usage documentation
4. Test on mobile and desktop
5. Verify WCAG AA compliance
6. Update this README with links

## Resources

- **Main Design System Docs:** [/docs/DESIGN_SYSTEM.md](../../docs/DESIGN_SYSTEM.md)
- **Component Patterns:** [/components/chakra/README.md](../../components/chakra/README.md)
- **Design Guidelines:** [/docs/CORE_DESIGN_GUIDELINES.md](../../docs/CORE_DESIGN_GUIDELINES.md)

---

**Last Updated:** November 22, 2025  
**Maintainer:** Project Contributors
