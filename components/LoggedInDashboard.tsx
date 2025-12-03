/**
 * LoggedInDashboard Component
 * 
 * Enhanced landing page for logged-in users following MMFL design guidelines.
 * Features navy (#161C4F) and gold (#D4AF37) brand palette.
 * 
 * Displays:
 * - Active race name and lock time
 * - Team name and status
 * - Roster completion progress
 * - Budget usage
 * - Quick action buttons
 * 
 * SSR Optimized:
 * - Data should be passed via props from getServerSideProps
 * - No client-side fetching to avoid hydration mismatch
 * 
 * Uses Chakra UI v3 components per CORE_DESIGN_GUIDELINES.md
 * 
 * @version 1.0.0
 * @date December 2025
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Flex,
  Text,
  Heading,
  Container,
  VStack,
  HStack,
  Grid,
  GridItem,
  Skeleton,
} from '@chakra-ui/react';
import { Button, Card, CardBody, Badge } from '@/components/chakra';
import {
  ArrowRightIcon,
  ClockIcon,
  TrophyIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import { DEFAULT_BUDGET } from '@/lib/budget-utils';

// ===========================
// Types
// ===========================

export interface TeamData {
  teamName: string;
  gameId: string;
  rosterCount: number;
  totalSalary: number;
  isDraftComplete: boolean;
}

export interface RaceData {
  name: string;
  lockTime: string | null;
  date?: string;
  location?: string;
}

export interface LoggedInDashboardProps {
  teamName: string;
  teamData: TeamData | null;
  raceData: RaceData | null;
  onViewTeam: () => void;
  isLoading?: boolean;
}

// ===========================
// Constants
// ===========================

const COLORS = {
  navy: '#161C4F',
  navyLight: '#4A5F9D',
  gold: '#D4AF37',
  goldLight: '#FFF4D6',
  cream: '#FFF9E6',
  white: '#FFFFFF',
  grayText: '#4A5568',
  grayLight: '#E2E8F0',
  success: '#16A34A',
  warning: '#D97706',
} as const;

// ===========================
// Helper Functions
// ===========================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLockTime(lockTime: string | null): {
  display: string;
  isLocked: boolean;
  isUrgent: boolean;
  timeUntil: string;
} {
  if (!lockTime) {
    return { display: 'TBD', isLocked: false, isUrgent: false, timeUntil: '' };
  }

  const lockDate = new Date(lockTime);
  const now = new Date();
  const isLocked = lockDate <= now;
  
  if (isLocked) {
    return {
      display: lockDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      isLocked: true,
      isUrgent: false,
      timeUntil: 'Locked',
    };
  }

  const diff = lockDate.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let timeUntil = '';
  if (days > 0) {
    timeUntil = `${days}d ${hours}h`;
  } else if (hours > 0) {
    timeUntil = `${hours}h ${minutes}m`;
  } else {
    timeUntil = `${minutes}m`;
  }

  // Urgent if less than 24 hours
  const isUrgent = diff < 24 * 60 * 60 * 1000;

  return {
    display: lockDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    isLocked: false,
    isUrgent,
    timeUntil,
  };
}

// ===========================
// Sub-Components
// ===========================

/**
 * Race Information Card
 */
