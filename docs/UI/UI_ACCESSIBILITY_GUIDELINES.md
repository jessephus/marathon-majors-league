# Accessibility Guidelines for Contributed Components

**Version:** 1.0.0  
**Last Updated:** November 25, 2025  
**Standard:** WCAG 2.1 Level AA  
**Status:** ✅ Phase 4 Complete  
**Related Issue:** [#123 - Phase 4: Component Migration](https://github.com/jessephus/marathon-majors-league/issues/123)

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Reference Checklist](#quick-reference-checklist)
3. [Touch Target Sizes](#touch-target-sizes)
4. [Color Contrast Requirements](#color-contrast-requirements)
5. [Keyboard Navigation](#keyboard-navigation)
6. [Focus Management](#focus-management)
7. [ARIA Attributes](#aria-attributes)
8. [Form Component Guidelines](#form-component-guidelines)
9. [Motion & Animation](#motion--animation)
10. [Testing Checklist](#testing-checklist)
11. [Known Issues & Exceptions](#known-issues--exceptions)

---

## Overview

This document provides accessibility guidelines for all components contributed to the Marathon Majors Fantasy League (MMFL) project. All components MUST meet WCAG 2.1 Level AA compliance as a minimum standard.

### Compliance Summary

| Component Type | WCAG 2.1 AA | Touch Targets | Color Contrast | Keyboard Nav |
|---------------|-------------|---------------|----------------|--------------|
| **Buttons** | ✅ | ✅ md/lg/xl | ✅ All variants | ✅ |
| **Cards** | ✅ | ✅ | ✅ | ✅ Interactive |
| **Forms** | ✅ | ✅ md/lg | ✅ | ✅ |
| **Navigation** | ✅ | ✅ | ✅ | ✅ |

---

## Quick Reference Checklist

Before submitting a component PR, verify:

- [ ] **Touch targets** ≥ 44x44px for all interactive elements
- [ ] **Color contrast** ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- [ ] **Focus indicator** visible on all interactive elements (3px gold ring)
- [ ] **Keyboard accessible** - Tab to navigate, Enter/Space to activate
- [ ] **Labels** - All form inputs have associated labels
- [ ] **ARIA** - Use semantic HTML first, ARIA only when needed
- [ ] **Motion** - Respect `prefers-reduced-motion`

---

## Touch Target Sizes

### Requirements (WCAG 2.5.5)

All interactive elements must have a minimum touch target of **44x44 pixels** for mobile accessibility.

### Button Size Guidelines

| Size | Height | Use Case | Mobile Recommended |
|------|--------|----------|-------------------|
| `xs` | 32px | Desktop only, icon buttons | ❌ |
| `sm` | 40px | Desktop preferred, limited mobile | ⚠️ |
| `md` | 44px | Default, meets WCAG minimum | ✅ |
| `lg` | 48px | Recommended for mobile | ✅ |
| `xl` | 56px | Primary CTAs, important actions | ✅ |

### Implementation

```tsx
// ✅ GOOD - Meets touch target requirements
<Button size="md">Save Team</Button>  // 44px height
<Button size="lg">Create Team</Button>  // 48px height

// ⚠️ ACCEPTABLE - Desktop only
<Button size="sm">View Details</Button>  // 40px height

// ❌ AVOID on mobile
<Button size="xs">...</Button>  // 32px height
```

### Form Input Guidelines

All form inputs must have a minimum height of 44px for the `md` size:

| Component | Size sm | Size md | Size lg |
|-----------|---------|---------|---------|
| Input | 40px | 44px | 48px |
| Select | 40px | 44px | 48px |
| Textarea | 80px min | 120px min | 160px min |
| Checkbox | 16px + 44px label | 20px + 44px label | 24px + 48px label |
| Radio | 16px + 44px label | 20px + 44px label | 24px + 48px label |

---

## Color Contrast Requirements

### Minimum Ratios (WCAG 2.1)

| Content Type | AA Ratio | AAA Ratio |
|-------------|----------|-----------|
| Normal text (< 18pt) | 4.5:1 | 7:1 |
| Large text (≥ 18pt or 14pt bold) | 3:1 | 4.5:1 |
| UI components/graphics | 3:1 | 4.5:1 |

### MMFL Color Palette Compliance

#### Primary Colors (Navy)

| Color | On White | Rating |
|-------|----------|--------|
| Navy 900 | 15.99:1 | ✅ AAA |
| Navy 700 | 8.92:1 | ✅ AAA |
| Navy 500 | 6.15:1 | ✅ AAA |
| Navy 400 | 3.45:1 | ⚠️ Large text only |

#### Secondary Colors (Gold)

| Color | On White | Rating |
|-------|----------|--------|
| Gold 900 | 8.12:1 | ✅ AAA |
| Gold 700 | 5.24:1 | ✅ AA |
| Gold 600 | 4.90:1 | ✅ AA |
| Gold 500 | 3.68:1 | ⚠️ Large text only |

### Implementation Guidelines

```tsx
// ✅ GOOD - Use dark shades for text
<Text color="navy.900">Primary text</Text>
<Text color="gray.700">Secondary text</Text>

// ✅ GOOD - Use appropriate badge colors
<Badge bg="success.700" color="white">Saved</Badge>
<Badge bg="error.600" color="white">Error</Badge>

// ❌ AVOID - Low contrast combinations
<Badge colorPalette="success">✓</Badge>  // success.500 = 2.28:1 ❌
<Text color="gray.400">Muted text</Text>  // Too light
```

### Known Contrast Issues

Some button variants have intentionally lighter colors for visual hierarchy:

1. **Gold/Secondary outline buttons** - Gold 500 on white (3.68:1) - Use for large text or secondary actions only
2. **Disabled states** - Reduced opacity (60%) - Expected behavior for disabled elements

---

## Keyboard Navigation

### Required Behaviors

| Key | Action |
|-----|--------|
| `Tab` | Move focus to next interactive element |
| `Shift+Tab` | Move focus to previous interactive element |
| `Enter` | Activate buttons, submit forms |
| `Space` | Activate buttons, toggle checkboxes |
| `Arrow Keys` | Navigate within radio groups, selects |
| `Escape` | Close modals, drawers, dropdowns |

### Implementation

```tsx
// Buttons are automatically keyboard accessible
<Button onClick={handleClick}>Clickable</Button>

// Ensure custom interactive elements are focusable
<Box
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Custom Interactive
</Box>
```

### Tab Order

Ensure tab order follows visual layout (top to bottom, left to right). Avoid using `tabIndex > 0`.

---

## Focus Management

### Focus Indicator Requirements

All interactive elements MUST have a visible focus indicator:

```css
/* MMFL Focus Ring */
:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.3); /* Gold focus ring */
}
```

### Implementation in Components

```tsx
// Focus styles are built into MMFL components
<Button
  _focus={{ boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.3)' }}
>
  Button with Focus Ring
</Button>
```

### Focus Trapping

For modals and drawers, implement focus trapping:

```tsx
// Focus should stay within modal when open
const modalRef = useRef();

useEffect(() => {
  if (isOpen) {
    // Focus first focusable element
    modalRef.current?.querySelector('button')?.focus();
  }
}, [isOpen]);
```

---

## ARIA Attributes

### Semantic HTML First

Always prefer semantic HTML elements over ARIA attributes:

```tsx
// ✅ GOOD - Use semantic elements
<button>Click me</button>
<nav>Navigation content</nav>
<main>Main content</main>

// ❌ AVOID - Unnecessary ARIA
<div role="button">Click me</div>
<div role="navigation">Navigation content</div>
```

### When to Use ARIA

Use ARIA only when semantic HTML is insufficient:

```tsx
// Dynamic content updates
<div role="alert" aria-live="polite">
  Form submitted successfully!
</div>

// Custom components without semantic equivalent
<div role="radiogroup" aria-label="Difficulty level">
  ...
</div>

// State management
<button aria-pressed={isActive}>Toggle</button>
<div aria-expanded={isOpen}>Dropdown content</div>
```

### Common ARIA Patterns

#### Buttons with Loading State

```tsx
<Button
  isLoading={isLoading}
  aria-busy={isLoading}
  aria-label={isLoading ? "Loading..." : "Submit"}
>
  {isLoading ? "Loading..." : "Submit"}
</Button>
```

#### Icon Buttons

```tsx
<IconButton
  aria-label="Delete item"  // Required!
  icon={<TrashIcon />}
/>
```

#### Error Messages

```tsx
<FormControl isInvalid={hasError}>
  <FormLabel htmlFor="email">Email</FormLabel>
  <Input 
    id="email" 
    aria-describedby={hasError ? "email-error" : undefined}
  />
  {hasError && (
    <FormErrorMessage id="email-error" role="alert">
      Please enter a valid email
    </FormErrorMessage>
  )}
</FormControl>
```

---

## Form Component Guidelines

### Label Association

Every form input MUST have an associated label:

```tsx
// ✅ GOOD - Using htmlFor
<FormLabel htmlFor="team-name">Team Name</FormLabel>
<Input id="team-name" />

// ✅ GOOD - Using aria-label
<Input aria-label="Search athletes" placeholder="Search..." />

// ✅ GOOD - Wrapping in label
<label>
  <Checkbox /> I agree to terms
</label>

// ❌ BAD - No label association
<Input placeholder="Enter name" />  // Placeholder is NOT a label
```

### Required Fields

```tsx
<FormControl isRequired>
  <FormLabel htmlFor="name">
    Name <span aria-label="required">*</span>
  </FormLabel>
  <Input id="name" required aria-required="true" />
</FormControl>
```

### Validation Messages

```tsx
<FormControl isInvalid={hasError}>
  <FormLabel htmlFor="password">Password</FormLabel>
  <Input 
    id="password" 
    type="password"
    aria-invalid={hasError}
    aria-describedby={hasError ? "password-error" : "password-help"}
  />
  {hasError ? (
    <FormErrorMessage id="password-error" role="alert">
      Password must be at least 8 characters
    </FormErrorMessage>
  ) : (
    <FormHelperText id="password-help">
      Minimum 8 characters with one number
    </FormHelperText>
  )}
</FormControl>
```

---

## Motion & Animation

### Respecting User Preferences

All animations MUST respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Implementation

```tsx
<Box
  transition="transform 0.2s ease"
  css={{
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    }
  }}
>
  Animated content
</Box>
```

### Animation Guidelines

| Duration | Use Case |
|----------|----------|
| ≤ 150ms | Micro-interactions (hover, focus) |
| 200-300ms | Page transitions, modals |
| ≤ 500ms | Complex animations |
| > 500ms | Avoid for UI, use sparingly |

---

## Testing Checklist

### Automated Testing

Run these commands before submitting:

```bash
# Run accessibility audit
npm run audit:a11y

# Run Phase 4 component tests
npm run audit:phase4

# Run navigation accessibility tests
npm run audit:navigation
```

### Manual Testing Checklist

#### Keyboard Testing
- [ ] Can navigate to all interactive elements with Tab
- [ ] Tab order follows visual layout
- [ ] Can activate buttons with Enter and Space
- [ ] Can navigate radio groups with arrow keys
- [ ] Escape closes modals/drawers
- [ ] Focus is visible on all elements

#### Screen Reader Testing
- [ ] All images have alt text (or aria-hidden for decorative)
- [ ] Form inputs have accessible labels
- [ ] Error messages are announced
- [ ] Headings create logical document outline
- [ ] ARIA live regions announce dynamic content

#### Visual Testing
- [ ] Focus indicators visible on all interactive elements
- [ ] Color is not the only way to convey information
- [ ] Text is readable at 200% zoom
- [ ] Content works in high contrast mode

#### Mobile Testing
- [ ] Touch targets are at least 44x44px
- [ ] Swipe gestures have button alternatives
- [ ] Content is usable in portrait and landscape

---

## Known Issues & Exceptions

### Documented Exceptions

The following items are known limitations with documented rationale:

1. **Small button size (40px)** - Intentional for desktop-only usage. Always use `md` or larger for mobile interfaces.

2. **Gold outline button contrast (3.68:1)** - Secondary color has lower contrast. Use for secondary actions on large text or non-critical UI.

3. **Disabled state opacity (60%)** - Standard opacity reduction for disabled elements. Color contrast requirements do not apply to disabled content per WCAG.

4. **Helper text contrast** - Helper text uses `gray.600` which meets AA for informational text.

### Filing Accessibility Issues

If you find an accessibility issue:

1. Run `npm run audit:a11y` to generate a report
2. Open a GitHub issue with:
   - Screenshot or description of the issue
   - WCAG criterion violated
   - Steps to reproduce
   - Suggested fix (if known)
3. Label with `accessibility` and `bug`

---

## Resources

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/) - Browser extension
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Chrome DevTools
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluator
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Reference Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Related MMFL Documentation
- [Design Guidelines](../CORE_DESIGN_GUIDELINES.md)
- [Button Components](./UI_BUTTON_COMPONENTS.md)
- [Card Components](./UI_CARD_COMPONENTS.md)
- [Form Components](./UI_FORM_COMPONENTS.md)
- [Phase 3 Navigation Accessibility](./UI_PHASE3_ACCESSIBILITY_REMEDIATION.md)

---

**Document Status:** Complete - Phase 4 Accessibility Guidelines  
**Last Review:** November 25, 2025  
**Next Review:** After Phase 5 completion  
**Maintainer:** MMFL Development Team
