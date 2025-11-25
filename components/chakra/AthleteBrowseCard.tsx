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
        {/* Background decoration */}
        <Box
          position="absolute"
          right="-30px"
          bottom="-30px"
          opacity={0.03}
          fontSize="200px"
          color="white"
          pointerEvents="none"
          userSelect="none"
        >
          🏃
        </Box>

        <Flex direction={{ base: 'column', md: 'row' }} gap={{ base: 4, md: 6 }}>
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

  // Default variant - balanced design matching mockup
  return (
    <Box
      ref={ref}
      as="button"
      onClick={onClick}
      w="100%"
      bg="navy.800"
      borderRadius="xl"
      p={{ base: 4, md: 5 }}
      position="relative"
      transition="all 0.2s cubic-bezier(0, 0, 0.2, 1)"
      border="1px solid"
      borderColor={isSelected ? 'gold.500' : 'navy.700'}
      _hover={{
        borderColor: 'gold.500',
        transform: 'translateY(-2px)',
        shadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
      }}
      _focus={{
        outline: 'none',
        borderColor: 'gold.500',
        boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.3)',
      }}
      textAlign="left"
      cursor="pointer"
      overflow="hidden"
      minH={{ base: '120px', md: '140px' }}
    >
      {/* Background Pattern */}
      <Box
        position="absolute"
        right="-20px"
        bottom="-20px"
        opacity={0.04}
        fontSize="150px"
        color="white"
        pointerEvents="none"
        userSelect="none"
      >
        🏃
      </Box>
      
      <Flex align="center" gap={{ base: 3, md: 4 }}>
        {/* Left: Info Section */}
        <VStack align="stretch" flex={1} gap={1}>
          {/* Name Row with Flag */}
          <HStack gap={2} align="center">
            <Text fontSize={{ base: 'lg', md: 'xl' }} aria-label={`Country: ${athlete.country}`}>
              {getCountryFlag(athlete.country)}
            </Text>
            <Heading 
              as="h3" 
              size={{ base: 'sm', md: 'md' }}
              color="white"
              fontWeight="bold"
              lineClamp={1}
            >
              {athlete.name}
            </Heading>
          </HStack>
          
          {/* Stats Row */}
          <HStack gap={2} color="gray.300" fontSize={{ base: 'xs', md: 'sm' }} flexWrap="wrap">
            <Text>PB: {athlete.pb}</Text>
            <Text color="gray.500">|</Text>
            <Text>Age: {athlete.age || '—'}</Text>
            {athlete.marathonRank && (
              <>
                <Text color="gray.500">|</Text>
                <Text>Rank: #{athlete.marathonRank}</Text>
              </>
            )}
          </HStack>
          
          {/* Fantasy Score Section */}
          <VStack align="flex-start" gap={0} mt={2}>
            <Text 
              color="gold.500" 
              fontSize={{ base: 'xs', md: 'sm' }}
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Fantasy Score
            </Text>
            <Text 
              color="white" 
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="extrabold"
              lineHeight="1"
            >
              {fantasyScore}
            </Text>
          </VStack>
        </VStack>
        
        {/* Right: Avatar with Score Badge */}
        <Box position="relative" flexShrink={0}>
          {/* Athlete Photo */}
          <Box
            w={{ base: '70px', md: '90px' }}
            h={{ base: '70px', md: '90px' }}
            borderRadius="full"
            overflow="hidden"
            border="3px solid"
            borderColor="gold.500"
            bg="navy.700"
            boxShadow="0 4px 15px rgba(0, 0, 0, 0.3)"
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
                <Text 
                  color="gold.500" 
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="bold"
                >
                  {athlete.name.charAt(0)}
                </Text>
              </Flex>
            )}
          </Box>
          
          {/* Score Badge */}
          <Box
            position="absolute"
            bottom="-5px"
            right="-5px"
            bg="navy.900"
            borderRadius="full"
            border="2px solid"
            borderColor="gold.500"
            w={{ base: '36px', md: '44px' }}
            h={{ base: '36px', md: '44px' }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.4)"
          >
            <Text 
              color="gold.500" 
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight="bold"
            >
              {fantasyScore}
            </Text>
          </Box>
        </Box>
      </Flex>
      
      {/* Salary Display */}
      {athlete.salary && (
        <Box mt={3} pt={3} borderTop="1px solid" borderColor="navy.700">
          <HStack justify="space-between">
            <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
              Salary
            </Text>
            <Text color="gold.400" fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
              {formatSalary(athlete.salary)}
            </Text>
          </HStack>
        </Box>
      )}
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
      <Box bg="navy.800" borderRadius="lg" p={3} border="1px solid" borderColor="navy.700">
        <Flex align="center" gap={3}>
          <Box w="44px" h="44px" borderRadius="full" bg="navy.700" />
          <VStack align="stretch" flex={1} gap={1}>
            <Box h="16px" w="120px" bg="navy.700" borderRadius="sm" />
            <Box h="12px" w="80px" bg="navy.700" borderRadius="sm" />
          </VStack>
          <Box h="24px" w="32px" bg="navy.700" borderRadius="sm" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box bg="navy.800" borderRadius="xl" p={{ base: 4, md: 5 }} border="1px solid" borderColor="navy.700">
      <Flex align="center" gap={4}>
        <VStack align="stretch" flex={1} gap={2}>
          <HStack gap={2}>
            <Box h="24px" w="24px" bg="navy.700" borderRadius="sm" />
            <Box h="20px" w="140px" bg="navy.700" borderRadius="sm" />
          </HStack>
          <Box h="14px" w="180px" bg="navy.700" borderRadius="sm" />
          <Box h="12px" w="80px" bg="navy.700" borderRadius="sm" mt={2} />
          <Box h="32px" w="50px" bg="navy.700" borderRadius="sm" />
        </VStack>
        <Box w={{ base: '70px', md: '90px' }} h={{ base: '70px', md: '90px' }} borderRadius="full" bg="navy.700" />
      </Flex>
      <Box mt={3} pt={3} borderTop="1px solid" borderColor="navy.700">
        <Flex justify="space-between">
          <Box h="12px" w="50px" bg="navy.700" borderRadius="sm" />
          <Box h="14px" w="70px" bg="navy.700" borderRadius="sm" />
        </Flex>
      </Box>
    </Box>
  );
}
