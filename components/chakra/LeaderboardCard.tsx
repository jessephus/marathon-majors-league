/**
 * LeaderboardCard Component
 * 
 * Specialized compact card for leaderboard/standings display.
 * Optimized for showing multiple teams in a list or table format.
 * 
 * Features:
 * - Rank display with medal icons for top 3
 * - Team name and owner
 * - Points and roster status
 * - Compact design for list views
 * - Highlight for current user's team
 * - Loading skeleton
 * - WCAG 2.1 AA compliant
 * 
 * @example
 * ```tsx
 * <LeaderboardCard
 *   entry={{
 *     rank: 1,
 *     teamName: 'Speed Demons',
 *     ownerName: 'John Doe',
 *     points: 847,
 *     rosterComplete: true
 *   }}
 *   isCurrentUser={true}
 *   onClick={() => viewTeam(entry)}
 * />
 * ```
 */

import { Flex, Text, HStack, VStack } from '@chakra-ui/react';
import { Badge } from './Badge';
import { Card } from './Card';
import { forwardRef } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

// ===========================
// Types
// ===========================

export interface LeaderboardEntry {
  rank: number;
  teamId?: number;
  teamName: string;
  ownerName?: string;
  points: number;
  rosterComplete?: boolean;
  athleteCount?: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  showOwner?: boolean;
  showRoster?: boolean;
  isCurrentUser?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  onClick?: (entry: LeaderboardEntry) => void;
  [key: string]: any;
}

// ===========================
// LeaderboardCard Component
// ===========================

export const LeaderboardCard = forwardRef<HTMLDivElement, LeaderboardCardProps>(({
  entry,
  showOwner = true,
  showRoster = true,
  isCurrentUser = false,
  isSelected = false,
  isDisabled = false,
  isLoading = false,
  onClick,
  ...props
}, ref) => {
  
  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick(entry);
    }
  };

  // Format points with commas
  const formatPoints = (points: number) => {
    return new Intl.NumberFormat('en-US').format(points);
  };

  // Get medal icon and color for top 3
  const getMedalDisplay = (rank: number) => {
    if (rank === 1) {
      return { icon: '🥇', color: 'gold.600', bg: 'gold.50' };
    } else if (rank === 2) {
      return { icon: '🥈', color: 'gray.600', bg: 'gray.50' };
    } else if (rank === 3) {
      return { icon: '🥉', color: 'orange.600', bg: 'orange.50' };
    }
    return null;
  };

  const medal = getMedalDisplay(entry.rank);

  return (
    <Card
      ref={ref}
      variant={isCurrentUser ? 'filled' : 'outline'}
      size="sm"
      isHoverable={!!onClick}
      isSelected={isSelected || isCurrentUser}
      isDisabled={isDisabled}
      isLoading={isLoading}
      onClick={handleClick}
      bg={isCurrentUser ? 'navy.50' : undefined}
      borderColor={isCurrentUser ? 'navy.300' : undefined}
      {...props}
    >
      <Flex align="center" gap={3} minH="44px">
        {/* Rank */}
        <Flex
          minW="48px"
          height="48px"
          borderRadius="md"
          bg={medal ? medal.bg : 'gray.50'}
          color={medal ? medal.color : 'gray.700'}
          align="center"
          justify="center"
          fontSize={medal ? '2xl' : 'lg'}
          fontWeight="bold"
          flexShrink={0}
          border={medal ? '2px solid' : '1px solid'}
          borderColor={medal ? medal.color : 'gray.200'}
        >
          {medal ? medal.icon : entry.rank}
        </Flex>

        {/* Team info */}
        <VStack align="stretch" flex={1} gap={0} minW={0}>
          <Text
            fontSize="md"
            fontWeight={isCurrentUser ? 'bold' : 'semibold'}
            color={isCurrentUser ? 'navy.700' : 'navy.600'}
            lineClamp={1}
          >
            {entry.teamName}
            {isCurrentUser && (
              <Badge
                colorPalette="navy"
                size="sm"
                ml={2}
                display="inline-flex"
                verticalAlign="middle"
              >
                You
              </Badge>
            )}
          </Text>
          {showOwner && entry.ownerName && (
            <Text fontSize="xs" color="gray.500" lineClamp={1}>
              {entry.ownerName}
            </Text>
          )}
        </VStack>

        {/* Roster status */}
        {showRoster && (
          <Flex align="center" gap={1} flexShrink={0}>
            {entry.rosterComplete ? (
              <CheckCircleIcon style={{ width: '18px', height: '18px', color: 'var(--chakra-colors-success-600)' }} />
            ) : (
              <XCircleIcon style={{ width: '18px', height: '18px', color: 'var(--chakra-colors-warning-600)' }} />
            )}
            {entry.athleteCount !== undefined && (
              <Text fontSize="xs" color="gray.500">
                {entry.athleteCount}/6
              </Text>
            )}
          </Flex>
        )}

        {/* Points */}
        <VStack align="flex-end" gap={0} flexShrink={0} minW="70px">
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
            Pts
          </Text>
          <Text fontSize="xl" fontWeight="bold" color="navy.700">
            {formatPoints(entry.points)}
          </Text>
        </VStack>
      </Flex>
    </Card>
  );
});

LeaderboardCard.displayName = 'LeaderboardCard';
