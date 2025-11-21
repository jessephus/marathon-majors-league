# Design Guidelines - Marathon Majors Fantasy League

**Document Version:** 1.0  
**Last Updated:** November 21, 2025  
**Purpose:** Comprehensive design specifications for consistent UI/UX across MMFL  
**Status:** 🟡 Living Document

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Brand Identity](#brand-identity)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Components](#components)
7. [Iconography](#iconography)
8. [Motion & Animation](#motion--animation)
9. [Responsive Design](#responsive-design)
10. [Accessibility](#accessibility)
11. [Content Guidelines](#content-guidelines)

---

## Design Principles

### 1. Mobile-First
**Every design starts on mobile (320px width), then scales up.**

- Touch targets minimum 44x44px
- Content readable without zoom
- One-handed operation where possible
- Progressive enhancement for larger screens

### 2. Clarity Over Cleverness
**Users should instantly understand what to do.**

- Clear, descriptive labels (no jargon)
- Obvious call-to-action buttons
- Helpful error messages
- Consistent patterns across the app

### 3. Speed Matters
**Fast is better than slow.**

- Perceived performance > actual performance
- Skeleton loaders while content loads
- Optimistic UI updates
- Instant feedback on all interactions

### 4. Accessible by Default
**Everyone can use MMFL, regardless of ability.**

- WCAG 2.1 AA compliance minimum
- Keyboard navigation on all features
- Screen reader friendly
- High color contrast

### 5. Data-Driven Design
**Measure everything, iterate often.**

- A/B test major changes
- User feedback drives priorities
- Analytics inform decisions
- Continuous improvement

---

## Brand Identity

### Logo

#### Primary Logo
- **Icon:** 🗽 Statue of Liberty (emoji or SVG)
- **Wordmark:** "Marathon Majors Fantasy League"
- **Short Form:** "MMFL"
- **Minimum Size:** 120px wide (maintains legibility)
- **Clear Space:** Minimum 16px padding on all sides

#### Logo Variants
1. **Full Color:** Orange gradient, use on light backgrounds
2. **White:** Use on dark backgrounds or photos
3. **Black:** Use for print or monochrome contexts
4. **Icon Only:** Use when space is limited (mobile header, favicon)

#### Logo Usage
✅ **Do:**
- Use official logo files only
- Maintain aspect ratio
- Ensure clear space around logo
- Use on approved backgrounds

❌ **Don't:**
- Distort, rotate, or modify logo
- Change colors or add effects
- Place on busy backgrounds
- Make smaller than minimum size

### Tagline

**Primary:** "Turn marathon watching into the ultimate competitive experience"

**Alternatives:**
- "Draft. Compete. Win."
- "Your Marathon, Your Glory"
- "Fantasy Marathon Simplified"

**Usage:** Hero sections, social media, marketing materials

### Voice & Tone

#### Brand Voice (always)
- **Enthusiastic:** We love marathons and fantasy sports
- **Friendly:** Approachable, not corporate
- **Expert:** Knowledgeable without being condescending
- **Inclusive:** Everyone is welcome to play

#### Tone (varies by context)
- **Onboarding:** Encouraging, helpful
- **Game Play:** Exciting, competitive
- **Errors:** Apologetic, solution-oriented
- **Results:** Celebratory, engaging

**Example Messages:**
- ✅ Good: "You're all set! Your team is ready for race day."
- ❌ Bad: "Team configuration complete. Proceed to dashboard."
- ✅ Good: "Oops! Looks like you're over budget. Remove an athlete to continue."
- ❌ Bad: "Error: Budget constraint violated. Cannot proceed."

---

## Color System

### Primary Colors

#### Orange (Primary Brand Color)
- **Name:** Marathon Orange
- **HEX:** `#ff6900`
- **RGB:** `rgb(255, 105, 0)`
- **HSL:** `hsl(25, 100%, 50%)`
- **CSS Variable:** `--primary-orange`

**Usage:**
- Primary CTA buttons
- Active states
- Highlights and emphasis
- Brand elements

**Shades:**
```css
--orange-50:  #fff3e6;  /* Lightest tint */
--orange-100: #ffe0cc;
--orange-200: #ffc299;
--orange-300: #ffa366;
--orange-400: #ff8533;
--orange-500: #ff6900;  /* Base */
--orange-600: #e55d00;  /* Hover state */
--orange-700: #cc5200;
--orange-800: #b24600;
--orange-900: #993b00;  /* Darkest shade */
```

#### Blue (Secondary Brand Color)
- **Name:** Marathon Blue
- **HEX:** `#2C39A2`
- **RGB:** `rgb(44, 57, 162)`
- **HSL:** `hsl(234, 57%, 40%)`
- **CSS Variable:** `--primary-blue`

**Usage:**
- Secondary buttons
- Links
- Accents
- Gradient partner with orange

**Shades:**
```css
--blue-50:  #e6e8f5;  /* Lightest tint */
--blue-100: #ccd1eb;
--blue-200: #99a3d7;
--blue-300: #6675c3;
--blue-400: #3347af;
--blue-500: #2C39A2;  /* Base */
--blue-600: #252f8a;  /* Hover state */
--blue-700: #1f2672;
--blue-800: #181c5a;
--blue-900: #161C4F;  /* Darkest shade */
```

### Semantic Colors

#### Success
- **HEX:** `#28a745`
- **CSS Variable:** `--success-green`
- **Usage:** Confirmations, success messages, positive feedback

#### Warning
- **HEX:** `#ffc107`
- **CSS Variable:** `--warning-yellow`
- **Usage:** Warnings, cautions, attention-needed states

#### Error
- **HEX:** `#dc3545`
- **CSS Variable:** `--error-red`
- **Usage:** Errors, destructive actions, validation failures

#### Info
- **HEX:** `#17a2b8`
- **CSS Variable:** `--info-blue`
- **Usage:** Informational messages, tips, helpers

### Neutral Colors (Grayscale)

```css
--white:       #ffffff;  /* Pure white */
--gray-50:     #f8f9fa;  /* Background */
--gray-100:    #e9ecef;  /* Secondary background */
--gray-200:    #dee2e6;  /* Borders, dividers */
--gray-300:    #ced4da;  /* Disabled backgrounds */
--gray-400:    #adb5bd;  /* Disabled text */
--gray-500:    #6c757d;  /* Secondary text */
--gray-600:    #495057;  /* Body text */
--gray-700:    #343a40;  /* Headings */
--gray-800:    #212529;  /* Primary text */
--gray-900:    #0d0f12;  /* High emphasis text */
--black:       #000000;  /* Pure black */
```

### Gradients

#### Primary Gradient
```css
background: linear-gradient(135deg, #ff6900 0%, #2C39A2 100%);
```
**Usage:** Headers, hero sections, premium features

#### Subtle Gradient (Background)
```css
background: linear-gradient(135deg, 
  rgba(255, 105, 0, 0.08) 0%, 
  rgba(44, 57, 162, 0.08) 100%
);
```
**Usage:** Card backgrounds, section highlights

### Color Accessibility

#### Contrast Ratios (WCAG 2.1 AA)
- **Normal text (< 18px):** Minimum 4.5:1
- **Large text (≥ 18px or 14px bold):** Minimum 3:1
- **UI components:** Minimum 3:1

#### Approved Text/Background Combinations

✅ **High Contrast (AAA):**
- `#212529` (gray-800) on `#ffffff` (white) - 15.8:1
- `#ffffff` (white) on `#2C39A2` (blue) - 8.2:1
- `#ffffff` (white) on `#ff6900` (orange) - 3.9:1

✅ **Acceptable (AA):**
- `#495057` (gray-600) on `#ffffff` (white) - 8.7:1
- `#6c757d` (gray-500) on `#ffffff` (white) - 5.9:1

❌ **Avoid:**
- `#adb5bd` (gray-400) on `#ffffff` (white) - 2.5:1 (fails)
- `#ffc107` (warning) on `#ffffff` (white) - 1.8:1 (fails)

---

## Typography

### Font Family

#### Primary Font
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
  'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

**Why System Fonts?**
- Zero load time (already on device)
- Optimized for each OS
- Familiar to users
- Excellent legibility

**Alternative:** Consider modern web font for brand consistency
- **Option:** Inter, Poppins, or DM Sans
- **Load:** Only if performance impact is minimal (<50KB)

### Type Scale

#### Font Sizes (Mobile-First)
```css
--text-xs:   0.75rem;  /* 12px - Captions, labels */
--text-sm:   0.875rem; /* 14px - Secondary text */
--text-base: 1rem;     /* 16px - Body text (default) */
--text-lg:   1.125rem; /* 18px - Emphasized text */
--text-xl:   1.25rem;  /* 20px - Subheadings */
--text-2xl:  1.5rem;   /* 24px - Section headings */
--text-3xl:  1.875rem; /* 30px - Page headings */
--text-4xl:  2.25rem;  /* 36px - Hero headings */
--text-5xl:  3rem;     /* 48px - Display text (desktop only) */
```

#### Font Weights
```css
--font-normal:   400;  /* Body text, default */
--font-medium:   500;  /* Emphasized text */
--font-semibold: 600;  /* Buttons, headings */
--font-bold:     700;  /* Strong emphasis, hero */
```

#### Line Heights
```css
--leading-none:    1;     /* Tightly packed (avoid) */
--leading-tight:   1.25;  /* Headings */
--leading-snug:    1.375; /* Subheadings */
--leading-normal:  1.5;   /* Body text (default) */
--leading-relaxed: 1.625; /* Long-form content */
--leading-loose:   1.75;  /* Very relaxed (avoid) */
```

#### Letter Spacing
```css
--tracking-tighter: -0.05em;  /* Tight headings */
--tracking-tight:   -0.025em; /* Large headings */
--tracking-normal:  0;        /* Body text (default) */
--tracking-wide:    0.025em;  /* Buttons, labels */
--tracking-wider:   0.05em;   /* All-caps headings */
--tracking-widest:  0.1em;    /* Rare, extreme emphasis */
```

### Typography Hierarchy

#### Headings

```css
/* H1 - Page Title */
h1 {
  font-size: var(--text-3xl);      /* 30px mobile */
  font-weight: var(--font-bold);    /* 700 */
  line-height: var(--leading-tight); /* 1.25 */
  letter-spacing: var(--tracking-tight);
  color: var(--gray-800);
}

@media (min-width: 768px) {
  h1 { font-size: var(--text-4xl); } /* 36px tablet+ */
}

/* H2 - Section Title */
h2 {
  font-size: var(--text-2xl);       /* 24px */
  font-weight: var(--font-semibold); /* 600 */
  line-height: var(--leading-tight);
  color: var(--gray-800);
  margin-bottom: 1rem;
}

/* H3 - Subsection */
h3 {
  font-size: var(--text-xl);        /* 20px */
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  color: var(--gray-700);
  margin-bottom: 0.75rem;
}

/* H4 - Card Title */
h4 {
  font-size: var(--text-lg);        /* 18px */
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  color: var(--gray-700);
}
```

#### Body Text

```css
/* Paragraph - Default */
p {
  font-size: var(--text-base);      /* 16px */
  font-weight: var(--font-normal);   /* 400 */
  line-height: var(--leading-normal); /* 1.5 */
  color: var(--gray-600);
  margin-bottom: 1rem;
}

/* Small Text - Captions, Labels */
.text-sm {
  font-size: var(--text-sm);        /* 14px */
  color: var(--gray-500);
}

/* Extra Small - Fine Print */
.text-xs {
  font-size: var(--text-xs);        /* 12px */
  color: var(--gray-400);
}
```

#### Links

```css
a {
  color: var(--primary-blue);
  text-decoration: underline;
  text-decoration-color: rgba(44, 57, 162, 0.3);
  text-underline-offset: 2px;
  transition: all 150ms ease-in-out;
}

a:hover {
  color: var(--blue-700);
  text-decoration-color: var(--blue-700);
}

a:focus {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
  border-radius: 2px;
}
```

### Typography Best Practices

✅ **Do:**
- Use 16px (1rem) minimum for body text
- Maintain 1.5 line height for readability
- Limit line length to 60-80 characters
- Use hierarchy to guide eye (H1 > H2 > H3)
- Left-align text (avoid justified)

❌ **Don't:**
- Use font sizes smaller than 12px
- Use all-caps for more than a few words
- Center-align long paragraphs
- Use more than 3 font weights
- Mix too many font sizes on one page

---

## Spacing & Layout

### Spacing Scale

**Base Unit:** 4px (0.25rem)

```css
--space-0:  0;
--space-1:  0.25rem;  /* 4px  - Tiny gaps */
--space-2:  0.5rem;   /* 8px  - Compact spacing */
--space-3:  0.75rem;  /* 12px - Small spacing */
--space-4:  1rem;     /* 16px - Base spacing (default) */
--space-5:  1.25rem;  /* 20px - Medium spacing */
--space-6:  1.5rem;   /* 24px - Large spacing */
--space-8:  2rem;     /* 32px - Extra large spacing */
--space-10: 2.5rem;   /* 40px - Section spacing */
--space-12: 3rem;     /* 48px - Major sections */
--space-16: 4rem;     /* 64px - Hero spacing */
--space-20: 5rem;     /* 80px - Extra large sections */
--space-24: 6rem;     /* 96px - Max spacing */
```

### Layout Grid

#### Container
```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4);  /* 16px mobile */
}

@media (min-width: 768px) {
  .container {
    padding: var(--space-6);  /* 24px tablet+ */
  }
}
```

#### Grid System (12 Columns)
```css
.grid {
  display: grid;
  gap: var(--space-4);  /* 16px gap */
}

/* Auto-fit grid (responsive) */
.grid-auto {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

/* 2-column grid (tablet+) */
@media (min-width: 768px) {
  .grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 3-column grid (desktop+) */
@media (min-width: 1024px) {
  .grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Border Radius

```css
--radius-none: 0;
--radius-sm:   0.25rem; /* 4px  - Small elements (inputs, tags) */
--radius-base: 0.5rem;  /* 8px  - Default (buttons, cards) */
--radius-md:   0.75rem; /* 12px - Medium (modals, panels) */
--radius-lg:   1rem;    /* 16px - Large (hero sections) */
--radius-xl:   1.5rem;  /* 24px - Extra large (rare) */
--radius-full: 9999px;  /* Full - Pills, avatars, badges */
```

**Usage:**
- **Inputs:** `radius-sm` (4px)
- **Buttons:** `radius-base` (8px)
- **Cards:** `radius-md` (12px)
- **Modals:** `radius-lg` (16px)
- **Avatars:** `radius-full` (circle)

### Shadows

```css
/* Elevation Levels */
--shadow-none: none;

--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
/* Usage: Subtle cards, inputs */

--shadow-base: 0 1px 3px rgba(0, 0, 0, 0.1),
               0 1px 2px rgba(0, 0, 0, 0.06);
/* Usage: Default cards, dropdowns */

--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07),
             0 2px 4px rgba(0, 0, 0, 0.05);
/* Usage: Hover states, tooltips */

--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1),
             0 4px 6px rgba(0, 0, 0, 0.05);
/* Usage: Modals, drawers */

--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15),
             0 10px 10px rgba(0, 0, 0, 0.04);
/* Usage: Large modals, full-screen overlays */

--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);
/* Usage: Rare, extreme emphasis */
```

**Shadow Usage Guidelines:**
- **Base:** Default cards, panels
- **Medium:** Hover states, tooltips
- **Large:** Modals, overlays
- **Extra Large:** Full-screen takeovers

---

## Components

### Buttons

#### Primary Button (CTA)
```css
.btn-primary {
  background: var(--primary-orange);
  color: white;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  padding: 12px 24px;
  border-radius: var(--radius-base);
  border: none;
  cursor: pointer;
  transition: all 150ms ease-in-out;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--orange-600);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-primary:focus {
  outline: 3px solid rgba(255, 105, 0, 0.3);
  outline-offset: 2px;
}

.btn-primary:disabled {
  background: var(--gray-300);
  color: var(--gray-500);
  cursor: not-allowed;
  box-shadow: none;
}
```

#### Secondary Button
```css
.btn-secondary {
  background: white;
  color: var(--primary-orange);
  border: 2px solid var(--primary-orange);
  /* Rest same as primary */
}

.btn-secondary:hover {
  background: var(--orange-50);
}
```

#### Tertiary Button (Text)
```css
.btn-tertiary {
  background: transparent;
  color: var(--primary-blue);
  border: none;
  padding: 8px 16px;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.btn-tertiary:hover {
  color: var(--blue-700);
  text-decoration-color: var(--blue-700);
}
```

#### Button Sizes
```css
.btn-sm {
  font-size: var(--text-sm);
  padding: 8px 16px;
}

.btn-base {
  font-size: var(--text-base);
  padding: 12px 24px;
}

.btn-lg {
  font-size: var(--text-lg);
  padding: 16px 32px;
}
```

#### Icon Buttons
```css
.btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-base);
}

.btn-icon svg {
  width: 20px;
  height: 20px;
}
```

### Cards

#### Basic Card
```css
.card {
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-base);
  padding: var(--space-6);
  transition: box-shadow 150ms ease-in-out;
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-4);
}

