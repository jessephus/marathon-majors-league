/**
 * Button Component Examples - Marathon Majors Fantasy League
 * 
 * Complete collection of button patterns using Chakra UI v3.
 * All examples are copy-paste ready and follow MMFL design guidelines.
 * 
 * Related Docs:
 * - /docs/DESIGN_SYSTEM.md
 * - /docs/CORE_DESIGN_GUIDELINES.md
 * - /components/chakra/README.md
 */

import { Button, IconButton, ButtonGroup, HStack, VStack, Box, Text } from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, DownloadIcon, SearchIcon, SettingsIcon } from '@chakra-ui/icons';
import { useState } from 'react';

// =============================================================================
// PRIMARY BUTTONS
// =============================================================================

/**
 * Primary Button (Navy)
 * 
 * Usage: Main call-to-action buttons
 * Examples: "Create Team", "Save", "Submit", "Continue"
 * 
 * Accessibility: WCAG AAA contrast (6.8:1 on white)
 */
export function PrimaryButton() {
  return (
    <Button colorPalette="primary" size="lg">
      Create Team
    </Button>
  );
}

/**
 * Primary Button with Icon
 * 
 * Usage: Actions that benefit from visual reinforcement
 */
export function PrimaryButtonWithIcon() {
  return (
    <Button colorPalette="primary" size="lg" leftIcon={<AddIcon />}>
      Add Athlete
    </Button>
  );
}

/**
 * Primary Button with Loading State
 * 
 * Usage: Async operations (API calls, form submissions)
 */
export function PrimaryButtonLoading() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  return (
    <Button 
      colorPalette="primary" 
      size="lg"
      isLoading={isLoading}
      loadingText="Saving..."
      onClick={handleSubmit}
    >
      Save Team
    </Button>
  );
}

// =============================================================================
// SECONDARY BUTTONS
// =============================================================================

/**
 * Secondary Button (Outline)
 * 
 * Usage: Less prominent actions, secondary options
 * Examples: "Cancel", "Skip", "Learn More"
 */
export function SecondaryButton() {
  return (
    <Button variant="outline" colorPalette="primary" size="lg">
      Cancel
    </Button>
  );
}

/**
 * Ghost Button
 * 
 * Usage: Tertiary actions, toolbar buttons
 * Examples: "Skip Tutorial", "Dismiss", navigation items
 */
export function GhostButton() {
  return (
    <Button variant="ghost" colorPalette="primary">
      Skip Tutorial
    </Button>
  );
}

// =============================================================================
// GOLD ACCENT BUTTONS
// =============================================================================

/**
 * Gold Button (Premium/Achievement)
 * 
 * Usage: Premium features, upgrade prompts, achievements
 * Examples: "Upgrade to Pro", "Unlock Feature", "Claim Prize"
 */
export function GoldButton() {
  return (
    <Button 
      bg="gold.500" 
      color="navy.900"
      _hover={{ bg: 'gold.600' }}
      _active={{ bg: 'gold.700' }}
      size="lg"
      rightIcon={<DownloadIcon />}
    >
      Upgrade to Pro
    </Button>
  );
}

// =============================================================================
// DESTRUCTIVE BUTTONS
// =============================================================================

/**
 * Destructive Button (Delete/Remove)
 * 
 * Usage: Permanent destructive actions
 * Examples: "Delete Team", "Remove Athlete", "Clear Data"
 * 
 * Note: Always confirm with AlertDialog before executing
 */
export function DestructiveButton() {
  return (
    <Button 
      colorPalette="error" 
      variant="outline"
      leftIcon={<DeleteIcon />}
    >
      Delete Team
    </Button>
  );
}

/**
 * Destructive Ghost Button
 * 
 * Usage: Less prominent delete actions (in lists, tables)
 */
export function DestructiveGhostButton() {
  return (
    <Button 
      colorPalette="error" 
      variant="ghost"
      size="sm"
    >
      Remove
    </Button>
  );
}

// =============================================================================
// ICON BUTTONS
// =============================================================================

/**
 * Icon Button
 * 
 * Usage: Actions without text labels (toolbars, cards)
 * Note: ALWAYS include aria-label for accessibility
 */
