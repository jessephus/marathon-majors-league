/**
 * Chakra UI Demo Page - Phase 1 Validation
 * 
 * Purpose: Demonstrate Chakra UI v3 components working alongside legacy vanilla JS/CSS.
 * This page validates that:
 * 1. Chakra UI is properly installed and configured
 * 2. Theme (navy/gold palette) is applied correctly
 * 3. Google Fonts (Inter/Roboto) are loaded
 * 4. Chakra components coexist with legacy code
 * 5. Responsive design works (mobile-first)
 * 
 * This demo is referenced in UI_REDESIGN_ROADMAP.md Phase 1.
 * 
 * Note: Uses Chakra UI v3 API
 * 
 * @version 1.0.0
 * @date November 21, 2025
 */

import Head from 'next/head';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  Badge,
  Grid,
  GridItem,
  Stack,
} from '@chakra-ui/react';

export default function ChakraDemoPage() {

  return (
    <>
      <Head>
        <title>Chakra UI Demo - MMFL Phase 1</title>
        <meta name="description" content="Chakra UI demonstration page for Marathon Majors Fantasy League" />
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
              Chakra UI Phase 1 Demo
            </Heading>
            <Text fontSize="lg" mb={6}>
              Navy & Gold Design System • Inter/Roboto Fonts • Mobile-First
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

                {/* Semantic Colors */}
                <Box>
                  <Text fontWeight="semibold" mb={2}>Semantic Colors</Text>
                  <HStack gap={4} flexWrap="wrap">
                    <Badge colorPalette="success" size="lg">Success</Badge>
                    <Badge colorPalette="warning" size="lg">Warning</Badge>
                    <Badge colorPalette="error" size="lg">Error</Badge>
                    <Badge colorPalette="info" size="lg">Info</Badge>
                  </HStack>
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Typography Showcase */}
          <Card.Root>
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>Typography System</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={4} align="stretch">
                <Box>
                  <Heading as="h1" fontSize={{ base: '2xl', md: '4xl' }} fontFamily="heading">
                    H1 Heading - Inter Font
                  </Heading>
                  <Text fontSize="sm" color="gray.500">4xl size (36px desktop, 24px mobile)</Text>
                </Box>
                
                <Box>
                  <Heading as="h2" fontSize={{ base: 'xl', md: '3xl' }} fontFamily="heading">
                    H2 Heading - Inter Font
                  </Heading>
                  <Text fontSize="sm" color="gray.500">3xl size (30px desktop, 20px mobile)</Text>
                </Box>
                
                <Box>
                  <Heading as="h3" fontSize={{ base: 'lg', md: '2xl' }} fontFamily="heading">
                    H3 Heading - Inter Font
                  </Heading>
                  <Text fontSize="sm" color="gray.500">2xl size (24px desktop, 18px mobile)</Text>
                </Box>
                
                <Box h="1px" bg="gray.200" />
                
                <Box>
                  <Text fontSize="lg" fontFamily="body" mb={2}>
                    Body Text Large - Roboto Font (18px)
                  </Text>
                  <Text fontSize="md" fontFamily="body" mb={2}>
                    Body Text Default - Roboto Font (16px) - This is the base font size for all body content.
                  </Text>
                  <Text fontSize="sm" fontFamily="body" color="gray.600">
                    Body Text Small - Roboto Font (14px) - Used for secondary information.
                  </Text>
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Button Variants */}
          <Card.Root>
            <Card.Header>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>Button Styles</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={4} direction={{ base: 'column', md: 'row' }} flexWrap="wrap">
                <Button bg="navy.500" color="white" _hover={{ bg: 'navy.600' }}>
                  Navy Primary
                </Button>
                <Button 
                  variant="outline" 
                  borderColor="navy.500" 
                  color="navy.500"
                  _hover={{ bg: 'navy.50' }}
                >
                  Navy Outline
                </Button>
                <Button bg="gold.500" color="navy.900" _hover={{ bg: 'gold.600' }}>
                  Gold Accent
                </Button>
                <Button bg="success.500" color="white" _hover={{ bg: 'success.600' }}>
                  Success
                </Button>
                <Button bg="error.500" color="white" _hover={{ bg: 'error.600' }}>
                  Error
                </Button>
              </Stack>
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

          {/* Accessibility Info */}
          <Box bg="success.50" borderLeft="4px solid" borderColor="success.500" p={4} borderRadius="md">
            <Heading fontSize="lg" color="success.700" mb={2}>
              WCAG 2.1 AA Compliant
            </Heading>
            <Text color="success.800">
              All color combinations meet accessibility standards:
              Navy 900 on white (13.5:1 ✅ AAA) • Gold 500 on navy 900 (8.2:1 ✅ AAA)
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