function RaceInfoCard({ raceData }: { raceData: RaceData | null }) {
  const [lockTimeInfo, setLockTimeInfo] = useState(() =>
    formatLockTime(raceData?.lockTime || null)
  );

  // Update lock time every minute
  useEffect(() => {
    if (!raceData?.lockTime) return;

    const interval = setInterval(() => {
      setLockTimeInfo(formatLockTime(raceData.lockTime));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [raceData?.lockTime]);

  if (!raceData) {
    return null;
  }

  return (
    <Card variant="outline" size="sm" mb={4}>
      <CardBody p={4}>
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          align={{ base: 'flex-start', sm: 'center' }}
          justify="space-between"
          gap={3}
        >
          {/* Race Name */}
          <Box>
            <Text
              fontSize="xs"
              color={COLORS.navyLight}
              fontWeight="medium"
              textTransform="uppercase"
              letterSpacing="wide"
              mb={1}
            >
              Active Race
            </Text>
            <Heading as="h3" size="md" color={COLORS.navy}>
              {raceData.name}
            </Heading>
          </Box>

          {/* Lock Time */}
          <Flex align="center" gap={2}>
            <Box
              as={ClockIcon}
              w={5}
              h={5}
              color={
                lockTimeInfo.isLocked
                  ? COLORS.grayText
                  : lockTimeInfo.isUrgent
                  ? COLORS.warning
                  : COLORS.navyLight
              }
            />
            <Box textAlign={{ base: 'left', sm: 'right' }}>
              <Text
                fontSize="xs"
                color={COLORS.grayText}
                textTransform="uppercase"
                letterSpacing="wide"
              >
                {lockTimeInfo.isLocked ? 'Locked' : 'Locks In'}
              </Text>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color={
                  lockTimeInfo.isLocked
                    ? COLORS.grayText
                    : lockTimeInfo.isUrgent
                    ? COLORS.warning
                    : COLORS.navy
                }
              >
                {lockTimeInfo.isLocked ? lockTimeInfo.display : lockTimeInfo.timeUntil}
              </Text>
            </Box>
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
}

/**
 * Team Status Card
 */
function TeamStatusCard({
  teamData,
  teamName,
}: {
  teamData: TeamData | null;
  teamName: string;
}) {
  if (!teamData) {
    return (
      <Card variant="elevated" size="md" mb={4}>
        <CardBody>
          <Skeleton height="100px" borderRadius="md" />
        </CardBody>
      </Card>
    );
  }

  const budgetRemaining = DEFAULT_BUDGET - teamData.totalSalary;
  const budgetPercentUsed = (teamData.totalSalary / DEFAULT_BUDGET) * 100;
  const rosterComplete = teamData.rosterCount === 6;

  return (
    <Card variant="elevated" size="md" mb={4}>
      <CardBody p={5}>
        {/* Team Header */}
        <Flex align="center" mb={4}>
          <Box
            w={12}
            h={12}
            borderRadius="full"
            bg={COLORS.navy}
            display="flex"
            alignItems="center"
            justifyContent="center"
            mr={3}
          >
            <Text color={COLORS.gold} fontWeight="bold" fontSize="lg">
              {teamName.charAt(0).toUpperCase()}
            </Text>
          </Box>
          <Box flex={1}>
            <Heading as="h2" size="lg" color={COLORS.navy} mb={1}>
              {teamName}
            </Heading>
            <Badge
              colorPalette={teamData.isDraftComplete ? 'success' : 'warning'}
              size="sm"
            >
              {teamData.isDraftComplete ? 'Roster Submitted' : 'Draft In Progress'}
            </Badge>
          </Box>
        </Flex>

        {/* Stats Grid */}
        <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={4}>
          {/* Roster Count */}
          <GridItem>
            <Card variant="filled" size="sm">
              <CardBody p={3}>
                <Flex align="center" gap={2} mb={1}>
                  <Box
                    as={UserGroupIcon}
                    w={4}
                    h={4}
                    color={rosterComplete ? COLORS.success : COLORS.gold}
                  />
                  <Text fontSize="xs" color={COLORS.grayText} textTransform="uppercase">
                    Roster
                  </Text>
                </Flex>
                <Text fontSize="2xl" fontWeight="bold" color={COLORS.navy}>
                  {teamData.rosterCount}
                  <Text as="span" fontSize="sm" color={COLORS.grayText} fontWeight="normal">
                    /6
                  </Text>
                </Text>
                <Text fontSize="xs" color={rosterComplete ? COLORS.success : COLORS.grayText}>
                  {rosterComplete ? (
                    <Flex align="center" gap={1}>
                      <Box as={CheckCircleIcon} w={3} h={3} />
                      Complete
                    </Flex>
                  ) : (
                    `${6 - teamData.rosterCount} slots open`
                  )}
                </Text>
              </CardBody>
            </Card>
          </GridItem>

          {/* Budget */}
          <GridItem>
            <Card variant="filled" size="sm">
              <CardBody p={3}>
                <Flex align="center" gap={2} mb={1}>
                  <Box as={CurrencyDollarIcon} w={4} h={4} color={COLORS.navyLight} />
                  <Text fontSize="xs" color={COLORS.grayText} textTransform="uppercase">
                    Remaining
                  </Text>
                </Flex>
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  color={budgetRemaining < 0 ? COLORS.warning : COLORS.navy}
                >
                  {formatCurrency(budgetRemaining)}
                </Text>
                <Text fontSize="xs" color={COLORS.grayText}>
                  of {formatCurrency(DEFAULT_BUDGET)}
                </Text>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Budget Progress Bar */}
        <Box>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="xs" color={COLORS.grayText}>
              Budget Used
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color={COLORS.navy}>
              {Math.round(budgetPercentUsed)}%
            </Text>
          </Flex>
          <Box
            height="8px"
            bg="gray.200"
            borderRadius="full"
            overflow="hidden"
          >
            <Box
              height="100%"
              width={`${Math.min(budgetPercentUsed, 100)}%`}
              bg={budgetPercentUsed > 100 ? 'red.500' : budgetPercentUsed > 90 ? 'orange.500' : COLORS.navyLight}
              borderRadius="full"
              transition="width 0.3s ease"
            />
          </Box>
        </Box>
      </CardBody>
    </Card>
  );
}

/**
 * Action Buttons
 */
function ActionButtons({
  onViewTeam,
  teamData,
}: {
  onViewTeam: () => void;
  teamData: TeamData | null;
}) {
  const router = useRouter();

  return (
    <VStack gap={3} align="stretch">
      {/* Primary CTA */}
      <Button
        colorPalette="primary"
        size="lg"
        onClick={onViewTeam}
        rightIcon={<ArrowRightIcon style={{ width: '16px', height: '16px' }} />}
        w="full"
      >
        {teamData?.isDraftComplete ? 'View My Team' : 'Continue Draft'}
      </Button>

      {/* Secondary Actions */}
      <Flex gap={3}>
        <Button
          variant="outline"
          colorPalette="navy"
          size="md"
          onClick={() => router.push('/leaderboard')}
          flex={1}
          leftIcon={<TrophyIcon style={{ width: '16px', height: '16px' }} />}
        >
          Leaderboard
        </Button>
        <Button
          variant="outline"
          colorPalette="navy"
          size="md"
          onClick={() => router.push('/athletes')}
          flex={1}
        >
          Browse Athletes
        </Button>
      </Flex>
    </VStack>
  );
}

// ===========================
// Main Component
// ===========================

export default function LoggedInDashboard({
  teamName,
  teamData,
  raceData,
  onViewTeam,
  isLoading = false,
}: LoggedInDashboardProps) {
  if (isLoading) {
    return (
      <Box
        className="welcome-card"
        maxW="container.md"
        mx="auto"
        my={{ base: 0, md: 4 }}
        px={4}
        py={6}
      >
        <Container maxW="container.sm">
          <VStack gap={4} align="stretch">
            <Skeleton height="80px" borderRadius="lg" />
            <Skeleton height="200px" borderRadius="lg" />
            <Skeleton height="48px" borderRadius="lg" />
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      className="welcome-card"
      maxW="container.md"
      mx="auto"
      my={{ base: 0, md: 4 }}
      px={4}
      py={6}
    >
      <Container maxW="container.sm">
        {/* Welcome Header */}
        <Box textAlign="center" mb={6}>
          <Text fontSize="sm" color={COLORS.navyLight} mb={1}>
            Welcome back
          </Text>
          <Heading as="h1" size="xl" color={COLORS.navy}>
            {teamName || 'Your Team'}
          </Heading>
        </Box>

        {/* Race Info */}
        <RaceInfoCard raceData={raceData} />

        {/* Team Status */}
        <TeamStatusCard teamData={teamData} teamName={teamName} />

        {/* Action Buttons */}
        <ActionButtons onViewTeam={onViewTeam} teamData={teamData} />
      </Container>
    </Box>
  );
}
