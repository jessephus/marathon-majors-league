# Typography Guide - Marathon Majors Fantasy League

**Document Version:** 1.0  
**Last Updated:** November 22, 2025  
**Purpose:** Complete typography system reference for MMFL Chakra UI implementation  
**Status:** ✅ Phase 2 Complete  
**Parent:** UI_REDESIGN_ROADMAP.md (Phase 2: Design System & Tokens)

---

## Table of Contents

1. [Overview](#overview)
2. [Font Families](#font-families)
3. [Type Scale](#type-scale)
4. [Heading System (H1-H6)](#heading-system-h1-h6)
5. [Body Text System](#body-text-system)
6. [Font Weights](#font-weights)
7. [Line Heights](#line-heights)
8. [Letter Spacing](#letter-spacing)
9. [Responsive Typography](#responsive-typography)
10. [Usage Guidelines](#usage-guidelines)
11. [Accessibility](#accessibility)
12. [Code Examples](#code-examples)

---

## Overview

Marathon Majors Fantasy League uses a carefully crafted typography system built on two Google Fonts:

- **Inter** for headings (modern, geometric, authoritative)
- **Roboto** for body text (clean, readable, screen-optimized)

This system provides a complete scale from 12px (xs) to 48px (5xl) with responsive sizing, proper hierarchy, and WCAG 2.1 AA compliance.

### Key Features

✅ **Complete Type Scale:** 9 sizes from xs to 5xl  
✅ **Heading Variants:** H1-H6 with semantic HTML  
✅ **5 Font Weights:** 400 (normal) through 800 (extrabold)  
✅ **6 Line Heights:** From tight (1.25) to loose (1.75)  
✅ **6 Letter Spacings:** From tighter (-0.05em) to widest (0.1em)  
✅ **Responsive Scaling:** Mobile-first sizing that adapts to screen width  
✅ **Accessible:** All text meets WCAG 2.1 AA contrast requirements

---

## Font Families

### Inter (Headings)

**Purpose:** Modern, geometric sans-serif for headings and emphasis  
**Google Fonts:** [Inter](https://fonts.google.com/specimen/Inter)  
**Weights Used:** 400, 500, 600, 700, 800  
**License:** Open Font License (free)

**Characteristics:**
- Geometric construction with consistent letterforms
- Excellent legibility at all sizes
- Professional and authoritative feel
- Optimized for digital displays

**CSS Definition:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Usage:**
- All headings (H1-H6)
- Emphasized text blocks
- Navigation menus
- Button labels (optional, can use Roboto)

### Roboto (Body Text)

**Purpose:** Clean, readable sans-serif for body content  
**Google Fonts:** [Roboto](https://fonts.google.com/specimen/Roboto)  
**Weights Used:** 400, 500, 700  
**License:** Apache License 2.0 (free)

**Characteristics:**
- Slightly wider than Inter (better for body text)
- Clean and neutral appearance
- Optimized for screen reading
- Excellent legibility in paragraphs

**CSS Definition:**
```css
font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Usage:**
- All body text (paragraphs, descriptions)
- Form inputs and labels
- Data displays and tables
- UI element text

### Roboto Mono (Monospace)

**Purpose:** Fixed-width font for code and technical data  
**Google Fonts:** [Roboto Mono](https://fonts.google.com/specimen/Roboto+Mono)  
**Weights Used:** 400, 500, 700  
**License:** Apache License 2.0 (free)

**CSS Definition:**
```css
font-family: 'Roboto Mono', Menlo, Monaco, 'Courier New', monospace;
```

**Usage:**
- Code snippets (rare in MMFL)
- Technical data (athlete IDs, session tokens)
- Timestamps (optional)
- Monospace data displays

### Fallback Stack

All fonts include system font fallbacks for instant rendering and graceful degradation:

```css
/* Headings */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Body */
font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace */
font-family: 'Roboto Mono', Menlo, Monaco, 'Courier New', monospace;
```

**System Fonts:**
- `-apple-system` → San Francisco (iOS/macOS)
- `BlinkMacSystemFont` → San Francisco (Chrome on macOS)
- `Segoe UI` → Windows default
- `sans-serif` → Ultimate fallback

---

## Type Scale

Complete font size scale following a consistent ratio:

| Token | Size (rem) | Size (px) | Usage |
|-------|-----------|-----------|-------|
| **xs** | 0.75rem | 12px | Fine print, captions, legal text |
| **sm** | 0.875rem | 14px | Secondary text, labels, helper text |
| **md** | 1rem | 16px | **Base body text (DEFAULT)** |
| **lg** | 1.125rem | 18px | Large body, emphasized paragraphs |
| **xl** | 1.25rem | 20px | Subheadings, intro text, H6 |
| **2xl** | 1.5rem | 24px | Section headings, H3 |
| **3xl** | 1.875rem | 30px | Page titles, H2 |
| **4xl** | 2.25rem | 36px | Hero headings, H1 |
| **5xl** | 3rem | 48px | Display text (rare, desktop only) |

### Implementation in Chakra UI

```typescript
// theme/index.ts
fontSizes: {
  xs: { value: '0.75rem' },    // 12px
  sm: { value: '0.875rem' },   // 14px
  md: { value: '1rem' },       // 16px (DEFAULT)
  lg: { value: '1.125rem' },   // 18px
  xl: { value: '1.25rem' },    // 20px
  '2xl': { value: '1.5rem' },  // 24px
  '3xl': { value: '1.875rem' },// 30px
  '4xl': { value: '2.25rem' }, // 36px
  '5xl': { value: '3rem' },    // 48px
}
```

### Size Selection Guidelines

**When to use each size:**

- **xs (12px):** Only for legal text, tooltips, or very minor metadata. Use sparingly.
- **sm (14px):** Secondary information, form helper text, timestamps, labels.
- **md (16px):** Default for all body text. Minimum recommended size for accessibility.
- **lg (18px):** Long-form content, emphasized paragraphs, improved readability.
- **xl (20px):** Subheadings, intro paragraphs, small headings (H6).
- **2xl (24px):** Section headings (H3), pull quotes, card titles.
- **3xl (30px):** Page titles (H2), major section headings.
- **4xl (36px):** Hero headings (H1), page-level titles.
- **5xl (48px):** Hero/display text only. Use on desktop only, reduce on mobile.

---

## Heading System (H1-H6)

Complete heading hierarchy with semantic HTML and visual styling:

### H1 - Page Title

**Visual Hierarchy:** Highest  
**Frequency:** Once per page  
**HTML:** `<h1>`

**Specifications:**
- **Font Family:** Inter
- **Font Size:** 4xl (36px desktop / 24px mobile)
- **Font Weight:** bold (700)
- **Line Height:** tight (1.25)
- **Letter Spacing:** tight (-0.025em)
- **Color:** navy.900

**Chakra UI Code:**
```tsx
<Heading 
  as="h1" 
  fontSize={{ base: '2xl', md: '4xl' }}
  fontWeight="bold"
  lineHeight="tight"
  letterSpacing="tight"
  color="navy.900"
>
  Your Team Dashboard
</Heading>
```

**Usage Examples:**
- Page title: "Your Team Dashboard"
- Hero heading: "Welcome to Marathon Majors"
- Main screen heading: "Salary Cap Draft"

---

### H2 - Section Title

**Visual Hierarchy:** Major sections  
**Frequency:** 2-5 per page  
**HTML:** `<h2>`

**Specifications:**
- **Font Family:** Inter
- **Font Size:** 3xl (30px desktop / 20px mobile)
- **Font Weight:** bold (700)
- **Line Height:** tight (1.25)
- **Letter Spacing:** normal
- **Color:** navy.800

**Chakra UI Code:**
```tsx
<Heading 
  as="h2" 
  fontSize={{ base: 'xl', md: '3xl' }}
  fontWeight="bold"
  lineHeight="tight"
  color="navy.800"
>
  Confirmed Athletes
</Heading>
```

**Usage Examples:**
- Section heading: "Confirmed Athletes"
- Major content division: "Leaderboard Standings"
- Feature heading: "Live Race Results"

---

### H3 - Subsection Title

**Visual Hierarchy:** Subsections  
**Frequency:** 3-10 per page  
**HTML:** `<h3>`

**Specifications:**
- **Font Family:** Inter
- **Font Size:** 2xl (24px desktop / 18px mobile)
- **Font Weight:** semibold (600)
- **Line Height:** snug (1.375)
- **Letter Spacing:** normal
- **Color:** navy.700

**Chakra UI Code:**
```tsx
<Heading 
  as="h3" 
  fontSize={{ base: 'lg', md: '2xl' }}
  fontWeight="semibold"
  lineHeight="snug"
  color="navy.700"
>
  Men's Elite Division
</Heading>
```

**Usage Examples:**
- Subsection: "Men's Elite Division"
- Card group heading: "Your Athletes"
- Panel title: "Team Statistics"

---

### H4 - Component/Card Title

**Visual Hierarchy:** Component level  
**Frequency:** Many per page  
**HTML:** `<h4>`

**Specifications:**
- **Font Family:** Inter
- **Font Size:** xl (20px)
- **Font Weight:** semibold (600)
- **Line Height:** snug (1.375)
- **Letter Spacing:** normal
- **Color:** navy.600

**Chakra UI Code:**
```tsx
<Heading 
  as="h4" 
  fontSize="xl"
  fontWeight="semibold"
  lineHeight="snug"
  color="navy.600"
>
  Eliud Kipchoge
</Heading>
```

**Usage Examples:**
- Athlete name: "Eliud Kipchoge"
- Card title: "Team Performance"
- Modal header: "Edit Roster"

---

### H5 - Small Heading

**Visual Hierarchy:** Minor headings  
**Frequency:** Variable  
**HTML:** `<h5>`

**Specifications:**
- **Font Family:** Inter
- **Font Size:** lg (18px)
- **Font Weight:** semibold (600)
- **Line Height:** normal (1.5)
- **Letter Spacing:** normal
- **Color:** gray.700

**Chakra UI Code:**
```tsx
<Heading 
  as="h5" 
  fontSize="lg"
  fontWeight="semibold"
  color="gray.700"
>
  Personal Records
</Heading>
```

**Usage Examples:**
- List header: "Personal Records"
- Small card title: "Recent Activity"
- Data table caption: "Top 10 Runners"

---

### H6 - Smallest Heading

**Visual Hierarchy:** Minimal  
**Frequency:** Rare  
**HTML:** `<h6>`

**Specifications:**
- **Font Family:** Inter
- **Font Size:** md (16px)
- **Font Weight:** semibold (600)
- **Line Height:** normal (1.5)
- **Letter Spacing:** normal
- **Color:** gray.600

**Chakra UI Code:**
```tsx
<Heading 
  as="h6" 
  fontSize="md"
  fontWeight="semibold"
  color="gray.600"
>
  Related Links
</Heading>
```

**Usage Examples:**
- Micro-heading: "Related Links"
- Footnote header: "Additional Info"

**Note:** Consider using bold text (`<Text fontWeight="bold">`) instead of H6 for this hierarchy level.

---

## Body Text System

Complete body text scale with Roboto font:

### Display Text (5xl - 48px)

**Purpose:** Hero sections, dramatic emphasis (rare)  
**Desktop Only:** Yes (reduce on mobile)

```tsx
<Text fontSize="5xl" fontFamily="body" color="navy.900" lineHeight="tight">
  42.2 Kilometers of Glory
</Text>
```

**Usage:** Hero text on landing page, dramatic statistics display

---

### Hero Text (4xl - 36px)

**Purpose:** Large emphasis text, CTAs, hero sections

```tsx
<Text fontSize="4xl" fontFamily="body" color="navy.800" lineHeight="tight">
  Draft Your Championship Team
</Text>
```

**Usage:** Hero CTAs, large statistics, featured content

---

### Extra Large (3xl - 30px)

**Purpose:** Emphasized content, statistics, featured data

```tsx
<Text fontSize="3xl" fontFamily="body" color="navy.700">
  847 Points
</Text>
```

**Usage:** Large data displays, emphasized statistics, callouts

---

### Large Emphasized (2xl - 24px)

**Purpose:** Pull quotes, important callouts

```tsx
<Text fontSize="2xl" fontFamily="body" color="gray.800">
  "The greatest marathon performance of all time"
</Text>
```

**Usage:** Pull quotes, featured quotes, large callouts

---

### Emphasized Text (xl - 20px)

**Purpose:** Subheadings, intro paragraphs, emphasized body

```tsx
<Text fontSize="xl" fontFamily="body" color="gray.700">
  Build your fantasy team by selecting 3 men and 3 women.
</Text>
```

**Usage:** Lead paragraphs, emphasized descriptions, subheadings

---

### Large Body (lg - 18px)

**Purpose:** Long-form content with improved readability

```tsx
<Text fontSize="lg" fontFamily="body" color="gray.700" lineHeight="relaxed">
  Marathon running requires exceptional endurance, strategy, and mental fortitude. 
  The world's elite marathoners train for years to compete at the highest level.
</Text>
```

**Usage:** Article body text, long-form content, accessibility-focused content

---

### Base Body Text (md - 16px) - DEFAULT ✅

**Purpose:** Default for all body content  
**Minimum Recommended Size:** Yes (for accessibility)

```tsx
<Text fontSize="md" fontFamily="body" color="gray.700">
  This is the default font size for all body content. Use this for paragraphs, 
  descriptions, and general UI text. Minimum recommended size for body text.
</Text>
```

**Usage:** All paragraphs, descriptions, form text, UI text

---

### Small Text (sm - 14px)

**Purpose:** Secondary information, helper text, captions

```tsx
<Text fontSize="sm" fontFamily="body" color="gray.600">
  Personal Best: 2:01:09 • World Record: 2:00:35
</Text>
```

**Usage:** Labels, helper text, timestamps, metadata, captions

---

### Extra Small (xs - 12px)

**Purpose:** Fine print, legal text, tooltips (use sparingly)

```tsx
<Text fontSize="xs" fontFamily="body" color="gray.500">
  * Roster locks at 8:00 AM EST on race day
</Text>
```

**Usage:** Legal text, fine print, tooltip content, very minor metadata

---

## Font Weights

Complete font weight system:

### Normal (400) - DEFAULT ✅

**Purpose:** All body text by default  
**Usage:** Paragraphs, descriptions, most UI text

```tsx
<Text fontWeight="normal">
  This is normal weight body text. Use for all default content.
</Text>
```

---

### Medium (500)

**Purpose:** Subtle emphasis within paragraphs  
**Usage:** Emphasized text, important words, subtle highlights

```tsx
<Text fontWeight="medium">
  Your team is currently ranked #1 in the league.
</Text>
```

---

### Semibold (600)

**Purpose:** Buttons, labels, card titles, H3-H6  
**Usage:** Button text, form labels, data labels, small headings

```tsx
<Text fontWeight="semibold">
  Team Name:
</Text>
```

---

### Bold (700)

**Purpose:** Headings (H1-H3), strong emphasis  
**Usage:** Major headings, strong emphasis, calls to action

```tsx
<Text fontWeight="bold">
  Championship Round
</Text>
```

---

### Extrabold (800)

**Purpose:** Hero headings only (use sparingly)  
**Usage:** Hero text, display headings (rare)

```tsx
<Heading fontWeight="extrabold" fontSize="5xl">
  Marathon Majors
</Heading>
```

**Warning:** Only use extrabold for hero/display text. Overuse reduces impact.

---

## Line Heights

Complete line height system:

### None (1.0)

**Purpose:** Avoid - causes text overlap  
**Usage:** Special cases only (icons, single-line displays)

---

### Tight (1.25)

**Purpose:** Large headings (H1, H2)  
**Usage:** Hero headings, large display text

```tsx
<Heading fontSize="4xl" lineHeight="tight">
  Welcome to Marathon Majors
</Heading>
```

---

### Snug (1.375)

**Purpose:** Small headings (H3-H6)  
**Usage:** Section headings, card titles

```tsx
<Heading fontSize="2xl" lineHeight="snug">
  Your Athletes
</Heading>
```

---

### Normal (1.5) - DEFAULT ✅

**Purpose:** Body text default - optimal readability  
**Usage:** All body text, paragraphs, UI text

```tsx
<Text fontSize="md" lineHeight="normal">
  This is the default line height for body text. It provides comfortable 
  reading with adequate spacing between lines.
</Text>
```

---

### Relaxed (1.625)

**Purpose:** Long-form content with extra breathing room  
**Usage:** Articles, documentation, detailed explanations

```tsx
<Text fontSize="lg" lineHeight="relaxed">
  Marathon running requires exceptional endurance, strategy, and mental 
  fortitude. The world's elite marathoners train for years to compete at 
  the highest level, pushing the boundaries of human performance.
</Text>
```

---

### Loose (1.75)

**Purpose:** Very relaxed spacing (rare)  
**Usage:** Special cases with extreme readability needs

---

## Letter Spacing

Complete letter spacing system:

### Tighter (-0.05em)

**Purpose:** Very tight headings (rare, special cases)

```tsx
<Text fontSize="3xl" letterSpacing="tighter" fontWeight="bold">
  CHAMPIONSHIP
</Text>
```

---

### Tight (-0.025em)

**Purpose:** Large headings (48px+) for visual balance

```tsx
<Heading fontSize="4xl" letterSpacing="tight">
  Marathon Majors Fantasy League
</Heading>
```

---

### Normal (0) - DEFAULT ✅

**Purpose:** Body text, most UI elements

```tsx
<Text fontSize="md" letterSpacing="normal">
  Default letter spacing for body text and UI elements.
</Text>
```

---

### Wide (0.025em)

**Purpose:** Buttons, CTA text for better readability

```tsx
<Button fontSize="md" letterSpacing="wide">
  CREATE TEAM
</Button>
```

---

### Wider (0.05em)

**Purpose:** All-caps labels, overline text, eyebrows

```tsx
<Text 
  fontSize="sm" 
  letterSpacing="wider" 
  fontWeight="semibold" 
  textTransform="uppercase"
>
  TEAM STATISTICS
</Text>
```

---

### Widest (0.1em)

**Purpose:** Extreme emphasis (rare)

```tsx
<Text 
  fontSize="xs" 
  letterSpacing="widest" 
  textTransform="uppercase"
>
  WORLD RECORD
</Text>
```

---

## Responsive Typography

### Mobile-First Approach

All typography scales responsively from mobile to desktop:

```tsx
// Heading - scales from mobile to desktop
<Heading 
  fontSize={{ base: '2xl', md: '4xl' }}  // 24px mobile → 36px desktop
>
  Page Title
</Heading>

// Body text - typically consistent across sizes
<Text fontSize={{ base: 'md', lg: 'lg' }}>  // 16px → 18px (optional)
  Body content
</Text>
```

### Breakpoints

```javascript
breakpoints: {
  base: '0px',     // Mobile portrait
  sm: '480px',     // Mobile landscape
  md: '768px',     // Tablet portrait
  lg: '1024px',    // Desktop
  xl: '1280px',    // Large desktop
  '2xl': '1536px', // Extra large
}
```

### Common Responsive Patterns

#### Pattern 1: Heading Scales

```tsx
// H1 - Dramatic scaling
<Heading fontSize={{ base: '2xl', md: '4xl' }}>
  Hero Heading
</Heading>
// Mobile: 24px → Desktop: 36px

// H2 - Moderate scaling
<Heading fontSize={{ base: 'xl', md: '3xl' }}>
  Section Heading
</Heading>
// Mobile: 20px → Desktop: 30px

// H3 - Subtle scaling
<Heading fontSize={{ base: 'lg', md: '2xl' }}>
  Subsection
</Heading>
// Mobile: 18px → Desktop: 24px
```

#### Pattern 2: Body Text

```tsx
// Most body text stays consistent
<Text fontSize="md">
  Paragraph text - 16px on all devices
</Text>

// Optional: Increase for improved readability on large screens
<Text fontSize={{ base: 'md', lg: 'lg' }}>
  Long-form article content
</Text>
// Mobile: 16px → Large Desktop: 18px
```

#### Pattern 3: Display Text

```tsx
// Display text reduces significantly on mobile
<Text fontSize={{ base: 'xl', md: '3xl', lg: '5xl' }}>
  Hero Display
</Text>
// Mobile: 20px → Tablet: 30px → Desktop: 48px
```

---

## Usage Guidelines

### Best Practices ✅

**Do:**
1. Use 16px (md) minimum for body text (accessibility)
2. Maintain 1.5 line height for readability
3. Limit line length to 60-80 characters
4. Use scale consistently (don't create custom sizes)
5. Left-align text (never justify)
6. Use headings for structure, not just styling
7. Choose Roboto for body, Inter for headings
8. Test on actual devices, not just browser DevTools

**Font Weight Guidelines:**
- **400:** Default for all body text
- **500:** Subtle emphasis within text
- **600:** Buttons, labels, H3-H6
- **700:** H1-H2, strong emphasis
- **800:** Hero text only (sparingly)

**Line Height Guidelines:**
- **tight (1.25):** Large headings only
- **snug (1.375):** Small headings
- **normal (1.5):** All body text (default)
- **relaxed (1.625):** Long-form articles

**Letter Spacing Guidelines:**
- **tight:** Large headings (48px+)
- **normal:** Body text (default)
- **wide:** Button text
- **wider:** All-caps labels

### Anti-Patterns ❌

**Don't:**
1. ❌ Use font sizes smaller than 12px (except rare legal text)
2. ❌ Use all-caps for more than a few words
3. ❌ Center-align paragraphs
4. ❌ Mix more than 2 font families
5. ❌ Use extreme font weights (100, 900) except hero text
6. ❌ Set lineHeight less than 1.25
7. ❌ Create custom font sizes outside the scale
8. ❌ Use justified text alignment
9. ❌ Ignore responsive sizing needs
10. ❌ Use emoji for icons or visual elements

---

## Accessibility

### WCAG 2.1 AA Compliance

All typography meets or exceeds WCAG 2.1 AA standards:

#### Minimum Text Sizes

- **Normal text:** 16px minimum (md size)
- **Large text (18px+ or 14px bold):** 14px minimum (sm size)

#### Contrast Requirements

**Normal Text (16px):**
- Navy 900 (#161C4F) on white: **13.5:1** ✅ AAA (exceeds 4.5:1)
- Navy 500 (#4A5F9D) on white: **6.8:1** ✅ AAA (exceeds 4.5:1)
- Gray 700 on white: **4.6:1** ✅ AA

**Large Text (18px+ or 14px bold):**
- All navy shades 500+ meet AA requirements
- All gray shades 600+ meet AA requirements

#### Screen Reader Support

```tsx
// Always use semantic HTML
<Heading as="h1">Page Title</Heading>  // Not <div> styled as heading

// Provide context for complex displays
<Text>
  <VisuallyHidden>Your current rank is</VisuallyHidden>
  #1
</Text>
```

#### Focus Indicators

```tsx
// Ensure keyboard focus is visible
<Link 
  href="/team"
  _focus={{
    outline: '2px solid',
    outlineColor: 'gold.500',
    outlineOffset: '2px'
  }}
>
  View Team
</Link>
```

---

## Code Examples

### Complete Heading Examples

```tsx
// H1 - Page Title
<Heading 
  as="h1" 
  fontSize={{ base: '2xl', md: '4xl' }}
  fontWeight="bold"
  lineHeight="tight"
  letterSpacing="tight"
  color="navy.900"
  mb={6}
>
  Your Team Dashboard
</Heading>

// H2 - Section Title
<Heading 
  as="h2" 
  fontSize={{ base: 'xl', md: '3xl' }}
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
  fontSize={{ base: 'lg', md: '2xl' }}
  fontWeight="semibold"
  lineHeight="snug"
  color="navy.700"
  mb={3}
>
  Men's Elite Division
</Heading>

// H4 - Card Title
<Heading 
  as="h4" 
  fontSize="xl"
  fontWeight="semibold"
  lineHeight="snug"
  color="navy.600"
  mb={2}
>
  Eliud Kipchoge
</Heading>
```

### Body Text Examples

```tsx
// Default body paragraph
<Text fontSize="md" lineHeight="normal" color="gray.700" mb={4}>
  Build your fantasy team by selecting 3 men and 3 women within your $30,000 
  budget. Each athlete has a salary based on their world ranking and recent 
  performances.
</Text>

// Large emphasized intro
<Text fontSize="lg" lineHeight="normal" color="gray.700" fontWeight="medium" mb={4}>
  Your team is ready for race day! You've selected 6 elite athletes within 
  your budget.
</Text>

// Small secondary text
<Text fontSize="sm" lineHeight="normal" color="gray.600">
  Personal Best: 2:01:09 • World Ranking: #1
</Text>

// Fine print
<Text fontSize="xs" lineHeight="normal" color="gray.500">
  * Roster locks at 8:00 AM EST on race day
</Text>
```

### Article Layout Example

```tsx
<Box maxW="800px" mx="auto" py={8}>
  {/* Eyebrow */}
  <Text 
    fontSize="xs" 
    textTransform="uppercase" 
    letterSpacing="wider" 
    fontWeight="semibold" 
    color="gray.500" 
    mb={2}
  >
    News • March 15, 2025
  </Text>

  {/* Headline */}
  <Heading 
    as="h1" 
    fontSize={{ base: '2xl', md: '4xl' }}
    lineHeight="tight"
    mb={4}
  >
    Eliud Kipchoge Breaks Marathon World Record
  </Heading>

  {/* Deck */}
  <Text 
    fontSize="xl" 
    color="gray.600" 
    lineHeight="relaxed" 
    mb={6}
    fontWeight="medium"
  >
    The Kenyan marathon legend shattered his own world record by 30 seconds 
    at the Berlin Marathon, finishing in an astonishing 2:00:35.
  </Text>

  {/* Body */}
  <Text fontSize="md" lineHeight="normal" color="gray.700" mb={4}>
    In what can only be described as a historic performance, Eliud Kipchoge 
    demonstrated why he is considered the greatest marathoner of all time. 
    Running in near-perfect conditions in Berlin, Kipchoge maintained a 
    blistering pace throughout the entire 42.2 kilometers.
  </Text>

  <Text fontSize="md" lineHeight="normal" color="gray.700" mb={4}>
    "I felt strong from the start," Kipchoge said after the race. "The crowd, 
    the weather, everything came together perfectly today."
  </Text>
</Box>
```

### Data Display Example

```tsx
<Box bg="navy.900" color="white" p={6} borderRadius="lg">
  {/* Eyebrow */}
  <Text 
    fontSize="sm" 
    textTransform="uppercase" 
    letterSpacing="wider" 
    fontWeight="semibold" 
    opacity={0.7} 
    mb={3}
  >
    Team Statistics
  </Text>

  {/* Large numbers */}
  <HStack justify="space-between" mb={4}>
    <Box>
      <Text fontSize="4xl" fontWeight="bold" lineHeight="none" color="gold.500">
        847
      </Text>
      <Text fontSize="sm" mt={1} opacity={0.9}>Total Points</Text>
    </Box>
    <Box textAlign="right">
      <Text fontSize="4xl" fontWeight="bold" lineHeight="none" color="gold.500">
        #1
      </Text>
      <Text fontSize="sm" mt={1} opacity={0.9}>Current Rank</Text>
    </Box>
  </HStack>

  {/* Detailed data */}
  <VStack align="stretch" gap={2}>
    <HStack justify="space-between">
      <Text fontSize="sm">Men's Average</Text>
      <Text fontSize="sm" fontWeight="semibold">2:04:32</Text>
    </HStack>
    <HStack justify="space-between">
      <Text fontSize="sm">Women's Average</Text>
      <Text fontSize="sm" fontWeight="semibold">2:18:45</Text>
    </HStack>
  </VStack>
</Box>
```

---

## Testing Checklist

Before deploying typography changes:

### Visual Testing
- [ ] Test all heading sizes (H1-H6) on mobile, tablet, desktop
- [ ] Verify body text is readable at 16px minimum
- [ ] Check line heights don't cause text overlap
- [ ] Ensure letter spacing looks natural
- [ ] Test with actual content (not just Lorem Ipsum)

### Accessibility Testing
- [ ] Run axe DevTools accessibility scan
- [ ] Check contrast ratios (WCAG 2.1 AA)
- [ ] Test keyboard navigation (skip to content)
- [ ] Verify screen reader announces headings correctly
- [ ] Check focus indicators are visible

### Device Testing
- [ ] iPhone SE (small screen - 320px)
- [ ] iPhone 14 Pro (notch handling)
- [ ] iPad (tablet sizing)
- [ ] Desktop (1280px+ sizing)

### Browser Testing
- [ ] Chrome (Blink engine)
- [ ] Safari (WebKit - font rendering differences)
- [ ] Firefox (Gecko)
- [ ] Mobile Safari (iOS)

---

## Resources

- **Google Fonts:** [Inter](https://fonts.google.com/specimen/Inter) | [Roboto](https://fonts.google.com/specimen/Roboto)
- **Chakra UI Typography:** [Documentation](https://www.chakra-ui.com/docs/components/typography)
- **WCAG 2.1 Guidelines:** [Typography Requirements](https://www.w3.org/WAI/WCAG21/quickref/?showtechniques=146#text-alternatives)
- **Type Scale Calculator:** [TypeScale](https://typescale.com/)
- **Contrast Checker:** [WebAIM](https://webaim.org/resources/contrastchecker/)

---

## Related Documentation

- **Parent:** `UI_REDESIGN_ROADMAP.md` (Phase 2: Typography)
- **Theme Implementation:** `theme/index.ts` (typography tokens)
- **Typography Reference:** `theme/typography.ts` (reference doc)
- **Design Guidelines:** `CORE_DESIGN_GUIDELINES.md` (complete design system)
- **Demo Page:** `/chakra-demo` (live typography examples)

---

**Document Status:** ✅ Complete - Phase 2 Typography Implementation  
**Last Updated:** November 22, 2025  
**Next Review:** When implementing Phase 3 (Component Migration)