export function IconButtons() {
  return (
    <HStack spacing={2}>
      <IconButton 
        icon={<EditIcon />}
        aria-label="Edit team"
        variant="outline"
        colorPalette="primary"
      />
      
      <IconButton 
        icon={<DeleteIcon />}
        aria-label="Delete team"
        variant="ghost"
        colorPalette="error"
      />
      
      <IconButton 
        icon={<SettingsIcon />}
        aria-label="Settings"
        variant="ghost"
        colorPalette="primary"
      />
    </HStack>
  );
}

/**
 * Floating Action Button (FAB)
 * 
 * Usage: Primary action on mobile screens
 * Example: "Add Athlete" button on athlete list page
 */
export function FloatingActionButton() {
  return (
    <IconButton 
      icon={<AddIcon />}
      aria-label="Add athlete"
      colorPalette="primary"
      size="lg"
      borderRadius="full"
      position="fixed"
      bottom={{ base: 20, md: 8 }}
      right={{ base: 4, md: 8 }}
      shadow="lg"
      zIndex="sticky"
    />
  );
}

// =============================================================================
// BUTTON GROUPS
// =============================================================================

/**
 * Button Group (Horizontal)
 * 
 * Usage: Related actions grouped together
 * Examples: Modal footer buttons, form actions
 */
export function HorizontalButtonGroup() {
  return (
    <ButtonGroup spacing={3}>
      <Button variant="ghost" colorPalette="primary">
        Cancel
      </Button>
      <Button variant="outline" colorPalette="primary">
        Save Draft
      </Button>
      <Button colorPalette="primary">
        Publish
      </Button>
    </ButtonGroup>
  );
}

/**
 * Segmented Button Group
 * 
 * Usage: Toggle between options (view modes, filters)
 * Example: "List View" vs "Grid View"
 */
export function SegmentedButtonGroup() {
  const [view, setView] = useState<'list' | 'grid'>('list');

  return (
    <ButtonGroup isAttached variant="outline">
      <Button 
        colorPalette={view === 'list' ? 'primary' : 'gray'}
        bg={view === 'list' ? 'primary.500' : 'transparent'}
        color={view === 'list' ? 'white' : 'inherit'}
        onClick={() => setView('list')}
      >
        List View
      </Button>
      <Button 
        colorPalette={view === 'grid' ? 'primary' : 'gray'}
        bg={view === 'grid' ? 'primary.500' : 'transparent'}
        color={view === 'grid' ? 'white' : 'inherit'}
        onClick={() => setView('grid')}
      >
        Grid View
      </Button>
    </ButtonGroup>
  );
}

// =============================================================================
// SIZE VARIATIONS
// =============================================================================

/**
 * Button Sizes
 * 
 * Usage: Different contexts require different sizes
 * - xs: Compact UI, tags
 * - sm: Tables, dense lists
 * - md: Default (most common)
 * - lg: CTAs, hero sections
 * - xl: Marketing pages, hero banners
 */
export function ButtonSizes() {
  return (
    <VStack align="start" spacing={4}>
      <Button colorPalette="primary" size="xs">Extra Small</Button>
      <Button colorPalette="primary" size="sm">Small</Button>
      <Button colorPalette="primary" size="md">Medium (Default)</Button>
      <Button colorPalette="primary" size="lg">Large</Button>
    </VStack>
  );
}

// =============================================================================
// RESPONSIVE BUTTONS
// =============================================================================

/**
 * Responsive Button
 * 
 * Usage: Adapts size and icon visibility based on screen size
 * Mobile: Icon only or smaller size
 * Desktop: Full text with icon
 */
export function ResponsiveButton() {
  return (
    <Button 
      colorPalette="primary"
      size={{ base: 'md', md: 'lg' }}
      leftIcon={<AddIcon />}
    >
      <Box as="span" display={{ base: 'none', sm: 'inline' }}>
        Add Athlete
      </Box>
      <Box as="span" display={{ base: 'inline', sm: 'none' }}>
        Add
      </Box>
    </Button>
  );
}

// =============================================================================
// SPECIAL STATES
// =============================================================================

/**
 * Disabled Button
 * 
 * Usage: Actions that are temporarily unavailable
 * Note: Include helpful tooltip explaining why disabled
 */
export function DisabledButton() {
  return (
    <Button 
      colorPalette="primary" 
      size="lg"
      isDisabled
    >
      Submit (3 athletes required)
    </Button>
  );
}

