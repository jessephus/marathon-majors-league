# Chakra UI Component Patterns - Marathon Majors Fantasy League

**Document Version:** 1.1  
**Created:** November 21, 2025  
**Last Updated:** November 22, 2025  
**Purpose:** Component pattern documentation for Chakra UI migration  
**Related:** Phase 2 - Component Library Audit & Planning

> **⚠️ Important API Note:** This project uses Chakra UI v3, which changed the color prop from `colorScheme` (v2) to `colorPalette` (v3). Some older code examples in this document may still reference `colorScheme`, but all new code should use `colorPalette`. Our custom wrapper components (`Button.tsx`, `Badge.tsx`) provide clean semantic color support.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Component Architecture](#component-architecture)
3. [Pattern Library](#pattern-library)
4. [Theme Configuration](#theme-configuration)
5. [Best Practices](#best-practices)
6. [Common Pitfalls](#common-pitfalls)
7. [Migration Guide](#migration-guide)

---

## Getting Started

### Prerequisites

```bash
# Install Chakra UI (Phase 1, Weeks 1-2)
npm install @chakra-ui/react @chakra-ui/next-js @emotion/react @emotion/styled framer-motion
```

### Setup ChakraProvider

```tsx
// pages/_app.tsx
import { ChakraProvider } from '@chakra-ui/react';
import theme from '@/theme';

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;
```

### Directory Structure

```
components/chakra/
├── README.md (this file)
├── Button/
│   ├── index.tsx
│   ├── Button.stories.tsx
│   └── __tests__/
│       └── Button.test.tsx
├── Card/
│   ├── index.tsx
│   ├── AthleteCard.tsx
│   ├── TeamCard.tsx
│   └── __tests__/
├── Form/
│   ├── Input.tsx
│   ├── Select.tsx
│   └── FormControl.tsx
├── Modal/
│   ├── BaseModal.tsx
│   ├── TeamCreationModal.tsx
│   └── AthleteModal.tsx
├── Navigation/
│   ├── StickyHeader/
│   ├── BottomToolbar/
│   └── NavigationProvider.tsx
└── DataDisplay/
    ├── Table.tsx
    ├── Badge.tsx
    └── Avatar.tsx
```

---

## Component Architecture

### Component Wrapper Pattern

**Purpose:** Maintain consistent API while migrating to Chakra UI

```tsx
// components/chakra/Button/index.tsx
import { Button as ChakraButton, ButtonProps as ChakraButtonProps } from '@chakra-ui/react';

// Extend Chakra props with custom variants
interface MMFLButtonProps extends Omit<ChakraButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'gold' | 'ghost';
}

export function Button({ variant = 'primary', children, ...props }: MMFLButtonProps) {
  // Map MMFL variants to Chakra props
  const variantMap = {
    primary: { colorScheme: 'navy', variant: 'solid' },
    secondary: { colorScheme: 'navy', variant: 'outline' },
    gold: { bg: 'gold.500', color: 'navy.900', _hover: { bg: 'gold.600' } },
    ghost: { colorScheme: 'navy', variant: 'ghost' },
  };
  
  return (
    <ChakraButton 
      fontWeight="semibold"
      {...variantMap[variant]} 
      {...props}
    >
      {children}
    </ChakraButton>
  );
}

// Export Chakra Button for advanced use cases
export { ChakraButton };
```

**Usage:**
```tsx
import { Button } from '@/components/chakra/Button';

// Simple usage (uses defaults)
<Button>Save Team</Button>

// Custom variant
<Button variant="gold" size="lg">Upgrade to Pro</Button>

// With icons
<Button variant="secondary" leftIcon={<AddIcon />}>
  Add Athlete
</Button>
```

### Composition Pattern

**Purpose:** Build complex components from Chakra primitives

```tsx
// components/chakra/Card/AthleteCard.tsx
import { 
  Card, CardBody, 
  Flex, HStack, VStack, 
  Avatar, Heading, Text, Badge 
} from '@chakra-ui/react';

interface AthleteCardProps {
  athlete: {
    name: string;
    country: string;
    photoUrl?: string;
    personalBest: string;
    salary: number;
  };
  onSelect?: () => void;
}

export function AthleteCard({ athlete, onSelect }: AthleteCardProps) {
  return (
    <Card 
      variant="elevated"
      _hover={{ shadow: 'lg', borderColor: 'navy.300' }}
      cursor={onSelect ? 'pointer' : 'default'}
      onClick={onSelect}
      transition="all 0.2s"
    >
      <CardBody>
        <Flex align="center" gap={4}>
          {/* Avatar */}
          <Avatar 
            name={athlete.name}
            src={athlete.photoUrl}
            size="lg"
            bg="navy.500"
            color="white"
          />
          
          {/* Info */}
          <VStack align="start" flex={1} spacing={1}>
            <Heading size="sm">{athlete.name}</Heading>
            <HStack spacing={2}>
              <Badge colorScheme="navy" variant="solid">
                {athlete.country}
              </Badge>
              <Text fontSize="sm" color="gray.500">
                PB: {athlete.personalBest}
              </Text>
            </HStack>
          </VStack>
          
          {/* Salary */}
          <Text fontSize="lg" fontWeight="bold" color="gold.600">
            ${athlete.salary.toLocaleString()}
          </Text>
        </Flex>
      </CardBody>
    </Card>
  );
}
```

### Render Props Pattern

**Purpose:** Share component logic while maintaining flexibility

```tsx
// components/chakra/DataDisplay/Table.tsx
import { 
  Table, Thead, Tbody, Tr, Th, Td, 
  TableContainer, TableProps 
} from '@chakra-ui/react';

interface ResponsiveTableProps<T> extends TableProps {
  data: T[];
  columns: Array<{
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    isNumeric?: boolean;
  }>;
  onRowClick?: (item: T) => void;
}

export function ResponsiveTable<T>({ 
  data, 
  columns, 
  onRowClick,
  ...tableProps 
}: ResponsiveTableProps<T>) {
  return (
    <TableContainer>
      <Table variant="striped" colorScheme="navy" {...tableProps}>
        <Thead bg="navy.900">
          <Tr>
            {columns.map((col, index) => (
              <Th 
                key={index} 
                color="white" 
                isNumeric={col.isNumeric}
              >
                {col.header}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data.map((item, rowIndex) => (
            <Tr 
              key={rowIndex}
              _hover={{ bg: 'gray.50' }}
              cursor={onRowClick ? 'pointer' : 'default'}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col, colIndex) => (
                <Td key={colIndex} isNumeric={col.isNumeric}>
                  {typeof col.accessor === 'function' 
                    ? col.accessor(item)
                    : String(item[col.accessor])
                  }
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
```

**Usage:**
```tsx
<ResponsiveTable 
  data={teams}
  columns={[
    { header: 'Rank', accessor: (team) => `#${team.rank}` },
    { header: 'Team', accessor: 'name' },
    { header: 'Points', accessor: 'points', isNumeric: true },
  ]}
  onRowClick={(team) => console.log('Clicked:', team)}
/>
```

---

## Pattern Library

### 1. Button Patterns

#### Primary Action Button
```tsx
<Button 
  variant="primary" 
  size="lg"
  isLoading={isSubmitting}
  loadingText="Saving..."
>
  Save Team
</Button>
```

#### Secondary Button with Icon
```tsx
<Button 
  variant="secondary" 
  leftIcon={<InfoIcon />}
  onClick={showHelp}
>
  Learn More
</Button>
```

#### Gold Call-to-Action
```tsx
<Button 
  variant="gold"
  size="lg"
  rightIcon={<ArrowForwardIcon />}
>
  Create Your Team
</Button>
```

#### Icon-Only Button
```tsx
<IconButton 
  icon={<CloseIcon />}
  aria-label="Close modal"
  variant="ghost"
  colorScheme="navy"
/>
```

### 2. Form Patterns

#### Text Input with Validation
```tsx
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
```

#### Select Dropdown
```tsx
<FormControl>
  <FormLabel>Race</FormLabel>
  <Select 
    placeholder="Select race"
    focusBorderColor="navy.500"
    value={selectedRace}
    onChange={(e) => setSelectedRace(e.target.value)}
  >
    <option value="nyc">New York City Marathon</option>
    <option value="boston">Boston Marathon</option>
    <option value="chicago">Chicago Marathon</option>
  </Select>
</FormControl>
```

#### Checkbox Group
```tsx
<CheckboxGroup value={selectedFilters} onChange={setSelectedFilters}>
  <VStack align="start" spacing={2}>
    <Checkbox value="men" colorScheme="navy">Men</Checkbox>
    <Checkbox value="women" colorScheme="navy">Women</Checkbox>
    <Checkbox value="confirmed" colorScheme="navy">Confirmed Only</Checkbox>
  </VStack>
</CheckboxGroup>
```

### 3. Modal Patterns

#### Basic Modal
```tsx
function TeamCreationModal({ isOpen, onClose }) {
  const [teamName, setTeamName] = useState('');
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent>
        <ModalHeader bg="navy.900" color="white" borderTopRadius="lg">
          Create Your Team
        </ModalHeader>
        <ModalCloseButton color="white" />
        
        <ModalBody py={6}>
          <FormControl>
            <FormLabel>Team Name</FormLabel>
            <Input 
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
            />
          </FormControl>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Create Team
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

#### Full-Screen Mobile Modal
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
    <ModalCloseButton />
    <ModalBody>
      {/* Scrollable athlete list */}
    </ModalBody>
  </ModalContent>
</Modal>
```

#### Alert Dialog (Destructive Action)
```tsx
function DeleteTeamDialog({ isOpen, onClose, onConfirm }) {
  const cancelRef = useRef();
  
  return (
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
            <Button colorScheme="red" onClick={onConfirm} ml={3}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}
```

### 4. Card Patterns

#### Elevated Card
```tsx
<Card variant="elevated" borderRadius="lg">
  <CardHeader>
    <Heading size="md">Team Statistics</Heading>
  </CardHeader>
  <CardBody>
    <VStack align="start" spacing={3}>
      <Stat>
        <StatLabel>Total Points</StatLabel>
        <StatNumber>847</StatNumber>
      </Stat>
    </VStack>
  </CardBody>
</Card>
```

#### Clickable Card
```tsx
<Card 
  variant="outline"
  _hover={{ shadow: 'lg', borderColor: 'navy.300' }}
  cursor="pointer"
  onClick={handleClick}
  transition="all 0.2s"
>
  <CardBody>
    {/* Content */}
  </CardBody>
</Card>
```

### 5. Data Display Patterns

#### Badge Usage
```tsx
// Country badge
<Badge colorScheme="navy" variant="solid">KEN</Badge>

// Status badge
<Badge colorScheme="green" variant="subtle">Active</Badge>

// Rank badge
<Badge colorScheme="gold" variant="solid">#1</Badge>
```

#### Avatar with Fallback
```tsx
<Avatar 
  name="Eliud Kipchoge"
  src={athlete.photoUrl}
  size="lg"
  bg="navy.500"
  color="white"
/>
```

#### Stat Display
```tsx
<Stat>
  <StatLabel>Budget Remaining</StatLabel>
  <StatNumber color={remaining < 0 ? 'error.500' : 'success.500'}>
    ${remaining.toLocaleString()}
  </StatNumber>
  <StatHelpText>
    <StatArrow type={remaining < 0 ? 'decrease' : 'increase'} />
    {Math.abs(remaining / 30000 * 100).toFixed(1)}%
  </StatHelpText>
</Stat>
```

### 6. Loading States

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
    color="navy.500" 
    thickness="4px" 
  />
</Center>
```

#### Progress Bar
```tsx
<Progress 
  value={(spent / 30000) * 100} 
  colorScheme={spent > 30000 ? 'red' : 'green'}
  size="lg"
  borderRadius="full"
  hasStripe
  isAnimated
/>
```

### 7. Notification Patterns

#### Toast Notifications
```tsx
const toast = useToast();

// Success toast
const showSuccess = () => {
  toast({
    title: 'Team saved',
    description: 'Your roster has been saved successfully',
    status: 'success',
    duration: 5000,
    isClosable: true,
    position: 'top-right',
  });
};

// Error toast
const showError = () => {
  toast({
    title: 'Error',
    description: 'Failed to save roster. Please try again.',
    status: 'error',
    duration: 7000,
    isClosable: true,
    position: 'top-right',
  });
};

// Warning toast
const showWarning = () => {
  toast({
    title: 'Over budget',
    description: 'Your team is $1,500 over the $30,000 budget',
    status: 'warning',
    duration: null, // Won't auto-dismiss
    isClosable: true,
    position: 'top',
  });
};
```

### 8. Layout Primitive Patterns

#### Container Usage
```tsx
// Standard page container (1280px max-width)
<Container maxW="container.xl" px={4} py={8}>
  <VStack align="stretch" spacing={6}>
    <Heading>Page Title</Heading>
    <Text>Content goes here...</Text>
  </VStack>
</Container>

// Narrow content (forms, articles)
<Container maxW="container.md" px={4} py={8}>
  <FormLayout />
</Container>

// Full-width section with constrained content
<Box bg="navy.900" color="white" py={16}>
  <Container maxW="container.xl" px={4}>
    <Heading size="2xl">Hero Section</Heading>
  </Container>
</Box>
```

#### VStack for Vertical Lists
```tsx
// Standard vertical list (16px gaps)
<VStack align="stretch" spacing={4}>
  <Card>Team 1</Card>
  <Card>Team 2</Card>
  <Card>Team 3</Card>
</VStack>

// Compact list (8px gaps)
<VStack align="stretch" spacing={2}>
  <ListItem />
  <ListItem />
  <ListItem />
</VStack>

// Comfortable list (24px gaps)
<VStack align="stretch" spacing={6}>
  <Section />
  <Section />
</VStack>
```

#### HStack for Button Groups
```tsx
// Standard button group (12px gaps)
<HStack spacing={3}>
  <Button colorScheme="primary">Save</Button>
  <Button variant="outline">Cancel</Button>
  <Button variant="ghost">Skip</Button>
</HStack>

// Icon toolbar (8px gaps)
<HStack spacing={2}>
  <IconButton icon={<EditIcon />} aria-label="Edit" />
  <IconButton icon={<DeleteIcon />} aria-label="Delete" />
  <IconButton icon={<ShareIcon />} aria-label="Share" />
</HStack>
```

#### SimpleGrid for Card Grids
```tsx
// Responsive athlete grid: 1 col mobile → 4 cols desktop
<SimpleGrid 
  columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
  spacing={{ base: 4, md: 6 }}
>
  {athletes.map(athlete => (
    <AthleteCard key={athlete.id} athlete={athlete} />
  ))}
</SimpleGrid>

// Dashboard stats grid
<SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
  <StatCard label="Teams" value="3" />
  <StatCard label="Points" value="2,451" />
  <StatCard label="Rank" value="#12" />
  <StatCard label="Budget" value="$30K" />
</SimpleGrid>
```

#### Grid for Custom Layouts
```tsx
// 2/3 - 1/3 sidebar layout
<Grid 
  templateColumns={{ base: '1fr', lg: '2fr 1fr' }}
  gap={{ base: 6, lg: 8 }}
>
  <GridItem>
    <MainContent />
  </GridItem>
  <GridItem>
    <Sidebar />
  </GridItem>
</Grid>

// 12-column grid system
<Grid templateColumns="repeat(12, 1fr)" gap={6}>
  <GridItem colSpan={{ base: 12, md: 8 }}>
    <Article />
  </GridItem>
  <GridItem colSpan={{ base: 12, md: 4 }}>
    <RelatedLinks />
  </GridItem>
</Grid>
```

#### Flex for Headers and Alignment
```tsx
// Header with logo and actions
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

// Centered content
<Flex justify="center" align="center" minH="100vh">
  <Box textAlign="center">
    <Heading>Loading...</Heading>
    <Spinner size="xl" mt={4} />
  </Box>
</Flex>
```

#### Responsive Stack Pattern
```tsx
// Vertical mobile → Horizontal desktop
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

#### Spacing Scale Reference
```tsx
// Use consistent 4px-based spacing:
spacing={1}  // 4px  - Tight lists
spacing={2}  // 8px  - Compact spacing ⭐ Common
spacing={3}  // 12px - Button groups
spacing={4}  // 16px - Default spacing ⭐ Most common
spacing={6}  // 24px - Card padding ⭐ Common
spacing={8}  // 32px - Section spacing
spacing={12} // 48px - Major sections
```

**See full layout guide:** [UI_LAYOUT_PRIMITIVES.md](../../docs/UI_REDESIGN/UI_LAYOUT_PRIMITIVES.md)

---

## Theme Configuration

### Color Palette
```typescript
// theme/colors.ts
export const colors = {
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
};
```

### Component Styles
```typescript
// theme/components/Button.ts
export const Button = {
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
  },
  defaultProps: {
    size: 'md',
    variant: 'solid',
    colorScheme: 'navy',
  },
};
```

---

## Best Practices

### 1. Use Responsive Utilities

```tsx
// Good: Responsive sizing
<Box 
  fontSize={{ base: 'sm', md: 'md', lg: 'lg' }}
  p={{ base: 4, md: 6, lg: 8 }}
>
  Content
</Box>

// Bad: Fixed sizing
<Box fontSize="lg" p={8}>
  Content
</Box>
```

### 2. Leverage Theme Tokens

```tsx
// Good: Use theme tokens
<Button colorScheme="navy" />
<Text color="gray.600" />

// Bad: Hardcoded values
<Button style={{ backgroundColor: '#4A5F9D' }} />
<Text style={{ color: '#52525B' }} />
```

### 3. Compose Components

```tsx
// Good: Compose from Chakra primitives
<Flex align="center" gap={4}>
  <Avatar {...props} />
  <VStack align="start">
    <Heading size="sm">{name}</Heading>
    <Text>{description}</Text>
  </VStack>
</Flex>

// Bad: Custom CSS
<div className="athlete-card">
  <img />
  <div>
    <h3>{name}</h3>
    <p>{description}</p>
  </div>
</div>
```

### 4. Use Semantic Components

```tsx
// Good: Semantic HTML
<Box as="header" role="banner">
  <Heading as="h1">Page Title</Heading>
</Box>

// Bad: Generic divs
<Box>
  <Text fontSize="2xl" fontWeight="bold">Page Title</Text>
</Box>
```

### 5. Implement Loading States

```tsx
// Good: Show loading state
{isLoading ? (
  <Skeleton height="200px" />
) : (
  <AthleteCard athlete={data} />
)}

// Bad: Show nothing
{!isLoading && <AthleteCard athlete={data} />}
```

---

## Common Pitfalls

### 1. Not Using ColorScheme

```tsx
// ❌ Bad: Manual color props
<Button bg="blue.500" color="white" _hover={{ bg: 'blue.600' }}>
  Click me
</Button>

// ✅ Good: Use colorScheme
<Button colorScheme="blue">
  Click me
</Button>
```

### 2. Forgetting Mobile Responsiveness

```tsx
// ❌ Bad: Desktop-only sizing
<Modal size="xl">
  <ModalContent>
    {/* Content */}
  </ModalContent>
</Modal>

// ✅ Good: Responsive sizing
<Modal size={{ base: 'full', md: 'xl' }}>
  <ModalContent>
    {/* Content */}
  </ModalContent>
</Modal>
```

### 3. Not Managing Focus

```tsx
// ❌ Bad: No focus management
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalContent>
    <Input />
  </ModalContent>
</Modal>

// ✅ Good: Set initial focus
const initialRef = useRef();

<Modal 
  isOpen={isOpen} 
  onClose={onClose}
  initialFocusRef={initialRef}
>
  <ModalContent>
    <Input ref={initialRef} />
  </ModalContent>
</Modal>
```

### 4. Overriding Theme Styles

```tsx
// ❌ Bad: Inline styles override theme
<Button style={{ backgroundColor: 'red' }}>
  Click me
</Button>

// ✅ Good: Use Chakra style props
<Button bg="red.500" _hover={{ bg: 'red.600' }}>
  Click me
</Button>
```

### 5. Not Using Chakra Icons

```tsx
// ❌ Bad: Custom SVG
<button>
  <svg viewBox="0 0 24 24">
    <path d="..." />
  </svg>
</button>

// ✅ Good: Use Chakra Icon
import { CloseIcon } from '@chakra-ui/icons';

<IconButton icon={<CloseIcon />} aria-label="Close" />
```

---

## Migration Guide

### Step 1: Install Dependencies

```bash
npm install @chakra-ui/react @chakra-ui/next-js @emotion/react @emotion/styled framer-motion
```

### Step 2: Set Up Theme

Create `theme/index.ts` with custom colors, fonts, components.

### Step 3: Wrap App with ChakraProvider

```tsx
// pages/_app.tsx
<ChakraProvider theme={theme}>
  <Component {...pageProps} />
</ChakraProvider>
```

### Step 4: Create Component Wrappers

Start with buttons, then forms, then modals.

### Step 5: Migrate Component by Component

Use feature flags to toggle between old and new components.

### Step 6: Test Thoroughly

Visual regression, accessibility, responsive testing.

### Step 7: Remove Legacy Code

After 100% rollout, remove old CSS and components.

---

## Resources

**Official Documentation:**
- [Chakra UI Docs](https://chakra-ui.com/docs)
- [Component Library](https://chakra-ui.com/docs/components)
- [Styling Props](https://chakra-ui.com/docs/styled-system/style-props)

**Internal Documentation:**
- [PHASE2_COMPONENT_MAPPING.md](../docs/PHASE2_COMPONENT_MAPPING.md)
- [PHASE2_NAVIGATION_SPEC.md](../docs/PHASE2_NAVIGATION_SPEC.md)
- [UI_REDESIGN_ROADMAP.md](../docs/UI_REDESIGN_ROADMAP.md)
- [CORE_DESIGN_GUIDELINES.md](../docs/CORE_DESIGN_GUIDELINES.md)

---

**Document Status:** ✅ Active - Update as patterns evolve  
**Last Updated:** November 21, 2025  
**Maintainer:** Project Team  
**Related Issues:** [#120 - Component Audit](https://github.com/jessephus/marathon-majors-league/issues/120)