.card-footer {
  border-top: 1px solid var(--gray-200);
  padding-top: var(--space-4);
  margin-top: var(--space-4);
}
```

### Inputs

#### Text Input
```css
.input {
  width: 100%;
  font-size: var(--text-base);
  padding: 12px 16px;
  border: 2px solid var(--gray-300);
  border-radius: var(--radius-sm);
  background: white;
  transition: all 150ms ease-in-out;
}

.input:hover {
  border-color: var(--gray-400);
}

.input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(44, 57, 162, 0.1);
}

.input:disabled {
  background: var(--gray-100);
  color: var(--gray-500);
  cursor: not-allowed;
}

.input-error {
  border-color: var(--error-red);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}
```

#### Input with Label
```html
<div class="input-group">
  <label for="team-name" class="input-label">
    Team Name <span class="required">*</span>
  </label>
  <input 
    id="team-name" 
    type="text" 
    class="input"
    placeholder="Enter team name"
    aria-describedby="team-name-hint"
  />
  <span id="team-name-hint" class="input-hint">
    Choose a unique name for your team
  </span>
</div>
```

```css
.input-group {
  margin-bottom: var(--space-4);
}

.input-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-700);
  margin-bottom: var(--space-2);
}

.input-label .required {
  color: var(--error-red);
}

