/**
 * AthleteCard Component
 * 
 * Specialized card for displaying athlete information.
 * Used in athlete browser, draft selection, and team roster displays.
 * 
 * Features:
 * - Athlete photo/avatar with fallback
 * - Name and country display
 * - Key stats (PB, rank, salary)
 * - Selectable state for draft mode
 * - Loading skeleton
 * - Responsive design (mobile/desktop)
 * - WCAG 2.1 AA compliant
 * 
 * @example
 * ```tsx
 * <AthleteCard
 *   athlete={{
 *     id: 1,
 *     name: 'Eliud Kipchoge',
 *     country: 'KEN',
 *     pb: '2:01:09',
 *     rank: 1,
 *     salary: 12500
 *   }}
 *   isSelected={false}
 *   onSelect={() => handleSelect(athlete)}
 * />
 * ```
 */

import { Box, Flex, Text, Heading, Image, HStack, VStack } from '@chakra-ui/react';
import { Badge } from './Badge';
import { Card } from './Card';
import { forwardRef } from 'react';

// ===========================
// Types
// ===========================

export interface AthleteCardData {
  id: number;
  name: string;
  country: string;
  gender?: 'M' | 'F' | 'Men' | 'Women';
  pb?: string | null;
  seasonBest?: string | null;
  rank?: number | null;
  salary?: number | null;
  photoUrl?: string | null;
  iaafId?: number | null;
}

export interface AthleteCardProps {
  athlete: AthleteCardData;
  variant?: 'compact' | 'standard' | 'detailed';
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  showPrice?: boolean;
  showStats?: boolean;
  onSelect?: (athlete: AthleteCardData) => void;
  onClick?: (athlete: AthleteCardData) => void;
  [key: string]: any;
}

// ===========================
// AthleteCard Component
// ===========================

