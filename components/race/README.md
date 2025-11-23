# Race Components

Modern, visually engaging race page components built with Chakra UI following the CORE_DESIGN_GUIDELINES.md.

## Components

### RaceHero

Full-width hero section for race pages.

**Features:**
- Background image with semi-transparent navy overlay
- Race logo prominently displayed (left-aligned)
- Race name in bold uppercase white text
- Date and time with icons
- Gradient fade to white at bottom

**Props:**
```typescript
interface RaceHeroProps {
  raceName: string;
  raceDate: string;
  raceTime?: string;
  location?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
}
```

**Usage:**
```tsx
<RaceHero
  raceName="Tokyo Marathon"
  raceDate="2024-03-03T02:10:00Z"
  location="Tokyo, Japan"
  logoUrl="https://example.com/logo.png"
  backgroundImageUrl="https://example.com/background.jpg"
/>
```

### CompactAthleteList

Displays confirmed athletes in horizontally scrollable rows, separated by gender.

**Features:**
- Two rows maximum (Men and Women)
- Horizontal scrolling with custom scrollbar
- Compact circular avatars (60px-80px)
- Fallback initials for missing photos
- Links to athlete detail page
- Smooth hover effects

**Props:**
```typescript
interface CompactAthleteListProps {
  athletes: CompactAthlete[];
  showViewAll?: boolean;
  onViewAll?: () => void;
  title?: string;
}

interface CompactAthlete {
  id: number;
  name: string;
  headshotUrl?: string;
  country?: string;
  gender?: 'M' | 'F' | 'men' | 'women';
}
```

**Usage:**
```tsx
<CompactAthleteList
  athletes={allAthletes}
  title="Confirmed Athletes"
  showViewAll={false}
/>
```

## Design Specifications

### Color Palette
- **Hero Background**: Navy (#161C4F) with 85% opacity overlay
- **Text on Hero**: White (#FFFFFF)
- **Headings**: Navy 800 (#1F2D47)
- **Body Text**: Gray 700 (#3F3F46)

### Spacing
- Hero padding: 8-16 (32px-64px responsive)
- Card gaps: 8-12 (32px-48px responsive)
- Avatar gaps: 4-6 (16px-24px responsive)

### Responsive Breakpoints
- **Mobile**: 320px - 767px (base)
- **Tablet**: 768px - 1023px (md)
- **Desktop**: 1024px+ (lg, xl)

### Accessibility
- ✅ WCAG 2.1 AA compliant contrast ratios
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Touch targets ≥44x44px

## Integration with Database

The components integrate with the `races` table:

```sql
-- Database fields used
logo_url TEXT              -- Race logo image URL
background_image_url TEXT  -- Hero background image URL
name VARCHAR(255)          -- Race name
date DATE                  -- Race date and time
location VARCHAR(255)      -- Race location
```

## Testing

A test page is available at `/test-race-page` with sample data to preview the design without database connection.

## Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Optimized images with lazy loading
- Smooth 60fps scrolling
- Minimal re-renders with React hooks
- CSS-based transitions (hardware accelerated)
