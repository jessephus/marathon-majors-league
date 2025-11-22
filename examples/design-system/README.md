# Design System Examples

This directory contains practical, copy-paste ready examples for implementing the Marathon Majors Fantasy League design system with Chakra UI.

> **⚠️ Important Note:** The `.tsx.example` files in this directory are **illustrative examples** showing patterns and best practices. They are not compiled with the project and may require adjustments for Chakra UI v3 API compatibility when implementing in your code. Use them as reference guides for understanding component patterns, accessibility requirements, and design system usage.

## Directory Structure

```
examples/design-system/
├── README.md                          (this file)
├── before-after-examples.md           (Legacy → Chakra migration examples)
├── button-examples.tsx.example        (Button patterns - reference only)
└── form-examples.tsx.example          (Form patterns - reference only)
```

## Implementation Notes

### Chakra UI v3 API Changes

When implementing these patterns in your code, be aware of Chakra UI v3 API changes:

- Use `colorPalette` instead of `colorScheme`
- Use `gap` instead of `spacing` for Stack components
- Use `loading` instead of `isLoading` for Button
- Use `disabled` instead of `isDisabled` for form controls
- Use `attached` instead of `isAttached` for ButtonGroup

### Icon Libraries

The example files use placeholder icon components. In production, install and use a proper icon library:

**Recommended Options:**
- **lucide-react** (recommended): `npm install lucide-react`
  ```tsx
  import { Plus, Edit, Trash2 } from 'lucide-react';
  ```
  
- **react-icons**: `npm install react-icons`
  ```tsx
  import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
  ```

- **Custom SVG icons** from your design system

### Using the Examples

1. **Read through the examples** to understand patterns and best practices
2. **Copy relevant patterns** to your component files
3. **Adjust imports** to match your icon library choice
4. **Update prop names** for Chakra v3 API compatibility
5. **Test thoroughly** in your development environment

## Quick Links

- **[Before/After Examples](./before-after-examples.md)** - See how legacy components migrate to Chakra with 50-80% code reduction
- **[Main Design System Docs](../../docs/DESIGN_SYSTEM.md)** - Complete design system reference
- **[Component Patterns](../../components/chakra/README.md)** - Detailed component documentation
- **[Design Guidelines](../../docs/CORE_DESIGN_GUIDELINES.md)** - Design principles and brand standards

## Example Files

### button-examples.tsx.example

Contains 20+ button patterns including:
- Primary, secondary, and ghost button variants
- Icon buttons with accessibility labels
- Loading states and disabled states
- Button groups (horizontal and segmented)
- Size variations (xs, sm, md, lg)
- Responsive patterns
- Real-world usage examples (modal footers, form navigation, card actions)

### form-examples.tsx.example

Contains complete form component patterns:
- Text inputs (basic, validated, email, password, number)
- Select dropdowns (basic and controlled)
- Checkboxes and checkbox groups
- Radio button groups
- Textarea components
- Switch toggles
- Complete form examples with validation
- Search and filter forms

## Accessibility Best Practices

All examples follow WCAG 2.1 AA standards:

✅ **Required:**
- Always include `aria-label` for icon-only buttons
- Use proper color contrast (4.5:1 minimum for text)
- Provide loading states for async operations
- Make touch targets at least 44x44px
- Use semantic HTML elements
- Include helpful error messages

❌ **Avoid:**
- Using emoji for production icons
- Buttons without accessible labels
- Disabled states without explanation
- Generic error messages
- Hardcoded colors instead of theme tokens

## Testing Examples

Before using patterns in production:

1. **Visual Testing** - Verify appearance matches design guidelines
2. **Accessibility Testing** - Test with keyboard navigation and screen readers
3. **Responsive Testing** - Test on mobile (320px), tablet (768px), and desktop (1024px+)
4. **Browser Testing** - Verify cross-browser compatibility
5. **Performance Testing** - Check for rendering performance issues

## Contributing New Examples

When adding new example patterns:

1. Follow existing file structure and naming conventions
2. Include comprehensive comments and documentation
3. Add accessibility notes and ARIA requirements
4. Provide real-world usage examples
5. Test patterns thoroughly before committing
6. Update this README with new examples

## Resources

- **Main Design System Docs:** [/docs/DESIGN_SYSTEM.md](../../docs/DESIGN_SYSTEM.md)
- **Component Patterns:** [/components/chakra/README.md](../../components/chakra/README.md)
- **Design Guidelines:** [/docs/CORE_DESIGN_GUIDELINES.md](../../docs/CORE_DESIGN_GUIDELINES.md)
- **Chakra UI v3 Docs:** [https://chakra-ui.com/docs](https://chakra-ui.com/docs)

---

**Last Updated:** November 22, 2025  
**Maintainer:** Project Contributors
