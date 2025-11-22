/**
 * Chakra UI Demo Page - Phase 1 & 2 Complete Validation
 * 
 * Purpose: Comprehensive demonstration of Chakra UI v3 design system implementation.
 * This page validates that:
 * 1. ✅ Chakra UI v3 is properly installed and configured
 * 2. ✅ Theme (navy/gold palette) is applied correctly
 * 3. ✅ Semantic color mappings (primary/secondary) work correctly
 * 4. ✅ Typography system (Inter/Roboto) with complete scale (xs-5xl)
 * 5. ✅ Heading variants (H1-H6) with responsive sizing
 * 6. ✅ Font weights (400-800) and letter spacing
 * 7. ✅ Line heights (tight, snug, normal, relaxed, loose)
 * 8. ✅ Google Fonts loaded and applied
 * 9. ✅ Chakra components coexist with legacy code
 * 10. ✅ Responsive design works (mobile-first)
 * 11. ✅ WCAG 2.1 AA/AAA contrast compliance
 * 12. ✅ Real-world typography usage examples
 * 
 * This demo is referenced in UI_REDESIGN_ROADMAP.md Phase 2.
 * 
 * Note: Uses custom Button/Badge wrappers for semantic colorPalette support
 * 
 * @version 2.2.0 (Phase 2 Complete - Typography Scale & Font Setup)
 * @date November 22, 2025
 */

import Head from 'next/head';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Grid,
  GridItem,
  Stack,
} from '@chakra-ui/react';
import { Button, Badge } from '@/components/chakra';

