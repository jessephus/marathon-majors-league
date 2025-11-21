# Phase 2: Component Library Audit & Chakra UI Migration Mapping

**Document Version:** 1.0  
**Created:** November 21, 2025  
**Phase:** 2 - Component Library Audit & Planning (Weeks 3-4)  
**Related Issue:** [#120 - Component Audit](https://github.com/jessephus/marathon-majors-league/issues/120)  
**Roadmap Reference:** [UI_REDESIGN_ROADMAP.md](UI_REDESIGN_ROADMAP.md)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Complete Component Mapping](#complete-component-mapping)
3. [Migration Priority Matrix](#migration-priority-matrix)
4. [Chakra UI Component Specifications](#chakra-ui-component-specifications)
5. [Implementation Guidelines](#implementation-guidelines)
6. [Risk Assessment](#risk-assessment)
7. [Timeline & Dependencies](#timeline--dependencies)

---

## Executive Summary

### Audit Scope
- **Total Components Audited:** 18 React components + 8 modals
- **Legacy Elements:** 1 (app.js - vanilla JavaScript, ~3,000 lines)
- **Chakra Equivalents Mapped:** 26 component types
- **Migration Complexity:** Medium-High (coexistence with legacy code required)

### Key Findings

✅ **Strengths:**
- Well-organized component structure (by feature/function)
- Consistent prop interfaces
- TypeScript adoption for newer components
- Mobile-first CSS already in place

⚠️ **Challenges:**
- Mixed legacy vanilla JS + React components
- Inconsistent styling patterns (inline styles, CSS modules, vanilla CSS)
- Some components tightly coupled to global state (app.js)
- No component library or design system currently

🎯 **Recommendations:**
1. **Start with atomic components** (buttons, inputs, badges)
2. **Create Chakra component wrappers** (maintain backward compatibility)
3. **Gradual migration with feature flags** (A/B test new vs old)
4. **Build pattern library** (/components/chakra/README.md)

---

## Complete Component Mapping

### 1. Button Components

| Current Component | File Location | Chakra UI Equivalent | Migration Complexity | Priority |
|-------------------|---------------|---------------------|---------------------|----------|
| Primary action buttons | `public/style.css` (`.button-primary`) | `<Button colorScheme="navy">` | Low | P0 |
| Secondary buttons | `public/style.css` (`.button-secondary`) | `<Button variant="outline" colorScheme="navy">` | Low | P0 |
| Gold CTA buttons | `public/style.css` (`.button-gold`) | `<Button bg="gold.500" color="navy.900">` | Low | P0 |
| Ghost buttons | Various inline styles | `<Button variant="ghost" colorScheme="navy">` | Low | P1 |
| Icon buttons | Various | `<IconButton>` | Low | P1 |
| Loading buttons | Manual spinner | `<Button isLoading>` | Medium | P1 |

**Chakra Implementation:**
```tsx
// Primary Button
<Button 
  colorScheme="navy"
  size="lg"
  fontWeight="semibold"
  px={8}
  _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
  _active={{ transform: 'translateY(0)' }}
>
  Save Team
</Button>

// Gold Accent Button
<Button 
  bg="gold.500"
  color="navy.900"
  fontWeight="bold"
  _hover={{ bg: 'gold.600' }}
  leftIcon={<StarIcon />}
>
  Premium Feature
</Button>
```

**Migration Notes:**
- Create theme variants in `theme/components/Button.ts`
- Use Chakra's built-in hover/active states
- Implement loading state with `isLoading` prop
- Replace all `<button>` elements incrementally

---

### 2. Card Components

| Current Component | File Location | Chakra UI Equivalent | Migration Complexity | Priority |
|-------------------|---------------|---------------------|---------------------|----------|
| **WelcomeCard** | `components/WelcomeCard.jsx` | `<Box>` + custom layout | Medium | P0 |
| **RosterSlots** (athlete cards) | `components/RosterSlots.tsx` | `<Card>` + `<CardBody>` | High | P0 |
| Athlete selection cards | `components/AthleteSelectionModal.tsx` | `<Card variant="athlete">` | High | P0 |
| Leaderboard row cards | `components/LeaderboardTable.tsx` | `<Card variant="leaderboard">` | Medium | P1 |
| Commissioner panel cards | `components/commissioner/*.tsx` | `<Card variant="elevated">` | Medium | P2 |

**Chakra Implementation:**
```tsx
// Athlete Card Component
<Card 
  variant="elevated"
  borderRadius="lg"
  _hover={{ shadow: 'lg', borderColor: 'navy.300' }}
  transition="all 0.2s"
>
  <CardBody>
    <HStack spacing={4}>
      <Avatar name={athlete.name} src={athlete.photoUrl} size="lg" />
      <VStack align="start" flex={1} spacing={1}>
        <Heading size="sm">{athlete.name}</Heading>
        <HStack spacing={2}>
          <Badge colorScheme="navy">{athlete.country}</Badge>
          <Text fontSize="sm" color="gray.500">PB: {athlete.pb}</Text>
        </HStack>
      </VStack>
      <Text fontSize="lg" fontWeight="bold" color="gold.600">
        ${athlete.salary.toLocaleString()}
      </Text>
    </HStack>
  </CardBody>
</Card>
```

**Migration Notes:**
- Create reusable `<AthleteCard>` component wrapper
- Extract card variants to theme
- Implement loading skeleton states
- Maintain responsive grid layout

---

### 3. Form Components

| Current Component | File Location | Chakra UI Equivalent | Migration Complexity | Priority |
|-------------------|---------------|---------------------|---------------------|----------|
| Team name input | `components/TeamCreationModal.tsx` | `<Input>` + `<FormControl>` | Low | P0 |
| TOTP code input | `components/CommissionerTOTPModal.tsx` | `<PinInput>` | Medium | P0 |
| Athlete filters (dropdowns) | `components/AthleteSelectionModal.tsx` | `<Select>` | Low | P1 |
| Result entry forms | `components/commissioner/*.tsx` | `<FormControl>` + validation | Medium | P2 |
| Race creation forms | `components/commissioner/RaceManagementPanel.tsx` | Complex form layout | High | P2 |

**Chakra Implementation:**
```tsx
// Team Name Input with Validation
<FormControl isInvalid={!!errors.teamName}>
  <FormLabel color="navy.700">Team Name</FormLabel>
  <Input 
    placeholder="Enter your team name"
    value={teamName}
    onChange={(e) => setTeamName(e.target.value)}
    focusBorderColor="navy.500"
    errorBorderColor="error.500"
  />
  {errors.teamName && (
    <FormErrorMessage>{errors.teamName}</FormErrorMessage>
  )}
  <FormHelperText>Choose a unique name for your team</FormHelperText>
</FormControl>

// TOTP Pin Input
<PinInput 
  size="lg" 
  mask 
  focusBorderColor="navy.500"
  otp
>
  <PinInputField />
  <PinInputField />
  <PinInputField />
  <PinInputField />
  <PinInputField />
  <PinInputField />
</PinInput>
```

**Migration Notes:**
- Use `<FormControl>` for all form fields
- Implement validation with `isInvalid` prop
- Add `FormErrorMessage` and `FormHelperText`
- Use `PinInput` for TOTP (better UX than text input)

---

### 4. Modal Components

| Current Component | File Location | Chakra UI Equivalent | Migration Complexity | Priority |
|-------------------|---------------|---------------------|---------------------|----------|
| **TeamCreationModal** | `components/TeamCreationModal.tsx` | `<Modal>` + `<ModalContent>` | Medium | P0 |
| **CommissionerTOTPModal** | `components/CommissionerTOTPModal.tsx` | `<Modal>` + focus management | Medium | P0 |
| **AthleteSelectionModal** | `components/AthleteSelectionModal.tsx` | `<Modal size="full">` (mobile) | High | P0 |
| **AthleteModal** | `components/AthleteModal.tsx` | `<Modal>` + scrollable body | Medium | P1 |
| **PointsModal** | `components/PointsModal.tsx` | `<Modal size="md">` | Low | P1 |
| **RaceDetailModal** | `components/RaceDetailModal.tsx` | `<Modal>` | Low | P2 |
| Confirmation dialogs | `window.confirm()` | `<AlertDialog>` | Medium | P1 |

**Chakra Implementation:**
```tsx
// Team Creation Modal
<Modal 
  isOpen={isOpen} 
  onClose={onClose} 
  size="lg"
  isCentered
>
  <ModalOverlay bg="blackAlpha.600" />
  <ModalContent>
    <ModalHeader 
      bg="navy.900" 
      color="white"
      borderTopRadius="lg"
    >
      Create Your Team
    </ModalHeader>
    <ModalCloseButton color="white" />
    
    <ModalBody py={6}>
      {/* Form content */}
    </ModalBody>
    
    <ModalFooter>
      <Button variant="ghost" mr={3} onClick={onClose}>
        Cancel
      </Button>
      <Button colorScheme="navy" onClick={handleSubmit}>
        Create Team
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>

// Full-Screen Mobile Modal (Athlete Selection)
<Modal 
  isOpen={isOpen} 
  onClose={onClose}
  size={{ base: 'full', md: 'xl' }}
  scrollBehavior="inside"
>
  {/* Content */}
</Modal>

// Confirmation Alert Dialog
<AlertDialog
  isOpen={isOpen}
  leastDestructiveRef={cancelRef}
  onClose={onClose}
>
  <AlertDialogOverlay>
    <AlertDialogContent>
      <AlertDialogHeader>Delete Team</AlertDialogHeader>
      <AlertDialogBody>
        Are you sure? This action cannot be undone.
      </AlertDialogBody>
      <AlertDialogFooter>
        <Button ref={cancelRef} onClick={onClose}>
          Cancel
        </Button>
        <Button colorScheme="red" onClick={handleDelete} ml={3}>
          Delete
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialogOverlay>
</AlertDialog>
```

**Migration Notes:**
- Replace all custom modal overlays with Chakra `<Modal>`
- Implement proper focus management (accessibility)
- Use `<AlertDialog>` for destructive actions
- Add entrance/exit animations (Chakra default)
- Make modals responsive (full-screen on mobile)

---

### 5. Data Display Components

| Current Component | File Location | Chakra UI Equivalent | Migration Complexity | Priority |
|-------------------|---------------|---------------------|---------------------|----------|
| **LeaderboardTable** | `components/LeaderboardTable.tsx` | `<Table>` + responsive | High | P0 |
| **ResultsTable** | `components/ResultsTable.tsx` | `<Table>` + sortable | High | P0 |
| **BudgetTracker** | `components/BudgetTracker.tsx` | `<Stat>` + `<Progress>` | Medium | P0 |
| Athlete badges (country) | Various | `<Badge>` | Low | P1 |
| Rank indicators | Various | `<Badge>` or `<Tag>` | Low | P1 |
| Athlete avatars | Various | `<Avatar>` | Low | P1 |
| Stats displays | Various | `<Stat>` + `<StatLabel>` | Low | P1 |

**Chakra Implementation:**
```tsx
// Leaderboard Table (Responsive)
<TableContainer>
  <Table variant="striped" colorScheme="navy" size="sm">
    <Thead bg="navy.900">
      <Tr>
        <Th color="white">Rank</Th>
        <Th color="white">Team</Th>
        <Th color="white" isNumeric>Points</Th>
      </Tr>
    </Thead>
    <Tbody>
      {teams.map((team, index) => (
        <Tr 
          key={team.id}
          bg={team.isCurrentUser ? 'gold.50' : undefined}
          _hover={{ bg: 'gray.50' }}
        >
          <Td>
            {index < 3 ? (
              <HStack>
                <Text>{index + 1}</Text>
                <Text>{['🥇', '🥈', '🥉'][index]}</Text>
              </HStack>
            ) : (
              <Text>{index + 1}</Text>
            )}
          </Td>
          <Td fontWeight="semibold">{team.name}</Td>
          <Td isNumeric>{team.points}</Td>
        </Tr>
      ))}
    </Tbody>
  </Table>
</TableContainer>

// Budget Tracker
<VStack align="stretch" spacing={3}>
  <HStack justify="space-between">
    <Stat>
      <StatLabel>Budget</StatLabel>
      <StatNumber>$30,000</StatNumber>
    </Stat>
    <Stat>
      <StatLabel>Spent</StatLabel>
      <StatNumber color={spent > 30000 ? 'error.500' : 'navy.700'}>
        ${spent.toLocaleString()}
      </StatNumber>
    </Stat>
    <Stat>
      <StatLabel>Remaining</StatLabel>
      <StatNumber color={remaining < 0 ? 'error.500' : 'success.500'}>
        ${remaining.toLocaleString()}
      </StatNumber>
    </Stat>
  </HStack>
  <Progress 
    value={(spent / 30000) * 100} 
    colorScheme={remaining < 0 ? 'red' : remaining < 3000 ? 'yellow' : 'green'}
    size="lg"
    borderRadius="full"
  />
</VStack>

// Country Badge
<Badge colorScheme="navy" variant="solid" fontSize="xs">
  {athlete.country}
</Badge>

// Avatar with Fallback
<Avatar 
  name={athlete.name}
  src={athlete.photoUrl}
  size="lg"
  bg="navy.500"
  color="white"
/>
```

**Migration Notes:**
- Use `<TableContainer>` for horizontal scroll on mobile
- Implement sticky table headers
- Add sorting functionality (controlled component)
- Use `<Stat>` components for numeric displays
- Create avatar fallbacks for missing images

---

### 6. Navigation Components

| Current Component | File Location | Chakra UI Equivalent | Migration Complexity | Priority |
|-------------------|---------------|---------------------|---------------------|----------|
| **Footer** | `components/Footer.tsx` | Custom navbar (mobile/desktop) | High | P0 |
| Header | Inline in pages | `<Flex>` as sticky header | Medium | P0 |
| Bottom toolbar | Not yet implemented | Custom `<Flex>` component | High | P0 |
| Breadcrumbs | Not implemented | `<Breadcrumb>` | Low | P2 |

**Chakra Implementation:**
```tsx
// Sticky Header (Desktop)
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
    <Image src="/logo-full.svg" h="36px" alt="MMFL" />
  </HStack>
  
  <HStack spacing={8}>
    <Link href="/" fontWeight="medium">Home</Link>
    <Link href="/team">My Team</Link>
    <Link href="/leaderboard">Standings</Link>
    <Link href="/athletes">Athletes</Link>
  </HStack>
  
  <HStack spacing={4} flex={1} justify="flex-end">
    <Link href="/help">Help</Link>
    <Button size="sm" variant="outline" colorScheme="gold">
      Logout
    </Button>
  </HStack>
</Flex>

// Bottom Toolbar (Mobile Only)
<Flex 
  as="nav"
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
  display={{ base: 'flex', md: 'none' }}
>
  <VStack 
    spacing={0}
    flex={1}
    as="button"
    onClick={() => router.push('/')}
    color={isActive('/') ? 'navy.500' : 'gray.400'}
  >
    <Icon as={HomeIcon} boxSize={6} />
    <Text fontSize="xs" fontWeight={isActive('/') ? 'semibold' : 'normal'}>
      Home
    </Text>
  </VStack>
  {/* Repeat for other nav items */}
</Flex>
```

**Migration Notes:**
- Create separate `<StickyHeader>` component
- Create `<BottomNav>` component (mobile-only)
- Implement route-aware active states
- Add smooth transitions on scroll
- Ensure touch targets are 44x44px minimum

**See [PHASE2_NAVIGATION_SPEC.md](PHASE2_NAVIGATION_SPEC.md) for complete navigation specifications**

---

### 7. Utility Components

| Current Component | File Location | Chakra UI Equivalent | Migration Complexity | Priority |
|-------------------|---------------|---------------------|---------------------|----------|
| **SkeletonLoader** | `components/PerformanceDashboard.tsx` | `<Skeleton>` | Low | P1 |
| Loading spinners | Inline | `<Spinner>` | Low | P1 |
| Tooltips | Not implemented | `<Tooltip>` | Low | P2 |
| Toast notifications | Not implemented | `useToast()` hook | Medium | P0 |

**Chakra Implementation:**
```tsx
// Skeleton Loader
<VStack spacing={4} align="stretch">
  <Skeleton height="60px" borderRadius="md" />
  <Skeleton height="200px" borderRadius="md" />
  <Skeleton height="40px" borderRadius="md" width="50%" />
</VStack>

// Toast Notification
const toast = useToast();

const showSuccessToast = () => {
  toast({
    title: 'Team saved',
    description: 'Your roster has been saved successfully',
    status: 'success',
    duration: 5000,
    isClosable: true,
    position: 'top-right',
  });
};

// Tooltip
<Tooltip 
  label="Select 3 men and 3 women within your $30,000 budget"
  placement="top"
  hasArrow
>
  <IconButton 
    icon={<InfoIcon />}
    aria-label="Help"
    variant="ghost"
    size="sm"
  />
</Tooltip>
```

**Migration Notes:**
- Replace custom loading spinners with `<Spinner>`
- Use `<Skeleton>` for content placeholders
- Implement toast system (replaces `alert()`)
- Add tooltips for contextual help

---

## Migration Priority Matrix

### Priority 0 (Critical - Week 3-4)
**Goal:** Foundation components that all other components depend on

| Component | Complexity | Est. Hours | Blocker For |
|-----------|-----------|-----------|-------------|
| Button variants | Low | 4 | All forms, modals |
| Toast system | Medium | 6 | Error handling, notifications |
| TeamCreationModal | Medium | 8 | Landing page |
| CommissionerTOTPModal | Medium | 6 | Commissioner access |
| RosterSlots (athlete cards) | High | 12 | Team page core functionality |
| AthleteSelectionModal | High | 16 | Draft interface |
| LeaderboardTable | High | 12 | Standings display |
| BudgetTracker | Medium | 8 | Draft validation |
| Sticky Header | Medium | 8 | All pages |
| Bottom Toolbar | High | 12 | Mobile navigation |

**Total Estimate:** 92 hours (~2 weeks for 1 developer)

### Priority 1 (High - Week 5-6)
**Goal:** Enhance core functionality and UX

| Component | Complexity | Est. Hours | Dependencies |
|-----------|-----------|-----------|--------------|
| ResultsTable | High | 10 | LeaderboardTable |
| AthleteModal | Medium | 8 | Modal system |
| PointsModal | Low | 4 | Modal system |
| Form components | Low | 6 | Button variants |
| Badge components | Low | 2 | - |
| Avatar components | Low | 3 | - |
| Skeleton loaders | Low | 4 | - |
| AlertDialog | Medium | 6 | Modal system |

**Total Estimate:** 43 hours (~1 week for 1 developer)

### Priority 2 (Medium - Week 7-8)
**Goal:** Commissioner tools and advanced features

| Component | Complexity | Est. Hours | Dependencies |
|-----------|-----------|-----------|--------------|
| Commissioner panels | High | 20 | All form components |
| RaceDetailModal | Low | 4 | Modal system |
| WelcomeCard redesign | Medium | 8 | Card components |
| Breadcrumb navigation | Low | 3 | Header |
| Tooltip system | Low | 4 | - |

**Total Estimate:** 39 hours (~1 week for 1 developer)

---

## Chakra UI Component Specifications

### Theme Configuration Structure

```typescript
// theme/index.ts
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { colors } from './colors';
import { fonts } from './fonts';
import { components } from './components';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  components,
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

### Component Theme Overrides

**Button Component:**
```typescript
// theme/components/Button.ts
import { defineStyleConfig } from '@chakra-ui/react';

export const Button = defineStyleConfig({
  baseStyle: {
    fontWeight: 'semibold',
    borderRadius: 'md',
  },
  variants: {
    solid: {
      bg: 'navy.500',
      color: 'white',
      _hover: {
        bg: 'navy.600',
        transform: 'translateY(-2px)',
        shadow: 'md',
      },
      _active: {
        bg: 'navy.700',
        transform: 'translateY(0)',
      },
    },
    gold: {
      bg: 'gold.500',
      color: 'navy.900',
      _hover: {
        bg: 'gold.600',
      },
      _active: {
        bg: 'gold.700',
      },
    },
  },
  sizes: {
    sm: {
      fontSize: 'sm',
      px: 4,
      py: 2,
    },
    md: {
      fontSize: 'md',
      px: 6,
      py: 3,
    },
    lg: {
      fontSize: 'lg',
      px: 8,
      py: 4,
    },
  },
  defaultProps: {
    size: 'md',
    variant: 'solid',
    colorScheme: 'navy',
  },
});
```

**Card Component:**
```typescript
// theme/components/Card.ts
import { defineStyleConfig } from '@chakra-ui/react';

export const Card = defineStyleConfig({
  baseStyle: {
    container: {
      bg: 'white',
      borderRadius: 'lg',
      border: '1px solid',
      borderColor: 'gray.200',
      shadow: 'sm',
      transition: 'all 0.2s',
    },
  },
  variants: {
    elevated: {
      container: {
        shadow: 'md',
        _hover: {
          shadow: 'lg',
        },
      },
    },
    athlete: {
      container: {
        _hover: {
          shadow: 'lg',
          borderColor: 'navy.300',
        },
      },
    },
  },
  defaultProps: {
    variant: 'elevated',
  },
});
```

---

## Implementation Guidelines

### 1. Coexistence Strategy

**Phase 1: Side-by-Side (Weeks 3-4)**
```typescript
// Feature flag approach
import { getFeatureFlag } from '@/lib/feature-flags';

export function TeamCreationButton() {
  const useChakraButton = getFeatureFlag('chakra_buttons');
  
  if (useChakraButton) {
    return <ChakraButton colorScheme="navy">Create Team</ChakraButton>;
  }
  
  return <button className="button-primary">Create Team</button>;
}
```

**Phase 2: Migration (Weeks 5-8)**
- Gradually increase feature flag percentage (10% → 50% → 100%)
- Monitor error rates and user feedback
- Roll back instantly if issues detected

**Phase 3: Cleanup (Weeks 9-10)**
- Remove feature flags
- Delete legacy CSS
- Remove old components

### 2. Component Wrapper Pattern

Create wrapper components that maintain the same API:

```typescript
// components/chakra/Button.tsx
import { Button as ChakraButton, ButtonProps } from '@chakra-ui/react';

interface MMFLButtonProps extends ButtonProps {
  variant?: 'primary' | 'secondary' | 'gold' | 'ghost';
}

export function Button({ variant = 'primary', ...props }: MMFLButtonProps) {
  const variantMap = {
    primary: { colorScheme: 'navy', variant: 'solid' },
    secondary: { colorScheme: 'navy', variant: 'outline' },
    gold: { bg: 'gold.500', color: 'navy.900', _hover: { bg: 'gold.600' } },
    ghost: { colorScheme: 'navy', variant: 'ghost' },
  };
  
  return <ChakraButton {...variantMap[variant]} {...props} />;
}
```

### 3. Testing Strategy

**Unit Tests:**
```typescript
// components/chakra/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { Button } from '../Button';
import theme from '@/theme';

describe('Button Component', () => {
  it('renders primary variant correctly', () => {
    render(
      <ChakraProvider theme={theme}>
        <Button variant="primary">Click me</Button>
      </ChakraProvider>
    );
    
    const button = screen.getByText('Click me');
    expect(button).toBeInTheDocument();
    expect(button).toHaveStyle({ backgroundColor: theme.colors.navy[500] });
  });
});
```

**Visual Regression Tests:**
- Use Storybook + Chromatic for visual testing
- Capture screenshots before/after migration
- Compare side-by-side for consistency

**Accessibility Tests:**
- Use `jest-axe` for automated a11y testing
- Manual keyboard navigation testing
- Screen reader testing (NVDA, VoiceOver)

### 4. Documentation Pattern

Every component should have:

1. **Component File** (`components/chakra/[Component].tsx`)
2. **Story File** (`components/chakra/[Component].stories.tsx`)
3. **Test File** (`components/chakra/__tests__/[Component].test.tsx`)
4. **Usage Documentation** (in `/components/chakra/README.md`)

---

## Risk Assessment

### High Risk Items

#### 1. Budget Tracker Performance
**Risk:** Real-time calculations may cause performance issues  
**Mitigation:**
- Use React.memo() for expensive calculations
- Debounce state updates
- Use Chakra's optimized `<Progress>` component
- Benchmark before/after migration

#### 2. Athlete Selection Modal (Mobile)
**Risk:** Full-screen modal with 200+ athletes may lag on low-end devices  
**Mitigation:**
- Implement virtual scrolling (react-window)
- Lazy load athlete images
- Use Chakra's `useVirtualizer` hook
- Add loading skeleton placeholders

#### 3. Leaderboard Table Responsiveness
**Risk:** Large tables don't work well on mobile  
**Mitigation:**
- Use horizontal scroll with sticky columns
- Implement card view for mobile (< 768px)
- Use Chakra's responsive utilities
- Test on real devices (iPhone SE, Android)

### Medium Risk Items

#### 1. Legacy Code Conflicts
**Risk:** app.js may interfere with React components  
**Mitigation:**
- Use feature flags for gradual rollout
- Test with legacy code enabled/disabled
- Monitor console errors
- Have rollback plan ready

#### 2. Bundle Size Increase
**Risk:** Chakra UI adds ~50KB to bundle  
**Mitigation:**
- Tree-shake unused components
- Lazy-load modals and panels
- Use Next.js dynamic imports
- Monitor bundle analyzer reports

### Low Risk Items

#### 1. Design Inconsistencies
**Risk:** New components may not match brand exactly  
**Mitigation:**
- Create comprehensive theme file
- Use design tokens consistently
- Review with stakeholders early
- Iterate based on feedback

---

## Timeline & Dependencies

### Week 3: Foundation Setup (40 hours)

**Tasks:**
- [x] Install Chakra UI and dependencies
- [x] Create theme configuration (colors, fonts, spacing)
- [x] Set up ChakraProvider in _app.tsx
- [ ] Create component wrapper utilities
- [ ] Implement feature flag system
- [ ] Document migration patterns

**Deliverables:**
- ✅ Chakra UI installed and configured
- ✅ Theme file with navy/gold palette
- ✅ Proof-of-concept component (Button)

### Week 4: Core Components (52 hours)

**Priority 0 Components:**
- [ ] Button variants (4 hours)
- [ ] Toast notification system (6 hours)
- [ ] TeamCreationModal (8 hours)
- [ ] CommissionerTOTPModal (6 hours)
- [ ] RosterSlots athlete cards (12 hours)
- [ ] AthleteSelectionModal (16 hours)

**Deliverables:**
- ✅ All P0 components migrated
- ✅ Feature flags in place
- ✅ Unit tests passing

### Week 5-6: Navigation & Data Display (50 hours)

**Navigation:**
- [ ] Sticky Header component (8 hours)
- [ ] Bottom Toolbar component (12 hours)
- [ ] Route-aware active states (4 hours)

**Data Display:**
- [ ] LeaderboardTable (12 hours)
- [ ] ResultsTable (10 hours)
- [ ] BudgetTracker (8 hours)

**Deliverables:**
- ✅ Navigation system complete
- ✅ Data tables migrated
- ✅ Mobile responsiveness tested

### Dependencies Graph

```
Chakra Theme
  ├─> Button Components (P0)
  │     ├─> Form Components (P1)
  │     └─> Modal System (P0)
  │           ├─> TeamCreationModal (P0)
  │           ├─> CommissionerTOTPModal (P0)
  │           ├─> AthleteSelectionModal (P0)
  │           ├─> AthleteModal (P1)
  │           └─> PointsModal (P1)
  ├─> Card Components (P0)
  │     ├─> RosterSlots (P0)
  │     ├─> AthleteCard (P0)
  │     └─> WelcomeCard (P2)
  ├─> Navigation Components (P0)
  │     ├─> StickyHeader (P0)
  │     ├─> BottomNav (P0)
  │     └─> Footer (refactor) (P1)
  └─> Data Display (P0)
        ├─> LeaderboardTable (P0)
        ├─> ResultsTable (P1)
        ├─> BudgetTracker (P0)
        ├─> Badge/Avatar (P1)
        └─> Stat displays (P1)
```

---

## Next Steps

### Immediate (This Week)
1. ✅ Complete component mapping audit
2. ✅ Document navigation specifications
3. ✅ Update UI_REDESIGN_ROADMAP.md
4. [ ] Get stakeholder approval
5. [ ] Begin Week 3 implementation

### Short-Term (Weeks 3-4)
1. Install and configure Chakra UI
2. Create theme file with navy/gold palette
3. Build proof-of-concept components
4. Set up feature flag system
5. Migrate Priority 0 components

### Medium-Term (Weeks 5-8)
1. Complete Priority 1 components
2. Implement navigation system
3. Test on real devices
4. Gather user feedback
5. Begin Priority 2 migration

---

## Related Documentation

- **[PHASE2_NAVIGATION_SPEC.md](PHASE2_NAVIGATION_SPEC.md)** - Complete navigation specifications
- **[UI_REDESIGN_ROADMAP.md](UI_REDESIGN_ROADMAP.md)** - Overall redesign roadmap
- **[CORE_DESIGN_GUIDELINES.md](CORE_DESIGN_GUIDELINES.md)** - Design system specifications
- **[UI_INVENTORY_QUICK_REFERENCE.md](UI_INVENTORY_QUICK_REFERENCE.md)** - Current component inventory
- **[/components/chakra/README.md](/components/chakra/README.md)** - Component pattern documentation

---

**Document Status:** ✅ Complete - Ready for Phase 2 implementation  
**Last Updated:** November 21, 2025  
**Next Review:** After Week 4 (Priority 0 completion)  
**Maintainer:** Project Team  
**Related Issues:** [#120 - Component Audit](https://github.com/jessephus/marathon-majors-league/issues/120)
