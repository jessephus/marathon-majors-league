/**
 * RaceCard Component
 * 
 * Specialized card for displaying race/marathon event information.
 * Used in race selection, race details, and event listings.
 * 
 * Features:
 * - Race name and date
 * - Location and venue
 * - Confirmed athlete count
 * - Race status (upcoming, live, completed)
 * - Interactive selection
 * - Loading skeleton
 * - WCAG 2.1 AA compliant
 * 
 * @example
 * ```tsx
 * <RaceCard
 *   race={{
 *     id: 1,
 *     name: 'New York City Marathon',
 *     date: '2024-11-03',
 *     location: 'New York, USA',
 *     confirmedAthletes: 45,
 *     status: 'upcoming'
 *   }}
 *   onClick={() => selectRace(race)}
 * />
 * ```
 */

import { Box, Flex, Text, Heading, HStack, VStack } from '@chakra-ui/react';
import { Badge } from './Badge';
import { Card } from './Card';
import { forwardRef } from 'react';
import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';

// ===========================
// Types
// ===========================

export interface RaceCardData {
  id: number;
  name: string;
  date: string;
  location?: string;
  venue?: string;
  confirmedAthletes?: number;
  status?: 'upcoming' | 'live' | 'completed' | 'draft';
  distance?: string;
  description?: string;
}

export interface RaceCardProps {
  race: RaceCardData;
  variant?: 'compact' | 'standard' | 'detailed';
  showStatus?: boolean;
  showAthleteCount?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  onClick?: (race: RaceCardData) => void;
  [key: string]: any;
}

// ===========================
// RaceCard Component
// ===========================

