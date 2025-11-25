/**
 * AthleteBrowseCard Component
 * 
 * A specialized, visually rich athlete card for the browse/discovery page.
 * Designed to match the MMFL mockup design with:
 * - Dark navy background with gold accents
 * - Circular athlete photo with gold border
 * - Fantasy score prominently displayed
 * - Key stats (PB, age, rank) in a compact format
 * - Salary information
 * - Country flag display
 * - Hover effects and interactivity
 * 
 * Follows MMFL design guidelines:
 * - Navy (#161C4F) backgrounds
 * - Gold (#D4AF37) accents
 * - WCAG 2.1 AA compliant
 * - Mobile-first responsive design
 * - 44px minimum touch targets
 * 
 * @example
 * ```tsx
 * <AthleteBrowseCard
 *   athlete={{
 *     id: 1,
 *     name: 'Eliud Kipchoge',
 *     country: 'KEN',
 *     gender: 'men',
 *     pb: '2:01:09',
 *     salary: 12500,
 *     marathonRank: 1,
 *     age: 39
 *   }}
 *   fantasyScore={86}
 *   onClick={() => handleClick(athlete)}
 * />
 * ```
 */

import { Box, Flex, Text, Heading, Image, HStack, VStack } from '@chakra-ui/react';
import { forwardRef, useState } from 'react';

// ===========================
// Types
// ===========================

export interface AthleteBrowseData {
  id: number;
  name: string;
  country: string;
  gender: 'men' | 'women' | string;
  pb: string;
  salary?: number;
  headshotUrl?: string;
  marathonRank?: number;
  worldAthleticsMarathonRankingScore?: number;
  age?: number;
  sponsor?: string;
  seasonBest?: string;
}

export interface AthleteBrowseCardProps {
  athlete: AthleteBrowseData;
  fantasyScore: number;
  variant?: 'default' | 'compact' | 'detailed';
  isSelected?: boolean;
  onClick?: () => void;
}

// ===========================
// Helper Functions
// ===========================

/**
 * Get country flag emoji from 3-letter country code
 */
function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    'USA': '🇺🇸', 'KEN': '🇰🇪', 'ETH': '🇪🇹', 'GBR': '🇬🇧',
    'JPN': '🇯🇵', 'ITA': '🇮🇹', 'GER': '🇩🇪', 'FRA': '🇫🇷',
    'ESP': '🇪🇸', 'NED': '🇳🇱', 'BEL': '🇧🇪', 'NOR': '🇳🇴',
    'SWE': '🇸🇪', 'UGA': '🇺🇬', 'ERI': '🇪🇷', 'MEX': '🇲🇽',
    'CAN': '🇨🇦', 'AUS': '🇦🇺', 'NZL': '🇳🇿', 'RSA': '🇿🇦',
    'BRA': '🇧🇷', 'CHN': '🇨🇳', 'MAR': '🇲🇦', 'TAN': '🇹🇿',
    'RWA': '🇷🇼', 'BDI': '🇧🇮', 'ISR': '🇮🇱', 'POR': '🇵🇹',
    'SUI': '🇨🇭', 'IRL': '🇮🇪', 'POL': '🇵🇱', 'BRN': '🇧🇭',
  };
  return flags[countryCode] || '🏃';
}

/**
 * Format salary for display
 */
