# Design System Documentation - Marathon Majors Fantasy League

**Document Version:** 1.0  
**Last Updated:** November 22, 2025  
**Purpose:** Central hub for design system documentation, usage guides, and component patterns  
**Status:** 🟢 Active Development  
**Related Issue:** [#122 - Phase 2: Design System Documentation & Examples](https://github.com/jessephus/marathon-majors-league/issues/122)

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Design Foundations](#design-foundations)
4. [Component Library](#component-library)
5. [Migration Guide](#migration-guide)
6. [WCAG AA Compliance](#wcag-aa-compliance)
7. [Resources & References](#resources--references)

---

## Overview

The Marathon Majors Fantasy League design system is built on **Chakra UI v3** and implements a modern, accessible, mobile-first approach with a premium navy and gold brand palette. This documentation serves as the central reference for all design system components, tokens, and patterns.

### Design Philosophy

Our design system is guided by five core principles:

1. **Premium Elegance** - Navy/gold palette conveys prestige and sophistication
2. **Mobile-First Always** - Design for 320px screens first, scale up gracefully
3. **Instant Visual Feedback** - Every interaction has immediate, clear response
4. **Accessible by Default** - WCAG 2.1 AA compliance is non-negotiable
5. **Data Clarity** - Information hierarchy guides user attention effortlessly

### Framework & Tools

- **UI Framework:** Chakra UI v3
- **React Framework:** Next.js 15
- **Icon Library:** Heroicons (@heroicons/react v2.2.0)
- **Typography:** Inter (headings), Roboto (body)
- **Color Palette:** Navy (#161C4F) and Gold (#D4AF37)
- **Spacing System:** 4px base unit
- **Breakpoints:** Mobile-first (320px → 1536px)

---

## Quick Start

### Installation

Chakra UI is already installed and configured. To use the design system:

```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

### Basic Usage

```tsx
import { Button, Box, Heading, Text } from '@chakra-ui/react';

function MyComponent() {
  return (
    <Box p={6} bg="navy.900" color="white">
      <Heading size="2xl" mb={4}>Welcome to MMFL</Heading>
      <Text mb={6}>Create your fantasy marathon team today.</Text>
      <Button colorPalette="primary" size="lg">
        Get Started
      </Button>
    </Box>
  );
}
```

### Theme Configuration

The theme is automatically provided via `ChakraProvider` in `_app.tsx`. Access theme values:

```tsx
import { useTheme } from '@chakra-ui/react';

function MyComponent() {
  const theme = useTheme();
  
  // Access theme values
  const navyColor = theme.colors.navy[500];
  const baseSpacing = theme.spacing[4];
}
```

---

## Design Foundations

### Color System

Our color system uses **semantic color names** that map to our brand colors.

#### Primary Colors

| Token | Hex | Usage | WCAG Contrast |
|-------|-----|-------|---------------|
| `primary.500` | #4A5F9D | Buttons, links, primary actions | 6.8:1 (AA) |
| `primary.900` | #161C4F | Headers, dark backgrounds | 13.5:1 (AAA) |
| `secondary.500` | #D4AF37 | Accents, achievements | 8.2:1 on navy.900 (AAA) |

#### Semantic Colors

```tsx
// Success - Green
<Badge colorPalette="success">Saved</Badge>

// Warning - Amber
<Alert status="warning">Budget warning</Alert>

// Error - Red
<Button colorPalette="error">Delete</Button>

// Info - Blue
<Alert status="info">New feature</Alert>
```

**Full Color Reference:** See [UI_DESIGN_TOKENS.md](UI_REDESIGN/UI_DESIGN_TOKENS.md) for complete color palettes and usage guidelines.

### Typography

#### Font Families

- **Headings:** Inter (modern, geometric, authoritative)
- **Body:** Roboto (clean, readable, screen-optimized)
- **Monospace:** Roboto Mono (code, technical data)

#### Type Scale

```tsx
// Heading sizes
<Heading size="4xl">Hero (36px)</Heading>        // H1
<Heading size="3xl">Page Title (30px)</Heading>  // H2
<Heading size="2xl">Section (24px)</Heading>     // H3
<Heading size="xl">Subsection (20px)</Heading>   // H4

// Body text
<Text fontSize="lg">Large (18px)</Text>
<Text fontSize="md">Base (16px)</Text>           // Default
<Text fontSize="sm">Small (14px)</Text>
<Text fontSize="xs">Caption (12px)</Text>
```

#### Responsive Typography

```tsx
// Mobile → Desktop responsive sizing
<Heading 
  size={{ base: '2xl', md: '3xl', lg: '4xl' }}
  mb={{ base: 4, md: 6 }}
>
  Responsive Heading
</Heading>
```

**Full Typography Guide:** See [UI_TYPOGRAPHY_GUIDE.md](UI_REDESIGN/UI_TYPOGRAPHY_GUIDE.md) for complete specifications.

### Spacing & Layout

#### Spacing Scale (4px base unit)

```tsx
// Common spacing values
p={2}   // 8px - Compact
p={4}   // 16px - Default ⭐
p={6}   // 24px - Comfortable
p={8}   // 32px - Spacious
p={12}  // 48px - Section gaps
```

#### Layout Components

```tsx
// Container (max-width wrapper)
<Container maxW="container.xl" px={4} py={8}>
  <VStack align="stretch" spacing={6}>
    <Heading>Content</Heading>
  </VStack>
</Container>

// Stack (flexible spacing)
<VStack spacing={4} align="start">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
</VStack>

// Grid (responsive columns)
<SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
  <AthleteCard />
  <AthleteCard />
  <AthleteCard />
</SimpleGrid>
```

**Full Layout Guide:** See [UI_LAYOUT_PRIMITIVES.md](UI_REDESIGN/UI_LAYOUT_PRIMITIVES.md) for layout patterns.

### Icons

#### Icon Library

The project uses **Heroicons** (@heroicons/react) for all icon needs.

```bash
# Already installed
npm install @heroicons/react
```

#### Basic Usage

```tsx
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// In a button
<Button display="flex" gap={2}>
  <PlusIcon style={{ width: '20px', height: '20px' }} />
  <span>Add Athlete</span>
</Button>

// Icon button
<IconButton aria-label="Edit">
  <PencilIcon style={{ width: '20px', height: '20px' }} />
</IconButton>
```

#### Icon Variants

| Variant | Import Path | Usage |
|---------|-------------|-------|
| **Outline** | `@heroicons/react/24/outline` | Primary UI elements (recommended) |
| **Solid** | `@heroicons/react/24/solid` | Emphasis, filled states |
| **Mini** | `@heroicons/react/20/solid` | Compact layouts (20px) |

#### Sizing Guidelines

| Size | Use Case | Examples |
|------|----------|----------|
| 16px | Inline text, dense tables | Table actions, status indicators |
| 20px | Standard UI | Buttons, form inputs, cards |
| 24px | Emphasized actions | Navigation, headers, CTAs |
| 32px+ | Hero sections | Landing pages, empty states |

**Complete Icon Guide:** See [Icon System section in CORE_DESIGN_GUIDELINES.md](CORE_DESIGN_GUIDELINES.md#icon-system) for detailed patterns and best practices.

### Shadows & Elevation

```tsx
// Card elevation
<Card variant="elevated">Content</Card>  // shadow="md"

// Hover states
<Box 
  shadow="sm" 
  _hover={{ shadow: 'lg' }}
  transition="all 0.2s"
>
  Interactive card
</Box>
```

### Transitions

```tsx
// Standard transitions
<Button 
  transition="all 0.2s ease-out"
  _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
>
  Hover me
</Button>
```

---

## Component Library

### Button Components

#### Primary Button

```tsx
<Button colorPalette="primary" size="lg">
  Create Team
</Button>
```

#### Secondary Button

```tsx
<Button variant="outline" colorPalette="primary">
  View Details
</Button>
```

#### Gold Accent Button

```tsx
<Button bg="gold.500" color="navy.900" _hover={{ bg: 'gold.600' }}>
  Upgrade to Pro
</Button>
```

#### Icon Button

```tsx
import { CloseIcon } from '@chakra-ui/icons';

<IconButton 
  icon={<CloseIcon />} 
  aria-label="Close"
  variant="ghost"
/>
```

### Form Components

#### Text Input

```tsx
<FormControl>
  <FormLabel>Team Name</FormLabel>
  <Input 
    placeholder="Enter your team name"
    focusBorderColor="primary.500"
  />
  <FormHelperText>Choose a unique name</FormHelperText>
</FormControl>
```

#### Select Dropdown

```tsx
<FormControl>
  <FormLabel>Race</FormLabel>
  <Select placeholder="Select race">
    <option value="nyc">New York City Marathon</option>
    <option value="boston">Boston Marathon</option>
    <option value="chicago">Chicago Marathon</option>
  </Select>
</FormControl>
```

#### Checkbox Group

```tsx
<CheckboxGroup>
  <VStack align="start" spacing={2}>
    <Checkbox value="men" colorPalette="primary">Men</Checkbox>
    <Checkbox value="women" colorPalette="primary">Women</Checkbox>
  </VStack>
</CheckboxGroup>
```

### Card Components

#### Basic Card

```tsx
<Card variant="elevated" borderRadius="lg">
  <CardHeader>
    <Heading size="md">Team Statistics</Heading>
  </CardHeader>
  <CardBody>
    <Text>Your content here</Text>
  </CardBody>
</Card>
```

#### Interactive Card

```tsx
<Card 
  variant="outline"
  _hover={{ shadow: 'lg', borderColor: 'primary.300' }}
  cursor="pointer"
  onClick={handleClick}
  transition="all 0.2s"
>
  <CardBody>Clickable content</CardBody>
</Card>
```

### Modal Components

#### Standard Modal

```tsx
<Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
  <ModalOverlay bg="blackAlpha.600" />
  <ModalContent>
    <ModalHeader bg="primary.900" color="white">
      Modal Title
    </ModalHeader>
    <ModalCloseButton color="white" />
    <ModalBody py={6}>
      Modal content
    </ModalBody>
    <ModalFooter>
      <Button variant="ghost" mr={3} onClick={onClose}>
        Cancel
      </Button>
      <Button colorPalette="primary">Save</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

#### Mobile-Responsive Modal

```tsx
<Modal 
  isOpen={isOpen} 
  onClose={onClose}
  size={{ base: 'full', md: 'xl' }}
  scrollBehavior="inside"
>
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>Select Athlete</ModalHeader>
    <ModalBody>Scrollable content</ModalBody>
  </ModalContent>
</Modal>
```

### Data Display

#### Badge

```tsx
<Badge colorPalette="primary" variant="solid">KEN</Badge>
<Badge colorPalette="success" variant="subtle">Active</Badge>
<Badge colorPalette="gold" variant="solid">#1</Badge>
```

#### Avatar

```tsx
<Avatar 
  name="Eliud Kipchoge"
  src={photoUrl}
  size="lg"
  bg="primary.500"
  color="white"
/>
```

#### Stats Display

```tsx
<Stat>
  <StatLabel>Total Points</StatLabel>
  <StatNumber>847</StatNumber>
  <StatHelpText>
    <StatArrow type="increase" />
    23.5%
  </StatHelpText>
</Stat>
```

### Loading States

#### Skeleton Loader

```tsx
<VStack spacing={4} align="stretch">
  <Skeleton height="60px" borderRadius="md" />
  <Skeleton height="200px" borderRadius="md" />
  <Skeleton height="40px" borderRadius="md" width="50%" />
</VStack>
```

#### Spinner

```tsx
<Center h="100vh">
  <Spinner 
    size="xl" 
    color="primary.500" 
    thickness="4px" 
  />
</Center>
```

#### Progress Bar

```tsx
<Progress 
  value={75} 
  colorPalette="primary"
  size="lg"
  borderRadius="full"
  hasStripe
  isAnimated
/>
```

### Notification Patterns

#### Toast

```tsx
import { useToast } from '@chakra-ui/react';

const toast = useToast();

// Success toast
toast({
  title: 'Team saved',
  description: 'Your roster has been saved successfully',
  status: 'success',
  duration: 5000,
  isClosable: true,
  position: 'top-right',
});

// Error toast
toast({
  title: 'Error',
  description: 'Failed to save roster',
  status: 'error',
  duration: 7000,
  isClosable: true,
});
```

**Complete Component Patterns:** See [/components/chakra/README.md](../components/chakra/README.md) for detailed patterns and examples.

---

## Migration Guide

### From Legacy to Chakra UI

#### Step 1: Identify Legacy Component

Find existing vanilla JS/CSS component:

```html
<!-- Legacy HTML -->
<div class="button button-primary" onclick="handleClick()">
  Create Team
</div>
```

```css
/* Legacy CSS */
.button {
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
}
.button-primary {
  background-color: #ff6900;
  color: white;
}
```

#### Step 2: Convert to Chakra Component

```tsx
// Chakra UI
<Button 
  colorPalette="primary" 
  size="lg"
  onClick={handleClick}
>
  Create Team
</Button>
```

#### Step 3: Test & Verify

- ✅ Visual appearance matches design
- ✅ Interactive states work (hover, active, focus)
- ✅ Responsive on mobile and desktop
- ✅ Keyboard accessible
- ✅ Screen reader compatible

### Common Migration Patterns

#### Buttons

```tsx
// Before (vanilla CSS)
<button class="btn btn-primary">Click</button>

// After (Chakra)
<Button colorPalette="primary">Click</Button>
```

#### Cards

```tsx
// Before
<div class="card">
  <h3 class="card-title">Title</h3>
  <p class="card-body">Content</p>
</div>

// After
<Card>
  <CardHeader>
    <Heading size="md">Title</Heading>
  </CardHeader>
  <CardBody>
    <Text>Content</Text>
  </CardBody>
</Card>
```

#### Forms

```tsx
// Before
<div class="form-group">
  <label for="name">Name</label>
  <input type="text" id="name" class="form-control" />
</div>

// After
<FormControl>
  <FormLabel>Name</FormLabel>
  <Input type="text" />
</FormControl>
```

#### Modals

```tsx
// Before (vanilla JS)
function openModal() {
  document.getElementById('modal').style.display = 'block';
}

// After (Chakra with hooks)
const { isOpen, onOpen, onClose } = useDisclosure();

<Modal isOpen={isOpen} onClose={onClose}>
  <ModalContent>
    {/* content */}
  </ModalContent>
</Modal>
```

### Migration Best Practices

1. **Start Small** - Migrate one component type at a time
2. **Use Feature Flags** - Toggle between old and new components
3. **Test Thoroughly** - Verify all interactions and responsive behavior
4. **Update Tests** - Ensure tests work with new component structure
5. **Remove Legacy Code** - Clean up after successful migration

**Detailed Migration Guide:** See [UI_PHASE2_COMPONENT_MAPPING.md](UI_REDESIGN/UI_PHASE2_COMPONENT_MAPPING.md) for complete component mappings.

---

## WCAG AA Compliance

The design system is built with **WCAG 2.1 Level AA compliance** as a baseline requirement. All components and color combinations are tested for accessibility.

### Color Contrast Requirements

#### WCAG 2.1 Level AA Standards

- **Normal Text (< 18px):** Minimum 4.5:1 contrast ratio
- **Large Text (≥ 18px or ≥ 14px bold):** Minimum 3:1 contrast ratio
- **UI Components:** Minimum 3:1 contrast ratio against adjacent colors
- **Focus Indicators:** Clearly visible on all interactive elements

### Validated Color Combinations

All primary color combinations meet or exceed WCAG AA standards:

| Foreground | Background | Contrast | Level | Usage |
|------------|-----------|----------|-------|-------|
| Navy 900 | White | 13.5:1 | AAA | Headers, body text |
| Navy 700 | White | 9.8:1 | AAA | Subheadings |
| Navy 500 | White | 6.8:1 | AAA | Links, buttons |
| Gold 500 | Navy 900 | 8.2:1 | AAA | Accent on dark |
| White | Primary 500 | 6.8:1 | AAA | Button text |
| White | Success 500 | 4.9:1 | AA | Success states |
| White | Error 500 | 5.7:1 | AA | Error states |

### Keyboard Navigation

All interactive components are keyboard accessible:

- **Tab** - Navigate between interactive elements
- **Shift + Tab** - Navigate backwards
- **Enter/Space** - Activate buttons, checkboxes
- **Escape** - Close modals, dropdowns
- **Arrow Keys** - Navigate within menus, select options

### Screen Reader Support

Components use semantic HTML and ARIA labels:

```tsx
// Proper semantic structure
<Button aria-label="Close modal">
  <CloseIcon />
</Button>

// Form field associations
<FormControl>
  <FormLabel htmlFor="team-name">Team Name</FormLabel>
  <Input id="team-name" />
  <FormHelperText>Descriptive help text</FormHelperText>
</FormControl>
```

### Focus Indicators

All interactive elements have visible focus states:

```tsx
<Button 
  _focus={{
    outline: '2px solid',
    outlineColor: 'primary.500',
    outlineOffset: '2px',
  }}
>
  Accessible Button
</Button>
```

### Accessibility Testing Checklist

Before releasing any component:

- [ ] Color contrast meets WCAG AA (minimum 4.5:1 for text)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators are visible
- [ ] Screen reader announces content correctly
- [ ] Touch targets are at least 44x44px
- [ ] Interactive states are clear (hover, active, disabled)
- [ ] Error messages are descriptive and helpful
- [ ] Forms use proper labels and associations

**Complete Validation Report:** See [UI_COLOR_CONTRAST_VALIDATION.md](UI_REDESIGN/UI_COLOR_CONTRAST_VALIDATION.md) for detailed testing methodology and results.

---

## Resources & References

### Design System Documentation

#### Core Guides
- **[CORE_DESIGN_GUIDELINES.md](CORE_DESIGN_GUIDELINES.md)** - Aspirational design specifications
- **[UI_REDESIGN_ROADMAP.md](UI_REDESIGN_ROADMAP.md)** - 40-week Chakra UI migration plan

#### Design Tokens
- **[UI_DESIGN_TOKENS.md](UI_REDESIGN/UI_DESIGN_TOKENS.md)** - Complete token reference (colors, spacing, shadows, etc.)
- **[UI_TYPOGRAPHY_GUIDE.md](UI_REDESIGN/UI_TYPOGRAPHY_GUIDE.md)** - Typography specifications and usage
- **[UI_LAYOUT_PRIMITIVES.md](UI_REDESIGN/UI_LAYOUT_PRIMITIVES.md)** - Layout patterns and grid system

#### Component Documentation
- **[/components/chakra/README.md](../components/chakra/README.md)** - Component patterns and best practices
- **[UI_PHASE2_COMPONENT_MAPPING.md](UI_REDESIGN/UI_PHASE2_COMPONENT_MAPPING.md)** - Legacy to Chakra mapping

#### Accessibility
- **[UI_COLOR_CONTRAST_VALIDATION.md](UI_REDESIGN/UI_COLOR_CONTRAST_VALIDATION.md)** - WCAG 2.1 AA/AAA validation report

#### Navigation
- **[UI_PHASE2_NAVIGATION_SPEC.md](UI_REDESIGN/UI_PHASE2_NAVIGATION_SPEC.md)** - Navigation system specifications

### External Resources

#### Chakra UI
- [Chakra UI Documentation](https://chakra-ui.com/docs)
- [Component Library](https://chakra-ui.com/docs/components)
- [Styling Props](https://chakra-ui.com/docs/styled-system/style-props)
- [Theme Customization](https://chakra-ui.com/docs/styled-system/customize-theme)

#### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [A11y Project](https://www.a11yproject.com/)

#### Design
- [Material Design System](https://m3.material.io/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Inclusive Components](https://inclusive-components.design/)

### GitHub Issues

- **[#59 - Redesign UI](https://github.com/jessephus/marathon-majors-league/issues/59)** - Grand-parent issue
- **[#121 - Phase 2: Design System & Tokens](https://github.com/jessephus/marathon-majors-league/issues/121)** - Parent issue
- **[#122 - Phase 2: Documentation & Examples](https://github.com/jessephus/marathon-majors-league/issues/122)** - This issue

---

## Contributing

### Adding New Components

When creating new Chakra UI components:

1. **Follow patterns** in `/components/chakra/README.md`
2. **Use theme tokens** instead of hard-coded values
3. **Test accessibility** (keyboard nav, screen readers, contrast)
4. **Document usage** with code examples
5. **Add to this guide** under Component Library section

### Updating Documentation

When modifying the design system:

1. **Update theme tokens** in `/theme/`
2. **Update component patterns** in `/components/chakra/README.md`
3. **Update this guide** with new examples
4. **Test across breakpoints** (320px, 768px, 1024px+)
5. **Verify WCAG compliance** with contrast checker

### Getting Help

- Review existing documentation first
- Check `/components/chakra/README.md` for patterns
- Consult [UI_REDESIGN_ROADMAP.md](UI_REDESIGN_ROADMAP.md) for migration strategy
- Open GitHub issue for questions or suggestions

---

**Last Updated:** November 22, 2025  
**Maintainer:** Project Contributors  
**Version:** 1.0  
**Status:** 🟢 Active Development