export const RaceCard = forwardRef<HTMLDivElement, RaceCardProps>(({
  race,
  variant = 'standard',
  showStatus = true,
  showAthleteCount = true,
  isSelected = false,
  isDisabled = false,
  isLoading = false,
  onClick,
  ...props
}, ref) => {
  
  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick(race);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Get status badge config
  const getStatusBadge = (status: string): {
    colorPalette: 'primary' | 'secondary' | 'navy' | 'gold' | 'success' | 'warning' | 'error' | 'info';
    label: string;
    bg: string;
  } | null => {
    switch (status) {
      case 'live':
        return { colorPalette: 'error', label: '🔴 Live', bg: 'error.600' };
      case 'upcoming':
        return { colorPalette: 'info', label: 'Upcoming', bg: 'info.600' };
      case 'completed':
        return { colorPalette: 'success', label: 'Completed', bg: 'success.600' };
      case 'draft':
        return { colorPalette: 'warning', label: 'Draft Open', bg: 'warning.600' };
      default:
        return { colorPalette: 'navy', label: status, bg: 'navy.600' };
    }
  };

  const statusBadge = race.status ? getStatusBadge(race.status) : null;

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card
        ref={ref}
        variant="outline"
        size="sm"
        isHoverable={!!onClick}
        isSelected={isSelected}
        isDisabled={isDisabled}
        isLoading={isLoading}
        onClick={handleClick}
        {...props}
      >
        <VStack align="stretch" gap={2}>
          <Flex justify="space-between" align="center">
            <Text
              as="h3"
              fontSize="sm"
              fontWeight="semibold"
              lineClamp={1}
            >
              {race.name}
            </Text>
            {showStatus && statusBadge && (
              <Badge colorPalette={statusBadge.colorPalette} bg={statusBadge.bg} color="white" size="sm">
                {statusBadge.label}
              </Badge>
            )}
          </Flex>

          <HStack gap={3} fontSize="xs" color="gray.600">
            <Flex align="center" gap={1}>
              <CalendarIcon style={{ width: '14px', height: '14px' }} />
              <Text>{formatDate(race.date)}</Text>
            </Flex>
            {race.location && (
              <Flex align="center" gap={1}>
                <MapPinIcon style={{ width: '14px', height: '14px' }} />
                <Text lineClamp={1}>{race.location}</Text>
              </Flex>
            )}
          </HStack>
        </VStack>
      </Card>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <Card
        ref={ref}
        variant="elevated"
        size="lg"
        isHoverable={!!onClick}
        isSelected={isSelected}
        isDisabled={isDisabled}
        isLoading={isLoading}
        onClick={handleClick}
        {...props}
      >
        <VStack align="stretch" gap={4}>
          {/* Header */}
          <Flex justify="space-between" align="start" gap={4}>
            <VStack align="stretch" flex={1} gap={2}>
              <Heading as="h3" size="lg">
                {race.name}
              </Heading>
              {race.distance && (
                <Badge colorPalette="navy" alignSelf="flex-start">
                  {race.distance}
                </Badge>
              )}
            </VStack>
            {showStatus && statusBadge && (
              <Badge colorPalette={statusBadge.colorPalette} bg={statusBadge.bg} color="white" size="lg">
                {statusBadge.label}
              </Badge>
            )}
          </Flex>

          {/* Description */}
          {race.description && (
            <Text fontSize="md" color="gray.600" lineHeight="tall">
              {race.description}
            </Text>
          )}

          {/* Info Grid */}
          <Flex gap={4} flexWrap="wrap">
            <Flex
              flex={1}
              minW="140px"
              p={3}
              borderRadius="md"
              bg="gray.50"
              align="center"
              gap={3}
            >
              <CalendarIcon style={{ width: '24px', height: '24px', color: 'var(--chakra-colors-navy-500)' }} />
              <VStack align="stretch" gap={0}>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                  Date
                </Text>
                <Text fontSize="md" fontWeight="semibold" color="navy.700">
                  {formatDate(race.date)}
                </Text>
              </VStack>
            </Flex>

            {race.location && (
              <Flex
                flex={1}
                minW="140px"
                p={3}
                borderRadius="md"
                bg="gray.50"
                align="center"
                gap={3}
              >
                <MapPinIcon style={{ width: '24px', height: '24px', color: 'var(--chakra-colors-navy-500)' }} />
                <VStack align="stretch" gap={0}>
                  <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                    Location
                  </Text>
                  <Text fontSize="md" fontWeight="semibold" color="navy.700" lineClamp={1}>
                    {race.location}
                  </Text>
                </VStack>
              </Flex>
            )}

            {showAthleteCount && race.confirmedAthletes !== undefined && (
              <Flex
                flex={1}
                minW="140px"
                p={3}
                borderRadius="md"
                bg="gray.50"
                align="center"
                gap={3}
              >
                <UsersIcon style={{ width: '24px', height: '24px', color: 'var(--chakra-colors-navy-500)' }} />
                <VStack align="stretch" gap={0}>
                  <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                    Athletes
                  </Text>
                  <Text fontSize="md" fontWeight="semibold" color="navy.700">
                    {race.confirmedAthletes} confirmed
                  </Text>
                </VStack>
              </Flex>
            )}
          </Flex>
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
      isHoverable={!!onClick}
      isSelected={isSelected}
      isDisabled={isDisabled}
      isLoading={isLoading}
      onClick={handleClick}
      {...props}
    >
      <VStack align="stretch" gap={3}>
        {/* Header */}
        <Flex justify="space-between" align="start" gap={3}>
          <Heading as="h3" size="md" flex={1}>
            {race.name}
          </Heading>
          {showStatus && statusBadge && (
            <Badge colorPalette={statusBadge.colorPalette} bg={statusBadge.bg} color="white">
              {statusBadge.label}
            </Badge>
          )}
        </Flex>

        {/* Info */}
        <HStack gap={4} flexWrap="wrap" fontSize="sm" color="gray.600">
          <Flex align="center" gap={2}>
            <CalendarIcon style={{ width: '16px', height: '16px' }} />
            <Text>{formatDate(race.date)}</Text>
          </Flex>
          {race.location && (
            <Flex align="center" gap={2}>
              <MapPinIcon style={{ width: '16px', height: '16px' }} />
              <Text lineClamp={1}>{race.location}</Text>
            </Flex>
          )}
          {showAthleteCount && race.confirmedAthletes !== undefined && (
            <Flex align="center" gap={2}>
              <UsersIcon style={{ width: '16px', height: '16px' }} />
              <Text>{race.confirmedAthletes} athletes</Text>
            </Flex>
          )}
        </HStack>
      </VStack>
    </Card>
  );
});

RaceCard.displayName = 'RaceCard';