function formatSalary(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

/**
 * Get score color based on fantasy score value
 */
function getScoreColor(score: number): string {
  if (score >= 80) return 'gold.400';
  if (score >= 70) return 'gold.500';
  if (score >= 60) return 'gold.600';
  return 'gray.400';
}

// ===========================
// AthleteBrowseCard Component
// ===========================

export const AthleteBrowseCard = forwardRef<HTMLDivElement, AthleteBrowseCardProps>(({
  athlete,
  fantasyScore,
  variant = 'default',
  isSelected = false,
  onClick,
}, ref) => {
  const [imageError, setImageError] = useState(false);
  const scoreColor = getScoreColor(fantasyScore);

  // Compact variant for tighter layouts
  if (variant === 'compact') {
    return (
      <Box
        ref={ref}
        as="button"
        onClick={onClick}
        w="100%"
        bg="navy.800"
        borderRadius="lg"
        p={3}
        transition="all 0.15s cubic-bezier(0, 0, 0.2, 1)"
        border="1px solid"
        borderColor={isSelected ? 'gold.500' : 'navy.700'}
        _hover={{
          borderColor: 'gold.500',
          bg: 'navy.750',
        }}
        _focus={{
          outline: 'none',
          borderColor: 'gold.500',
          boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.3)',
        }}
        textAlign="left"
        cursor="pointer"
        minH="60px"
      >
        <Flex align="center" gap={3}>
          {/* Avatar */}
          <Box
            w="44px"
            h="44px"
            borderRadius="full"
            overflow="hidden"
            border="2px solid"
            borderColor="gold.500"
            bg="navy.700"
            flexShrink={0}
          >
            {athlete.headshotUrl && !imageError ? (
              <Image
                src={athlete.headshotUrl}
                alt={athlete.name}
                w="100%"
                h="100%"
                objectFit="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <Flex w="100%" h="100%" align="center" justify="center" bg="navy.600">
                <Text color="gold.500" fontSize="lg" fontWeight="bold">
                  {athlete.name.charAt(0)}
                </Text>
              </Flex>
            )}
          </Box>

          {/* Info */}
          <VStack align="stretch" flex={1} gap={0}>
            <HStack gap={2}>
              <Text fontSize="md" aria-hidden="true">
                {getCountryFlag(athlete.country)}
              </Text>
              <Text color="white" fontWeight="semibold" fontSize="sm" lineClamp={1}>
                {athlete.name}
              </Text>
            </HStack>
            <Text color="gray.400" fontSize="xs">
              PB: {athlete.pb}
            </Text>
          </VStack>

          {/* Score */}
          <Text color={scoreColor} fontWeight="bold" fontSize="xl" flexShrink={0}>
            {fantasyScore}
          </Text>
        </Flex>
      </Box>
    );
  }

  // Detailed variant with more stats
  if (variant === 'detailed') {
    return (
      <Box
        ref={ref}
        as="button"
        onClick={onClick}
        w="100%"
        bg="navy.800"
        borderRadius="xl"
        p={{ base: 5, md: 6 }}
        position="relative"
        transition="all 0.2s cubic-bezier(0, 0, 0.2, 1)"
        border="2px solid"
        borderColor={isSelected ? 'gold.500' : 'navy.700'}
        _hover={{
          borderColor: 'gold.500',
          transform: 'translateY(-4px)',
          shadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
        }}
        _focus={{
          outline: 'none',
          borderColor: 'gold.500',
          boxShadow: '0 0 0 4px rgba(212, 175, 55, 0.3)',
        }}
        textAlign="left"
        cursor="pointer"
        overflow="hidden"
      >
      {/* Background Watermark - Winged Shoe */}
      <Box
        position="absolute"
        right="-30px"
        bottom="-30px"
        opacity={0.10}
        pointerEvents="none"
        userSelect="none"
      >
        <Image
          src="/assets/winged-shoe.png"
          alt=""
          w="150px"
          h="150px"
          objectFit="contain"
        />
      </Box>        <Flex direction={{ base: 'column', md: 'row' }} gap={{ base: 4, md: 6 }}>
          {/* Left: Avatar and Name */}
          <Flex align="center" gap={4}>
            <Box
              w={{ base: '80px', md: '100px' }}
              h={{ base: '80px', md: '100px' }}
              borderRadius="full"
              overflow="hidden"
              border="3px solid"
              borderColor="gold.500"
              bg="navy.700"
              flexShrink={0}
              boxShadow="0 4px 20px rgba(212, 175, 55, 0.3)"
            >
              {athlete.headshotUrl && !imageError ? (
                <Image
                  src={athlete.headshotUrl}
                  alt={athlete.name}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Flex w="100%" h="100%" align="center" justify="center" bg="navy.600">
                  <Text color="gold.500" fontSize="3xl" fontWeight="bold">
                    {athlete.name.charAt(0)}
                  </Text>
                </Flex>
              )}
            </Box>

            <VStack align="stretch" gap={1}>
              <HStack gap={2}>
                <Text fontSize="2xl" aria-hidden="true">
                  {getCountryFlag(athlete.country)}
                </Text>
                <Heading as="h3" size="lg" color="white" fontWeight="bold">
                  {athlete.name}
                </Heading>
              </HStack>
              <Text color="gray.400" fontSize="sm">
                {athlete.country} • {athlete.gender === 'men' ? 'Male' : 'Female'}
              </Text>
            </VStack>
          </Flex>

          {/* Right: Stats */}
          <Flex flex={1} direction={{ base: 'row', md: 'column' }} justify="space-between" align={{ base: 'center', md: 'flex-end' }} gap={4}>
            {/* Fantasy Score */}
            <VStack align={{ base: 'flex-start', md: 'flex-end' }} gap={0}>
              <Text color="gold.500" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                Fantasy Score
              </Text>
              <Text color={scoreColor} fontSize="4xl" fontWeight="extrabold" lineHeight="1">
                {fantasyScore}
              </Text>
            </VStack>

            {/* Salary */}
            {athlete.salary && (
              <Text color="gold.400" fontSize="xl" fontWeight="bold">
                {formatSalary(athlete.salary)}
              </Text>
            )}
          </Flex>
        </Flex>

        {/* Stats Row */}
        <Flex
          mt={4}
          pt={4}
          borderTop="1px solid"
          borderColor="navy.700"
          gap={{ base: 4, md: 8 }}
          flexWrap="wrap"
        >
          <VStack align="flex-start" gap={0}>
            <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
              Personal Best
            </Text>
            <Text color="white" fontSize="lg" fontWeight="semibold">
              {athlete.pb}
            </Text>
          </VStack>
          
          {athlete.marathonRank && (
            <VStack align="flex-start" gap={0}>
              <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                World Rank
              </Text>
              <Text color="white" fontSize="lg" fontWeight="semibold">
                #{athlete.marathonRank}
              </Text>
            </VStack>
          )}
          
          {athlete.age && (
            <VStack align="flex-start" gap={0}>
              <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                Age
              </Text>
              <Text color="white" fontSize="lg" fontWeight="semibold">
                {athlete.age}
              </Text>
            </VStack>
          )}
          
          {athlete.seasonBest && (
            <VStack align="flex-start" gap={0}>
              <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                Season Best
              </Text>
              <Text color="white" fontSize="lg" fontWeight="semibold">
                {athlete.seasonBest}
              </Text>
            </VStack>
          )}
        </Flex>
      </Box>
    );
  }

  // Default variant - compact 3-column horizontal layout
  return (
    <Box
      ref={ref}
      as="button"
      onClick={onClick}
      w="100%"
      bg="white"
      borderRadius="xl"
      p={{ base: 3, md: 4 }}
      position="relative"
      transition="all 0.2s cubic-bezier(0, 0, 0.2, 1)"
      border="1px solid"
      borderColor={isSelected ? 'gold.500' : 'gray.200'}
      _hover={{
        borderColor: 'navy.400',
        transform: 'translateY(-2px)',
        shadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
      }}
      _focus={{
        outline: 'none',
        borderColor: 'navy.500',
        boxShadow: '0 0 0 3px rgba(22, 28, 79, 0.2)',
      }}
      textAlign="left"
      cursor="pointer"
      overflow="hidden"
      minH={{ base: '64px', md: '70px' }}
    >
      {/* Background Watermark - Winged Shoe */}
      <Box
        position="absolute"
        right={{ base: '-30px', md: '-20px' }}
        bottom={{ base: '-30px', md: '-20px' }}
        opacity={0.10}
        pointerEvents="none"
        userSelect="none"
      >
        <Image
          src="/assets/winged-shoe.png"
          alt=""
          w={{ base: '120px', md: '150px' }}
          h={{ base: '120px', md: '150px' }}
          objectFit="contain"
        />
      </Box>
      
      <Flex align="center" gap={{ base: 2, md: 3 }} justify="space-between">
        {/* Left: Avatar */}
        {/* Left Column: Avatar */}
        <Box flexShrink={0}>
          <Box
            w={{ base: '48px', md: '52px' }}
            h={{ base: '48px', md: '52px' }}
            borderRadius="full"
            overflow="hidden"
            border="2px solid"
            borderColor="gold.500"
            bg="gray.100"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
          >
            {athlete.headshotUrl && !imageError ? (
              <Image
                src={athlete.headshotUrl}
                alt={athlete.name}
                w="100%"
                h="100%"
                objectFit="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <Flex w="100%" h="100%" align="center" justify="center" bg="gray.200">
                <Text 
                  color="navy.600" 
                  fontSize={{ base: 'lg', md: 'xl' }}
                  fontWeight="bold"
                >
                  {athlete.name.charAt(0)}
                </Text>
              </Flex>
            )}
          </Box>
        </Box>
        
        {/* Middle Column: Name and Stats - 2 rows stacked */}
        <Flex flex={1} direction="column" gap={0.5} minW={0} justify="center">
          {/* Row 1: Name with Flag */}
          <HStack gap={1.5} align="center">
            <Text fontSize={{ base: 'sm', md: 'md' }} aria-label={`Country: ${athlete.country}`}>
              {getCountryFlag(athlete.country)}
            </Text>
            <Heading 
              as="h3" 
              size="xs"
              fontSize={{ base: 'sm', md: 'md' }}
              color="navy.900"
              fontWeight="bold"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {athlete.name}
            </Heading>
          </HStack>
          
          {/* Row 2: Stats inline */}
          <HStack gap={2} color="gray.600" fontSize={{ base: '2xs', md: 'xs' }} flexWrap="nowrap">
            <Text whiteSpace="nowrap">PB: {athlete.pb}</Text>
            <Text color="gray.400">•</Text>
            <Text whiteSpace="nowrap">Age: {athlete.age || '—'}</Text>
            {athlete.salary && (
              <>
                <Text color="gray.400">•</Text>
                <Text whiteSpace="nowrap" fontWeight="semibold" color="navy.700">
                  {formatSalary(athlete.salary)}
                </Text>
              </>
            )}
          </HStack>
        </Flex>
        
        {/* Right Column: WA Score */}
        <Flex direction="column" align="flex-end" justify="center" gap={0} flexShrink={0}>
          <Text 
            color="navy.600" 
            fontSize={{ base: '2xs', md: 'xs' }}
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            WA Score
          </Text>
          <Text 
            color="navy.900" 
            fontSize={{ base: 'xl', md: '2xl' }}
            fontWeight="extrabold"
            lineHeight="1"
          >
            {athlete.worldAthleticsMarathonRankingScore || '--'}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
});

AthleteBrowseCard.displayName = 'AthleteBrowseCard';

// ===========================
// Loading Skeleton
// ===========================

export function AthleteBrowseCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'detailed' }) {
  if (variant === 'compact') {
    return (
      <Box bg="white" borderRadius="lg" p={3} border="1px solid" borderColor="gray.200">
        <Flex align="center" gap={3}>
          <Box w="44px" h="44px" borderRadius="full" bg="gray.200" />
          <VStack align="stretch" flex={1} gap={1}>
            <Box h="16px" w="120px" bg="gray.200" borderRadius="sm" />
            <Box h="12px" w="80px" bg="gray.200" borderRadius="sm" />
          </VStack>
          <Box h="24px" w="32px" bg="gray.200" borderRadius="sm" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box bg="white" borderRadius="xl" p={{ base: 4, md: 5 }} border="1px solid" borderColor="gray.200">
      <Flex align="center" gap={4}>
        <VStack align="stretch" flex={1} gap={2}>
          <HStack gap={2}>
            <Box h="24px" w="24px" bg="gray.200" borderRadius="sm" />
            <Box h="20px" w="140px" bg="gray.200" borderRadius="sm" />
          </HStack>
          <Box h="14px" w="180px" bg="gray.200" borderRadius="sm" />
          <Box h="12px" w="80px" bg="gray.200" borderRadius="sm" mt={2} />
          <Box h="32px" w="50px" bg="gray.200" borderRadius="sm" />
        </VStack>
        <Box w={{ base: '70px', md: '90px' }} h={{ base: '70px', md: '90px' }} borderRadius="full" bg="gray.200" />
      </Flex>
      <Box mt={3} pt={3} borderTop="1px solid" borderColor="gray.200">
        <Flex justify="space-between">
          <Box h="12px" w="50px" bg="gray.200" borderRadius="sm" />
          <Box h="14px" w="70px" bg="gray.200" borderRadius="sm" />
        </Flex>
      </Box>
    </Box>
  );
}
