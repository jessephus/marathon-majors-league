# Navigation Microinteractions & Polish

**Document Version:** 1.0  
**Last Updated:** November 22, 2025  
**Purpose:** Complete reference for navigation component microinteractions and polish  
**Phase:** Phase 3 - Navigation Polish & Microinteractions  
**GitHub Issue:** [Navigation Polish & Microinteractions](https://github.com/jessephus/marathon-majors-league/issues/TBD)

---

## Overview

This document details the microinteractions and polish applied to the navigation components in Phase 3 of the UI redesign. All enhancements follow the design system principles defined in `CORE_DESIGN_GUIDELINES.md` and respect WCAG 2.1 AA accessibility guidelines.

### Key Principles

1. **Purposeful:** Every animation serves a function
2. **Fast:** 150-300ms for most interactions
3. **Natural:** Ease-out curves feel organic
4. **Consistent:** Same elements use same animations
5. **Accessible:** Respect `prefers-reduced-motion`

---

## Animation Timing System

All navigation components use a consistent timing system based on the theme configuration:

```javascript
durations: {
  ultra:   '75ms',   // Instant feedback (hover colors)
  faster:  '100ms',  // Quick (button press)
  fast:    '150ms',  // Standard (hover effects)
  normal:  '250ms',  // Comfortable (modal open)
  slow:    '350ms',  // Deliberate (page transition)
  slower:  '500ms',  // Dramatic (rarely used)
}

easings: {
  easeOut:    'cubic-bezier(0, 0, 0.2, 1)',      // Decelerate (DEFAULT)
  easeIn:     'cubic-bezier(0.4, 0, 1, 1)',      // Accelerate
  easeInOut:  'cubic-bezier(0.4, 0, 0.2, 1)',    // Smooth (organic)
  sharp:      'cubic-bezier(0.4, 0, 0.6, 1)',    // Snappy
}
```

### Navigation-Specific Timing

| Interaction | Duration | Easing | Purpose |
|-------------|----------|--------|---------|
| Color transitions | 150ms | ease-out | Quick color changes on hover |
| Scale transforms | 150ms | ease-out | Tap/press feedback |
| Underline slides | 250ms | ease-out | Desktop nav link hover |
| Scroll shadows | 250ms | ease-out | Header elevation on scroll |
| Drawer open/close | 300ms | ease-out | Mobile menu slide |
| Ripple effects | 600ms | ease-out | Touch feedback |
| Menu item stagger | 50ms | ease-out | Sequential reveal (per item) |

---

## Component Microinteractions

### 1. BottomNav Component

#### BottomNavItem Interactions

**Tap/Click Feedback**
```typescript
// State management
const [isPressed, setIsPressed] = useState(false);
const [showRipple, setShowRipple] = useState(false);

// Touch/press effects
transform={isPressed ? 'scale(0.92)' : isActive ? 'translateY(-2px)' : 'none'}
```

**Visual States:**
- **Default:** Gray icon/text, no transform
- **Hover:** Light gray background, subtle translateY(-1px)
- **Active (pressed):** Scale(0.92) for tactile feedback
- **Active (current page):** Navy color, translateY(-2px) elevation, scale(1.1) icon
- **Focus:** Gold outline with 2px offset

**Ripple Effect:**
```typescript
// Triggered on click/tap
setShowRipple(true);
setTimeout(() => setShowRipple(false), 600);

// CSS animation
@keyframes ripple {
  0%: { width: 0, height: 0, opacity: 0.3 }
  100%: { width: 100px, height: 100px, opacity: 0 }
}
```

**Badge Pulse Animation:**
```typescript
// Notification badges pulse to draw attention
animation="pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"

@keyframes pulse {
  0%, 100%: { opacity: 1 }
  50%: { opacity: 0.7 }
}
```

---

### 2. NavLink Component (Desktop Header)

**Animated Underline:**
```typescript
// Underline with scaleX transform
<Box
  position="absolute"
  bottom={0}
  left={0}
  right={0}
  height="2px"
  bg="gold.400"
  transformOrigin="left"
  transform={isActive || isHovered ? 'scaleX(1)' : 'scaleX(0)'}
  transition="transform 0.25s cubic-bezier(0, 0, 0.2, 1)"
/>
```

**Why This Works:**
- `transformOrigin: left` creates left-to-right slide
- `scaleX` is GPU-accelerated (better than width)
- 250ms feels natural
- High contrast gold color for accessibility

---

### 3. StickyHeader Component

**Scroll Shadow Effect (Optimized):**
```typescript
useEffect(() => {
  let ticking = false;
  
  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const isScrolled = window.scrollY > 10;
        if (isScrolled !== scrolled) {
          setScrolled(isScrolled);
        }
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, [scrolled]);
```

**Performance Benefits:**
- `requestAnimationFrame` prevents layout thrashing
- `ticking` flag ensures only one RAF callback queued
- `passive: true` improves scroll performance

---

### 4. MobileMenuDrawer Component

**Stagger Animation:**
```typescript
{menuItems.map((item, index) => (
  <Box
    transition="all 0.2s cubic-bezier(0, 0, 0.2, 1)"
    transitionDelay={isOpen ? `${index * 0.05}s` : '0s'}
    opacity={isOpen ? 1 : 0}
    transform={isOpen ? 'translateX(0)' : 'translateX(20px)'}
  >
    {/* Menu item */}
  </Box>
))}
```

**Visual Sequence:**
1. Overlay fades in (250ms)
2. Drawer slides in from right (300ms)
3. Menu items stagger sequentially (50ms per item)

---

## Accessibility Implementation

### prefers-reduced-motion Support

All components respect user motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  transition: none;
  animation: none;
  transform: none !important;
}
```

**What This Means:**
- Users with vestibular disorders see instant state changes
- No sliding, scaling, or fading animations
- Static underlines instead of animated
- Full functionality preserved

### Testing

**Browser DevTools:**
1. Open DevTools → Rendering
2. Enable "Emulate prefers-reduced-motion: reduce"
3. Verify all animations are disabled

---

## Performance Considerations

### GPU-Accelerated Transforms

✅ **Efficient:**
- `transform: translateX()`
- `transform: scale()`
- `transform: translateY()`
- `opacity`

❌ **Expensive:**
- `width` / `height` transitions
- `top` / `left` / `right` / `bottom`

---

## Implementation Guidelines

### Animation Checklist

- [ ] Does it serve a clear purpose?
- [ ] Is duration 150-300ms?
- [ ] Uses GPU-accelerated properties?
- [ ] Respects `prefers-reduced-motion`?
- [ ] Maintains accessibility?
- [ ] Uses cubic-bezier ease-out?
- [ ] Works on low-end devices?

---

## References

- `/docs/CORE_DESIGN_GUIDELINES.md` - Motion & Interaction
- `/docs/UI_REDESIGN_ROADMAP.md` - Phase 3 implementation
- `/theme/index.ts` - Animation timing configuration
- WCAG 2.1 Level AA - Motion guidelines

---

**Document Status:** Active Reference  
**Last Review:** November 22, 2025  
**Maintained By:** UI/UX Team