.input-hint {
  display: block;
  font-size: var(--text-xs);
  color: var(--gray-500);
  margin-top: var(--space-2);
}

.input-error-message {
  display: block;
  font-size: var(--text-sm);
  color: var(--error-red);
  margin-top: var(--space-2);
}
```

### Modals

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.modal {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--gray-200);
}

.modal-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--gray-800);
  margin: 0;
}

.modal-close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms ease-in-out;
}

.modal-close:hover {
  background: var(--gray-100);
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
```

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: 4px 8px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.badge-primary {
  background: var(--orange-100);
  color: var(--orange-700);
}

.badge-success {
  background: var(--success-bg);
  color: var(--success-text);
}

.badge-warning {
  background: var(--warning-bg);
  color: var(--warning-text);
}

.badge-count {
  background: var(--error-red);
  color: white;
  min-width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## Iconography

### Icon System

**Library:** Choose one consistent library
- **Heroicons** (recommended) - MIT license, clean, modern
- **Lucide** - Fork of Feather Icons, very popular
- **Font Awesome** - Comprehensive, requires license for Pro

### Icon Sizes

```css
--icon-xs:  16px;  /* Small inline icons */
--icon-sm:  20px;  /* Default inline icons */
--icon-base: 24px; /* Standard size */
--icon-lg:  32px;  /* Large icons */
--icon-xl:  40px;  /* Hero icons */
```

### Icon Usage

✅ **Do:**
- Use outline style for most icons
- Use solid style for active states
- Maintain consistent size within a component
- Add aria-label to icon-only buttons
- Use semantic icons (trash for delete, pencil for edit)

❌ **Don't:**
- Mix icon styles (outline + solid) in same context
- Scale icons larger than 48px (use illustrations instead)
- Use icons without labels in forms
- Use overly complex icons

### Custom Icons (SVG)

```html
<svg 
  class="icon" 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  stroke-width="2"
  stroke-linecap="round" 
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d="M..." />
</svg>
```

**SVG Best Practices:**
- Use `currentColor` for stroke/fill (inherits text color)
- Set `aria-hidden="true"` for decorative icons
- Optimize SVGs (remove unnecessary attributes)
- Inline SVGs for better control

---

## Motion & Animation

### Animation Principles

1. **Purposeful:** Every animation serves a function
2. **Fast:** 150-300ms for most interactions
3. **Smooth:** Use ease-in-out curves
4. **Subtle:** Don't distract from content
5. **Accessible:** Respect `prefers-reduced-motion`

### Timing

```css
--duration-instant: 0ms;
--duration-fast:    150ms;  /* Hover, focus states */
--duration-base:    300ms;  /* Default transitions */
--duration-slow:    500ms;  /* Modals, drawers */
--duration-slower:  1000ms; /* Page transitions (rare) */
```

### Easing Functions

```css
--ease-linear:     linear;
--ease-in:         cubic-bezier(0.4, 0, 1, 1);      /* Accelerate */
--ease-out:        cubic-bezier(0, 0, 0.2, 1);      /* Decelerate */
--ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1);    /* Default */
--ease-bounce:     cubic-bezier(0.68, -0.55, 0.265, 1.55);  /* Playful */
```

### Common Animations

#### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 300ms ease-in-out;
}
```

#### Slide In (from top)
```css
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-in-top {
  animation: slideInFromTop 300ms ease-out;
}
```

#### Scale In
```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.scale-in {
  animation: scaleIn 200ms ease-out;
}
```

#### Spinner
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

### Transitions

```css
/* Default transition for interactive elements */
button, a, input, .card {
  transition: all 150ms ease-in-out;
}

