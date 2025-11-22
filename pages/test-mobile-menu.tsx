/**
 * Mobile Menu Drawer Test Page
 * 
 * Test page for validating MobileMenuDrawer component functionality.
 * 
 * Tests:
 * - Drawer opens on hamburger click
 * - Drawer closes on route change
 * - All navigation items present
 * - Active state highlighting
 * - Accessibility compliance
 * - Touch targets adequate size
 * - Responsive behavior (mobile only)
 */

import { Box, Container, VStack, Heading, Text, Card, Code } from '@chakra-ui/react';
import { StickyHeader } from '@/components/navigation/StickyHeader';
import { BottomNav } from '@/components/navigation/BottomNav';
import Head from 'next/head';

export default function TestMobileMenuDrawer() {
  return (
    <>
      <Head>
        <title>Mobile Menu Test - Marathon Majors Fantasy League</title>
        <meta name="description" content="Accessibility test page for MobileMenuDrawer component" />
      </Head>
      
      {/* Header with integrated mobile drawer */}
      <StickyHeader />

      {/* Page content with top padding to account for fixed header */}
      <Box pt={{ base: '60px', md: '72px', lg: '80px' }}>
        <Container maxW="container.lg" py={8}>
          <VStack gap={8} align="stretch">
            <Box>
              <Heading size="2xl" mb={4} color="navy.900">
                Mobile Menu Drawer Test
              </Heading>
              <Text fontSize="lg" color="gray.600">
                Test page for the mobile slide-out navigation drawer.
              </Text>
            </Box>

            <Card.Root>
              <Card.Body>
                <Heading size="md" mb={4} color="navy.800">
                  Testing Instructions
                </Heading>
                <VStack align="stretch" gap={3}>
                  <Text>
                    <strong>Mobile Testing (&lt;768px):</strong>
                  </Text>
                  <VStack align="stretch" gap={2} pl={4}>
                    <Text>1. Resize your browser window to &lt;768px width (or use mobile device)</Text>
                    <Text>2. Click the hamburger menu button (☰) in the top right</Text>
                    <Text>3. Verify drawer slides in from the right</Text>
                    <Text>4. Check all navigation items are present</Text>
                    <Text>5. Verify current page is highlighted in gold</Text>
                    <Text>6. Click a navigation link</Text>
                    <Text>7. Verify drawer automatically closes</Text>
                    <Text>8. Try pressing Escape key to close drawer</Text>
                    <Text>9. Try clicking overlay to close drawer</Text>
                  </VStack>

                  <Text mt={4}>
                    <strong>Desktop Testing (≥768px):</strong>
                  </Text>
                  <VStack align="stretch" gap={2} pl={4}>
                    <Text>1. Resize your browser window to ≥768px width</Text>
                    <Text>2. Verify hamburger button is NOT visible</Text>
                    <Text>3. Verify navigation items are in the header instead</Text>
                    <Text>4. Drawer should never appear on desktop</Text>
                  </VStack>
                </VStack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <Heading size="md" mb={4} color="navy.800">
                  Expected Features
                </Heading>
                <VStack align="stretch" gap={2}>
                  <Text>✅ Drawer slides in from right with smooth animation</Text>
                  <Text>✅ Navy background (#161C4F) with white text</Text>
                  <Text>✅ Logo and wordmark in header</Text>
                  <Text>✅ All navigation items visible:</Text>
                  <Box pl={6}>
                    <Text>- Home (/) </Text>
                    <Text>- My Team (/team)</Text>
                    <Text>- Standings (/leaderboard)</Text>
                    <Text>- Athletes (/athletes)</Text>
                    <Text>- Help (/help)</Text>
                    <Text>- Commissioner (/commissioner)</Text>
                    <Text>- Logout button</Text>
                  </Box>
                  <Text>✅ Active route highlighted in gold</Text>
                  <Text>✅ Touch targets 48x48px minimum</Text>
                  <Text>✅ Hover states on all items</Text>
                  <Text>✅ Auto-closes on navigation</Text>
                  <Text>✅ Closes on Escape key</Text>
                  <Text>✅ Closes on overlay click</Text>
                  <Text>✅ Keyboard accessible (Tab, Enter, Escape)</Text>
                </VStack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <Heading size="md" mb={4} color="navy.800">
                  Accessibility Checklist
                </Heading>
                <VStack align="stretch" gap={2}>
                  <Text>🔍 Keyboard Navigation:</Text>
                  <Box pl={6}>
                    <Text>- Tab through all menu items</Text>
                    <Text>- Press Enter to activate links</Text>
                    <Text>- Press Escape to close drawer</Text>
                    <Text>- Focus trap within drawer when open</Text>
                  </Box>
                  <Text mt={3}>🔍 Screen Reader:</Text>
                  <Box pl={6}>
                    <Text>- Turn on screen reader (VoiceOver/NVDA/TalkBack)</Text>
                    <Text>- Verify all items are announced</Text>
                    <Text>- Check ARIA labels on buttons</Text>
                    <Text>- Verify drawer state changes announced</Text>
                  </Box>
                  <Text mt={3}>🔍 Color Contrast:</Text>
                  <Box pl={6}>
                    <Text>- White on Navy 900: 15.99:1 (AAA) ✅</Text>
                    <Text>- Gold 400 on Navy 900: 8.2:1 (AAA) ✅</Text>
                  </Box>
                </VStack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <Heading size="md" mb={4} color="navy.800">
                  Technical Details
                </Heading>
                <VStack align="stretch" gap={2}>
                  <Text><strong>Component:</strong> MobileMenuDrawer</Text>
                  <Text><strong>Location:</strong> <Code>components/navigation/MobileMenuDrawer/</Code></Text>
                  <Text><strong>Framework:</strong> Chakra UI v3</Text>
                  <Text><strong>Router:</strong> Next.js (auto-close on route change)</Text>
                  <Text><strong>Icons:</strong> Heroicons v2</Text>
                  <Text><strong>Width:</strong> 280px (mobile), 320px (sm+)</Text>
                  <Text><strong>Z-index:</strong> 1400 (Chakra Drawer default)</Text>
                  <Text><strong>Animation:</strong> 300ms ease-out</Text>
                </VStack>
              </Card.Body>
            </Card.Root>

            <Card.Root bg="navy.50">
              <Card.Body>
                <Heading size="md" mb={4} color="navy.800">
                  Test Navigation Links
                </Heading>
                <Text mb={3}>
                  Click these links to test auto-close functionality:
                </Text>
                <VStack align="stretch" gap={2}>
                  <Text>
                    → <a href="/" style={{ color: '#4A5F9D', textDecoration: 'underline' }}>Home</a>
                  </Text>
                  <Text>
                    → <a href="/team" style={{ color: '#4A5F9D', textDecoration: 'underline' }}>My Team</a>
                  </Text>
                  <Text>
                    → <a href="/leaderboard" style={{ color: '#4A5F9D', textDecoration: 'underline' }}>Standings</a>
                  </Text>
                  <Text>
                    → <a href="/athletes" style={{ color: '#4A5F9D', textDecoration: 'underline' }}>Athletes</a>
                  </Text>
                  <Text>
                    → <a href="/help" style={{ color: '#4A5F9D', textDecoration: 'underline' }}>Help</a>
                  </Text>
                  <Text>
                    → <a href="/commissioner" style={{ color: '#4A5F9D', textDecoration: 'underline' }}>Commissioner</a>
                  </Text>
                  <Text>
                    → <a href="/test-bottom-nav" style={{ color: '#4A5F9D', textDecoration: 'underline' }}>Bottom Nav Test</a>
                  </Text>
                  <Text>
                    → <a href="/test-sticky-header" style={{ color: '#4A5F9D', textDecoration: 'underline' }}>Sticky Header Test</a>
                  </Text>
                </VStack>
              </Card.Body>
            </Card.Root>

            <Box textAlign="center" py={8}>
              <Text fontSize="sm" color="gray.500">
                Part of Phase 3: Core Navigation (Week 13-14)
              </Text>
              <Text fontSize="sm" color="gray.500">
                GitHub Issue #122 - Mobile Menu Drawer Implementation
              </Text>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Bottom navigation (mobile only) */}
      <BottomNav />
    </>
  );
}
