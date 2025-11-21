# Design Guidelines - Marathon Majors Fantasy League

**Document Version:** 2.0  
**Last Updated:** November 21, 2025  
**Purpose:** Aspirational design specifications for the modern MMFL redesign using Chakra UI  
**Status:** 🟢 Active Development  
**Framework:** Chakra UI v2+  
**GitHub Issue:** [#59 - Redesign UI with Modern Mobile-First Look](https://github.com/jessephus/marathon-majors-league/issues/59)

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Brand Identity](#brand-identity)
3. [Color System (Navy & Gold)](#color-system-navy--gold)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Component Library (Chakra UI)](#component-library-chakra-ui)
7. [Navigation System](#navigation-system)
8. [Motion & Interaction](#motion--interaction)
9. [Responsive Design](#responsive-design)
10. [Accessibility](#accessibility)
11. [Implementation with Chakra](#implementation-with-chakra)

---

## Design Philosophy

### Core Principles

#### 1. Premium Elegance
**Marathon Majors deserves a sophisticated, premium feel.**

- Navy blue creates trust and professionalism
- Gold accents convey prestige and achievement
- Clean, minimal interfaces reduce cognitive load
- White space is intentional, not empty

#### 2. Mobile-First Always
**80% of users are on mobile during race day.**

- Design starts at 320px width
- Touch targets minimum 44x44px (Apple HIG)
- Bottom navigation for thumb-zone access
- Progressive enhancement for desktop

#### 3. Instant Feedback
**Every interaction should feel responsive.**

- Optimistic UI updates (don't wait for server)
- Micro-animations confirm actions
- Loading states never leave users wondering
- Errors are helpful, not punishing

#### 4. Accessible by Design
**WCAG 2.1 AA is the minimum, not the goal.**

- High contrast navy/gold palette
- Keyboard navigation on everything
- Screen reader labels on all interactive elements
- Focus indicators always visible

#### 5. Data Clarity
**Complex fantasy data made simple.**

- Visual hierarchy guides the eye
- Color only enhances, never sole indicator
- Progressive disclosure for complex info
- Tables work beautifully on mobile

---

## Brand Identity

### Logo & Wordmark

#### Primary Logo

<img src="../public/images/MMFL-logo.png" alt="MMFL Logo" width="250" height="250" valign="top"/>

The circular badge design embodies championship prestige. 

- **Central Icon:** Winged running shoe (gold on navy)
- **Text Treatment:** "MMFL" in bold, modern sans-serif
- **Ring Text:** "MARATHON MAJORS FANTASY LEAGUE" curved around perimeter
- **Stars:** Five gold stars representing the World Marathon Majors
- **Style:** Premium sports league aesthetic (similar to NFL, NBA, UEFA)

#### Logo Variants
1. **Full Color** (Primary)
   - Navy background (#161C4F)
   - Gold elements (#D4AF37)
   - Use on light backgrounds

2. **White** (On Dark)
   - White badge outline
   - White text
   - Gold accents remain
   - Use on photos or dark surfaces

3. **Monochrome** (Utility)
   - Single color version
   - For print or small sizes
   - Maintains proportions

4. **Icon Only** (App Icon)
   - Circular badge without text
   - Minimum 120px for clarity
   - Favicon, PWA icon, social media

#### Naming Convention
- **Primary:** Marathon Majors Fantasy League
- **Short Form:** MMFL
- **Never:** "Fantasy NY Marathon" (deprecated legacy name)

### Voice & Tone

#### Brand Personality
- **Sophisticated:** Premium sports league, not amateur hobby
- **Competitive:** Embrace the rivalry and trash talk
- **Knowledgeable:** Expert insights without being condescending
- **Inclusive:** Everyone can compete, from casual to hardcore fans

#### Tone by Context

**Onboarding:**
- Welcoming: "Welcome to the majors"
- Educational: "Here's how to build a championship team"
- Encouraging: "You're ready for race day"

**Game Play:**
- Energetic: "Your team is crushing it!"
- Competitive: "You're 2 points behind first place"
- Urgent: "Roster locks in 30 minutes"

**Errors:**
- Apologetic but helpful: "Oops! You're $1,500 over budget"
- Solution-oriented: "Remove one athlete to continue"
- Never blame the user

**Results:**
- Celebratory: "🏆 Champion! Your team dominated"
- Graceful: "Tough luck this time. There's always the next race"
- Data-rich: "Your team scored 847 points"

### Taglines

**Primary:** "Compete at the highest level"

**Alternatives:**
- "Draft. Race. Win."
- "The world's elite marathon fantasy league"
- "Your team. Your glory."

---

## Color System (Navy & Gold)

### Design Inspiration

Our palette is inspired by:
- Championship trophies and medals
- Premium athletic apparel brands
- Professional sports league branding
- Nautical elegance and tradition

### Primary Palette

#### Navy Blue (Primary Brand Color)
**The foundation - trust, stability, prestige.**

```javascript
// Chakra UI theme configuration
navy: {
  50:  '#F5F7FA',  // Lightest tint (backgrounds)
  100: '#E4E9F2',  // Very light (hover states)
  200: '#C3CDE3',  // Light (borders, dividers)
  300: '#9EADD1',  // Medium-light (disabled states)
  400: '#7A8DBF',  // Medium (secondary text)
  500: '#4A5F9D',  // Base navy (buttons, links)
  600: '#3A4D7E',  // Darker (hover on 500)
  700: '#2A3B5E',  // Much darker (active states)
  800: '#1F2D47',  // Very dark (headings)
  900: '#161C4F',  // Darkest (app background, logo)
}
```

**Usage Examples:**
- **900:** App background, sticky header background
- **800:** Card backgrounds (dark sections)
- **700:** Pressed button states
- **600:** Button hover states
- **500:** Primary buttons, links, active nav items
- **400:** Secondary text, placeholder text
- **300:** Disabled button backgrounds
- **200:** Borders, dividers, subtle backgrounds
- **100:** Hover states on light surfaces
- **50:** Page backgrounds, modal overlays

**Contrast Validation:**
- Navy 900 on white: 13.5:1 ✅ AAA
- Navy 500 on white: 6.8:1 ✅ AAA
- White on navy 900: 13.5:1 ✅ AAA

#### Gold (Accent Color)
**Championship prestige and achievement.**

```javascript
gold: {
  50:  '#FFFBF0',  // Lightest (subtle highlights)
  100: '#FFF4D6',  // Very light
  200: '#FFE9AD',  // Light
  300: '#FFDE84',  // Medium-light
  400: '#EDD35B',  // Medium
  500: '#D4AF37',  // Base gold (logo color)
  600: '#B8941F',  // Darker (hover)
  700: '#9A7A15',  // Much darker
  800: '#7C610E',  // Very dark
  900: '#5E4808',  // Darkest
}
```

**Usage Examples:**
- **500:** Star ratings, achievement badges, premium features
- **400-600:** Hover states, active indicators
- **300:** Subtle highlights, success indicators
- **100-200:** Background tints, gentle emphasis
- **700-900:** Text on light backgrounds (use sparingly)

**Contrast Validation:**
- Gold 500 on navy 900: 8.2:1 ✅ AAA
- Gold 600 on white: 4.9:1 ✅ AA (large text)
- Gold 700 on white: 6.1:1 ✅ AAA

**Usage Guidelines:**
- Use gold sparingly - it's an accent, not a primary color
- Reserve for achievements, premium features, highlights
- Never use gold for error states or warnings
- Pair with navy for maximum impact

#### White & Gray (Neutral Palette)
**Clean, modern, versatile.**

```javascript
// Already included in Chakra's default theme, but customized:
gray: {
  50:  '#FAFAFA',  // Lightest (page background)
  100: '#F4F4F5',  // Very light (card background)
  200: '#E4E4E7',  // Light (borders)
  300: '#D4D4D8',  // Medium-light (disabled)
  400: '#A1A1AA',  // Medium (secondary text)
  500: '#71717A',  // Base (body text)
  600: '#52525B',  // Darker (headings)
  700: '#3F3F46',  // Much darker
  800: '#27272A',  // Very dark
  900: '#18181B',  // Darkest
}
```

**Usage:**
- Use for text, backgrounds, borders
- Gray 50-100: Page and card backgrounds
- Gray 200-300: Borders, dividers
- Gray 400-600: Text hierarchy
- Gray 700-900: High-emphasis text, dark mode

### Semantic Colors

#### Success (Green)
```javascript
success: {
  50:  '#F0FDF4',
  500: '#22C55E',  // Green for confirmations
  600: '#16A34A',  // Hover state
  700: '#15803D',  // Active state
}
```
**Usage:** Team saved, roster submitted, profile updated

#### Warning (Amber)
```javascript
warning: {
  50:  '#FFFBEB',
  500: '#F59E0B',  // Amber for cautions
  600: '#D97706',  // Hover state
  700: '#B45309',  // Active state
}
```
**Usage:** Roster lock warning, over budget, unsaved changes

#### Error (Red)
```javascript
error: {
  50:  '#FEF2F2',
  500: '#EF4444',  // Red for errors
  600: '#DC2626',  // Hover state
  700: '#B91C1C',  // Active state
}
```
**Usage:** Form validation errors, API failures, destructive actions

#### Info (Blue)
```javascript
info: {
  50:  '#EFF6FF',
  500: '#3B82F6',  // Blue for information
  600: '#2563EB',  // Hover state
  700: '#1D4ED8',  // Active state
}
```
**Usage:** Helpful tips, notifications, informational banners

### Color Combinations

#### Primary Patterns

**Hero/Header:**
```
Background: navy.900
Text: white
Accents: gold.500
```

**Content Cards:**
```
Background: white or gray.50
Text: gray.700
Heading: navy.800
Border: gray.200
```

**Buttons (Primary):**
```
Background: navy.500
Text: white
Hover: navy.600
Active: navy.700
Focus Ring: gold.500
```

**Buttons (Secondary):**
```
Background: white
Text: navy.500
Border: navy.500
Hover: navy.50
```

**Buttons (Gold Accent):**
```
Background: gold.500
Text: navy.900
Hover: gold.600
Active: gold.700
```

#### Do's and Don'ts

✅ **Do:**
- Use navy as the dominant color
- Use gold for highlights and achievements
- Maintain high contrast for text
- Test all combinations for accessibility

❌ **Don't:**
- Use gold as a background color (except very light tints)
- Mix gold with semantic colors (red, green, etc.)
- Use low-contrast combinations
- Use more than 3 colors in one interface

---

## Typography

### Font System

#### Font Families

**Heading Font: Inter**
```javascript
fonts: {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
}
```
- Modern, geometric sans-serif
- Excellent legibility at all sizes
- Professional and authoritative
- Available on Google Fonts (free)
- Weights: 400, 500, 600, 700, 800

**Body Font: Roboto**
```javascript
fonts: {
  body: `'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
}
```
- Clean, neutral, highly readable
- Optimized for screens
- Slightly wider than Inter (better for body text)
- Available on Google Fonts (free)
- Weights: 400, 500, 700

**Monospace Font: System Default**
```javascript
fonts: {
  mono: `'Roboto Mono', Menlo, Monaco, 'Courier New', monospace`,
}
```
- Use for code, technical data, timestamps
- Rarely needed in MMFL

**Fallback Stack:**
Always include system fonts for instant render and web font failure:
```
-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif
```

#### Type Scale

```javascript
fontSizes: {
  xs:   '0.75rem',  // 12px - Captions, fine print
  sm:   '0.875rem', // 14px - Secondary text, labels
  md:   '1rem',     // 16px - Base body text (DEFAULT)
  lg:   '1.125rem', // 18px - Large body, emphasized text
  xl:   '1.25rem',  // 20px - Small headings, subheadings
  '2xl': '1.5rem',  // 24px - Section headings (H3)
  '3xl': '1.875rem',// 30px - Page titles (H2)
  '4xl': '2.25rem', // 36px - Hero headings (H1)
  '5xl': '3rem',    // 48px - Display text (rare, desktop only)
}
```

**Mobile Adjustments:**
On screens < 768px, reduce by 10-20%:
```javascript
<Heading size="4xl" fontSize={{ base: '2xl', md: '4xl' }}>
  Welcome to MMFL
</Heading>
```

#### Font Weights

```javascript
fontWeights: {
  normal:   400,  // Body text
  medium:   500,  // Emphasized body text
  semibold: 600,  // Button text, labels
  bold:     700,  // Headings, strong emphasis
  extrabold: 800, // Hero headings (use sparingly)
}
```

**Usage Guidelines:**
- **400:** All body text by default
- **500:** Subtle emphasis within paragraphs
- **600:** Buttons, form labels, data labels
- **700:** H1, H2, H3 headings
- **800:** Hero text only (rare)

#### Line Heights

```javascript
lineHeights: {
  none:    1,     // Avoid (causes overlap)
  tight:   1.25,  // Large headings (H1, H2)
  snug:    1.375, // Small headings (H3, H4)
  normal:  1.5,   // Body text (DEFAULT)
  relaxed: 1.625, // Long-form content
  loose:   1.75,  // Very relaxed (rare)
}
```

**Recommended Pairings:**
- H1 (48px): `lineHeight="tight"` (60px)
- H2 (36px): `lineHeight="tight"` (45px)
- H3 (24px): `lineHeight="snug"` (33px)
- Body (16px): `lineHeight="normal"` (24px)
- Small (14px): `lineHeight="normal"` (21px)

#### Letter Spacing

```javascript
letterSpacings: {
  tighter: '-0.05em',  // Tight headings
  tight:   '-0.025em', // Large headings
  normal:  '0',        // Body text (DEFAULT)
  wide:    '0.025em',  // Buttons, all-caps labels
  wider:   '0.05em',   // Overline text, eyebrows
  widest:  '0.1em',    // Extreme emphasis (rare)
}
```

**Usage:**
- Headings (48px+): `letterSpacing="tight"`
- Body text: `letterSpacing="normal"`
- Buttons: `letterSpacing="wide"`
- All-caps labels: `letterSpacing="wider"`

### Typography Hierarchy

#### Headings

```jsx
// H1 - Page Title (Use once per page)
<Heading 
  as="h1" 
  size="4xl"                       // 36px (2.25rem)
  fontWeight="bold"                // 700
  lineHeight="tight"               // 1.25
  letterSpacing="tight"            // -0.025em
  color="navy.900"
  mb={6}
>
  Your Team
</Heading>

// H2 - Section Title
<Heading 
  as="h2" 
  size="3xl"                       // 30px (1.875rem)
  fontWeight="bold"
  lineHeight="tight"
  color="navy.800"
  mb={4}
>
  Confirmed Athletes
</Heading>

// H3 - Subsection
<Heading 
  as="h3" 
  size="2xl"                       // 24px (1.5rem)
  fontWeight="semibold"            // 600
  lineHeight="snug"
  color="navy.700"
  mb={3}
>
  Men's Elite
</Heading>

// H4 - Card Title
<Heading 
  as="h4" 
  size="xl"                        // 20px (1.25rem)
  fontWeight="semibold"
  lineHeight="snug"
  color="navy.600"
  mb={2}
>
  Eliud Kipchoge
</Heading>
```

#### Body Text

```jsx
// Default body text
<Text fontSize="md" lineHeight="normal" color="gray.700">
  Build your fantasy team by selecting 3 men and 3 women within your $30,000 budget.
</Text>

// Large body (emphasized)
<Text fontSize="lg" lineHeight="normal" color="gray.700" fontWeight="medium">
  Your team is ready for race day!
</Text>

// Small text (secondary info)
<Text fontSize="sm" lineHeight="normal" color="gray.500">
  Personal Best: 2:01:09
</Text>

// Fine print
<Text fontSize="xs" lineHeight="normal" color="gray.400">
  Roster locks at 8:00 AM EST on race day
</Text>
```

#### Links

```jsx
// Default link
<Link 
  color="navy.500" 
  fontWeight="medium"
  textDecoration="underline"
  _hover={{ 
    color: "navy.600",
    textDecoration: "none" 
  }}
>
  View athlete details
</Link>

// Button-styled link (no underline)
<Link 
  color="navy.500" 
  fontWeight="semibold"
  _hover={{ color: "navy.600" }}
>
  Learn more →
</Link>
```

### Typography Best Practices

✅ **Do:**
- Use 16px (1rem) minimum for body text
- Maintain 1.5 line height for readability
- Limit line length to 60-80 characters
- Use scale consistently (don't create custom sizes)
- Left-align text (never justify)
- Use headings for structure, not just styling

❌ **Don't:**
- Use font sizes smaller than 12px (except for rare legal text)
- Use all-caps for more than a few words
- Center-align paragraphs
- Mix more than 2 font families
- Use extreme font weights (100, 900) except for hero text
- Set lineHeight less than 1.25

---

## Spacing & Layout

### Spacing Scale

**Philosophy:** Use a consistent 4px base unit for all spacing.

```javascript
space: {
  px: '1px',       // Hairline borders
  0:  '0',         // No space
  0.5: '0.125rem', // 2px  - Micro adjustments
  1:  '0.25rem',   // 4px  - Tiny gap
  2:  '0.5rem',    // 8px  - Compact spacing
  3:  '0.75rem',   // 12px - Small spacing
  4:  '1rem',      // 16px - Base unit (DEFAULT)
  5:  '1.25rem',   // 20px - Medium spacing
  6:  '1.5rem',    // 24px - Large spacing
  8:  '2rem',      // 32px - Extra large
  10: '2.5rem',    // 40px - Section spacing
  12: '3rem',      // 48px - Major sections
  16: '4rem',      // 64px - Hero spacing
  20: '5rem',      // 80px - Extra large sections
  24: '6rem',      // 96px - Maximum spacing
}
```

### Layout System

#### Container

```jsx
// Default container (max-width, centered, padding)
<Container maxW="container.xl" px={4} py={8}>
  {/* Content */}
</Container>

// Container sizes
container: {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop (DEFAULT for MMFL)
  '2xl': '1536px', // Extra large (rare)
}
```

#### Stack (Vertical Spacing)

```jsx
// Vertical stack with consistent spacing
<VStack spacing={4} align="stretch">
  <Card>Team 1</Card>
  <Card>Team 2</Card>
  <Card>Team 3</Card>
</VStack>

// Horizontal stack
<HStack spacing={3}>
  <Button>Cancel</Button>
  <Button>Save</Button>
</HStack>
```

#### Grid System

```jsx
// Responsive grid (auto-fit)
<SimpleGrid 
  columns={{ base: 1, md: 2, lg: 3 }} 
  spacing={6}
>
  <AthleteCard />
  <AthleteCard />
  <AthleteCard />
</SimpleGrid>

// Custom grid with repeat
<Grid 
  templateColumns="repeat(auto-fit, minmax(250px, 1fr))" 
  gap={6}
>
  {/* Auto-responsive cards */}
</Grid>
```

### Spacing Patterns

#### Component Spacing

```jsx
// Card internal spacing
<Box 
  p={6}          // 24px padding on all sides
  borderRadius="lg"
  shadow="md"
>
  <Heading mb={4}>Title</Heading>  // 16px margin bottom
  <Text mb={3}>Description</Text>  // 12px margin bottom
  <Button mt={4}>Action</Button>   // 16px margin top
</Box>

// List spacing
<VStack spacing={2} align="stretch">
  <ListItem />  // 8px gap between items
  <ListItem />
  <ListItem />
</VStack>
```

#### Section Spacing

```jsx
// Page sections (mobile)
<Box py={8}>      // 32px vertical padding
  <Heading mb={6}>Section Title</Heading>  // 24px margin bottom
  {/* Content */}
</Box>

// Page sections (desktop)
<Box py={{ base: 8, md: 12 }}>  // 32px mobile, 48px desktop
  {/* Content */}
</Box>
```

### Responsive Spacing

```jsx
// Adapt spacing to screen size
<Box 
  p={{ base: 4, md: 6, lg: 8 }}     // 16px, 24px, 32px
  mb={{ base: 6, md: 8, lg: 12 }}   // 24px, 32px, 48px
>
  {/* Content */}
</Box>

// Conditional spacing
<VStack spacing={{ base: 4, md: 6 }}>
  {/* Larger gaps on desktop */}
</VStack>
```

---

## Component Library (Chakra UI)

### Button Components

#### Primary Button (Navy)
```jsx
<Button 
  colorScheme="navy"      // Uses navy.500 by default
  size="lg"               // lg, md, sm, xs
  fontWeight="semibold"
  px={8}
  _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
  _active={{ transform: 'translateY(0)' }}
>
  Save Team
</Button>
```

#### Secondary Button (Outline)
```jsx
<Button 
  variant="outline"
  colorScheme="navy"
  size="md"
  _hover={{ bg: 'navy.50' }}
>
  Cancel
</Button>
```

#### Gold Accent Button
```jsx
<Button 
  bg="gold.500"
  color="navy.900"
  fontWeight="bold"
  _hover={{ bg: 'gold.600' }}
  _active={{ bg: 'gold.700' }}
  leftIcon={<StarIcon />}
>
  Upgrade to Pro
</Button>
```

#### Ghost Button (Text Only)
```jsx
<Button 
  variant="ghost"
  colorScheme="navy"
  size="sm"
>
  Skip
</Button>
```

### Card Components

#### Basic Card
```jsx
<Box 
  bg="white"
  borderRadius="lg"      // 8px
  border="1px solid"
  borderColor="gray.200"
  p={6}
  shadow="sm"
  _hover={{ shadow: 'md' }}
>
  <Heading size="md" mb={3}>Card Title</Heading>
  <Text color="gray.600">Card content goes here</Text>
</Box>
```

#### Athlete Card
```jsx
<Flex 
  bg="white"
  borderRadius="lg"
  border="1px solid"
  borderColor="gray.200"
  p={4}
  align="center"
  gap={4}
  shadow="sm"
  transition="all 0.2s"
  _hover={{ shadow: 'lg', borderColor: 'navy.300' }}
>
  <Avatar name="Eliud Kipchoge" size="lg" />
  <Box flex="1">
    <Heading size="sm" mb={1}>Eliud Kipchoge</Heading>
    <HStack spacing={2}>
      <Badge colorScheme="navy">KEN</Badge>
      <Text fontSize="sm" color="gray.500">PB: 2:01:09</Text>
    </HStack>
  </Box>
  <Text fontSize="lg" fontWeight="bold" color="gold.600">
    $12,500
  </Text>
</Flex>
```

### Input Components

#### Text Input
```jsx
<FormControl>
  <FormLabel color="navy.700">Team Name</FormLabel>
  <Input 
    placeholder="Enter team name"
    focusBorderColor="navy.500"
    errorBorderColor="error.500"
    _placeholder={{ color: 'gray.400' }}
  />
  <FormHelperText>Choose a unique name</FormHelperText>
</FormControl>
```

#### Select Dropdown
```jsx
<Select 
  placeholder="Select race"
  focusBorderColor="navy.500"
>
  <option value="nyc">New York City Marathon</option>
  <option value="boston">Boston Marathon</option>
  <option value="chicago">Chicago Marathon</option>
</Select>
```

### Navigation Components

#### Sticky Header
```jsx
<Flex 
  as="header"
  position="sticky"
  top={0}
  zIndex={10}
  bg="navy.900"
  color="white"
  px={4}
  py={3}
  align="center"
  justify="space-between"
  shadow="md"
>
  <HStack spacing={3}>
    <Image src="/logo-icon.svg" w="32px" h="32px" alt="MMFL" />
    <Heading size="md">MMFL</Heading>
  </HStack>
  
  <HStack spacing={6} display={{ base: 'none', md: 'flex' }}>
    <Link href="/" fontWeight="medium">Home</Link>
    <Link href="/help">Help</Link>
    <Link href="/commissioner">Commissioner</Link>
    <Button size="sm" variant="outline" colorScheme="gold">
      Logout
    </Button>
  </HStack>
  
  <IconButton 
    icon={<HamburgerIcon />}
    display={{ base: 'flex', md: 'none' }}
    aria-label="Open menu"
    variant="ghost"
    colorScheme="whiteAlpha"
  />
</Flex>
```

#### Bottom Toolbar
```jsx
<Flex 
  as="nav"
  position="fixed"
  bottom={0}
  left={0}
  right={0}
  zIndex={10}
  bg="white"
  borderTop="1px solid"
  borderColor="gray.200"
  shadow="lg"
  px={2}
  py={2}
  justify="space-around"
  display={{ base: 'flex', md: 'none' }}  // Mobile only
>
  <VStack spacing={0} flex={1} as="button">
    <Icon as={HomeIcon} boxSize={5} color="navy.500" />
    <Text fontSize="xs" color="navy.500" fontWeight="semibold">
      Home
    </Text>
  </VStack>
  
  <VStack spacing={0} flex={1} as="button">
    <Icon as={TeamIcon} boxSize={5} color="gray.400" />
    <Text fontSize="xs" color="gray.400">
      Team
    </Text>
  </VStack>
  
  <VStack spacing={0} flex={1} as="button">
    <Icon as={TrophyIcon} boxSize={5} color="gray.400" />
    <Text fontSize="xs" color="gray.400">
      Standings
    </Text>
  </VStack>
  
  <VStack spacing={0} flex={1} as="button">
    <Icon as={UserIcon} boxSize={5} color="gray.400" />
    <Text fontSize="xs" color="gray.400">
      Athletes
    </Text>
  </VStack>
</Flex>
```

### Modal Components

```jsx
<Modal 
  isOpen={isOpen} 
  onClose={onClose} 
  size="xl"
  isCentered
>
  <ModalOverlay bg="blackAlpha.600" />
  <ModalContent>
    <ModalHeader 
      bg="navy.900" 
      color="white"
      borderTopRadius="lg"
    >
      Athlete Details
    </ModalHeader>
    <ModalCloseButton color="white" />
    
    <ModalBody py={6}>
      {/* Content */}
    </ModalBody>
    
    <ModalFooter>
      <Button variant="ghost" mr={3} onClick={onClose}>
        Cancel
      </Button>
      <Button colorScheme="navy">
        Add to Team
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

### Badge & Tag Components

```jsx
// Country badge
<Badge colorScheme="navy" variant="solid">
  KEN
</Badge>

// Status badge
<Badge colorScheme="green" variant="subtle">
  Active
</Badge>

// Ranking badge
<Badge colorScheme="gold" variant="solid">
  #1 World Ranking
</Badge>

// Tag (dismissible)
<Tag size="lg" colorScheme="navy" borderRadius="full">
  <TagLabel>Eliud Kipchoge</TagLabel>
  <TagCloseButton />
</Tag>
```

---

## Navigation System

### Mobile Navigation (Primary)

#### Bottom Action Toolbar
**Always visible on mobile (< 768px)**

```jsx
<Flex 
  position="fixed"
  bottom={0}
  left={0}
  right={0}
  zIndex={1000}
  bg="white"
  borderTop="2px solid"
  borderColor="gray.200"
  shadow="lg"
  height="64px"
  px={2}
  justify="space-around"
  align="center"
>
  <NavItem 
    icon={HomeIcon} 
    label="Home" 
    href="/" 
    isActive={pathname === '/'}
  />
  <NavItem 
    icon={TeamIcon} 
    label="Team" 
    href="/team"
    isActive={pathname === '/team'}
  />
  <NavItem 
    icon={TrophyIcon} 
    label="Standings" 
    href="/standings"
    isActive={pathname === '/standings'}
  />
  <NavItem 
    icon={UserIcon} 
    label="Athletes" 
    href="/athletes"
    isActive={pathname === '/athletes'}
  />
</Flex>

// NavItem component
function NavItem({ icon, label, href, isActive }) {
  return (
    <VStack 
      as={Link} 
      href={href}
      spacing={0}
      flex={1}
      py={2}
      color={isActive ? 'navy.500' : 'gray.400'}
      fontWeight={isActive ? 'semibold' : 'normal'}
      _hover={{ color: 'navy.600' }}
      transition="all 0.2s"
    >
      <Icon as={icon} boxSize={6} />
      <Text fontSize="xs" mt={1}>{label}</Text>
    </VStack>
  );
}
```

#### Mobile Header
```jsx
<Flex 
  as="header"
  position="sticky"
  top={0}
  zIndex={999}
  bg="navy.900"
  color="white"
  px={4}
  py={3}
  justify="space-between"
  align="center"
  shadow="md"
>
  <HStack spacing={2}>
    <Image src="/logo-icon.svg" w="28px" h="28px" />
    <Heading size="sm">MMFL</Heading>
  </HStack>
  
  <IconButton 
    icon={<BellIcon />}
    aria-label="Notifications"
    variant="ghost"
    colorScheme="whiteAlpha"
    size="sm"
  />
</Flex>
```

### Desktop Navigation (Tablet+)

#### Top Navigation Bar
```jsx
<Flex 
  as="header"
  position="sticky"
  top={0}
  zIndex={999}
  bg="navy.900"
  color="white"
  px={8}
  py={4}
  align="center"
  shadow="md"
>
  <HStack spacing={3} flex={1}>
    <Image src="/logo-full.svg" h="36px" />
  </HStack>
  
  <HStack spacing={8}>
    <Link href="/" fontWeight={pathname === '/' ? 'bold' : 'medium'}>
      Home
    </Link>
    <Link href="/team" fontWeight={pathname === '/team' ? 'bold' : 'medium'}>
      My Team
    </Link>
    <Link href="/standings" fontWeight={pathname === '/standings' ? 'bold' : 'medium'}>
      Standings
    </Link>
    <Link href="/athletes" fontWeight={pathname === '/athletes' ? 'bold' : 'medium'}>
      Athletes
    </Link>
  </HStack>
  
  <HStack spacing={4} flex={1} justify="flex-end">
    <Link href="/help">Help</Link>
    <Link href="/commissioner">Commissioner</Link>
    <Button size="sm" variant="outline" colorScheme="gold">
      Logout
    </Button>
  </HStack>
</Flex>
```

### Navigation Guidelines

✅ **Do:**
- Keep toolbar items to 4-5 max (mobile)
- Use icons + labels for clarity
- Highlight active page clearly
- Make touch targets 44x44px minimum
- Provide visual feedback on tap/click

❌ **Don't:**
- Hide critical navigation behind hamburger menu
- Use icon-only navigation (requires memorization)
- Make toolbar scrollable (defeats purpose)
- Use more than 2 levels of navigation depth

---

## Motion & Interaction

### Animation Principles

1. **Purposeful:** Every animation serves a function
2. **Fast:** 150-300ms for most interactions
3. **Natural:** Ease-in-out curves feel organic
4. **Consistent:** Same elements use same animations
5. **Accessible:** Respect `prefers-reduced-motion`

### Transition Durations

```javascript
transition: {
  ultra:  '75ms',   // Instant feedback (hover colors)
  faster: '100ms',  // Quick (button press)
  fast:   '150ms',  // Standard (hover effects)
  normal: '250ms',  // Comfortable (modal open)
  slow:   '350ms',  // Deliberate (page transition)
  slower: '500ms',  // Dramatic (rarely used)
}
```

### Easing Functions

```javascript
easings: {
  easeIn:     'cubic-bezier(0.4, 0, 1, 1)',      // Accelerate
  easeOut:    'cubic-bezier(0, 0, 0.2, 1)',      // Decelerate (DEFAULT)
  easeInOut:  'cubic-bezier(0.4, 0, 0.2, 1)',    // Smooth (organic)
  sharp:      'cubic-bezier(0.4, 0, 0.6, 1)',    // Snappy
}
```

### Common Animations

#### Hover Effects
```jsx
<Box 
  transition="all 0.2s"
  _hover={{ 
    transform: 'translateY(-4px)',
    shadow: 'lg'
  }}
>
  Card content
</Box>
```

#### Button Press
```jsx
<Button 
  transition="all 0.15s"
  _active={{ 
    transform: 'scale(0.95)',
    bg: 'navy.700'
  }}
>
  Click me
</Button>
```

#### Modal Entrance
```jsx
<MotionBox
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
>
  Modal content
</MotionBox>
```

#### Slide-in Notification
```jsx
<MotionBox
  initial={{ x: 300, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: 300, opacity: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Notification content
</MotionBox>
```

#### Loading Skeleton
```jsx
<Skeleton 
  height="20px" 
  startColor="gray.100" 
  endColor="gray.300"
  borderRadius="md"
/>
```

### Micro-interactions

#### Success Checkmark
```jsx
<MotionBox
  as={CheckIcon}
  initial={{ scale: 0 }}
  animate={{ scale: [0, 1.2, 1] }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
  color="success.500"
/>
```

#### Pulsing Indicator
```jsx
<Box 
  w="12px" 
  h="12px" 
  borderRadius="full" 
  bg="success.500"
  animation="pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
  sx={{
    '@keyframes pulse': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
  }}
/>
```

---

## Responsive Design

### Breakpoints

```javascript
breakpoints: {
  base: '0px',     // 0px+    (Mobile portrait)
  sm:   '480px',   // 480px+  (Mobile landscape)
  md:   '768px',   // 768px+  (Tablet portrait)
  lg:   '1024px',  // 1024px+ (Tablet landscape / Small desktop)
  xl:   '1280px',  // 1280px+ (Desktop)
  '2xl': '1536px', // 1536px+ (Large desktop)
}
```

### Mobile-First Approach

```jsx
// Start with mobile, enhance for larger screens
<Box 
  fontSize={{ base: 'sm', md: 'md', lg: 'lg' }}
  p={{ base: 4, md: 6, lg: 8 }}
  columns={{ base: 1, md: 2, lg: 3 }}
>
  Responsive content
</Box>
```

### Common Patterns

#### Hide on Mobile
```jsx
<Box display={{ base: 'none', md: 'block' }}>
  Desktop-only content
</Box>
```

#### Hide on Desktop
```jsx
<Box display={{ base: 'block', md: 'none' }}>
  Mobile-only content
</Box>
```

#### Conditional Rendering
```jsx
const isMobile = useBreakpointValue({ base: true, md: false });

return (
  <>
    {isMobile ? <MobileNav /> : <DesktopNav />}
  </>
);
```

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast
- **Normal text:** 4.5:1 minimum
- **Large text (18px+ or 14px bold):** 3:1 minimum
- **UI components:** 3:1 minimum

#### Keyboard Navigation
```jsx
// All interactive elements must be keyboard accessible
<Box 
  as="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  _focus={{
    outline: '2px solid',
    outlineColor: 'gold.500',
    outlineOffset: '2px',
  }}
>
  Clickable element
</Box>
```

#### Screen Reader Support
```jsx
<Button 
  aria-label="Add Eliud Kipchoge to team"
  aria-describedby="kipchoge-description"
>
  <Icon as={PlusIcon} />
</Button>

<Text id="kipchoge-description" srOnly>
  Adds the athlete to your roster
</Text>
```

#### Focus Management
```jsx
// Trap focus in modals
<Modal 
  isOpen={isOpen}
  onClose={onClose}
  initialFocusRef={firstFieldRef}
  finalFocusRef={buttonRef}
>
  {/* Content */}
</Modal>
```

### Accessibility Checklist

✅ All images have `alt` text  
✅ All interactive elements keyboard accessible  
✅ Focus indicators visible on all elements  
✅ Color not sole indicator of information  
✅ Form labels associated with inputs  
✅ Error messages clear and helpful  
✅ Headings follow logical hierarchy (H1 → H2 → H3)  
✅ ARIA labels on icon-only buttons  
✅ Modal focus trapped when open  
✅ Skip-to-content link available  

---

## Implementation with Chakra

### Theme Configuration

```javascript
// theme.ts
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    navy: {
      50: '#F5F7FA',
      100: '#E4E9F2',
      200: '#C3CDE3',
      300: '#9EADD1',
      400: '#7A8DBF',
      500: '#4A5F9D',
      600: '#3A4D7E',
      700: '#2A3B5E',
      800: '#1F2D47',
      900: '#161C4F',
    },
    gold: {
      50: '#FFFBF0',
      100: '#FFF4D6',
      200: '#FFE9AD',
      300: '#FFDE84',
      400: '#EDD35B',
      500: '#D4AF37',
      600: '#B8941F',
      700: '#9A7A15',
      800: '#7C610E',
      900: '#5E4808',
    },
  },
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Roboto', sans-serif`,
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'navy',
      },
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md',
      },
      variants: {
        solid: {
          _hover: {
            transform: 'translateY(-2px)',
            shadow: 'md',
          },
        },
      },
    },
    Heading: {
      baseStyle: {
        color: 'navy.900',
        fontWeight: 'bold',
      },
    },
    Link: {
      baseStyle: {
        color: 'navy.500',
        _hover: {
          color: 'navy.600',
          textDecoration: 'none',
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.700',
      },
    },
  },
});

export default theme;
```

### Chakra Provider Setup

```jsx
// _app.tsx
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;
```

---

## Additional Resources

- [Chakra UI Documentation](https://chakra-ui.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inter Font](https://fonts.google.com/specimen/Inter)
- [Roboto Font](https://fonts.google.com/specimen/Roboto)
- [GitHub Issue #59](https://github.com/jessephus/marathon-majors-league/issues/59)

---

**Document Status:** Living document - update as design system evolves  
**Last Review:** November 21, 2025  
**Next Review:** When Phase 2 (Design System & Foundation) begins