/* Specific property transitions (more performant) */
.btn {
  transition: background-color 150ms ease-in-out,
              transform 150ms ease-in-out,
              box-shadow 150ms ease-in-out;
}
```

### Reduced Motion

**Always respect user preferences:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Responsive Design

### Breakpoints

```css
/* Mobile-first approach */
/* Base styles: 320px+ (mobile) */

@media (min-width: 640px) { /* sm: Small tablets */ }
@media (min-width: 768px) { /* md: Tablets */ }
@media (min-width: 1024px) { /* lg: Desktops */ }
@media (min-width: 1280px) { /* xl: Large desktops */ }
@media (min-width: 1536px) { /* 2xl: Extra large desktops */ }
```

### Responsive Typography

```css
/* Mobile: 16px base */
html {
  font-size: 16px;
}

/* Tablet: 17px base */
@media (min-width: 768px) {
  html {
    font-size: 17px;
  }
}

/* Desktop: 18px base */
@media (min-width: 1024px) {
  html {
    font-size: 18px;
  }
}
```

### Mobile Optimizations

#### Touch Targets
- Minimum 44x44px (iOS guideline)
- Minimum 48x48px (Android guideline)
- Use larger targets on mobile (easier to tap)

#### Viewport
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
```

#### Mobile Navigation
- Hamburger menu for < 768px
- Full navigation for ≥ 768px
- Bottom navigation bar (optional, for frequent actions)

