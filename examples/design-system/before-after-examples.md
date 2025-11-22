# Before/After Migration Examples

This guide shows side-by-side comparisons of legacy code (vanilla HTML/CSS/JS) and modern Chakra UI equivalents. Each example demonstrates the benefits of migrating to the design system.

---

## Table of Contents

1. [Buttons](#buttons)
2. [Forms](#forms)
3. [Cards](#cards)
4. [Modals](#modals)
5. [Navigation](#navigation)
6. [Tables](#tables)
7. [Loading States](#loading-states)
8. [Responsive Layouts](#responsive-layouts)

---

## Buttons

### Primary Button

#### ❌ Before (Legacy)

```html
<!-- HTML -->
<button class="btn btn-primary" onclick="createTeam()">
  Create Team
</button>
```

```css
/* CSS */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #ff6900;
  color: white;
}

.btn-primary:hover {
  background-color: #e65e00;
}

.btn-primary:active {
  background-color: #cc5400;
}
```

**Issues:**
- 🔴 Hard-coded colors (not theme-based)
- 🔴 Manual responsive sizing needed
- 🔴 Limited accessibility (no focus states)
- 🔴 No loading state support

#### ✅ After (Chakra UI)

```tsx
import { Button } from '@chakra-ui/react';

<Button 
  colorPalette="primary"
  size="lg"
  onClick={createTeam}
>
  Create Team
</Button>
```

**Benefits:**
- ✅ Theme-based colors (automatic dark mode support)
- ✅ Responsive sizing built-in
- ✅ Full accessibility (focus, keyboard nav)
- ✅ Loading state: `isLoading={true}`
- ✅ Icons support: `leftIcon={<AddIcon />}`
- ✅ Only 4 lines vs 20+ lines

---

### Icon Button

#### ❌ Before (Legacy)

```html
<button class="icon-btn" onclick="closeModal()" aria-label="Close">
  <svg viewBox="0 0 24 24" class="icon">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
</button>
```

```css
.icon-btn {
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
}

.icon-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}
```

#### ✅ After (Chakra UI)

```tsx
import { IconButton } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';

<IconButton 
  icon={<CloseIcon />}
  aria-label="Close"
  variant="ghost"
  onClick={closeModal}
/>
```

**Benefits:**
- ✅ Icon library included
- ✅ Consistent sizing
- ✅ Proper ARIA label enforcement
- ✅ Theme-based hover states

---

## Forms

### Text Input with Validation

#### ❌ Before (Legacy)

```html
<div class="form-group">
  <label for="teamName" class="form-label">Team Name</label>
  <input 
    type="text" 
    id="teamName" 
    class="form-input"
    placeholder="Enter your team name"
    oninput="validateTeamName(this.value)"
  />
  <span class="error-message" id="teamNameError"></span>
  <small class="help-text">Choose a unique name for your team</small>
</div>
```

```css
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2A3B5E;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #C3CDE3;
  border-radius: 4px;
  font-size: 16px;
}

.form-input:focus {
  outline: none;
  border-color: #4A5F9D;
  box-shadow: 0 0 0 3px rgba(74, 95, 157, 0.1);
}

.form-input.error {
  border-color: #E53E3E;
}

.error-message {
  display: block;
  color: #E53E3E;
  font-size: 14px;
  margin-top: 4px;
}

.help-text {
  display: block;
  color: #718096;
  font-size: 14px;
  margin-top: 4px;
}
```

```javascript
// JavaScript validation
function validateTeamName(value) {
  const error = document.getElementById('teamNameError');
  const input = document.getElementById('teamName');
  
  if (value.length < 3) {
    error.textContent = 'Team name must be at least 3 characters';
    input.classList.add('error');
  } else {
    error.textContent = '';
    input.classList.remove('error');
  }
}
```

**Issues:**
- 🔴 70+ lines of code for one input
- 🔴 Manual error state management
- 🔴 No built-in validation
- 🔴 Inconsistent styling

#### ✅ After (Chakra UI)

```tsx
import { FormControl, FormLabel, Input, FormErrorMessage, FormHelperText } from '@chakra-ui/react';
import { useState } from 'react';

function TeamNameInput() {
  const [teamName, setTeamName] = useState('');
  const isError = teamName.length > 0 && teamName.length < 3;

  return (
    <FormControl isInvalid={isError}>
      <FormLabel>Team Name</FormLabel>
      <Input 
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        placeholder="Enter your team name"
        focusBorderColor="primary.500"
      />
      {isError && (
        <FormErrorMessage>
          Team name must be at least 3 characters
        </FormErrorMessage>
      )}
      <FormHelperText>Choose a unique name for your team</FormHelperText>
    </FormControl>
  );
}
```

**Benefits:**
- ✅ 20 lines vs 70+ lines
- ✅ Built-in error states
- ✅ Automatic ARIA associations
- ✅ Theme-based styling
- ✅ React state management

---

## Cards

### Athlete Card

#### ❌ Before (Legacy)

```html
<div class="athlete-card" onclick="selectAthlete(12)">
  <img src="/athletes/kipchoge.jpg" alt="Eliud Kipchoge" class="athlete-photo">
  <div class="athlete-info">
    <h3 class="athlete-name">Eliud Kipchoge</h3>
    <div class="athlete-meta">
      <span class="country-badge">KEN</span>
      <span class="pb-time">PB: 2:01:09</span>
    </div>
  </div>
  <div class="athlete-salary">$5,000</div>
</div>
```

```css
.athlete-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #E4E9F2;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.athlete-card:hover {
  border-color: #4A5F9D;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.athlete-photo {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 16px;
}

.athlete-info {
  flex: 1;
}

.athlete-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1F2D47;
}

.athlete-meta {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #718096;
}

.country-badge {
  background-color: #4A5F9D;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.athlete-salary {
  font-size: 18px;
  font-weight: 700;
  color: #D4AF37;
}
```

**Issues:**
- 🔴 60+ lines of CSS
- 🔴 Manual responsive behavior
- 🔴 No loading state
- 🔴 Poor accessibility

#### ✅ After (Chakra UI)

```tsx
import { Card, CardBody, Flex, Avatar, VStack, HStack, Heading, Text, Badge } from '@chakra-ui/react';

interface AthleteCardProps {
  athlete: {
    id: number;
    name: string;
    country: string;
    photoUrl: string;
    personalBest: string;
    salary: number;
  };
  onSelect: (id: number) => void;
}

function AthleteCard({ athlete, onSelect }: AthleteCardProps) {
  return (
    <Card 
      variant="elevated"
      _hover={{ shadow: 'lg', borderColor: 'primary.300' }}
      cursor="pointer"
      onClick={() => onSelect(athlete.id)}
      transition="all 0.2s"
    >
      <CardBody>
        <Flex align="center" gap={4}>
          <Avatar 
            name={athlete.name}
            src={athlete.photoUrl}
            size="lg"
            bg="primary.500"
          />
          
          <VStack align="start" flex={1} spacing={1}>
            <Heading size="sm">{athlete.name}</Heading>
            <HStack spacing={2}>
              <Badge colorPalette="primary" variant="solid">
                {athlete.country}
              </Badge>
              <Text fontSize="sm" color="gray.500">
                PB: {athlete.personalBest}
              </Text>
            </HStack>
          </VStack>
          
          <Text fontSize="lg" fontWeight="bold" color="secondary.600">
            ${athlete.salary.toLocaleString()}
          </Text>
        </Flex>
      </CardBody>
    </Card>
  );
}
```

**Benefits:**
- ✅ Type-safe props
- ✅ Responsive by default
- ✅ Theme-based colors
- ✅ Built-in hover states
- ✅ Accessible (keyboard nav, screen readers)
- ✅ Composable components

---

## Modals

### Team Creation Modal

#### ❌ Before (Legacy)

```html
<div id="createTeamModal" class="modal" style="display: none;">
  <div class="modal-overlay" onclick="closeModal()"></div>
  <div class="modal-content">
    <div class="modal-header">
      <h2>Create Your Team</h2>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label for="newTeamName">Team Name</label>
        <input type="text" id="newTeamName" class="form-input">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createTeam()">Create Team</button>
    </div>
  </div>
</div>
```

```css
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  max-width: 500px;
  margin: 100px auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #E4E9F2;
  background-color: #161C4F;
  color: white;
  border-radius: 8px 8px 0 0;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #E4E9F2;
}

.modal-close {
  background: transparent;
  border: none;
  color: white;
  font-size: 32px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
}
```

```javascript
function closeModal() {
  document.getElementById('createTeamModal').style.display = 'none';
  document.body.style.overflow = 'auto';
}

function openModal() {
  document.getElementById('createTeamModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}
```

**Issues:**
- 🔴 100+ lines of code
- 🔴 Manual show/hide logic
- 🔴 Manual scroll locking
- 🔴 No focus management
- 🔴 No ESC key support
- 🔴 Poor accessibility

#### ✅ After (Chakra UI)

```tsx
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  Button, FormControl, FormLabel, Input, useDisclosure
} from '@chakra-ui/react';
import { useState } from 'react';

function CreateTeamModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [teamName, setTeamName] = useState('');

  const handleCreate = () => {
    // Create team logic
    onClose();
  };

  return (
    <>
      <Button onClick={onOpen}>Create Team</Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent>
          <ModalHeader bg="primary.900" color="white" borderTopRadius="lg">
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
            <Button colorPalette="primary" onClick={handleCreate}>
              Create Team
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
```

**Benefits:**
- ✅ 30 lines vs 100+ lines
- ✅ Automatic focus management
- ✅ ESC key support
- ✅ Click outside to close
- ✅ Scroll locking handled
- ✅ Full accessibility (ARIA, keyboard nav)
- ✅ Smooth animations
- ✅ Mobile responsive

---

## Navigation

### Header Navigation

#### ❌ Before (Legacy)

```html
<header class="header">
  <div class="header-content">
    <div class="logo">
      <img src="/logo.svg" alt="MMFL Logo" class="logo-img">
      <span class="logo-text">MMFL</span>
    </div>
    <nav class="nav">
      <a href="/dashboard" class="nav-link">Dashboard</a>
      <a href="/teams" class="nav-link">My Teams</a>
      <a href="/athletes" class="nav-link">Athletes</a>
    </nav>
    <div class="header-actions">
      <button class="btn btn-icon">🔔</button>
      <button class="btn btn-primary btn-sm">Logout</button>
    </div>
  </div>
</header>
```

```css
.header {
  position: sticky;
  top: 0;
  background-color: #161C4F;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.header-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-img {
  height: 32px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
}

.nav {
  display: flex;
  gap: 24px;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 768px) {
  .nav {
    display: none;
  }
  .logo-text {
    display: none;
  }
}
```

**Issues:**
- 🔴 Manual responsive breakpoints
- 🔴 No active state management
- 🔴 Poor mobile menu
- 🔴 Inconsistent spacing

#### ✅ After (Chakra UI)

```tsx
import { Flex, HStack, Image, Heading, Link, Button, IconButton, Container } from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';

function Header() {
  const router = useRouter();
  const isActive = (path: string) => router.pathname === path;

  return (
    <Box 
      as="header" 
      position="sticky" 
      top={0} 
      bg="primary.900" 
      color="white" 
      shadow="sm"
      zIndex="docked"
    >
      <Container maxW="container.xl">
        <Flex 
          justify="space-between" 
          align="center" 
          py={3}
        >
          {/* Logo */}
          <HStack spacing={3}>
            <Image src="/logo.svg" h="32px" alt="MMFL Logo" />
            <Heading size="md" display={{ base: 'none', sm: 'block' }}>
              MMFL
            </Heading>
          </HStack>

          {/* Navigation */}
          <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
            <Link 
              href="/dashboard"
              fontWeight={isActive('/dashboard') ? 'bold' : 'medium'}
              bg={isActive('/dashboard') ? 'whiteAlpha.200' : 'transparent'}
              px={4}
              py={2}
              borderRadius="md"
              _hover={{ bg: 'whiteAlpha.100' }}
            >
              Dashboard
            </Link>
            <Link 
              href="/teams"
              fontWeight={isActive('/teams') ? 'bold' : 'medium'}
              bg={isActive('/teams') ? 'whiteAlpha.200' : 'transparent'}
              px={4}
              py={2}
              borderRadius="md"
              _hover={{ bg: 'whiteAlpha.100' }}
            >
              My Teams
            </Link>
            <Link 
              href="/athletes"
              fontWeight={isActive('/athletes') ? 'bold' : 'medium'}
              bg={isActive('/athletes') ? 'whiteAlpha.200' : 'transparent'}
              px={4}
              py={2}
              borderRadius="md"
              _hover={{ bg: 'whiteAlpha.100' }}
            >
              Athletes
            </Link>
          </HStack>

          {/* Actions */}
          <HStack spacing={3}>
            <IconButton 
              icon={<BellIcon />}
              aria-label="Notifications"
              variant="ghost"
              color="white"
            />
            <Button size="sm" variant="outline" color="white">
              Logout
            </Button>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
```

**Benefits:**
- ✅ Responsive props (no media queries)
- ✅ Active state management
- ✅ Consistent spacing
- ✅ Theme-based colors
- ✅ Accessible navigation

---

## Responsive Layouts

### Dashboard Grid

#### ❌ Before (Legacy)

```html
<div class="dashboard">
  <div class="stats-grid">
    <div class="stat-card">
      <h3>Total Points</h3>
      <p class="stat-value">2,451</p>
    </div>
    <div class="stat-card">
      <h3>Teams</h3>
      <p class="stat-value">3</p>
    </div>
    <div class="stat-card">
      <h3>Rank</h3>
      <p class="stat-value">#12</p>
    </div>
  </div>
</div>
```

```css
.dashboard {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  background: white;
  border: 1px solid #E4E9F2;
  border-radius: 8px;
  padding: 24px;
}

.stat-card h3 {
  font-size: 14px;
  color: #718096;
  margin: 0 0 8px 0;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1F2D47;
  margin: 0;
}
```

**Issues:**
- 🔴 Multiple media queries
- 🔴 Manual breakpoint management
- 🔴 Repetitive code

#### ✅ After (Chakra UI)

```tsx
import { Container, SimpleGrid, Card, CardBody, Stat, StatLabel, StatNumber } from '@chakra-ui/react';

function Dashboard() {
  return (
    <Container maxW="container.xl" px={4} py={8}>
      <SimpleGrid 
        columns={{ base: 1, md: 2, lg: 3 }}
        spacing={{ base: 4, md: 6 }}
        mb={8}
      >
        <Card variant="elevated">
          <CardBody>
            <Stat>
              <StatLabel>Total Points</StatLabel>
              <StatNumber>2,451</StatNumber>
            </Stat>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <Stat>
              <StatLabel>Teams</StatLabel>
              <StatNumber>3</StatNumber>
            </Stat>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <Stat>
              <StatLabel>Rank</StatLabel>
              <StatNumber>#12</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Container>
  );
}
```

**Benefits:**
- ✅ No CSS media queries needed
- ✅ Responsive props handle breakpoints
- ✅ Semantic `<Stat>` component
- ✅ Consistent spacing
- ✅ 15 lines vs 50+ lines

---

## Summary

### Code Reduction

| Component Type | Legacy Lines | Chakra Lines | Reduction |
|---------------|--------------|--------------|-----------|
| Button | 20+ | 4 | 80% |
| Form Input | 70+ | 20 | 71% |
| Card | 60+ | 25 | 58% |
| Modal | 100+ | 30 | 70% |
| Navigation | 80+ | 40 | 50% |
| Layout Grid | 50+ | 15 | 70% |

### Key Benefits of Migration

1. **Less Code** - 50-80% reduction in lines of code
2. **Better Accessibility** - WCAG AA compliance built-in
3. **Responsive by Default** - No manual media queries
4. **Type Safety** - TypeScript support out of the box
5. **Consistent Design** - Theme-based styling
6. **Better DX** - IntelliSense, documentation, examples
7. **Maintainability** - Upgrade Chakra UI vs maintaining custom CSS

---

**Last Updated:** November 22, 2025  
**Next Steps:** See [/examples/design-system/button-examples.tsx](./button-examples.tsx) for more button variations
