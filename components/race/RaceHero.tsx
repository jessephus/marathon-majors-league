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
  lockTime?: string | null;  // TIMESTAMPTZ from database - will be converted to user's timezone
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
  lockTime,
  location,
  logoUrl,
  backgroundImageUrl,
}: RaceHeroProps) {
  
  // Format date for display - prioritizes lockTime over raceDate
  const formatDate = (lockTimeValue?: string | null, fallbackDateString?: string) => {
    // If lockTime is available, use it (TIMESTAMPTZ from database with full date/time)
    if (lockTimeValue) {
      try {
        const date = new Date(lockTimeValue);
        return new Intl.DateTimeFormat('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }).format(date);
      } catch {
        // Fall through to fallback if lockTime parsing fails
      }
    }
    
    // Fallback to raceDate field (legacy behavior)
    if (fallbackDateString) {
      try {
        const date = new Date(fallbackDateString);
        return new Intl.DateTimeFormat('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }).format(date);
      } catch {
        return fallbackDateString;
      }
    }
    
    return fallbackDateString || '';
  };

  // Format time for display - prioritizes lockTime with automatic timezone conversion
  const formatTime = (lockTimeValue?: string | null, fallbackDateString?: string) => {
    // If lockTime is available, use it (TIMESTAMPTZ from database)
    // This will automatically convert to the user's browser timezone
    if (lockTimeValue) {
      try {
        const date = new Date(lockTimeValue);
        return new Intl.DateTimeFormat(undefined, {  // undefined = user's locale/timezone
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZoneName: 'short'  // Shows EST, PST, JST, etc.
        }).format(date);
      } catch {
        // If lockTime parsing fails, fall through to fallback
      }
    }
    
    // Fallback to extracting time from date string (legacy behavior)
    if (fallbackDateString) {
      try {
        const date = new Date(fallbackDateString);
        return new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(date);
      } catch {
        return '';
      }
    }
    
    return '';
  };

  // Priority: lockTime (for both date and time) > raceDate (fallback for date only)
  const displayDate = formatDate(lockTime, raceDate);
  // Priority: raceTime (explicit) > lockTime (with timezone) > fallback extraction from raceDate
  const displayTime = raceTime ? raceTime : formatTime(lockTime, raceDate);

  return (
    <Box
      position="relative"
      width="100%"
      minHeight={{ base: '180px', md: '220px', lg: '280px' }}
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
        height="60px"
        background="linear-gradient(to bottom, transparent 0%, rgba(247, 250, 252, 1) 100%)"
        pointerEvents="none"
      />
      <Container
        maxW="container.xl"
        mx="auto"
        position="relative"
        zIndex={2}
        height="100%"
        display="flex"
        alignItems="flex-start"
        pt={{ base: 3, md: 4, lg: 5 }}
        pb={{ base: 2, md: 3, lg: 4 }}
      >
        <VStack
          align="flex-start"
          gap={{ base: 2, md: 3, lg: 4 }}
          width="100%"
          px={{ base: 4, md: 6 }}
        >
          {/* Logo and Race Name */}
          <Flex
            align="center"
            gap={{ base: 3, md: 4, lg: 5 }}
            flexWrap={{ base: 'wrap', md: 'nowrap' }}
          >
            {logoUrl && (
              <Image
                src={logoUrl}
                alt={`${raceName} logo`}
                boxSize={{ base: '40px', md: '60px', lg: '70px' }}
                objectFit="contain"
                flexShrink={0}
                bg="white"
                borderRadius="lg"
                p={1}
                shadow="lg"
              />
            )}
            
            <Heading
              as="h1"
              fontSize={{ base: 'xl', md: '3xl', lg: '4xl' }}
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
            gap={1}
            fontSize={{ base: 'sm', md: 'md', lg: 'lg' }}
            color="white"
          >
            <HStack gap={2}>
              <CalendarIcon style={{ width: '20px', height: '20px' }} />
              <Text fontWeight="medium" textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                {displayDate}
              </Text>
              {displayTime && (
                <>
                  <Text color="whiteAlpha.700" px={1}>•</Text>
                  <ClockIcon style={{ width: '20px', height: '20px' }} />
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