/**
 * Full Width Button
 * 
 * Usage: Mobile CTAs, form submit buttons
 * Example: Login/signup buttons on mobile
 */
export function FullWidthButton() {
  return (
    <Button 
      colorPalette="primary" 
      size="lg"
      width="full"
    >
      Create Account
    </Button>
  );
}

// =============================================================================
// REAL-WORLD EXAMPLES
// =============================================================================

/**
 * Modal Footer Buttons
 * 
 * Usage: Standard modal actions (Cancel + Confirm)
 */
export function ModalFooterButtons() {
  return (
    <HStack spacing={3} justify="flex-end">
      <Button variant="ghost" colorPalette="primary">
        Cancel
      </Button>
      <Button colorPalette="primary">
        Save Changes
      </Button>
    </HStack>
  );
}

/**
 * Form Submit Buttons
 * 
 * Usage: Multi-step form navigation
 */
export function FormNavigationButtons() {
  return (
    <HStack spacing={3} justify="space-between" width="full">
      <Button variant="outline" colorPalette="primary">
        Previous
      </Button>
      <HStack spacing={3}>
        <Button variant="ghost">
          Save Draft
        </Button>
        <Button colorPalette="primary" rightIcon={<AddIcon transform="rotate(90deg)" />}>
          Next Step
        </Button>
      </HStack>
    </HStack>
  );
}

/**
 * Card Action Buttons
 * 
 * Usage: Actions on athlete/team cards
 */
export function CardActionButtons() {
  return (
    <HStack spacing={2}>
      <IconButton 
        icon={<EditIcon />}
        aria-label="Edit athlete"
        size="sm"
        variant="ghost"
        colorPalette="primary"
      />
      <IconButton 
        icon={<DeleteIcon />}
        aria-label="Remove athlete"
        size="sm"
        variant="ghost"
        colorPalette="error"
      />
      <Button size="sm" colorPalette="primary">
        View Stats
      </Button>
    </HStack>
  );
}

/**
 * Social Share Buttons
 * 
 * Usage: Share team results, invite friends
 */
export function SocialShareButtons() {
  return (
    <HStack spacing={3}>
      <Button 
        colorPalette="primary"
        variant="outline"
        size="sm"
        leftIcon={<SearchIcon />}
      >
        Copy Link
      </Button>
      <Button 
        bg="blue.500"
        color="white"
        _hover={{ bg: 'blue.600' }}
        size="sm"
      >
        Share on Twitter
      </Button>
    </HStack>
  );
}

// =============================================================================
// ACCESSIBILITY BEST PRACTICES
// =============================================================================

/**
 * Accessible Button Patterns
 * 
 * ✅ DO:
 * - Always include aria-label for icon buttons
 * - Use semantic button text ("Save Team" not "Click Here")
 * - Provide loading states for async operations
 * - Use appropriate color contrast (WCAG AA minimum)
 * - Make touch targets at least 44x44px
 * 
 * ❌ DON'T:
 * - Use buttons for navigation (use Link component)
 * - Disable buttons without explanation
 * - Use only icons without labels (unless tooltip provided)
 * - Create custom buttons when Chakra has the pattern
 */

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/**
 * Complete Button Examples Demo
 * 
 * Copy this component to test all button variations
 */
export function ButtonExamplesDemo() {
  return (
    <VStack align="start" spacing={8} p={6}>
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>Primary Actions</Text>
        <HStack spacing={4}>
          <PrimaryButton />
          <PrimaryButtonWithIcon />
        </HStack>
      </Box>

      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>Secondary Actions</Text>
        <HStack spacing={4}>
          <SecondaryButton />
          <GhostButton />
        </HStack>
      </Box>

      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>Special Buttons</Text>
        <HStack spacing={4}>
          <GoldButton />
          <DestructiveButton />
        </HStack>
      </Box>

      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>Icon Buttons</Text>
        <IconButtons />
      </Box>

      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>Button Groups</Text>
        <VStack align="start" spacing={4}>
          <HorizontalButtonGroup />
          <SegmentedButtonGroup />
        </VStack>
      </Box>

      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>Sizes</Text>
        <ButtonSizes />
      </Box>
    </VStack>
  );
}

export default ButtonExamplesDemo;
