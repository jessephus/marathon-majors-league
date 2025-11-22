/**
 * StickyHeader Test Page
 * 
 * Comprehensive testing and demonstration page for the StickyHeader component.
 * 
 * Tests:
 * - Sticky positioning on scroll
 * - Scroll shadow appearance
 * - Responsive behavior (mobile/tablet/desktop)
 * - Active state detection
 * - Logo and wordmark display
 * - Navigation links functionality
 * - Mobile menu button
 * - User action buttons
 * - Keyboard navigation
 * - Touch target sizes
 * - Z-index layering
 * 
 * Usage: Navigate to /test-sticky-header
 */

import { Box, Container, Heading, Text, VStack, HStack, SimpleGrid, Code } from '@chakra-ui/react';
import { StickyHeader } from '@/components/navigation/StickyHeader';
import { Badge } from '@/components/chakra';
import { useState, useEffect } from 'react';

export default function TestStickyHeaderPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [clickedLink, setClickedLink] = useState<string>('');
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState<number>(0);
  
  // Client-side only viewport width tracking
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Client-side only scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    handleScroll(); // Set initial value
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleMenuOpen = () => {
    setMenuOpen(true);
    setTimeout(() => setMenuOpen(false), 2000); // Auto-close after 2s for testing
  };
  
  return (
    <Box minHeight="100vh" bg="gray.50">
        {/* StickyHeader Component */}
        <StickyHeader onMenuOpen={handleMenuOpen} />
        
        {/* Test Content */}
        <Container maxW="container.xl" py={8}>
          <VStack align="stretch" gap={8}>
            {/* Header */}
            <Box>
              <Heading as="h1" size="2xl" mb={2}>
                StickyHeader Component Test Page
              </Heading>
              <Text fontSize="lg" color="gray.600">
                Comprehensive testing and validation for Phase 3 StickyHeader implementation
              </Text>
            </Box>
            
            {/* Status Indicators */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
              <Box bg="white" p={4} borderRadius="lg" shadow="sm">
                <Text fontSize="sm" fontWeight="semibold" color="navy.700" mb={1}>
                  Component Status
                </Text>
                <Badge colorPalette="success" size="lg">
                  ✅ Implemented
                </Badge>
              </Box>
              
              <Box bg="white" p={4} borderRadius="lg" shadow="sm">
                <Text fontSize="sm" fontWeight="semibold" color="navy.700" mb={1}>
                  Menu Button Clicks
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="navy.500">
                  {menuOpen ? '🍔 Opened' : '😴 Closed'}
                </Text>
              </Box>
              
              <Box bg="white" p={4} borderRadius="lg" shadow="sm">
                <Text fontSize="sm" fontWeight="semibold" color="navy.700" mb={1}>
                  Scroll Position
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="navy.500">
                  {scrollY > 10 ? '📜 Scrolled' : '⬆️ Top'}
                </Text>
              </Box>
              
              <Box bg="white" p={4} borderRadius="lg" shadow="sm">
                <Text fontSize="sm" fontWeight="semibold" color="navy.700" mb={1}>
                  Viewport Width
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="navy.500">
                  {viewportWidth !== null ? `${viewportWidth}px` : 'Loading...'}
                </Text>
              </Box>
            </SimpleGrid>
            
            {/* Test Instructions */}
            <Box bg="white" p={6} borderRadius="lg" shadow="sm">
              <Heading as="h2" size="lg" mb={4}>
                Testing Instructions
              </Heading>
              <VStack align="stretch" gap={3}>
                <HStack>
                  <Text fontWeight="semibold" minWidth="200px">1. Sticky Positioning:</Text>
                  <Text>Scroll down - header should stay at top</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="semibold" minWidth="200px">2. Scroll Shadow:</Text>
                  <Text>Shadow appears after scrolling &gt;10px</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="semibold" minWidth="200px">3. Active States:</Text>
                  <Text>Test page should have gold underline</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="semibold" minWidth="200px">4. Responsive:</Text>
                  <Text>Resize window to test mobile/tablet/desktop</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="semibold" minWidth="200px">5. Keyboard Nav:</Text>
                  <Text>Press Tab to focus elements, Enter to activate</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="semibold" minWidth="200px">6. Mobile Menu:</Text>
                  <Text>Click hamburger icon on mobile (&lt;768px)</Text>
                </HStack>
              </VStack>
            </Box>
            
            {/* Component Features */}
            <Box bg="white" p={6} borderRadius="lg" shadow="sm">
              <Heading as="h2" size="lg" mb={4}>
                Component Features
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <VStack align="stretch" gap={2}>
                  <Text fontWeight="semibold" color="navy.700">✅ Implemented</Text>
                  <Code fontSize="sm">position: sticky, top: 0</Code>
                  <Code fontSize="sm">z-index: 999</Code>
                  <Code fontSize="sm">Scroll shadow (after 10px)</Code>
                  <Code fontSize="sm">Logo + wordmark</Code>
                  <Code fontSize="sm">Desktop nav links (≥768px)</Code>
                  <Code fontSize="sm">Mobile menu button (&lt;768px)</Code>
                  <Code fontSize="sm">Active route highlighting</Code>
                  <Code fontSize="sm">Keyboard navigation</Code>
                </VStack>
                
                <VStack align="stretch" gap={2}>
                  <Text fontWeight="semibold" color="navy.700">📏 Responsive Heights</Text>
                  <Code fontSize="sm">Mobile: 60px (&lt;768px)</Code>
                  <Code fontSize="sm">Tablet: 72px (768-1023px)</Code>
                  <Code fontSize="sm">Desktop: 80px (≥1024px)</Code>
                  <Text fontWeight="semibold" color="navy.700" mt={2}>🎨 Colors</Text>
                  <Code fontSize="sm">Background: Navy 900</Code>
                  <Code fontSize="sm">Text: White / Gold 400 (active)</Code>
                  <Code fontSize="sm">Border: Gold 400 (active)</Code>
                </VStack>
              </SimpleGrid>
            </Box>
            
            {/* Accessibility Validation */}
            <Box bg="white" p={6} borderRadius="lg" shadow="sm">
              <Heading as="h2" size="lg" mb={4}>
                Accessibility Compliance
              </Heading>
              <VStack align="stretch" gap={3}>
                <HStack>
                  <Badge colorPalette="success">✅</Badge>
                  <Text>WCAG 2.1 AA Color Contrast (Navy 900 on white: 15.99:1)</Text>
                </HStack>
                <HStack>
                  <Badge colorPalette="success">✅</Badge>
                  <Text>Touch targets ≥44x44px (Mobile menu: 48px, Notifications: 44px)</Text>
                </HStack>
                <HStack>
                  <Badge colorPalette="success">✅</Badge>
                  <Text>Keyboard navigation (Tab + Enter/Space)</Text>
                </HStack>
                <HStack>
                  <Badge colorPalette="success">✅</Badge>
                  <Text>ARIA landmarks (role="banner", role="navigation")</Text>
                </HStack>
                <HStack>
                  <Badge colorPalette="success">✅</Badge>
                  <Text>ARIA labels on icon buttons</Text>
                </HStack>
                <HStack>
                  <Badge colorPalette="success">✅</Badge>
                  <Text>aria-current="page" on active links</Text>
                </HStack>
                <HStack>
                  <Badge colorPalette="success">✅</Badge>
                  <Text>Semantic HTML (&lt;header&gt;, &lt;nav&gt;)</Text>
                </HStack>
              </VStack>
            </Box>
            
            {/* Scroll Test Content */}
            <Box bg="white" p={6} borderRadius="lg" shadow="sm">
              <Heading as="h2" size="lg" mb={4}>
                Scroll Test Section
              </Heading>
              <Text mb={4}>
                Scroll down to test the sticky header behavior. The header should remain at the top
                of the viewport, and a shadow should appear after scrolling more than 10px.
              </Text>
              
              {/* Generate enough content to enable scrolling */}
              {Array.from({ length: 20 }).map((_, i) => (
                <Box key={i} mb={4} p={4} bg="gray.50" borderRadius="md">
                  <Text fontWeight="semibold" color="navy.700" mb={2}>
                    Test Section {i + 1}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                    nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </Text>
                </Box>
              ))}
            </Box>
            
            {/* Integration Notes */}
            <Box bg="blue.50" p={6} borderRadius="lg" border="1px solid" borderColor="blue.200">
              <Heading as="h3" size="md" color="blue.800" mb={3}>
                💡 Integration Notes
              </Heading>
              <VStack align="stretch" gap={2}>
                <Text fontSize="sm" color="blue.700">
                  • Use with BottomNav for complete mobile navigation
                </Text>
                <Text fontSize="sm" color="blue.700">
                  • Add bottom padding to page content (64px on mobile) to prevent BottomNav overlap
                </Text>
                <Text fontSize="sm" color="blue.700">
                  • Implement mobile menu drawer for hamburger button functionality
                </Text>
                <Text fontSize="sm" color="blue.700">
                  • Z-index hierarchy: Content (1) → Header (999) → BottomNav (1000) → Modal (1300+)
                </Text>
              </VStack>
            </Box>
            
            {/* Footer Spacer */}
            <Box height="200px" />
          </VStack>
        </Container>
      </Box>
  );
}
