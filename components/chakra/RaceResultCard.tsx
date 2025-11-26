/**
 * RaceResultCard Component
 * 
 * A compact, two-row race result card for the leaderboard results table.
 * Displays athlete race performance with fantasy points in a mobile-friendly format.
 * 
 * Design Requirements:
 * - Maximum 2 rows at ALL breakpoints (base, sm, md, lg)
 * - Compact layout inspired by AthleteBrowseCard
 * - Shows: placement, athlete info, performance, and fantasy points
 * - Interactive (opens athlete modal on click)
 * - Keyboard accessible
 * - WCAG 2.1 AA compliant
 * 
 * @example
 * ```tsx
 * <RaceResultCard
 *   placement={1}
 *   athleteName="Eliud Kipchoge"
 *   athleteId={1}
 *   country="KEN"
 *   personalBest="2:01:09"
 *   headshotUrl="..."
 *   finishTime="2:05:42"
 *   gap="+1:23"
 *   totalPoints={87}
 *   breakdown="Place(10), Gap(5), NS(2)"
 *   gender="men"
 *   onClick={handleClick}
 * />
 * ```
 */

import { Box, Flex, Text, Image, HStack, VStack } from '@chakra-ui/react';
import { forwardRef, useState } from 'react';
import { Badge } from '@/components/chakra/Badge';
import { TrophyIcon } from '@heroicons/react/24/solid';

// ===========================
// Types
// ===========================

export interface RaceResultCardProps {
  placement: number;
  athleteName: string;
  athleteId: number;
  headshotUrl?: string;
  country: string;
  personalBest: string;
  finishTime: string;
  gap?: string;
  totalPoints: number;
  breakdown: string;
  gender: 'men' | 'women';
  isDNS?: boolean;
  isDNF?: boolean;
  onClick?: () => void;
}

// ===========================
// Helper Functions
// ===========================

/**
 * Get medal emoji for top 3 placements
 */
function getMedalColor(placement: number): string | null {
  if (placement === 1) return '#FFD700'; // Gold
  if (placement === 2) return '#C0C0C0'; // Silver
  if (placement === 3) return '#CD7F32'; // Bronze
  return null;
}

/**
 * Get country flag emoji
 */
function getCountryFlagEmoji(code: string): string {
  if (!code || code.length !== 3) return '';
  
  // Convert ISO 3166-1 alpha-3 to alpha-2
  const alpha3ToAlpha2: { [key: string]: string } = {
    'USA': 'US', 'GBR': 'GB', 'KEN': 'KE', 'ETH': 'ET', 'JPN': 'JP',
    'CHN': 'CN', 'CAN': 'CA', 'AUS': 'AU', 'FRA': 'FR', 'GER': 'DE',
    // Add more mappings as needed
  };
  
  const alpha2 = alpha3ToAlpha2[code.toUpperCase()] || code.substring(0, 2);
  
  // Convert to flag emoji
  return alpha2
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

/**
 * Get fallback SVG for runner based on gender
 */
function getRunnerSvg(gender: string): string {
  const color = gender === 'women' ? '#ff6b9d' : '#4299e1';
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}">
      <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
    </svg>
  `)}`;
}

// ===========================
// RaceResultCard Component
// ===========================

