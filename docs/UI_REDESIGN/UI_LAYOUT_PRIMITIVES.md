# Layout Primitives Guide - Marathon Majors Fantasy League

**Document Version:** 1.0  
**Last Updated:** November 22, 2025  
**Purpose:** Complete guide to Chakra UI layout primitives and responsive patterns  
**Status:** 🟢 Phase 2 Complete  
**Related:** [UI_DESIGN_TOKENS.md](./UI_DESIGN_TOKENS.md) | [UI_REDESIGN_ROADMAP.md](./UI_REDESIGN_ROADMAP.md)

---

## Table of Contents

1. [Overview](#overview)
2. [Container Component](#container-component)
3. [Stack Components](#stack-components)
4. [Grid Components](#grid-components)
5. [Flex Component](#flex-component)
6. [Box Component](#box-component)
7. [Responsive Layout Patterns](#responsive-layout-patterns)
8. [Common Layout Recipes](#common-layout-recipes)
9. [Spacing Conventions](#spacing-conventions)
10. [Best Practices](#best-practices)

---

## Overview

Layout primitives are the foundational building blocks for creating consistent, responsive layouts in the Marathon Majors Fantasy League application. All primitives use the design tokens defined in `/theme/index.ts`.

### Core Principles

1. **Mobile-First:** Start with mobile layout, progressively enhance for larger screens
2. **Consistent Spacing:** Use 4px-based spacing scale (tokens: 4, 6, 8, 12, etc.)
3. **Semantic Structure:** Choose the right primitive for the job
4. **Responsive by Default:** Every layout should adapt gracefully across breakpoints

### Available Primitives

| Primitive | Purpose | When to Use |
|-----------|---------|-------------|
| `Container` | Max-width content wrapper | Page-level content, centering |
| `Stack` / `VStack` / `HStack` | Vertical/horizontal spacing | Lists, button groups, form fields |
| `Grid` / `SimpleGrid` | Grid layouts | Card grids, data tables, galleries |
| `Flex` | Flexible box layout | Complex alignments, navigation |
| `Box` | Generic container | Custom layouts, one-off components |

---

## Container Component

The `Container` component provides consistent max-width constraints and horizontal padding for page content.

### Basic Usage

```tsx
import { Container } from '@chakra-ui/react';

function Page() {
  return (
    <Container maxW="container.xl" px={4} py={8}>
      {/* Content stays within 1280px max-width and is centered */}
      <Heading>Page Title</Heading>
      <Text>Page content...</Text>
    </Container>
  );
}
```

### Container Sizes

```tsx
// Small container (640px) - Narrow content like articles
<Container maxW="container.sm" px={4}>
  <Text>Narrow centered content</Text>
</Container>

// Medium container (768px) - Forms, settings pages
<Container maxW="container.md" px={4}>
  <Form />
</Container>

// Large container (1024px) - Standard content pages
<Container maxW="container.lg" px={4}>
  <Content />
</Container>

// Extra Large container (1280px) - Dashboard, data-heavy pages ⭐ DEFAULT
<Container maxW="container.xl" px={4}>
  <Dashboard />
</Container>

// 2XL container (1536px) - Wide layouts, large screens
<Container maxW="container.2xl" px={4}>
  <WideLayout />
</Container>
```

### Responsive Padding

```tsx
// Adaptive padding: 16px mobile → 24px tablet → 32px desktop
<Container 
  maxW="container.xl" 
  px={{ base: 4, md: 6, lg: 8 }}
  py={{ base: 8, md: 12 }}
>
  <Content />
</Container>
```

### Full-Width Sections

```tsx
// Combine full-width section with constrained content
function Hero() {
  return (
    <Box bg="navy.900" color="white" py={16}>
      {/* Full-width background */}
      <Container maxW="container.xl" px={4}>
        {/* Constrained content */}
        <Heading size="2xl">Welcome to MMFL</Heading>
        <Text>Your championship journey starts here</Text>
      </Container>
    </Box>
  );
}
```

### Container Best Practices

✅ **Do:**
- Use `container.xl` (1280px) as default for MMFL pages
- Add horizontal padding to prevent edge-touching: `px={4}` minimum
- Center containers for balanced visual weight
- Nest containers when you need different max-widths in sections

❌ **Don't:**
- Use containers inside containers (causes unnecessary nesting)
- Forget horizontal padding (content will touch screen edges)
- Mix pixel values with container tokens
- Use containers for component-level layout (use Box/Stack instead)

---

## Stack Components

Stack components handle vertical or horizontal spacing between children with consistent gaps.

### VStack (Vertical Stack)

```tsx
import { VStack, Heading, Text, Button } from '@chakra-ui/react';

// Basic vertical stack with 16px gaps
<VStack spacing={4} align="stretch">
  <Heading>Section Title</Heading>
  <Text>Description text</Text>
  <Button>Action</Button>
</VStack>

// Compact spacing (8px gaps)
<VStack spacing={2} align="stretch">
  <Text fontSize="sm">Item 1</Text>
  <Text fontSize="sm">Item 2</Text>
  <Text fontSize="sm">Item 3</Text>
</VStack>

// Large spacing (24px gaps)
<VStack spacing={6} align="stretch">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</VStack>
```

### HStack (Horizontal Stack)

```tsx
import { HStack, Button, IconButton } from '@chakra-ui/react';

// Button group with 12px gaps
<HStack spacing={3}>
  <Button colorScheme="primary">Save</Button>
  <Button variant="outline">Cancel</Button>
</HStack>

// Icon toolbar with 8px gaps
<HStack spacing={2}>
  <IconButton icon={<EditIcon />} aria-label="Edit" />
  <IconButton icon={<DeleteIcon />} aria-label="Delete" />
  <IconButton icon={<ShareIcon />} aria-label="Share" />
</HStack>

// Navigation links with 24px gaps
<HStack spacing={6}>
  <Link href="/">Home</Link>
  <Link href="/team">Team</Link>
  <Link href="/standings">Standings</Link>
</HStack>
```

### Stack (Responsive Direction)

```tsx
import { Stack } from '@chakra-ui/react';

// Vertical on mobile, horizontal on desktop
<Stack 
  direction={{ base: 'column', md: 'row' }}
  spacing={{ base: 4, md: 6 }}
  justify="space-between"
  align={{ base: 'stretch', md: 'center' }}
>
  <Heading size="lg">Dashboard</Heading>
  <HStack spacing={3}>
    <Button>Create Team</Button>
    <Button variant="outline">Settings</Button>
  </HStack>
</Stack>
```

### Alignment Options

```tsx
// Align items to start (left/top)
<VStack align="start" spacing={4}>
  <Text>Left-aligned items</Text>
  <Button>Button</Button>
</VStack>

// Align items to end (right/bottom)
<VStack align="end" spacing={4}>
  <Text>Right-aligned items</Text>
  <Button>Button</Button>
</VStack>

// Align items to center
<VStack align="center" spacing={4}>
  <Heading>Centered heading</Heading>
  <Button>Centered button</Button>
</VStack>

// Stretch items to full width
<VStack align="stretch" spacing={4}>
  <Input placeholder="Full width" />
  <Button w="full">Full width button</Button>
</VStack>
```

### Stack Spacing Scale

| Spacing | Token | Gap | Use Case |
|---------|-------|-----|----------|
| `spacing={1}` | 4px | Tiny | Tight lists, dense data |
| `spacing={2}` | 8px | Compact | Form labels, metadata |
| `spacing={3}` | 12px | Small | Button groups, chips |
| `spacing={4}` | 16px | Base | **Default - Cards, sections** ⭐ |
| `spacing={6}` | 24px | Large | Major sections, cards |
| `spacing={8}` | 32px | Extra Large | Page sections |
| `spacing={12}` | 48px | Huge | Major page divisions |

### Stack Best Practices

✅ **Do:**
- Use `spacing={4}` (16px) as default for most lists
- Use `align="stretch"` for full-width form fields
- Combine Stack with Container for page layouts
- Use responsive spacing: `spacing={{ base: 4, md: 6 }}`

❌ **Don't:**
- Use margin on Stack children (spacing handles it)
- Nest VStack inside VStack without purpose
- Use Stack for complex grid layouts (use Grid instead)
- Forget to set `align` prop (defaults may not match intent)

---

## Grid Components

Grid components create multi-column layouts with consistent gaps.

### SimpleGrid (Auto-responsive Grid)

```tsx
import { SimpleGrid, Box } from '@chakra-ui/react';

// Auto-responsive: 1 col mobile → 2 cols tablet → 3 cols desktop
<SimpleGrid 
  columns={{ base: 1, md: 2, lg: 3 }}
  spacing={6}
>
  <AthleteCard />
  <AthleteCard />
  <AthleteCard />
  <AthleteCard />
  <AthleteCard />
  <AthleteCard />
</SimpleGrid>

// 4-column grid for athlete browser
<SimpleGrid 
  columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
  spacing={{ base: 4, md: 6 }}
>
  {athletes.map(athlete => (
    <AthleteCard key={athlete.id} athlete={athlete} />
  ))}
</SimpleGrid>

// Compact 2-column grid for sidebar
<SimpleGrid columns={2} spacing={3}>
  <Stat label="Points" value={847} />
  <Stat label="Rank" value="#2" />
  <Stat label="Budget" value="$29.5K" />
  <Stat label="Athletes" value="6" />
</SimpleGrid>
```

### Grid (Custom Column Layout)

```tsx
import { Grid, GridItem } from '@chakra-ui/react';

// 2/3 - 1/3 split layout (sidebar)
<Grid 
  templateColumns="2fr 1fr" 
  gap={6}
>
  <GridItem>
    <MainContent />
  </GridItem>
  <GridItem>
    <Sidebar />
  </GridItem>
</Grid>

// 12-column grid system
<Grid 
  templateColumns="repeat(12, 1fr)" 
  gap={6}
>
  <GridItem colSpan={{ base: 12, md: 8 }}>
    <Article />
  </GridItem>
  <GridItem colSpan={{ base: 12, md: 4 }}>
    <RelatedLinks />
  </GridItem>
</Grid>

// Dashboard grid with mixed sizes
<Grid 
  templateColumns="repeat(auto-fit, minmax(250px, 1fr))"
  gap={6}
>
  <GridItem colSpan={2}>
    <HeroCard />
  </GridItem>
  <GridItem>
    <SmallCard />
  </GridItem>
  <GridItem>
    <SmallCard />
  </GridItem>
  <GridItem>
    <SmallCard />
  </GridItem>
</Grid>
```

### Grid Spacing Patterns

```tsx
// Compact grid (8px gaps)
<SimpleGrid columns={3} spacing={2}>
  <Box>Item</Box>
</SimpleGrid>

// Standard grid (16px gaps) ⭐ DEFAULT
<SimpleGrid columns={3} spacing={4}>
  <Box>Item</Box>
</SimpleGrid>

// Comfortable grid (24px gaps)
<SimpleGrid columns={3} spacing={6}>
  <Box>Item</Box>
</SimpleGrid>

// Responsive gaps: 16px mobile → 24px desktop
<SimpleGrid 
  columns={{ base: 1, md: 3 }}
  spacing={{ base: 4, md: 6 }}
>
  <Box>Item</Box>
</SimpleGrid>

// Different row and column gaps
<Grid 
  templateColumns="repeat(3, 1fr)"
  columnGap={4}
  rowGap={8}
>
  <Box>Item</Box>
</Grid>
```

### Grid Best Practices

✅ **Do:**
- Use `SimpleGrid` for equal-width columns (athlete grids, card galleries)
- Use `Grid` for custom layouts (dashboard, sidebars)
- Set responsive columns: `columns={{ base: 1, md: 2, lg: 3 }}`
- Use `spacing={6}` (24px) for card grids
- Use `minmax(250px, 1fr)` for auto-responsive grids

❌ **Don't:**
- Use Grid for simple lists (use VStack instead)
- Forget mobile: always set `base` column count
- Use hard-coded pixel widths (breaks responsiveness)
- Mix Grid with float or position CSS (conflicts)

---

## Flex Component

Flex component provides flexible box layout with powerful alignment options.

### Basic Flexbox

```tsx
import { Flex, Box } from '@chakra-ui/react';

// Horizontal layout with space-between
<Flex justify="space-between" align="center" p={4}>
  <Heading size="md">Dashboard</Heading>
  <Button>Settings</Button>
</Flex>

// Vertical layout (column)
<Flex direction="column" gap={4} p={6}>
  <Heading>Section Title</Heading>
  <Text>Content</Text>
  <Button>Action</Button>
</Flex>

// Centered content
<Flex 
  justify="center" 
  align="center" 
  minH="100vh"
>
  <Box textAlign="center">
    <Heading>Loading...</Heading>
  </Box>
</Flex>
```

### Justify and Align Options

```tsx
// Space between items (push to edges)
<Flex justify="space-between">
  <Box>Left</Box>
  <Box>Right</Box>
</Flex>

// Space around items (equal spacing)
<Flex justify="space-around">
  <Box>Item 1</Box>
  <Box>Item 2</Box>
  <Box>Item 3</Box>
</Flex>

// Center items horizontally
<Flex justify="center">
  <Box>Centered</Box>
</Flex>

// Align items to top
<Flex align="start">
  <Box h="100px">Tall</Box>
  <Box h="50px">Short</Box>
</Flex>

// Align items to bottom
<Flex align="end">
  <Box h="100px">Tall</Box>
  <Box h="50px">Short</Box>
</Flex>

// Stretch items vertically
<Flex align="stretch">
  <Box>Stretches to match</Box>
  <Box h="200px">Tallest item</Box>
</Flex>
```

### Flex Wrap and Gap

```tsx
// Wrap items to next line
<Flex wrap="wrap" gap={4}>
  <Box>Item 1</Box>
  <Box>Item 2</Box>
  <Box>Item 3</Box>
  <Box>Item 4</Box>
  <Box>Item 5</Box>
</Flex>

// Tag cloud with wrapping
<Flex wrap="wrap" gap={2}>
  {tags.map(tag => (
    <Badge key={tag}>{tag}</Badge>
  ))}
</Flex>

// Responsive gap
<Flex gap={{ base: 3, md: 4, lg: 6 }}>
  <Box>Item</Box>
</Flex>
```

### Flex Item Control

```tsx
// Flex-grow: expand to fill space
<Flex gap={4}>
  <Box flex="1">Grows to fill space</Box>
  <Box>Fixed width</Box>
</Flex>

// Flex-shrink: prevent shrinking
<Flex gap={4}>
  <Box flexShrink={0} w="200px">Fixed 200px</Box>
  <Box flex="1">Fills remaining space</Box>
</Flex>

// Flex-basis: starting width
<Flex gap={4}>
  <Box flexBasis="200px" flexGrow={1}>Min 200px, can grow</Box>
  <Box flexBasis="300px" flexGrow={1}>Min 300px, can grow</Box>
</Flex>
```

### Common Flex Layouts

#### Header with Logo and Actions

```tsx
<Flex 
  as="header"
  justify="space-between" 
  align="center"
  px={4} 
  py={3}
  bg="navy.900"
  color="white"
>
  <HStack spacing={3}>
    <Image src="/logo.svg" h="32px" />
    <Heading size="md">MMFL</Heading>
  </HStack>
  
  <HStack spacing={4}>
    <Link>Help</Link>
    <Button size="sm">Logout</Button>
  </HStack>
</Flex>
```

#### Card with Footer Actions

```tsx
<Flex direction="column" h="full">
  {/* Content grows */}
  <Box flex="1" p={6}>
    <Heading size="md" mb={3}>Card Title</Heading>
    <Text>Card content goes here...</Text>
  </Box>
  
  {/* Footer pinned to bottom */}
  <Flex 
    justify="space-between" 
    align="center"
    p={4}
    borderTop="1px solid"
    borderColor="gray.200"
  >
    <Text fontSize="sm" color="gray.600">Last updated 2h ago</Text>
    <Button size="sm">Edit</Button>
  </Flex>
</Flex>
```

#### Sidebar Layout

```tsx
<Flex minH="100vh">
  {/* Fixed width sidebar */}
  <Box 
    w="250px" 
    bg="navy.900" 
    color="white"
    p={4}
  >
    <VStack align="stretch" spacing={2}>
      <Link>Dashboard</Link>
      <Link>Teams</Link>
      <Link>Athletes</Link>
    </VStack>
  </Box>
  
  {/* Main content area (grows) */}
  <Box flex="1" bg="gray.50" p={6}>
    <Container maxW="container.xl">
      <Heading>Main Content</Heading>
    </Container>
  </Box>
</Flex>
```

### Flex Best Practices

✅ **Do:**
- Use Flex for header/footer layouts with left/right items
- Use `justify="space-between"` for push-apart layouts
- Use `flex="1"` to make items grow and fill space
- Combine Flex with gap for consistent spacing
- Use responsive direction: `direction={{ base: 'column', md: 'row' }}`

❌ **Don't:**
- Use Flex for simple vertical lists (use VStack)
- Use Flex for equal-width columns (use Grid)
- Forget to set `align` when items have different heights
- Use `flex` without understanding flex-grow/shrink/basis

---

## Box Component

The most primitive layout component - a div with style props.

### Basic Box Usage

```tsx
import { Box } from '@chakra-ui/react';

// Simple container
<Box p={4} bg="white" borderRadius="lg">
  Content
</Box>

// Card with shadow
<Box 
  p={6}
  bg="white"
  borderRadius="lg"
  border="1px solid"
  borderColor="gray.200"
  shadow="sm"
>
  <Heading size="md" mb={3}>Card Title</Heading>
  <Text>Card content</Text>
</Box>

// Hero section
<Box 
  bg="navy.900" 
  color="white" 
  py={16} 
  textAlign="center"
>
  <Heading size="2xl" mb={4}>Welcome to MMFL</Heading>
  <Text fontSize="lg">Your championship journey starts here</Text>
</Box>
```

### Box as Semantic HTML

```tsx
// Section
<Box as="section" py={12}>
  <Container maxW="container.xl">
    <Heading>Section Title</Heading>
  </Container>
</Box>

// Article
<Box as="article" p={6} bg="white" borderRadius="lg">
  <Heading as="h2" size="lg" mb={4}>Article Title</Heading>
  <Text>Article content...</Text>
</Box>

// Nav
<Box as="nav" bg="navy.900" color="white">
  <Container maxW="container.xl" py={4}>
    <HStack spacing={6}>
      <Link>Home</Link>
      <Link>Team</Link>
      <Link>Standings</Link>
    </HStack>
  </Container>
</Box>
```

### Box for Custom Layouts

```tsx
// Overlapping elements with position
<Box position="relative" h="300px">
  <Image src="/hero.jpg" w="full" h="full" objectFit="cover" />
  
  <Box 
    position="absolute"
    bottom={0}
    left={0}
    right={0}
    bg="rgba(0,0,0,0.6)"
    color="white"
    p={6}
  >
    <Heading size="lg">Overlay Text</Heading>
  </Box>
</Box>

// Scrollable container
<Box 
  maxH="400px" 
  overflowY="auto"
  border="1px solid"
  borderColor="gray.200"
  borderRadius="md"
>
  <VStack align="stretch" spacing={0}>
    {items.map(item => (
      <Box key={item.id} p={3} borderBottom="1px solid" borderColor="gray.100">
        {item.name}
      </Box>
    ))}
  </VStack>
</Box>

// Aspect ratio container
<Box 
  position="relative"
  w="full"
  paddingBottom="56.25%" // 16:9 aspect ratio
  bg="gray.200"
  borderRadius="lg"
  overflow="hidden"
>
  <Box 
    position="absolute"
    top={0}
    left={0}
    w="full"
    h="full"
  >
    <Image src="/video-thumbnail.jpg" w="full" h="full" objectFit="cover" />
  </Box>
</Box>
```

### Box Best Practices

✅ **Do:**
- Use Box for one-off custom layouts
- Use `as` prop to set semantic HTML element
- Combine Box with other primitives (Container, Stack, Grid)
- Use Box for positioning (absolute, relative, fixed)

❌ **Don't:**
- Use Box when a semantic component exists (Card, Flex, Grid)
- Create deeply nested Box hierarchies (refactor into components)
- Use Box with inline styles (use Chakra props)

---

## Responsive Layout Patterns

### Pattern 1: Stacked Mobile → Side-by-Side Desktop

```tsx
// Common pattern for content + sidebar
<Stack 
  direction={{ base: 'column', lg: 'row' }}
  spacing={{ base: 6, lg: 8 }}
  align="stretch"
>
  {/* Main content */}
  <Box flex="1">
    <Heading mb={4}>Main Content</Heading>
    <Text>Content goes here...</Text>
  </Box>
  
  {/* Sidebar */}
  <Box 
    w={{ base: 'full', lg: '300px' }}
    flexShrink={0}
  >
    <VStack align="stretch" spacing={4}>
      <Box p={4} bg="white" borderRadius="lg" shadow="sm">
        <Heading size="sm" mb={2}>Quick Stats</Heading>
        <Text>Stats content...</Text>
      </Box>
    </VStack>
  </Box>
</Stack>
```

### Pattern 2: Single Column → Multi-Column Grid

```tsx
// Athlete grid: 1 col mobile → 2 cols tablet → 4 cols desktop
<SimpleGrid 
  columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
  spacing={{ base: 4, md: 6 }}
>
  {athletes.map(athlete => (
    <AthleteCard key={athlete.id} athlete={athlete} />
  ))}
</SimpleGrid>
```

### Pattern 3: Horizontal Scroll → Grid

```tsx
// Mobile: horizontal scroll, Desktop: grid
<Box>
  {/* Mobile: scrollable */}
  <Box 
    display={{ base: 'block', md: 'none' }}
    overflowX="auto"
    pb={4}
  >
    <HStack spacing={4} px={4}>
      {items.map(item => (
        <Box key={item.id} minW="280px" flexShrink={0}>
          <Card item={item} />
        </Box>
      ))}
    </HStack>
  </Box>
  
  {/* Desktop: grid */}
  <SimpleGrid 
    display={{ base: 'none', md: 'grid' }}
    columns={3}
    spacing={6}
  >
    {items.map(item => (
      <Card key={item.id} item={item} />
    ))}
  </SimpleGrid>
</Box>
```

### Pattern 4: Compact Mobile → Spacious Desktop

```tsx
<Container 
  maxW="container.xl"
  px={{ base: 4, md: 6, lg: 8 }}
  py={{ base: 8, md: 12, lg: 16 }}
>
  <VStack 
    align="stretch" 
    spacing={{ base: 4, md: 6, lg: 8 }}
  >
    <Heading 
      size={{ base: 'xl', md: '2xl' }}
      lineHeight="tight"
    >
      Page Title
    </Heading>
    
    <SimpleGrid 
      columns={{ base: 1, md: 2, lg: 3 }}
      spacing={{ base: 4, md: 6 }}
    >
      <Card />
      <Card />
      <Card />
    </SimpleGrid>
  </VStack>
</Container>
```

### Pattern 5: Bottom Toolbar (Mobile) → Top Navigation (Desktop)

```tsx
function Layout() {
  return (
    <>
      {/* Desktop header */}
      <Flex 
        as="header"
        display={{ base: 'none', md: 'flex' }}
        position="sticky"
        top={0}
        zIndex="docked"
        bg="navy.900"
        color="white"
        px={6}
        py={4}
        justify="space-between"
        align="center"
      >
        <Heading size="md">MMFL</Heading>
        <HStack spacing={6}>
          <Link>Home</Link>
          <Link>Team</Link>
          <Link>Standings</Link>
        </HStack>
      </Flex>
      
      {/* Page content */}
      <Box pb={{ base: '64px', md: 0 }}>
        {/* Content */}
      </Box>
      
      {/* Mobile bottom toolbar */}
      <Flex 
        as="nav"
        display={{ base: 'flex', md: 'none' }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex="docked"
        bg="white"
        borderTop="1px solid"
        borderColor="gray.200"
        shadow="lg"
        px={2}
        py={2}
        justify="space-around"
      >
        <VStack spacing={0}>
          <Icon as={HomeIcon} />
          <Text fontSize="xs">Home</Text>
        </VStack>
        {/* More nav items */}
      </Flex>
    </>
  );
}
```

---

## Common Layout Recipes

### Recipe 1: Dashboard Card Grid

```tsx
<Container maxW="container.xl" px={4} py={8}>
  <VStack align="stretch" spacing={6}>
    {/* Header */}
    <Flex justify="space-between" align="center">
      <Heading size="xl">Dashboard</Heading>
      <Button colorScheme="primary">Create Team</Button>
    </Flex>
    
    {/* Stats grid */}
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
      <StatCard label="Teams" value="3" />
      <StatCard label="Points" value="2,451" />
      <StatCard label="Rank" value="#12" />
      <StatCard label="Budget" value="$30K" />
    </SimpleGrid>
    
    {/* Main content grid */}
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
      <TeamCard />
      <TeamCard />
    </SimpleGrid>
  </VStack>
</Container>
```

### Recipe 2: Content with Sidebar

```tsx
<Container maxW="container.xl" px={4} py={8}>
  <Stack 
    direction={{ base: 'column', lg: 'row' }}
    spacing={8}
    align="stretch"
  >
    {/* Main content */}
    <Box flex="1">
      <VStack align="stretch" spacing={6}>
        <Heading size="xl">Race Results</Heading>
        <ResultsTable />
      </VStack>
    </Box>
    
    {/* Sidebar */}
    <Box w={{ base: 'full', lg: '320px' }}>
      <VStack align="stretch" spacing={4}>
        <Box p={4} bg="white" borderRadius="lg" shadow="sm">
          <Heading size="sm" mb={3}>Quick Filter</Heading>
          <VStack align="stretch" spacing={2}>
            <Button size="sm" variant="outline">Men</Button>
            <Button size="sm" variant="outline">Women</Button>
          </VStack>
        </Box>
        
        <Box p={4} bg="white" borderRadius="lg" shadow="sm">
          <Heading size="sm" mb={3}>Top Performers</Heading>
          <VStack align="stretch" spacing={2}>
            {/* Top 5 athletes */}
          </VStack>
        </Box>
      </VStack>
    </Box>
  </Stack>
</Container>
```

### Recipe 3: Form Layout

```tsx
<Container maxW="container.md" px={4} py={8}>
  <Box p={8} bg="white" borderRadius="lg" shadow="md">
    <VStack align="stretch" spacing={6}>
      <Heading size="lg">Create Team</Heading>
      
      {/* Form fields */}
      <VStack align="stretch" spacing={4}>
        <FormControl>
          <FormLabel>Team Name</FormLabel>
          <Input placeholder="Enter team name" />
        </FormControl>
        
        <FormControl>
          <FormLabel>Race</FormLabel>
          <Select placeholder="Select race">
            <option>New York City Marathon</option>
            <option>Chicago Marathon</option>
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea placeholder="Tell us about your team..." />
        </FormControl>
      </VStack>
      
      {/* Actions */}
      <HStack spacing={3} justify="flex-end">
        <Button variant="outline">Cancel</Button>
        <Button colorScheme="primary">Create Team</Button>
      </HStack>
    </VStack>
  </Box>
</Container>
```

### Recipe 4: Athlete Browser Grid

```tsx
<Container maxW="container.xl" px={4} py={8}>
  <VStack align="stretch" spacing={6}>
    {/* Header with filters */}
    <Stack 
      direction={{ base: 'column', md: 'row' }}
      spacing={4}
      justify="space-between"
      align={{ base: 'stretch', md: 'center' }}
    >
      <Heading size="xl">Athletes</Heading>
      
      <HStack spacing={3}>
        <Select w={{ base: 'full', md: '200px' }} placeholder="Gender">
          <option>Men</option>
          <option>Women</option>
        </Select>
        <Select w={{ base: 'full', md: '200px' }} placeholder="Country">
          <option>Kenya</option>
          <option>Ethiopia</option>
        </Select>
      </HStack>
    </Stack>
    
    {/* Athlete grid */}
    <SimpleGrid 
      columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
      spacing={{ base: 4, md: 6 }}
    >
      {athletes.map(athlete => (
        <AthleteCard key={athlete.id} athlete={athlete} />
      ))}
    </SimpleGrid>
  </VStack>
</Container>
```

### Recipe 5: Modal Layout

```tsx
<Modal isOpen={isOpen} onClose={onClose} size="xl">
  <ModalOverlay bg="blackAlpha.600" />
  <ModalContent>
    {/* Header with close button */}
    <ModalHeader 
      bg="navy.900" 
      color="white"
      borderTopRadius="lg"
    >
      <Flex justify="space-between" align="center">
        <Heading size="md">Athlete Details</Heading>
        <ModalCloseButton position="static" color="white" />
      </Flex>
    </ModalHeader>
    
    {/* Body with content */}
    <ModalBody py={6}>
      <VStack align="stretch" spacing={4}>
        <HStack spacing={4}>
          <Avatar size="xl" name="Eliud Kipchoge" />
          <VStack align="start" spacing={1}>
            <Heading size="md">Eliud Kipchoge</Heading>
            <HStack spacing={2}>
              <Badge>KEN</Badge>
              <Text fontSize="sm" color="gray.600">World #1</Text>
            </HStack>
          </VStack>
        </HStack>
        
        <SimpleGrid columns={2} spacing={4}>
          <Stat label="Personal Best" value="2:01:09" />
          <Stat label="Age" value="39" />
          <Stat label="Price" value="$12,500" />
          <Stat label="2024 Races" value="3" />
        </SimpleGrid>
        
        <Box>
          <Heading size="sm" mb={2}>Recent Results</Heading>
          <VStack align="stretch" spacing={2}>
            {/* Result items */}
          </VStack>
        </Box>
      </VStack>
    </ModalBody>
    
    {/* Footer with actions */}
    <ModalFooter>
      <HStack spacing={3}>
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button colorScheme="primary">Add to Team</Button>
      </HStack>
    </ModalFooter>
  </ModalContent>
</Modal>
```

---

## Spacing Conventions

### Spacing Scale (4px Base Unit)

| Token | Value | Use Case |
|-------|-------|----------|
| `0` | 0 | No space |
| `1` | 4px | Tiny gaps, dense lists |
| `2` | 8px | Compact spacing, metadata |
| `3` | 12px | Small spacing, button groups |
| `4` | 16px | **Base unit - Default spacing** ⭐ |
| `5` | 20px | Medium spacing |
| `6` | 24px | Large spacing, card padding |
| `8` | 32px | Extra large, section spacing |
| `10` | 40px | Major section spacing |
| `12` | 48px | Huge spacing, page sections |
| `16` | 64px | Hero spacing |
| `20` | 80px | Extra large page sections |
| `24` | 96px | Maximum spacing |

### Component-Level Spacing

#### Cards
```tsx
// Standard card padding: 24px
<Box p={6} bg="white" borderRadius="lg">
  Content
</Box>

// Compact card padding: 16px
<Box p={4} bg="white" borderRadius="lg">
  Content
</Box>

// Generous card padding: 32px (desktop only)
<Box p={{ base: 6, lg: 8 }} bg="white" borderRadius="lg">
  Content
</Box>
```

#### Sections
```tsx
// Page section: 32px mobile → 48px desktop
<Box py={{ base: 8, md: 12 }}>
  <Container maxW="container.xl" px={4}>
    {/* Content */}
  </Container>
</Box>

// Major section divider: 48px
<Box my={12}>
  {/* Large gap between sections */}
</Box>
```

#### Lists
```tsx
// Compact list: 8px gaps
<VStack spacing={2}>
  <Item />
</VStack>

// Standard list: 16px gaps ⭐ DEFAULT
<VStack spacing={4}>
  <Item />
</VStack>

// Comfortable list: 24px gaps
<VStack spacing={6}>
  <Item />
</VStack>
```

#### Button Groups
```tsx
// Standard button group: 12px gaps
<HStack spacing={3}>
  <Button>Save</Button>
  <Button>Cancel</Button>
</HStack>

// Compact button group: 8px gaps
<HStack spacing={2}>
  <IconButton />
  <IconButton />
</HStack>
```

### Responsive Spacing Patterns

```tsx
// Compact on mobile → spacious on desktop
<VStack spacing={{ base: 4, md: 6, lg: 8 }}>
  <Section />
</VStack>

// Consistent across breakpoints
<HStack spacing={4}>
  <Button />
</HStack>

// Large gaps for major sections
<Box mb={{ base: 8, md: 12, lg: 16 }}>
  <Section />
</Box>
```

---

## Best Practices

### Layout Selection Guide

**Use Container when:**
- ✅ You need max-width constraints on page content
- ✅ You want centered content with horizontal padding
- ✅ You're building a full page layout

**Use Stack (VStack/HStack) when:**
- ✅ You need consistent gaps between items
- ✅ You're building vertical lists or horizontal button groups
- ✅ You want simple, predictable spacing

**Use Grid/SimpleGrid when:**
- ✅ You need multi-column layouts
- ✅ You're displaying cards or data in a grid
- ✅ You want responsive column counts

**Use Flex when:**
- ✅ You need precise control over alignment
- ✅ You're building headers with left/right items
- ✅ You need items to grow/shrink dynamically

**Use Box when:**
- ✅ You need a custom, one-off layout
- ✅ You need absolute/relative positioning
- ✅ No other primitive fits your needs

### Common Mistakes to Avoid

❌ **Nesting Containers**
```tsx
// Bad: Unnecessary nesting
<Container maxW="container.xl">
  <Container maxW="container.md">
    Content
  </Container>
</Container>

// Good: Single container
<Container maxW="container.md" px={4}>
  Content
</Container>
```

❌ **Mixing Spacing Methods**
```tsx
// Bad: Mixing margin with Stack spacing
<VStack spacing={4}>
  <Box mb={4}>Item 1</Box>  {/* Don't add margin */}
  <Box>Item 2</Box>
</VStack>

// Good: Let Stack handle spacing
<VStack spacing={4}>
  <Box>Item 1</Box>
  <Box>Item 2</Box>
</VStack>
```

❌ **Forgetting Responsive Design**
```tsx
// Bad: Fixed layout
<SimpleGrid columns={4} spacing={6}>
  <Card />
</SimpleGrid>

// Good: Responsive columns
<SimpleGrid 
  columns={{ base: 1, md: 2, lg: 4 }}
  spacing={{ base: 4, md: 6 }}
>
  <Card />
</SimpleGrid>
```

❌ **Using Grid for Simple Lists**
```tsx
// Bad: Overkill
<Grid templateColumns="1fr" gap={4}>
  <Box>Item 1</Box>
  <Box>Item 2</Box>
</Grid>

// Good: Use VStack
<VStack align="stretch" spacing={4}>
  <Box>Item 1</Box>
  <Box>Item 2</Box>
</VStack>
```

### Performance Considerations

✅ **Do:**
- Use `SimpleGrid` for equal-width columns (simpler DOM)
- Avoid deeply nested layouts (flatten when possible)
- Use `display` prop to hide/show elements responsively
- Lazy load content below the fold

❌ **Don't:**
- Render two separate components for mobile/desktop (wastes memory)
- Use JavaScript to calculate layouts (CSS is faster)
- Animate layout properties (expensive reflows)

---

## Testing Checklist

When implementing layouts, verify:

- [ ] **Mobile (320px-767px):** Content is readable, no horizontal scroll
- [ ] **Tablet (768px-1023px):** Layout adapts gracefully
- [ ] **Desktop (1024px+):** Full features visible, proper spacing
- [ ] **Spacing:** Consistent 4px-based gaps throughout
- [ ] **Alignment:** Items aligned correctly at all breakpoints
- [ ] **Overflow:** No content cutoff, proper scrolling where needed
- [ ] **Touch targets:** Minimum 44x44px on mobile
- [ ] **Accessibility:** Keyboard navigation works, logical tab order

---

## Additional Resources

- **Design Tokens Reference:** [UI_DESIGN_TOKENS.md](./UI_DESIGN_TOKENS.md)
- **Chakra UI Layout Docs:** https://chakra-ui.com/docs/components/container
- **CSS Grid Guide:** https://css-tricks.com/snippets/css/complete-guide-grid/
- **Flexbox Guide:** https://css-tricks.com/snippets/css/a-guide-to-flexbox/

---

**Document Status:** ✅ Complete (Phase 2)  
**Last Updated:** November 22, 2025  
**Next Steps:** Phase 3 - Implement navigation components using these layout primitives