#### Mobile Forms
- Use appropriate input types (`email`, `tel`, `number`)
- Large form fields (min 44px height)
- Prominent submit buttons
- Inline validation

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast
- **Normal text:** 4.5:1 minimum
- **Large text (18px+ or 14px+ bold):** 3:1 minimum
- **UI components:** 3:1 minimum

#### Keyboard Navigation
- All interactive elements reachable via Tab
- Logical tab order (top-to-bottom, left-to-right)
- Visible focus indicators (outline or border)
- Escape key closes modals/dropdowns

#### Screen Readers
- Semantic HTML (`<header>`, `<nav>`, `<main>`, `<footer>`)
- ARIA labels for icon buttons
- ARIA roles for custom components
- ARIA live regions for dynamic content
- Alt text for all images

#### Focus Management
```css
/* Visible focus indicator */
*:focus {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
}

/* Remove focus outline only if using visible alternative */
button:focus-visible {
  outline: 3px solid var(--primary-blue);
  outline-offset: 2px;
}

button:focus:not(:focus-visible) {
  outline: none;
}
```

### Accessibility Checklist

✅ **Every Component Should:**
- [ ] Have proper semantic HTML
- [ ] Support keyboard navigation
- [ ] Have visible focus indicators
- [ ] Include ARIA labels where needed
- [ ] Pass automated accessibility tests (axe, Lighthouse)
- [ ] Work with screen readers (NVDA, JAWS, VoiceOver)
- [ ] Support browser zoom (up to 200%)
- [ ] Respect `prefers-reduced-motion`

