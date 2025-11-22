# Design System Examples

This directory contains practical, copy-paste ready examples for implementing the Marathon Majors Fantasy League design system with Chakra UI v3 and Heroicons.

## Directory Structure

```
examples/design-system/
├── README.md                          (this file)
├── before-after-examples.md           (Legacy → Chakra migration examples)
├── button-examples.tsx                (All button variations with Heroicons)
└── form-examples.tsx.example          (Form patterns - reference only, Chakra v3 forms not yet available)
```

## Icon Library

This project uses **@heroicons/react** for all icons.

### Installation

Already installed:
```bash
npm install @heroicons/react
```

### Usage

```tsx
// Outline icons (24x24) - recommended for most UI elements
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// Solid icons (24x24) - use for emphasis or filled states
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

// Mini icons (20x20) - use for compact UI
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/20/solid';

// Example usage
<Button>
  <PlusIcon style={{ width: '20px', height: '20px' }} />
  <span>Add Item</span>
</Button>
```

### Icon Sizing Guidelines

- **24px (default)** - Standard buttons, navigation, cards
- **20px** - Small buttons, compact layouts
- **16px** - Dense tables, inline icons
- **32px+** - Large CTAs, hero sections

## Quick Links

- **[Before/After Examples](./before-after-examples.md)** - See how legacy components migrate to Chakra with 50-80% code reduction
- **[Button Examples](./button-examples.tsx)** - 20+ button patterns with Heroicons ✅ Production-ready
- **[Form Examples](./form-examples.tsx.example)** - Complete form components (reference only, awaiting Chakra v3 form components)
- **[Main Design System Docs](../../docs/DESIGN_SYSTEM.md)** - Complete design system reference
- **[Component Patterns](../../components/chakra/README.md)** - Detailed component documentation
- **[Design Guidelines](../../docs/CORE_DESIGN_GUIDELINES.md)** - Design principles and brand standards

## How to Use

Each example file is a standalone, copy-paste ready TypeScript/TSX file that you can:

1. **Copy the entire component** into your project
2. **Extract specific patterns** you need
3. **Customize** colors, sizes, spacing to your needs
4. **Test** in your local environment

## Chakra UI v3 API Notes

When implementing these patterns, be aware of Chakra UI v3 API changes:

- Use `colorPalette` instead of `colorScheme`
- Use `gap` instead of `spacing` for Stack components
- Use `loading` instead of `isLoading` for Button
- Use `disabled` instead of `isDisabled` for form controls
- Use `attached` instead of `isAttached` for ButtonGroup

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
2. Use Heroicons for all icon needs
3. Include accessibility notes
4. Add usage documentation
5. Test on mobile and desktop
6. Verify WCAG AA compliance
7. Update this README with links

## Resources

- **Heroicons:** [https://heroicons.com/](https://heroicons.com/)
- **Main Design System Docs:** [/docs/DESIGN_SYSTEM.md](../../docs/DESIGN_SYSTEM.md)
- **Component Patterns:** [/components/chakra/README.md](../../components/chakra/README.md)
- **Design Guidelines:** [/docs/CORE_DESIGN_GUIDELINES.md](../../docs/CORE_DESIGN_GUIDELINES.md)
- **Chakra UI v3 Docs:** [https://chakra-ui.com/docs](https://chakra-ui.com/docs)

---

**Last Updated:** November 22, 2025  
**Maintainer:** Project Contributors
