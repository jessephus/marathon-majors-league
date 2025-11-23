/**
 * TeamCard Component
 * 
 * Specialized card for displaying team information on leaderboard and dashboard.
 * Shows team name, roster status, points, and ranking.
 * 
 * Features:
 * - Team name and owner display
 * - Roster completion indicator
 * - Points and ranking display
 * - Medal badges for top 3 teams
 * - Interactive states
 * - Loading skeleton
 * - WCAG 2.1 AA compliant
 * 
 * @example
 * ```tsx
 * <TeamCard
 *   team={{
 *     id: 1,
 *     name: 'Speed Demons',
 *     ownerName: 'John Doe',
 *     points: 847,
 *     rank: 1,
 *     rosterComplete: true,
 *     athleteCount: 6
 *   }}
 *   onClick={() => viewTeamDetails(team)}
 * />
 * ```
 */

import { Box, Flex, Text, Heading, HStack, VStack } from '@chakra-ui/react';
import { Badge } from './Badge';
import { Card } from './Card';
import { forwardRef } from 'react';
import { TrophyIcon, UsersIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

// ===========================
// Types
// ===========================

export interface TeamCardData {
  id: number;
  name: string;
  ownerName?: string;
  points?: number;
  rank?: number;
  rosterComplete?: boolean;
  athleteCount?: number;
  totalSalary?: number;
  gameId?: string;
}

export interface TeamCardProps {
  team: TeamCardData;
  variant?: 'compact' | 'standard' | 'detailed';
  showRank?: boolean;
  showOwner?: boolean;
  showRoster?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  onClick?: (team: TeamCardData) => void;
  [key: string]: any;
}

// ===========================
// TeamCard Component
// ===========================

export const TeamCard = forwardRef<HTMLDivElement, TeamCardProps>(({
  team,
  variant = 'standard',
  showRank = true,
  showOwner = true,
  showRoster = true,
  isSelected = false,
  isDisabled = false,
  isLoading = false,
  onClick,
  ...props
}, ref) => {
  
  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick(team);
    }
  };

  // Format points with commas
  const formatPoints = (points: number) => {
    return new Intl.NumberFormat('en-US').format(points);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get medal icon and color for top 3
  const getMedalBadge = (rank: number): {
    icon: string;
    color: 'gold' | 'secondary' | 'warning';
    label: string;
  } | null => {
    if (rank === 1) {
      return { icon: '🥇', color: 'gold', label: '1st Place' };
    } else if (rank === 2) {
      return { icon: '🥈', color: 'secondary', label: '2nd Place' };
    } else if (rank === 3) {
      return { icon: '🥉', color: 'warning', label: '3rd Place' };
    }
    return null;
  };

  const medal = team.rank ? getMedalBadge(team.rank) : null;

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
        <Flex align="center" gap={3} justify="space-between">
          {/* Rank */}
          {showRank && team.rank && (
            <Flex
              width="40px"
              height="40px"
              borderRadius="md"
              bg={medal ? `${medal.color}.100` : 'gray.100'}
              color={medal ? `${medal.color}.700` : 'gray.700'}
              align="center"
              justify="center"
              fontSize="xl"
              fontWeight="bold"
              flexShrink={0}
            >
              {medal ? medal.icon : team.rank}
            </Flex>
          )}

          {/* Team name */}
          <VStack align="stretch" flex={1} gap={0}>
            <Text
              as="h3"
              fontSize="sm"
              fontWeight="semibold"
              lineClamp={1}
            >
              {team.name}
            </Text>
            {showOwner && team.ownerName && (
              <Text fontSize="xs" color="gray.500" lineClamp={1}>
                {team.ownerName}
              </Text>
            )}
          </VStack>

          {/* Points */}
          {team.points !== undefined && (
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="navy.600"
              flexShrink={0}
            >
              {formatPoints(team.points)}
            </Text>
          )}
        </Flex>
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
          {/* Header with rank and name */}
          <Flex align="center" gap={4}>
            {showRank && team.rank && (
              <Flex
                width="72px"
                height="72px"
                borderRadius="lg"
                bg={medal ? `${medal.color}.100` : 'gray.100'}
                color={medal ? `${medal.color}.700` : 'gray.700'}
                align="center"
                justify="center"
                fontSize="3xl"
                fontWeight="bold"
                flexShrink={0}
                border="2px solid"
                borderColor={medal ? `${medal.color}.300` : 'gray.300'}
              >
                {medal ? medal.icon : `#${team.rank}`}
              </Flex>
            )}

            <VStack align="stretch" flex={1} gap={1}>
              <Heading as="h3" size="lg">
                {team.name}
              </Heading>
              {showOwner && team.ownerName && (
                <Text fontSize="md" color="gray.600">
                  by {team.ownerName}
                </Text>
              )}
              {medal && (
                <Badge colorPalette={medal.color} size="sm">
                  {medal.label}
                </Badge>
              )}
            </VStack>

            {team.points !== undefined && (
              <VStack align="flex-end" gap={0}>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                  Points
                </Text>
                <Text fontSize="3xl" fontWeight="bold" color="navy.700">
                  {formatPoints(team.points)}
                </Text>
              </VStack>
            )}
          </Flex>

          {/* Stats Grid */}
          {showRoster && (
            <Flex gap={4} flexWrap="wrap">
              {team.athleteCount !== undefined && (
                <Flex
                  flex={1}
                  minW="140px"
                  p={3}
                  borderRadius="md"
                  bg="gray.50"
                  align="center"
                  gap={2}
                >
                  <UsersIcon style={{ width: '24px', height: '24px', color: 'var(--chakra-colors-navy-500)' }} />
                  <VStack align="stretch" gap={0}>
                    <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                      Roster
                    </Text>
                    <Text fontSize="lg" fontWeight="semibold" color="navy.700">
                      {team.athleteCount}/6
                    </Text>
                  </VStack>
                  {team.rosterComplete && (
                    <CheckCircleIcon style={{ width: '20px', height: '20px', color: 'var(--chakra-colors-success-600)' }} />
                  )}
                </Flex>
              )}

              {team.totalSalary !== undefined && (
                <Flex
                  flex={1}
                  minW="140px"
                  p={3}
                  borderRadius="md"
                  bg="gray.50"
                  align="center"
                  gap={2}
                >
                  <TrophyIcon style={{ width: '24px', height: '24px', color: 'var(--chakra-colors-gold-500)' }} />
                  <VStack align="stretch" gap={0}>
                    <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                      Salary
                    </Text>
                    <Text fontSize="lg" fontWeight="semibold" color="navy.700">
                      {formatCurrency(team.totalSalary)}
                    </Text>
                  </VStack>
                </Flex>
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
      isHoverable={!!onClick}
      isSelected={isSelected}
      isDisabled={isDisabled}
      isLoading={isLoading}
      onClick={handleClick}
      {...props}
    >
      <Flex align="center" gap={4}>
        {/* Rank */}
        {showRank && team.rank && (
          <Flex
            width="56px"
            height="56px"
            borderRadius="md"
            bg={medal ? `${medal.color}.100` : 'gray.100'}
            color={medal ? `${medal.color}.700` : 'gray.700'}
            align="center"
            justify="center"
            fontSize="2xl"
            fontWeight="bold"
            flexShrink={0}
          >
            {medal ? medal.icon : `#${team.rank}`}
          </Flex>
        )}

        {/* Team info */}
        <VStack align="stretch" flex={1} gap={1}>
          <Heading as="h3" size="md">
            {team.name}
          </Heading>
          <HStack gap={2} flexWrap="wrap">
            {showOwner && team.ownerName && (
              <Text fontSize="sm" color="gray.600">
                by {team.ownerName}
              </Text>
            )}
            {showRoster && team.rosterComplete && (
              <Badge colorPalette="success" bg="success.600" color="white" size="sm">
                ✓ Complete
              </Badge>
            )}
            {showRoster && !team.rosterComplete && team.athleteCount !== undefined && (
              <Badge colorPalette="warning" bg="warning.600" color="white" size="sm">
                {team.athleteCount}/6
              </Badge>
            )}
          </HStack>
        </VStack>

        {/* Points */}
        {team.points !== undefined && (
          <VStack align="flex-end" gap={0} flexShrink={0}>
            <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
              Points
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="navy.700">
              {formatPoints(team.points)}
            </Text>
          </VStack>
        )}
      </Flex>
    </Card>
  );
});

TeamCard.displayName = 'TeamCard';