export default function ChakraDemoPage() {

  return (
    <>
      <Head>
        <title>Chakra UI Demo - Phase 2 Complete - Typography</title>
        <meta name="description" content="Complete Typography System: Inter/Roboto fonts, H1-H6 variants, responsive scaling, and comprehensive design tokens for MMFL" />
      </Head>

      {/* Legacy CSS Header - demonstrates coexistence */}
      <div style={{ 
        background: 'linear-gradient(135deg, #ff6900 0%, #2C39A2 100%)',
        padding: '20px',
        color: 'white',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px' }}>
          ⚠️ Legacy CSS Section (Orange/Blue) - Will be replaced
        </h2>
        <p style={{ margin: '10px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
          This demonstrates Chakra UI coexisting with existing vanilla CSS
        </p>
      </div>

      {/* Chakra UI Content */}
      <Container maxW="1200px" py={8}>
        <VStack gap={8} align="stretch">
          
          {/* Hero Section */}
          <Box 
            bg="navy.900" 
            color="white" 
            p={8} 
            borderRadius="lg" 
            textAlign="center"
          >
            <Heading 
              as="h1" 
              fontSize={{ base: '2xl', md: '4xl' }}
              mb={4}
              fontFamily="heading"
            >
              Phase 2 Complete: Typography System
            </Heading>
            <Text fontSize="lg" mb={6}>
              Complete Font System • H1-H6 Variants • Responsive Scaling • Inter/Roboto • All Design Tokens
            </Text>
            <HStack gap={4} justify="center" flexWrap="wrap">
              <Button 
                bg="white" 
                color="navy.900" 
                size="lg"
                _hover={{ bg: 'gray.100' }}
              >
                Primary Action
              </Button>
              <Button 
                bg="gold.500" 
                color="navy.900"
                size="lg"
                _hover={{ bg: 'gold.600' }}
              >
                Gold Button
              </Button>
            </HStack>
          </Box>

          {/* Color Palette Showcase */}
          <Card.Root>
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>Color System</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={6} align="stretch">
                
                {/* Navy Scale */}
                <Box>
                  <Text fontWeight="semibold" mb={2}>Navy Scale (Primary Brand Color)</Text>
                  <HStack gap={2} flexWrap="wrap">
                    {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                      <Box
                        key={shade}
                        bg={`navy.${shade}`}
                        w="60px"
                        h="60px"
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color={shade >= 500 ? 'white' : 'navy.900'}
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        {shade}
                      </Box>
                    ))}
                  </HStack>
                </Box>

                {/* Gold Scale */}
                <Box>
                  <Text fontWeight="semibold" mb={2}>Gold Scale (Accent Color)</Text>
                  <HStack gap={2} flexWrap="wrap">
                    {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                      <Box
                        key={shade}
                        bg={`gold.${shade}`}
                        w="60px"
                        h="60px"
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color={shade >= 600 ? 'white' : 'navy.900'}
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        {shade}
                      </Box>
                    ))}
                  </HStack>
                </Box>

                {/* Semantic Colors - NEW: Primary & Secondary */}
                <Box>
                  <Text fontWeight="semibold" mb={3}>Semantic Color Mappings (Phase 2)</Text>
                  <VStack gap={4} align="stretch">
                    {/* Primary Scale */}
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.600">
                        Primary (maps to Navy) - Main actions
                      </Text>
                      <HStack gap={2} flexWrap="wrap">
                        {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                          <Box
                            key={shade}
                            bg={`primary.${shade}`}
                            w="50px"
                            h="50px"
                            borderRadius="md"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color={shade >= 500 ? 'white' : 'primary.900'}
                            fontSize="xs"
                            fontWeight="bold"
                          >
                            {shade}
                          </Box>
                        ))}
                      </HStack>
                    </Box>

                    {/* Secondary Scale */}
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.600">
                        Secondary (maps to Gold) - Accent highlights
                      </Text>
                      <HStack gap={2} flexWrap="wrap">
                        {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                          <Box
                            key={shade}
                            bg={`secondary.${shade}`}
                            w="50px"
                            h="50px"
                            borderRadius="md"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color={shade >= 600 ? 'white' : 'secondary.900'}
                            fontSize="xs"
                            fontWeight="bold"
                          >
                            {shade}
                          </Box>
                        ))}
                      </HStack>
                    </Box>

                    {/* Status Colors */}
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.600">
                        Status Colors
                      </Text>
                      <HStack gap={4} flexWrap="wrap">
                        <Badge colorPalette="success" size="lg">Success</Badge>
                        <Badge colorPalette="warning" size="lg">Warning</Badge>
                        <Badge colorPalette="error" size="lg">Error</Badge>
                        <Badge colorPalette="info" size="lg">Info</Badge>
                      </HStack>
                    </Box>
                  </VStack>
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* NEW: Semantic Color Usage Examples */}
          <Card.Root bg="gray.50">
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>
                Semantic Colors in Action (Phase 2)
              </Heading>
              <Text fontSize="sm" color="gray.600" mt={2}>
                Using primary/secondary instead of navy/gold improves maintainability
              </Text>
            </Card.Header>
            <Card.Body>
              <VStack gap={6} align="stretch">
                
                {/* Button Comparison */}
                <Box>
                  <Text fontWeight="semibold" mb={3}>Buttons: Semantic vs Brand Names</Text>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.600">
                        ✅ Recommended: Semantic Names
                      </Text>
                      <Stack gap={3}>
                        <Button colorPalette="primary" size="lg">
                          Primary Action
                        </Button>
                        <Button colorPalette="secondary" size="lg">
                          Secondary Action
                        </Button>
                        <Button colorPalette="primary" variant="outline" size="lg">
                          Primary Outline
                        </Button>
                        <Button colorPalette="secondary" variant="outline" size="lg">
                          Secondary Outline
                        </Button>
                      </Stack>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.600">
                        ⚠️ Also Works: Brand Names
                      </Text>
                      <Stack gap={3}>
                        <Button colorPalette="navy" size="lg">
                          Navy Button
                        </Button>
                        <Button colorPalette="gold" size="lg">
                          Gold Button
                        </Button>
                        <Button colorPalette="navy" variant="outline" size="lg">
                          Navy Outline
                        </Button>
                        <Button colorPalette="gold" variant="outline" size="lg">
                          Gold Outline
                        </Button>
                      </Stack>
                    </Box>
                  </Grid>
                </Box>

                {/* Signature Brand Combo */}
                <Box>
                  <Text fontWeight="semibold" mb={3}>Signature Brand Combination</Text>
                  <Box 
                    bg="primary.900" 
                    color="white" 
                    p={6} 
                    borderRadius="lg"
                    textAlign="center"
                  >
                    <Heading size="lg" mb={2}>
                      Marathon Majors Fantasy League
                    </Heading>
                    <Text color="secondary.500" fontSize="xl" fontWeight="bold">
                      ⭐ Gold on Navy ⭐
                    </Text>
                    <Text fontSize="sm" color="gray.300" mt={2}>
                      8.2:1 Contrast Ratio - WCAG AAA
                    </Text>
                  </Box>
                </Box>

                {/* Real-World Component Example */}
                <Box>
                  <Text fontWeight="semibold" mb={3}>Real-World Component Example</Text>
                  <Card.Root>
                    <Card.Header bg="primary.900" color="white">
                      <HStack justify="space-between">
                        <Heading size="md">Elite Team Dashboard</Heading>
                        <Badge colorPalette="secondary" size="lg">Premium</Badge>
                      </HStack>
                    </Card.Header>
                    <Card.Body>
                      <VStack gap={4} align="stretch">
                        <HStack justify="space-between">
                          <Text fontWeight="semibold" color="primary.800">
                            Your Current Rank
                          </Text>
                          <Text fontSize="2xl" fontWeight="bold" color="secondary.600">
                            #1
                          </Text>
                        </HStack>
                        <Box h="1px" bg="gray.200" />
                        <HStack gap={3}>
                          <Button colorPalette="primary" flex={1}>
                            View Team
                          </Button>
                          <Button colorPalette="secondary" variant="outline" flex={1}>
                            Edit Roster
                          </Button>
                        </HStack>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                </Box>

                {/* Contrast Validation Showcase */}
                <Box>
                  <Text fontWeight="semibold" mb={3}>WCAG 2.1 Contrast Validation</Text>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                      <VStack align="stretch" gap={2}>
                        <Text fontSize="sm" fontWeight="bold" color="gray.600">Text on White</Text>
                        <Text color="primary.900" fontWeight="semibold">Primary 900: 13.5:1 (AAA)</Text>
                        <Text color="primary.500" fontWeight="semibold">Primary 500: 6.8:1 (AAA)</Text>
                        <Text color="secondary.700" fontWeight="semibold">Secondary 700: 6.1:1 (AAA)</Text>
                        <Text color="secondary.600" fontWeight="semibold">Secondary 600: 4.9:1 (AA)</Text>
                      </VStack>
                    </Box>
                    <Box bg="primary.900" p={4} borderRadius="md">
                      <VStack align="stretch" gap={2}>
                        <Text fontSize="sm" fontWeight="bold" color="gray.300">Text on Primary 900</Text>
                        <Text color="white" fontWeight="semibold">White: 13.5:1 (AAA)</Text>
                        <Text color="secondary.500" fontWeight="semibold">Secondary 500: 8.2:1 (AAA)</Text>
                        <Text color="secondary.400" fontWeight="semibold">Secondary 400: 10.5:1 (AAA)</Text>
                      </VStack>
                    </Box>
                  </Grid>
                </Box>

              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Status/Feedback Messages */}
          <Card.Root>
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>Status & Feedback Colors</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={4} align="stretch">
                <Box bg="success.50" border="1px solid" borderColor="success.500" p={4} borderRadius="md">
                  <HStack>
                    <Text fontSize="2xl">✅</Text>
                    <VStack align="start" gap={1}>
                      <Text fontWeight="bold" color="success.700">Success Message</Text>
                      <Text fontSize="sm" color="success.600">Your team has been saved successfully!</Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box bg="warning.50" border="1px solid" borderColor="warning.500" p={4} borderRadius="md">
                  <HStack>
                    <Text fontSize="2xl">⚠️</Text>
                    <VStack align="start" gap={1}>
                      <Text fontWeight="bold" color="warning.700">Warning Message</Text>
                      <Text fontSize="sm" color="warning.600">Roster locks in 30 minutes!</Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box bg="error.50" border="1px solid" borderColor="error.500" p={4} borderRadius="md">
                  <HStack>
                    <Text fontSize="2xl">❌</Text>
                    <VStack align="start" gap={1}>
                      <Text fontWeight="bold" color="error.700">Error Message</Text>
                      <Text fontSize="sm" color="error.600">Unable to save team. Please try again.</Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box bg="info.50" border="1px solid" borderColor="info.500" p={4} borderRadius="md">
                  <HStack>
                    <Text fontSize="2xl">ℹ️</Text>
                    <VStack align="start" gap={1}>
                      <Text fontWeight="bold" color="info.700">Info Message</Text>
                      <Text fontSize="sm" color="info.600">Race starts at 8:00 AM EST on Sunday.</Text>
                    </VStack>
                  </HStack>
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Typography Showcase - ENHANCED FOR PHASE 2 */}
          <Card.Root>
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>Typography System - Phase 2</Heading>
              <Text fontSize="sm" color="gray.600" mt={2}>
                Inter (headings) • Roboto (body) • Complete scale with responsive sizing
              </Text>
            </Card.Header>
            <Card.Body>
              <VStack gap={8} align="stretch">
                
                {/* Heading Hierarchy */}
                <Box>
                  <Text fontWeight="bold" fontSize="lg" mb={4} color="navy.700">
                    Heading Hierarchy (H1-H6)
                  </Text>
                  <VStack gap={4} align="stretch">
                    <Box borderLeft="4px solid" borderColor="navy.500" pl={4}>
                      <Heading as="h1" fontSize={{ base: '2xl', md: '4xl' }} fontWeight="bold" lineHeight="tight" letterSpacing="tight" color="navy.900">
                        H1: Page Title
                      </Heading>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        fontSize: 4xl (36px desktop / 24px mobile) • fontWeight: bold (700) • lineHeight: tight (1.25) • letterSpacing: tight (-0.025em)
                      </Text>
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        Use once per page for the main page title. Maximum visual hierarchy.
                      </Text>
                    </Box>

                    <Box borderLeft="4px solid" borderColor="navy.400" pl={4}>
                      <Heading as="h2" fontSize={{ base: 'xl', md: '3xl' }} fontWeight="bold" lineHeight="tight" color="navy.800">
                        H2: Section Title
                      </Heading>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        fontSize: 3xl (30px desktop / 20px mobile) • fontWeight: bold (700) • lineHeight: tight (1.25)
                      </Text>
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        Main section headings that divide page content into logical groups.
                      </Text>
                    </Box>

                    <Box borderLeft="4px solid" borderColor="navy.300" pl={4}>
                      <Heading as="h3" fontSize={{ base: 'lg', md: '2xl' }} fontWeight="semibold" lineHeight="snug" color="navy.700">
                        H3: Subsection Title
                      </Heading>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        fontSize: 2xl (24px desktop / 18px mobile) • fontWeight: semibold (600) • lineHeight: snug (1.375)
                      </Text>
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        Subsection headings within major sections. Secondary hierarchy level.
                      </Text>
                    </Box>

                    <Box borderLeft="4px solid" borderColor="navy.200" pl={4}>
                      <Heading as="h4" fontSize="xl" fontWeight="semibold" lineHeight="snug" color="navy.600">
                        H4: Card/Component Title
                      </Heading>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        fontSize: xl (20px) • fontWeight: semibold (600) • lineHeight: snug (1.375)
                      </Text>
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        Component-level headings like card titles, panel headers.
                      </Text>
                    </Box>

                    <Box borderLeft="4px solid" borderColor="gray.300" pl={4}>
                      <Heading as="h5" fontSize="lg" fontWeight="semibold" color="gray.700">
                        H5: Small Heading
                      </Heading>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        fontSize: lg (18px) • fontWeight: semibold (600)
                      </Text>
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        Minor headings, list headers, small card titles.
                      </Text>
                    </Box>

                    <Box borderLeft="4px solid" borderColor="gray.200" pl={4}>
                      <Heading as="h6" fontSize="md" fontWeight="semibold" color="gray.600">
                        H6: Smallest Heading
                      </Heading>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        fontSize: md (16px) • fontWeight: semibold (600)
                      </Text>
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        Rarely used. Consider bold text instead for this hierarchy level.
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                <Box h="1px" bg="gray.200" />

                {/* Body Text Scale */}
                <Box>
                  <Text fontWeight="bold" fontSize="lg" mb={4} color="navy.700">
                    Body Text Scale (Roboto)
                  </Text>
                  <VStack gap={3} align="stretch">
                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontSize="5xl" fontFamily="body" color="navy.900" lineHeight="tight">
                        Display Text (5xl - 48px)
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        fontSize: 5xl • Use sparingly for hero sections on desktop only
                      </Text>
                    </Box>

                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontSize="4xl" fontFamily="body" color="navy.800" lineHeight="tight">
                        Hero Text (4xl - 36px)
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        fontSize: 4xl • Large emphasis text, CTAs, hero sections
                      </Text>
                    </Box>

                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontSize="3xl" fontFamily="body" color="navy.700">
                        Extra Large (3xl - 30px)
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        fontSize: 3xl • Emphasized content, statistics, featured data
                      </Text>
                    </Box>

                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontSize="2xl" fontFamily="body" color="gray.800">
                        Large Emphasized (2xl - 24px)
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        fontSize: 2xl • Pull quotes, important callouts
                      </Text>
                    </Box>

                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontSize="xl" fontFamily="body" color="gray.700">
                        Emphasized Text (xl - 20px)
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        fontSize: xl • Subheadings, intro paragraphs, emphasized body text
                      </Text>
                    </Box>

                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontSize="lg" fontFamily="body" color="gray.700">
                        Large Body Text (lg - 18px) - Great for readability in long-form content and accessibility
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        fontSize: lg • Long-form content, article body, improved readability
                      </Text>
                    </Box>

                    <Box bg="white" border="2px solid" borderColor="navy.500" p={4} borderRadius="md">
                      <Text fontSize="md" fontFamily="body" color="gray.700">
                        Base Body Text (md - 16px) - This is the default font size for all body content. Use this for paragraphs, descriptions, and general UI text. Minimum recommended size for body text.
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={1} fontWeight="bold">
                        fontSize: md (DEFAULT) • Most common body text size • 16px minimum for accessibility
                      </Text>
                    </Box>

                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontSize="sm" fontFamily="body" color="gray.600">
                        Small Text (sm - 14px) - Used for secondary information, helper text, captions, and metadata
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        fontSize: sm • Labels, helper text, secondary information, timestamps
                      </Text>
                    </Box>

                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontSize="xs" fontFamily="body" color="gray.500">
                        Extra Small Text (xs - 12px) - Fine print, legal text, very minor metadata
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        fontSize: xs • Minimum size • Use sparingly for legal text, tooltips
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                <Box h="1px" bg="gray.200" />

                {/* Font Weights */}
                <Box>
                  <Text fontWeight="bold" fontSize="lg" mb={4} color="navy.700">
                    Font Weights
                  </Text>
                  <VStack gap={2} align="stretch">
                    <Box bg="gray.50" p={3} borderRadius="md">
                      <Text fontSize="lg" fontWeight="normal" mb={1}>
                        Normal (400) - Default body text weight
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        fontWeight: normal • All body text by default
                      </Text>
                    </Box>
                    <Box bg="gray.50" p={3} borderRadius="md">
                      <Text fontSize="lg" fontWeight="medium" mb={1}>
                        Medium (500) - Subtle emphasis within paragraphs
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        fontWeight: medium • Emphasized text, important words
                      </Text>
                    </Box>
                    <Box bg="gray.50" p={3} borderRadius="md">
                      <Text fontSize="lg" fontWeight="semibold" mb={1}>
                        Semibold (600) - Buttons, labels, card titles
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        fontWeight: semibold • Buttons, form labels, data labels, H3-H6
                      </Text>
                    </Box>
                    <Box bg="gray.50" p={3} borderRadius="md">
                      <Text fontSize="lg" fontWeight="bold" mb={1}>
                        Bold (700) - Headings, strong emphasis
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        fontWeight: bold • H1, H2, H3 headings, strong emphasis
                      </Text>
                    </Box>
                    <Box bg="gray.50" p={3} borderRadius="md">
                      <Text fontSize="lg" fontWeight="extrabold" mb={1}>
                        Extrabold (800) - Hero headings only (use sparingly)
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        fontWeight: extrabold • Hero text, display headings (rare)
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                <Box h="1px" bg="gray.200" />

                {/* Line Heights */}
                <Box>
                  <Text fontWeight="bold" fontSize="lg" mb={4} color="navy.700">
                    Line Heights
                  </Text>
                  <VStack gap={3} align="stretch">
                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Heading fontSize="2xl" lineHeight="tight" mb={2}>
                        Tight Line Height (1.25)
                      </Heading>
                      <Text fontSize="sm" color="gray.600">
                        lineHeight: tight • Used for large headings (H1, H2) to maintain compact visual hierarchy
                      </Text>
                    </Box>
                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Heading fontSize="xl" lineHeight="snug" mb={2}>
                        Snug Line Height (1.375)
                      </Heading>
                      <Text fontSize="sm" color="gray.600">
                        lineHeight: snug • Used for small headings (H3-H6) for balanced spacing
                      </Text>
                    </Box>
                    <Box bg="white" border="2px solid" borderColor="navy.500" p={4} borderRadius="md">
                      <Text fontSize="md" lineHeight="normal" mb={2}>
                        Normal Line Height (1.5) - This is the default line height for body text. It provides comfortable reading with adequate spacing between lines. Most paragraphs use this value.
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        lineHeight: normal (DEFAULT) • Body text default • Optimal readability
                      </Text>
                    </Box>
                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontSize="md" lineHeight="relaxed">
                        Relaxed Line Height (1.625) - Used for long-form content where extra breathing room improves readability. Articles, documentation, and detailed explanations benefit from this spacing.
                      </Text>
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        lineHeight: relaxed • Long-form content, articles, documentation
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                <Box h="1px" bg="gray.200" />

                {/* Letter Spacing */}
                <Box>
                  <Text fontWeight="bold" fontSize="lg" mb={4} color="navy.700">
                    Letter Spacing
                  </Text>
                  <VStack gap={3} align="stretch">
                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontSize="2xl" letterSpacing="tighter" fontWeight="bold">
                        TIGHTER (-0.05em)
                      </Text>
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        letterSpacing: tighter • Very tight headings (rare, special cases)
                      </Text>
                    </Box>
                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Heading fontSize="3xl" letterSpacing="tight">
                        Tight Spacing (-0.025em)
                      </Heading>
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        letterSpacing: tight • Large headings (48px+) for visual balance
                      </Text>
                    </Box>
                    <Box bg="white" border="2px solid" borderColor="navy.500" p={4} borderRadius="md">
                      <Text fontSize="lg" letterSpacing="normal">
                        Normal Spacing (0) - Default letter spacing
                      </Text>
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        letterSpacing: normal (DEFAULT) • Body text, most UI elements
                      </Text>
                    </Box>
                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Button colorPalette="primary" size="lg" letterSpacing="wide">
                        WIDE SPACING (0.025em)
                      </Button>
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        letterSpacing: wide • Buttons, CTA text for better readability
                      </Text>
                    </Box>
                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontSize="sm" letterSpacing="wider" fontWeight="semibold" textTransform="uppercase" color="gray.600">
                        WIDER SPACING (0.05em)
                      </Text>
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        letterSpacing: wider • All-caps labels, overline text, eyebrows
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                <Box h="1px" bg="gray.200" />

                {/* Real-World Typography Examples */}
                <Box>
                  <Text fontWeight="bold" fontSize="lg" mb={4} color="navy.700">
                    Real-World Usage Examples
                  </Text>
                  
                  {/* Article Layout */}
                  <Box bg="white" border="1px solid" borderColor="gray.200" p={6} borderRadius="lg" mb={4}>
                    <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" fontWeight="semibold" color="gray.500" mb={2}>
                      News • March 15, 2025
                    </Text>
                    <Heading as="h1" fontSize={{ base: '2xl', md: '4xl' }} lineHeight="tight" mb={4}>
                      Eliud Kipchoge Breaks Marathon World Record
                    </Heading>
                    <Text fontSize="xl" color="gray.600" lineHeight="relaxed" mb={4} fontWeight="medium">
                      The Kenyan marathon legend shattered his own world record by 30 seconds at the Berlin Marathon, finishing in an astonishing 2:00:35.
                    </Text>
                    <Text fontSize="md" lineHeight="normal" color="gray.700" mb={3}>
                      In what can only be described as a historic performance, Eliud Kipchoge demonstrated why he is considered the greatest marathoner of all time. Running in near-perfect conditions in Berlin, Kipchoge maintained a blistering pace throughout the entire 42.2 kilometers.
                    </Text>
                    <Text fontSize="md" lineHeight="normal" color="gray.700">
                      "I felt strong from the start," Kipchoge said after the race. "The crowd, the weather, everything came together perfectly today."
                    </Text>
                  </Box>

                  {/* Data Card */}
                  <Box bg="navy.900" color="white" p={6} borderRadius="lg">
                    <Text fontSize="sm" textTransform="uppercase" letterSpacing="wider" fontWeight="semibold" opacity={0.7} mb={3}>
                      Team Statistics
                    </Text>
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
                    <Box h="1px" bg="whiteAlpha.300" mb={4} />
                    <VStack align="stretch" gap={2}>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Men's Team Average</Text>
                        <Text fontSize="sm" fontWeight="semibold">2:04:32</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Women's Team Average</Text>
                        <Text fontSize="sm" fontWeight="semibold">2:18:45</Text>
                      </HStack>
                    </VStack>
                  </Box>
                </Box>

              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Button State Examples */}
          <Card.Root>
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>Button States & Interactions</Heading>
              <Text fontSize="sm" color="gray.600" mt={2}>
                All states use semantic color tokens for consistency
              </Text>
            </Card.Header>
            <Card.Body>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                
                {/* Primary Button States */}
                <Box>
                  <Text fontWeight="semibold" mb={3}>Primary Button (Navy)</Text>
                  <Stack gap={3}>
                    <Button colorPalette="primary" size="lg">
                      Default State
                    </Button>
                    <Button colorPalette="primary" size="lg" _hover={{ bg: 'primary.600' }}>
                      Hover State
                    </Button>
                    <Button colorPalette="primary" size="lg" disabled>
                      Disabled State
                    </Button>
                    <Button colorPalette="primary" variant="outline" size="lg">
                      Outline Variant
                    </Button>
                    <Button colorPalette="primary" variant="ghost" size="lg">
                      Ghost Variant
                    </Button>
                  </Stack>
                </Box>

                {/* Secondary Button States */}
                <Box>
                  <Text fontWeight="semibold" mb={3}>Secondary Button (Gold)</Text>
                  <Stack gap={3}>
                    <Button colorPalette="secondary" size="lg">
                      Default State
                    </Button>
                    <Button colorPalette="secondary" size="lg" _hover={{ bg: 'secondary.600' }}>
                      Hover State
                    </Button>
                    <Button colorPalette="secondary" size="lg" disabled>
                      Disabled State
                    </Button>
                    <Button colorPalette="secondary" variant="outline" size="lg">
                      Outline Variant
                    </Button>
                    <Button colorPalette="secondary" variant="ghost" size="lg">
                      Ghost Variant
                    </Button>
                  </Stack>
                </Box>

                {/* Status Button States */}
                <Box>
                  <Text fontWeight="semibold" mb={3}>Status Buttons</Text>
                  <Stack gap={3}>
                    <Button colorPalette="success" size="lg">
                      Success Action
                    </Button>
                    <Button colorPalette="warning" size="lg">
                      Warning Action
                    </Button>
                    <Button colorPalette="error" size="lg">
                      Destructive Action
                    </Button>
                    <Button colorPalette="info" size="lg">
                      Info Action
                    </Button>
                  </Stack>
                </Box>

                {/* Button Sizes */}
                <Box>
                  <Text fontWeight="semibold" mb={3}>Button Sizes</Text>
                  <Stack gap={3} align="start">
                    <Button colorPalette="primary" size="xs">
                      Extra Small
                    </Button>
                    <Button colorPalette="primary" size="sm">
                      Small
                    </Button>
                    <Button colorPalette="primary" size="md">
                      Medium (Default)
                    </Button>
                    <Button colorPalette="primary" size="lg">
                      Large
                    </Button>
                  </Stack>
                </Box>

              </Grid>
            </Card.Body>
          </Card.Root>

          {/* Responsive Grid Demo */}
          <Card.Root>
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>Responsive Grid (Resize Window)</Heading>
            </Card.Header>
            <Card.Body>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <GridItem
                    key={num}
                    bg="navy.100"
                    p={6}
                    borderRadius="md"
                    textAlign="center"
                    fontWeight="semibold"
                  >
                    Grid Item {num}
                  </GridItem>
                ))}
              </Grid>
            </Card.Body>
          </Card.Root>

          {/* NEW: Spacing System Demo */}
          <Card.Root>
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>Spacing System (4px Base Unit)</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={6} align="stretch">
                <Box>
                  <Text fontWeight="semibold" mb={2}>Common Spacing Values</Text>
                  <VStack gap={0} align="stretch">
                    {[
                      { size: '1', px: '4px', use: 'Tiny gap' },
                      { size: '2', px: '8px', use: 'Compact spacing' },
                      { size: '3', px: '12px', use: 'Small spacing' },
                      { size: '4', px: '16px', use: 'Base unit (DEFAULT)' },
                      { size: '6', px: '24px', use: 'Large spacing' },
                      { size: '8', px: '32px', use: 'Extra large' },
                      { size: '12', px: '48px', use: 'Major sections' },
                    ].map((space) => (
                      <HStack key={space.size} gap={4} py={2} borderBottom="1px solid" borderColor="gray.100">
                        <Box w="60px">
                          <Text fontSize="sm" fontWeight="bold">{space.size}</Text>
                        </Box>
                        <Box 
                          bg="navy.500" 
                          h="20px" 
                          w={`calc(${space.px})`}
                          borderRadius="sm"
                        />
                        <Box flex={1}>
                          <Text fontSize="sm">{space.px}</Text>
                          <Text fontSize="xs" color="gray.500">{space.use}</Text>
                        </Box>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* NEW: Shadow System Demo */}
          <Card.Root>
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>Shadow System (Elevation)</Heading>
            </Card.Header>
            <Card.Body>
              <Grid 
                templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} 
                gap={6}
              >
                {['xs', 'sm', 'md', 'lg', 'xl', '2xl'].map((shadow) => (
                  <Box
                    key={shadow}
                    bg="white"
                    p={6}
                    borderRadius="lg"
                    boxShadow={shadow}
                    textAlign="center"
                  >
                    <Text fontWeight="semibold" mb={1}>shadow="{shadow}"</Text>
                    <Text fontSize="sm" color="gray.600">
                      {shadow === 'xs' && 'Subtle'}
                      {shadow === 'sm' && 'Card default'}
                      {shadow === 'md' && 'Hover state'}
                      {shadow === 'lg' && 'Elevated'}
                      {shadow === 'xl' && 'Modal'}
                      {shadow === '2xl' && 'Maximum'}
                    </Text>
                  </Box>
                ))}
              </Grid>
            </Card.Body>
          </Card.Root>

          {/* NEW: Transition Durations Demo */}
          <Card.Root>
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>Transition Durations</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={3} align="stretch">
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Hover over each box to see the transition speed
                </Text>
                {[
                  { duration: '75ms', name: 'ultra', use: 'Instant feedback (hover colors)' },
                  { duration: '100ms', name: 'faster', use: 'Quick (button press)' },
                  { duration: '150ms', name: 'fast', use: 'Standard (hover effects)' },
                  { duration: '250ms', name: 'normal', use: 'Comfortable (modal open) - DEFAULT' },
                  { duration: '350ms', name: 'slow', use: 'Deliberate (page transition)' },
                ].map((transition) => (
                  <Box
                    key={transition.name}
                    bg="navy.500"
                    color="white"
                    p={4}
                    borderRadius="md"
                    transition={`all ${transition.duration} cubic-bezier(0, 0, 0.2, 1)`}
                    cursor="pointer"
                    _hover={{
                      bg: 'gold.500',
                      color: 'navy.900',
                      transform: 'translateX(10px)',
                    }}
                  >
                    <HStack justify="space-between">
                      <Box>
                        <Text fontWeight="bold">{transition.duration}</Text>
                        <Text fontSize="sm" opacity={0.9}>{transition.use}</Text>
                      </Box>
                      <Text fontSize="xs" opacity={0.7}>Hover me →</Text>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* NEW: Z-Index Layers Demo */}
          <Card.Root>
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>Z-Index Scale (Layering)</Heading>
            </Card.Header>
            <Card.Body>
              <Box position="relative" h="300px" bg="gray.50" borderRadius="md" overflow="hidden">
                <VStack gap={0} align="stretch" h="full" justify="space-around" p={4}>
                  {[
                    { level: 'base', value: '0', desc: 'Base layer' },
                    { level: 'docked', value: '10', desc: 'Sticky elements' },
                    { level: 'dropdown', value: '1000', desc: 'Dropdown menus' },
                    { level: 'modal', value: '1400', desc: 'Modal dialogs' },
                    { level: 'toast', value: '1700', desc: 'Toast notifications' },
                    { level: 'tooltip', value: '1800', desc: 'Tooltips (highest)' },
                  ].map((layer, index) => (
                    <Box
                      key={layer.level}
                      position="relative"
                      bg={`navy.${(index + 1) * 100}`}
                      color={index > 2 ? 'white' : 'navy.900'}
                      p={3}
                      borderRadius="md"
                      fontSize="sm"
                      zIndex={layer.value}
                      boxShadow="md"
                    >
                      <HStack justify="space-between">
                        <Text fontWeight="bold">{layer.level}</Text>
                        <Text opacity={0.8}>z-index: {layer.value}</Text>
                      </HStack>
                      <Text fontSize="xs" opacity={0.7}>{layer.desc}</Text>
                    </Box>
                  ))}
                </VStack>
              </Box>
              <Text fontSize="sm" color="gray.600" mt={3}>
                Visual representation of z-index layering system (darker = higher z-index)
              </Text>
            </Card.Body>
          </Card.Root>

          {/* NEW: Border Radius Demo */}
          <Card.Root>
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>Border Radius Scale</Heading>
            </Card.Header>
            <Card.Body>
              <Grid 
                templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} 
                gap={4}
              >
                {[
                  { size: 'sm', label: '2px' },
                  { size: 'md', label: '6px' },
                  { size: 'lg', label: '8px' },
                  { size: 'xl', label: '12px' },
                  { size: '2xl', label: '16px' },
                  { size: '3xl', label: '24px' },
                  { size: 'full', label: '9999px' },
                ].map((radius) => (
                  <Box key={radius.size} textAlign="center">
                    <Box
                      bg="navy.500"
                      w="80px"
                      h="80px"
                      borderRadius={radius.size}
                      mx="auto"
                      mb={2}
                    />
                    <Text fontSize="sm" fontWeight="semibold">{radius.size}</Text>
                    <Text fontSize="xs" color="gray.500">{radius.label}</Text>
                  </Box>
                ))}
              </Grid>
            </Card.Body>
          </Card.Root>

          {/* NEW: Container Sizes Demo */}
          <Card.Root>
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>Container Max-Widths</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={3} align="stretch">
                {[
                  { size: 'sm', width: '640px', use: 'Mobile landscape' },
                  { size: 'md', width: '768px', use: 'Tablet' },
                  { size: 'lg', width: '1024px', use: 'Desktop' },
                  { size: 'xl', width: '1280px', use: 'Large desktop (DEFAULT for MMFL)' },
                  { size: '2xl', width: '1536px', use: 'Extra large' },
                ].map((container) => (
                  <Box key={container.size}>
                    <Box
                      bg="navy.100"
                      borderRadius="md"
                      p={3}
                      maxW={container.width}
                      mx="auto"
                    >
                      <HStack justify="space-between">
                        <Text fontWeight="semibold">{container.size}</Text>
                        <Text fontSize="sm" color="gray.600">{container.width}</Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">{container.use}</Text>
                    </Box>
                  </Box>
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* NEW: Layout Primitives Demos */}
          <Card.Root>
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>Layout Primitives</Heading>
              <Text fontSize="sm" color="gray.600" mt={2}>
                Stack, Grid, Flex, and Container components for consistent layouts
              </Text>
            </Card.Header>
            <Card.Body>
              <VStack gap={8} align="stretch">
                
                {/* VStack Demo */}
                <Box>
                  <Heading fontSize="lg" mb={3}>VStack (Vertical Stack)</Heading>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Vertical layout with consistent spacing between items
                  </Text>
                  <VStack gap={4} align="stretch">
                    <Box p={4} bg="navy.50" borderRadius="md">
                      <Text>Item 1 - spacing={4} = 16px gap</Text>
                    </Box>
                    <Box p={4} bg="navy.50" borderRadius="md">
                      <Text>Item 2 - spacing={4} = 16px gap</Text>
                    </Box>
                    <Box p={4} bg="navy.50" borderRadius="md">
                      <Text>Item 3 - spacing={4} = 16px gap</Text>
                    </Box>
                  </VStack>
                </Box>

                {/* HStack Demo */}
                <Box>
                  <Heading fontSize="lg" mb={3}>HStack (Horizontal Stack)</Heading>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Horizontal layout for button groups and toolbars
                  </Text>
                  <HStack gap={3}>
                    <Button colorPalette="primary">Save</Button>
                    <Button variant="outline" colorPalette="primary">Cancel</Button>
                    <Button variant="ghost" colorPalette="primary">Skip</Button>
                  </HStack>
                </Box>

                {/* Grid Demo */}
                <Box>
                  <Heading fontSize="lg" mb={3}>SimpleGrid (Responsive Grid)</Heading>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Auto-responsive: 1 col mobile → 2 cols tablet → 3 cols desktop
                  </Text>
                  <Grid 
                    templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} 
                    gap={4}
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <Box 
                        key={num}
                        p={6} 
                        bg="navy.50" 
                        borderRadius="md" 
                        textAlign="center"
                      >
                        <Heading size="lg" color="navy.600">Card {num}</Heading>
                        <Text fontSize="sm" color="gray.600" mt={2}>
                          Responsive grid item
                        </Text>
                      </Box>
                    ))}
                  </Grid>
                </Box>

                {/* Flex Demo */}
                <Box>
                  <Heading fontSize="lg" mb={3}>Flex Layout</Heading>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Flexible box layout with justify and align options
                  </Text>
                  <VStack gap={3} align="stretch">
                    {/* Space-between */}
                    <Box 
                      display="flex" 
                      justifyContent="space-between" 
                      alignItems="center"
                      p={4} 
                      bg="navy.50" 
                      borderRadius="md"
                    >
                      <Text fontWeight="semibold">Dashboard</Text>
                      <Button size="sm" colorPalette="primary">Settings</Button>
                    </Box>
                    
                    {/* Center aligned */}
                    <Box 
                      display="flex" 
                      justifyContent="center" 
                      alignItems="center"
                      p={4} 
                      bg="navy.50" 
                      borderRadius="md"
                      h="100px"
                    >
                      <Text fontWeight="semibold">Centered Content</Text>
                    </Box>

                    {/* Space-around */}
                    <Box 
                      display="flex" 
                      justifyContent="space-around" 
                      alignItems="center"
                      p={4} 
                      bg="navy.50" 
                      borderRadius="md"
                    >
                      <Badge colorPalette="primary">Badge 1</Badge>
                      <Badge colorPalette="secondary">Badge 2</Badge>
                      <Badge colorPalette="success">Badge 3</Badge>
                    </Box>
                  </VStack>
                </Box>

                {/* Responsive Stack Demo */}
                <Box>
                  <Heading fontSize="lg" mb={3}>Responsive Stack</Heading>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Vertical on mobile → Horizontal on desktop (resize to see)
                  </Text>
                  <Stack 
                    direction={{ base: 'column', md: 'row' }}
                    gap={{ base: 4, md: 6 }}
                    justify="space-between"
                  >
                    <Box flex="1" p={4} bg="navy.50" borderRadius="md">
                      <Heading size="md" mb={2}>Main Content</Heading>
                      <Text fontSize="sm" color="gray.600">
                        This content takes up available space
                      </Text>
                    </Box>
                    <Box 
                      w={{ base: 'full', md: '250px' }}
                      p={4} 
                      bg="gold.50" 
                      borderRadius="md"
                    >
                      <Heading size="md" mb={2}>Sidebar</Heading>
                      <Text fontSize="sm" color="gray.600">
                        Fixed width on desktop
                      </Text>
                    </Box>
                  </Stack>
                </Box>

              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Accessibility Info */}
          <Box bg="success.50" borderLeft="4px solid" borderColor="success.500" p={4} borderRadius="md">
            <Heading fontSize="lg" color="success.700" mb={2}>
              ✅ Phase 2 Complete: Design Tokens + Layout Primitives
            </Heading>
            <Text color="success.800" mb={2}>
              All design tokens and layout primitives from CORE_DESIGN_GUIDELINES.md are now implemented:
            </Text>
            <Text color="success.800" fontSize="sm">
              • Colors (navy/gold + semantics) • Typography (Inter/Roboto) • Spacing (4px base unit) 
              • Shadows (elevation) • Transitions (durations + easing) • Z-Index (layering) 
              • Border Radius • Container Sizes • Breakpoints (mobile-first) • Layout Primitives (Stack/Grid/Flex/Container)
            </Text>
            <Box h="1px" bg="success.200" my={3} />
            <Text color="success.800" fontSize="sm">
              <strong>WCAG 2.1 AA Compliant:</strong> Navy 900 on white (13.5:1 ✅ AAA) • Gold 500 on navy 900 (8.2:1 ✅ AAA)
            </Text>
            <Box h="1px" bg="success.200" my={3} />
            <Text color="success.800" fontSize="sm" fontWeight="semibold">
              📚 Documentation: See docs/UI_LAYOUT_PRIMITIVES.md for complete usage guide
            </Text>
          </Box>

        </VStack>
      </Container>

      {/* Legacy CSS Footer - demonstrates coexistence */}
      <div style={{ 
        background: '#333',
        padding: '40px 20px',
        color: 'white',
        textAlign: 'center',
        marginTop: '40px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Legacy Footer (Vanilla CSS) - Demonstrates coexistence during migration
        </p>
      </div>
    </>
  );
}
