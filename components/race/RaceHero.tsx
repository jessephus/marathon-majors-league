/**
 * RaceHero Component
 * 
 * Full-width hero section for race pages featuring:
 * - Full-width background image with semi-transparent overlay
 * - Race logo prominently displayed to the left of race name
 * - Race name in bold uppercase white text
 * - Race date and time in clean white modern font
 * - Smooth fade into content below
 * 
 * Follows CORE_DESIGN_GUIDELINES.md navy/gold color scheme
 * and mobile-first responsive design principles.
 */

import { Box, Container, Flex, Heading, Text, HStack, VStack, Image } from '@chakra-ui/react';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

// ===========================
// Types
// ===========================

export interface RaceHeroProps {
  raceName: string;
  raceDate: string;
  raceTime?: string;
  location?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
}

// ===========================
// RaceHero Component
// ===========================

export function RaceHero({
  raceName,
  raceDate,
  raceTime,
  location,
  logoUrl,
  backgroundImageUrl,
}: RaceHeroProps) {
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch {
      return '';
    }
  };

  const displayDate = formatDate(raceDate);
  const displayTime = raceTime ? raceTime : formatTime(raceDate);

  return (
    <Box
      position="relative"
      width="100%"
      minHeight={{ base: '250px', md: '300px', lg: '400px' }}
      overflow="hidden"
    >
      {/* Background Image - Fixed position with responsive height */}
      {backgroundImageUrl && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100vw"
          height={{ base: '250px', md: '300px', lg: '400px' }}
          backgroundImage={`url(${backgroundImageUrl})`}
          backgroundSize="cover"
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
          zIndex={0}
          _after={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(22, 28, 79, 0.85) 0%, rgba(22, 28, 79, 0.70) 60%, rgba(255, 255, 255, 0) 100%)',
          }}
        />
      )}

      {/* Fallback gradient if no background image - Absolute position */}
      {!backgroundImageUrl && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          bgGradient="linear(to-br, navy.900, navy.700)"
          zIndex={0}
        />
      )}

      {/* Content - Positioned above fixed background */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        height="100px"
        background="linear-gradient(to bottom, transparent 0%, rgba(247, 250, 252, 1) 100%)"
        pointerEvents="none"
      />
      <Container
        maxW="container.xl"
        position="relative"
        zIndex={2}
        height="100%"
        display="flex"
        alignItems="center"
        py={{ base: 4, md: 6, lg: 8 }}
      >
        <VStack
          align="flex-start"
          gap={{ base: 4, md: 6 }}
          width="100%"
        >
          {/* Logo and Race Name */}
          <Flex
            align="center"
            gap={{ base: 4, md: 6 }}
            flexWrap={{ base: 'wrap', md: 'nowrap' }}
          >
            {logoUrl && (
              <Image
                src={logoUrl}
                alt={`${raceName} logo`}
                boxSize={{ base: '50px', md: '70px', lg: '90px' }}
                objectFit="contain"
                flexShrink={0}
                bg="white"
                borderRadius="xl"
                p={2}
                shadow="lg"
              />
            )}
            
            <Heading
              as="h1"
              fontSize={{ base: '2xl', md: '4xl', lg: '5xl' }}
              fontWeight="bold"
              color="white"
              textTransform="uppercase"
              letterSpacing="wider"
              lineHeight="shorter"
              textShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
            >
              {raceName}
            </Heading>
          </Flex>

          {/* Date, Time, Location */}
          <VStack
            align="flex-start"
            gap={2}
            fontSize={{ base: 'md', md: 'lg', lg: 'xl' }}
            color="white"
          >
            <HStack gap={3}>
              <CalendarIcon style={{ width: '24px', height: '24px' }} />
              <Text fontWeight="medium" textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                {displayDate}
              </Text>
              {displayTime && (
                <>
                  <Text color="whiteAlpha.700" px={2}>•</Text>
                  <ClockIcon style={{ width: '24px', height: '24px' }} />
                  <Text fontWeight="medium" textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                    {displayTime}
                  </Text>
                </>
              )}
            </HStack>
          </VStack>
        </VStack>
      </Container>

      {/* Enhanced fade effect at bottom - transitions to page background color */}
    </Box>
  );
}