export const AthleteCard = forwardRef<HTMLDivElement, AthleteCardProps>(({
  athlete,
  variant = 'standard',
  isSelected = false,
  isDisabled = false,
  isLoading = false,
  showPrice = true,
  showStats = true,
  onSelect,
  onClick,
  ...props
}, ref) => {
  
  const handleClick = () => {
    if (isDisabled) return;
    if (onClick) {
      onClick(athlete);
    } else if (onSelect) {
      onSelect(athlete);
    }
  };

  // Format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Get country flag emoji
  const getCountryFlag = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 3) return null;
    // World Athletics uses 3-letter codes, convert to emoji if possible
    // For now, just show the code in a badge
    return countryCode;
  };

  // Render based on variant
  if (variant === 'compact') {
    return (
      <Card
        ref={ref}
        variant="outline"
        size="sm"
        isHoverable
        isSelected={isSelected}
        isDisabled={isDisabled}
        isLoading={isLoading}
        onClick={handleClick}
        {...props}
      >
        <Flex align="center" gap={3}>
          {/* Avatar */}
          <Box
            width="48px"
            height="48px"
            borderRadius="full"
            overflow="hidden"
            flexShrink={0}
            bg="gray.200"
          >
            {athlete.photoUrl ? (
              <Image
                src={athlete.photoUrl}
                alt={athlete.name}
                width="48px"
                height="48px"
                objectFit="cover"
              />
            ) : (
              <Flex
                width="100%"
                height="100%"
                align="center"
                justify="center"
                bg="navy.100"
                color="navy.600"
                fontSize="lg"
                fontWeight="bold"
              >
                {athlete.name.charAt(0)}
              </Flex>
            )}
          </Box>

          {/* Info */}
          <VStack align="stretch" flex={1} gap={1}>
            <Text
              as="h3"
              fontSize="sm"
              fontWeight="semibold"
              lineClamp={1}
            >
              {athlete.name}
            </Text>
            <HStack gap={2}>
              <Badge colorPalette="navy" size="sm">
                {getCountryFlag(athlete.country)}
              </Badge>
              {athlete.pb && showStats && (
                <Text fontSize="xs" color="gray.500">
                  PB: {athlete.pb}
                </Text>
              )}
            </HStack>
          </VStack>

          {/* Price */}
          {showPrice && athlete.salary && (
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="gold.600"
              flexShrink={0}
            >
              {formatPrice(athlete.salary)}
            </Text>
          )}
        </Flex>
      </Card>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card
        ref={ref}
        variant="elevated"
        size="lg"
        isHoverable
        isSelected={isSelected}
        isDisabled={isDisabled}
        isLoading={isLoading}
        onClick={handleClick}
        {...props}
      >
        <VStack align="stretch" gap={4}>
          {/* Header with avatar and name */}
          <Flex align="center" gap={4}>
            <Box
              width="80px"
              height="80px"
              borderRadius="full"
              overflow="hidden"
              flexShrink={0}
              bg="gray.200"
            >
              {athlete.photoUrl ? (
                <Image
                  src={athlete.photoUrl}
                  alt={athlete.name}
                  width="80px"
                  height="80px"
                  objectFit="cover"
                />
              ) : (
                <Flex
                  width="100%"
                  height="100%"
                  align="center"
                  justify="center"
                  bg="navy.100"
                  color="navy.600"
                  fontSize="3xl"
                  fontWeight="bold"
                >
                  {athlete.name.charAt(0)}
                </Flex>
              )}
            </Box>

            <VStack align="stretch" flex={1} gap={2}>
              <Heading as="h3" size="lg">
                {athlete.name}
              </Heading>
              <HStack gap={2}>
                <Badge colorPalette="navy">
                  {getCountryFlag(athlete.country)}
                </Badge>
                {athlete.rank && (
                  <Badge colorPalette="gold">
                    Rank #{athlete.rank}
                  </Badge>
                )}
              </HStack>
            </VStack>

            {showPrice && athlete.salary && (
              <VStack align="flex-end" gap={0}>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                  Price
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="gold.600">
                  {formatPrice(athlete.salary)}
                </Text>
              </VStack>
            )}
          </Flex>

          {/* Stats Grid */}
          {showStats && (
            <Flex gap={4} flexWrap="wrap">
              {athlete.pb && (
                <Box flex={1} minW="120px">
                  <Text fontSize="xs" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="wider">
                    Personal Best
                  </Text>
                  <Text fontSize="xl" fontWeight="semibold" color="navy.700">
                    {athlete.pb}
                  </Text>
                </Box>
              )}
              {athlete.seasonBest && (
                <Box flex={1} minW="120px">
                  <Text fontSize="xs" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="wider">
                    Season Best
                  </Text>
                  <Text fontSize="xl" fontWeight="semibold" color="navy.700">
                    {athlete.seasonBest}
                  </Text>
                </Box>
              )}
              {athlete.rank && (
                <Box flex={1} minW="120px">
                  <Text fontSize="xs" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="wider">
                    World Rank
                  </Text>
                  <Text fontSize="xl" fontWeight="semibold" color="navy.700">
                    #{athlete.rank}
                  </Text>
                </Box>
              )}
            </Flex>
          )}
        </VStack>
      </Card>
    );
  }

  // Standard variant (default)
  return (
    <Card
      ref={ref}
      variant="outline"
      size="md"
      isHoverable
      isSelected={isSelected}
      isDisabled={isDisabled}
      isLoading={isLoading}
      onClick={handleClick}
      {...props}
    >
      <Flex align="center" gap={4}>
        {/* Avatar */}
        <Box
          width="64px"
          height="64px"
          borderRadius="full"
          overflow="hidden"
          flexShrink={0}
          bg="gray.200"
        >
          {athlete.photoUrl ? (
            <Image
              src={athlete.photoUrl}
              alt={athlete.name}
              width="64px"
              height="64px"
              objectFit="cover"
            />
          ) : (
            <Flex
              width="100%"
              height="100%"
              align="center"
              justify="center"
              bg="navy.100"
              color="navy.600"
              fontSize="2xl"
              fontWeight="bold"
            >
              {athlete.name.charAt(0)}
            </Flex>
          )}
        </Box>

        {/* Info */}
        <VStack align="stretch" flex={1} gap={1}>
          <Heading as="h3" size="md">
            {athlete.name}
          </Heading>
          <HStack gap={2} flexWrap="wrap">
            <Badge colorPalette="navy">
              {getCountryFlag(athlete.country)}
            </Badge>
            {athlete.pb && showStats && (
              <Text fontSize="sm" color="gray.500">
                PB: {athlete.pb}
              </Text>
            )}
            {athlete.rank && showStats && (
              <Text fontSize="sm" color="gray.500">
                Rank #{athlete.rank}
              </Text>
            )}
          </HStack>
        </VStack>

        {/* Price */}
        {showPrice && athlete.salary && (
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="gold.600"
            flexShrink={0}
          >
            {formatPrice(athlete.salary)}
          </Text>
        )}
      </Flex>
    </Card>
  );
});

AthleteCard.displayName = 'AthleteCard';