export const RaceResultCard = forwardRef<HTMLDivElement, RaceResultCardProps>(({
  placement,
  athleteName,
  athleteId,
  headshotUrl,
  country,
  personalBest,
  finishTime,
  gap,
  totalPoints,
  breakdown,
  gender,
  isDNS = false,
  isDNF = false,
  onClick,
}, ref) => {
  const [imageError, setImageError] = useState(false);

  // Prepare display data
  const medalColor = getMedalColor(placement);
  const countryCode = country.toUpperCase();
  const flag = getCountryFlagEmoji(countryCode);
  const fallbackImage = getRunnerSvg(gender);
  const displayImage = imageError || !headshotUrl ? fallbackImage : headshotUrl;

  // Status styling for light mode
  const isNonFinisher = isDNS || isDNF;
  const cardBg = isNonFinisher ? 'gray.100' : 'white';
  const textColor = 'gray.900';
  const secondaryTextColor = 'gray.600';

  return (
    <Box
      ref={ref}
      as="button"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      w="100%"
      bg={cardBg}
      borderRadius="lg"
      p={{ base: 3, md: 4 }}
      transition="all 0.15s cubic-bezier(0, 0, 0.2, 1)"
      border="1px solid"
      borderColor="gray.200"
      _hover={{
        borderColor: 'navy.500',
        bg: isNonFinisher ? 'gray.200' : 'gray.50',
        transform: 'translateY(-2px)',
        shadow: 'md',
      }}
      _focus={{
        outline: 'none',
        borderColor: 'navy.500',
        boxShadow: '0 0 0 3px rgba(22, 28, 79, 0.15)',
      }}
      textAlign="left"
      cursor="pointer"
      role="button"
      tabIndex={0}
      aria-label={`${athleteName}, place ${placement}, ${finishTime}`}
    >
      {/* Row 1: Main Info */}
      <Flex align="center" gap={{ base: 2, md: 3 }} mb={2}>
        {/* Placement */}
        <Box flexShrink={0} w={{ base: '36px', md: '44px' }} display="flex" alignItems="center" justifyContent="center">
          {medalColor ? (
            <TrophyIcon style={{ width: '24px', height: '24px', color: medalColor }} aria-label={`${placement} place`} />
          ) : (
            <Text
              color="gray.600"
              fontWeight="bold"
              fontSize={{ base: 'xs', md: 'sm' }}
              textAlign="center"
            >
              #{placement}
            </Text>
          )}
        </Box>

        {/* Athlete Avatar */}
        <Box
          w={{ base: '36px', md: '44px' }}
          h={{ base: '36px', md: '44px' }}
          borderRadius="full"
          overflow="hidden"
          border="2px solid"
          borderColor="navy.500"
          bg="gray.100"
          flexShrink={0}
        >
          <Image
            src={displayImage}
            alt={athleteName}
            w="100%"
            h="100%"
            objectFit="cover"
            onError={() => setImageError(true)}
          />
        </Box>

        {/* Athlete Name, Country, Time+Gap */}
        <VStack gap={0} align="flex-start" flex={1} minW={0}>
          <Text
            color={textColor}
            fontWeight="semibold"
            fontSize={{ base: 'sm', md: 'md' }}
            lineClamp={1}
          >
            {athleteName}
          </Text>
          
          {/* Country + Time+Gap (single row) */}
          <HStack gap={2}>
            <Text fontSize={{ base: '2xs', md: 'xs' }} color={secondaryTextColor}>
              {flag} {countryCode}
            </Text>
            <Text fontSize={{ base: '2xs', md: 'xs' }} color={secondaryTextColor}>
              •
            </Text>
            <Text
              color={isDNS || isDNF ? 'red.600' : textColor}
              fontWeight="semibold"
              fontSize={{ base: 'xs', md: 'sm' }}
            >
              {finishTime}
            </Text>
            {gap && (
              <Text fontSize={{ base: '2xs', md: 'xs' }} color={secondaryTextColor}>
                {gap}
              </Text>
            )}
          </HStack>
        </VStack>

        {/* Fantasy Breakdown (moved from bottom) */}
        <VStack gap={0} align="flex-end" flexShrink={0} minW={{ base: '80px', md: '100px' }}>
          <Text
            color="navy.600"
            fontWeight="bold"
            fontSize={{ base: 'sm', md: 'md' }}
          >
            {totalPoints} pts
          </Text>
          {breakdown && (
            <Text
              fontSize={{ base: 'xs', md: 'xs' }}
              color={secondaryTextColor}
              lineClamp={1}
            >
              {breakdown}
            </Text>
          )}
        </VStack>
      </Flex>
    </Box>
  );
});

RaceResultCard.displayName = 'RaceResultCard';