---

## Content Guidelines

### Writing Style

#### Voice
- **Conversational:** Write like you speak
- **Concise:** Get to the point quickly
- **Action-oriented:** Use verbs ("Create team" not "Team creation")
- **Positive:** Focus on what users can do, not what they can't

#### Tone
- **Encouraging:** "You're doing great! Just 2 more athletes to pick."
- **Helpful:** "Need help? Check out our quick guide."
- **Apologetic (errors):** "Sorry about that! Let's try again."
- **Celebratory (success):** "🎉 Your team is ready! Good luck on race day!"

### Button Labels

✅ **Good:**
- "Create Team"
- "Submit Roster"
- "View Leaderboard"
- "Enter Results"

❌ **Bad:**
- "Click Here"
- "Submit"
- "OK"
- "Continue"

### Error Messages

✅ **Good:**
- "Please enter a team name (at least 2 characters)"
- "You're $2,500 over budget. Remove an athlete to continue."
- "This athlete is already on your team. Pick someone else!"

❌ **Bad:**
- "Invalid input"
- "Error: Constraint violation"
- "Cannot proceed"

### Empty States

✅ **Good:**
- "No teams yet. Be the first to create one!"
- "The race hasn't started. Check back on November 3rd!"
- "No athletes confirmed yet. Ask your commissioner to add some."

❌ **Bad:**
- "No data"
- "Empty"
- "Nothing to show"

---

## Implementation Notes

### CSS Organization

**Recommended Structure:**
```
styles/
├── base/
│   ├── reset.css         # CSS reset/normalize
│   ├── variables.css     # Design tokens
│   └── typography.css    # Font styles
├── components/
│   ├── buttons.css       # Button styles
│   ├── cards.css         # Card styles
│   ├── inputs.css        # Form inputs
│   ├── modals.css        # Modal styles
│   └── ...
├── layouts/
│   ├── container.css     # Container styles
│   ├── grid.css          # Grid system
│   └── ...
└── utilities/
    ├── spacing.css       # Margin/padding utilities
    ├── colors.css        # Color utilities
    └── ...
```

### Design Tokens (CSS Variables)

**Location:** `styles/base/variables.css`

```css
:root {
  /* Colors */
  --primary-orange: #ff6900;
  --primary-blue: #2C39A2;
  /* ... all color variables ... */
  
  /* Spacing */
  --space-4: 1rem;
  /* ... all spacing variables ... */
  
  /* Typography */
  --text-base: 1rem;
  --font-normal: 400;
  /* ... all typography variables ... */
  
  /* Shadows, radius, etc. */
}
```

### Component Documentation

**Every component in Storybook should have:**
1. **Overview:** What is this component?
2. **Props:** All props with types and defaults
3. **Examples:** Common use cases
4. **Accessibility:** Keyboard support, ARIA labels
5. **Do's and Don'ts:** Usage guidelines

---

## Changelog

### Version 1.0 (November 21, 2025)
- Initial design guidelines based on UI/UX audit
- Documented current design patterns from style.css
- Defined comprehensive design tokens
- Established component specifications
- Added accessibility guidelines

---

**Document Status:** 🟡 Living Document  
**Last Updated:** November 21, 2025  
**Next Review:** Monthly during redesign, quarterly after launch  
**Owner:** Design Team  
**Approver:** Product Manager

**Related Documents:**
- [UI/UX Audit](PROCESS_UI_UX_AUDIT.md)
- [Redesign Roadmap](REDESIGN_ROADMAP.md)
- [Component Inventory](UI_INVENTORY_QUICK_REFERENCE.md)
