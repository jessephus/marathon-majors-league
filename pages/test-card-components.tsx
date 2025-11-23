/**
 * Card Components Test Page
 * 
 * Comprehensive showcase and testing page for all card components.
 * Used for visual verification, accessibility testing, and documentation screenshots.
 */

import { Box, Container, Heading, Text, VStack, SimpleGrid, HStack } from '@chakra-ui/react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  AthleteCard,
  TeamCard,
  RaceCard,
  LeaderboardCard,
  StatsCard,
  PresetStatsCards,
  Button,
} from '@/components/chakra';
import { TrophyIcon, UsersIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function TestCardComponents() {
  // Sample data
  const sampleAthlete = {
    id: 1,
    name: 'Eliud Kipchoge',
    country: 'KEN',
    gender: 'M' as const,
    pb: '2:01:09',
    seasonBest: '2:02:42',
    rank: 1,
    salary: 12500,
    photoUrl: null,
  };

  const sampleTeam = {
    id: 1,
    name: 'Speed Demons',
    ownerName: 'John Doe',
    points: 847,
    rank: 1,
    rosterComplete: true,
    athleteCount: 6,
    totalSalary: 28500,
  };

  const sampleRace = {
    id: 1,
    name: 'New York City Marathon',
    date: '2024-11-03',
    location: 'New York, USA',
    venue: 'Central Park',
    confirmedAthletes: 45,
    status: 'upcoming' as const,
    distance: '42.195km',
    description: 'The largest marathon in the world, featuring a fast and flat course through all five boroughs of New York City.',
  };

  const sampleLeaderboardEntries = [
    {
      rank: 1,
      teamId: 1,
      teamName: 'Speed Demons',
      ownerName: 'John Doe',
      points: 847,
      rosterComplete: true,
      athleteCount: 6,
      isCurrentUser: true,
    },
    {
      rank: 2,
      teamId: 2,
      teamName: 'Marathon Masters',
      ownerName: 'Jane Smith',
      points: 832,
      rosterComplete: true,
      athleteCount: 6,
    },
    {
      rank: 3,
      teamId: 3,
      teamName: 'Running Wild',
      ownerName: 'Bob Johnson',
      points: 815,
      rosterComplete: false,
      athleteCount: 5,
    },
  ];

  return (
    <Box bg="gray.50" minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack align="stretch" gap={12}>
          {/* Header */}
          <Box>
            <Heading as="h1" size="2xl" mb={2} color="navy.900">
              Card Components Test Page
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Comprehensive showcase of all Chakra UI card components
            </Text>
          </Box>

          {/* Base Card Component */}
          <VStack align="stretch" gap={6}>
            <Heading as="h2" size="xl" color="navy.800">
              1. Base Card Component
            </Heading>
            <Text color="gray.600">
              Foundation card component with multiple variants and sizes
            </Text>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
              {/* Variants */}
              <Card variant="elevated" size="md">
                <CardHeader>
                  <Heading as="h3" size="md">Elevated</Heading>
                </CardHeader>
                <CardBody>
                  <Text>Default card with shadow elevation</Text>
                </CardBody>
                <CardFooter>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>

              <Card variant="outline" size="md">
                <CardHeader>
                  <Heading as="h3" size="md">Outline</Heading>
                </CardHeader>
                <CardBody>
                  <Text>Card with border, no shadow</Text>
                </CardBody>
                <CardFooter>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>

              <Card variant="filled" size="md">
                <CardHeader>
                  <Heading as="h3" size="md">Filled</Heading>
                </CardHeader>
                <CardBody>
                  <Text>Card with filled background</Text>
                </CardBody>
                <CardFooter>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>

              <Card variant="unstyled" size="md" border="1px solid" borderColor="gray.300">
                <CardHeader>
                  <Heading as="h3" size="md">Unstyled</Heading>
                </CardHeader>
                <CardBody>
                  <Text>Minimal styling, full control</Text>
                </CardBody>
                <CardFooter>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>
            </SimpleGrid>

            {/* Interactive States */}
            <Heading as="h3" size="lg" color="navy.700" mt={4}>
              Interactive States
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
              <Card variant="outline" isHoverable onClick={() => alert('Clicked!')}>
                <CardBody>
                  <Text fontWeight="semibold" mb={2}>Hoverable</Text>
                  <Text fontSize="sm" color="gray.600">Hover to see elevation effect</Text>
                </CardBody>
              </Card>

              <Card variant="outline" isSelected>
                <CardBody>
                  <Text fontWeight="semibold" mb={2}>Selected</Text>
                  <Text fontSize="sm" color="gray.600">Shows active selection state</Text>
                </CardBody>
              </Card>

              <Card variant="outline" isDisabled>
                <CardBody>
                  <Text fontWeight="semibold" mb={2}>Disabled</Text>
                  <Text fontSize="sm" color="gray.600">Reduced opacity, no interaction</Text>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Loading State */}
            <Heading as="h3" size="lg" color="navy.700" mt={4}>
              Loading State
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
              <Card variant="outline" isLoading size="sm" />
              <Card variant="outline" isLoading size="md" />
              <Card variant="outline" isLoading size="lg" />
            </SimpleGrid>
          </VStack>

          {/* AthleteCard */}
          <VStack align="stretch" gap={6}>
            <Heading as="h2" size="xl" color="navy.800">
              2. AthleteCard Component
            </Heading>
            <Text color="gray.600">
              Specialized card for displaying athlete information with photo, stats, and salary
            </Text>

            <Heading as="h3" size="lg" color="navy.700">
              Variants
            </Heading>
            <VStack align="stretch" gap={4}>
              <AthleteCard
                athlete={sampleAthlete}
                variant="compact"
                onSelect={() => alert('Selected athlete!')}
              />
              <AthleteCard
                athlete={sampleAthlete}
                variant="standard"
                onSelect={() => alert('Selected athlete!')}
              />
              <AthleteCard
                athlete={sampleAthlete}
                variant="detailed"
                onSelect={() => alert('Selected athlete!')}
              />
            </VStack>

            <Heading as="h3" size="lg" color="navy.700" mt={4}>
              States
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <AthleteCard athlete={sampleAthlete} variant="standard" isSelected />
              <AthleteCard athlete={sampleAthlete} variant="standard" isDisabled />
            </SimpleGrid>
          </VStack>

          {/* TeamCard */}
          <VStack align="stretch" gap={6}>
            <Heading as="h2" size="xl" color="navy.800">
              3. TeamCard Component
            </Heading>
            <Text color="gray.600">
              Display team information with rankings, roster status, and points
            </Text>

            <Heading as="h3" size="lg" color="navy.700">
              Variants
            </Heading>
            <VStack align="stretch" gap={4}>
              <TeamCard team={sampleTeam} variant="compact" />
              <TeamCard team={sampleTeam} variant="standard" />
              <TeamCard team={sampleTeam} variant="detailed" />
            </VStack>

            <Heading as="h3" size="lg" color="navy.700" mt={4}>
              Top 3 Rankings (with medals)
            </Heading>
            <VStack align="stretch" gap={4}>
              <TeamCard team={{ ...sampleTeam, rank: 1, name: 'Speed Demons' }} variant="standard" />
              <TeamCard team={{ ...sampleTeam, rank: 2, name: 'Marathon Masters' }} variant="standard" />
              <TeamCard team={{ ...sampleTeam, rank: 3, name: 'Running Wild' }} variant="standard" />
            </VStack>
          </VStack>

          {/* RaceCard */}
          <VStack align="stretch" gap={6}>
            <Heading as="h2" size="xl" color="navy.800">
              4. RaceCard Component
            </Heading>
            <Text color="gray.600">
              Display race/event information with status, location, and confirmed athletes
            </Text>

            <Heading as="h3" size="lg" color="navy.700">
              Variants
            </Heading>
            <VStack align="stretch" gap={4}>
              <RaceCard race={sampleRace} variant="compact" />
              <RaceCard race={sampleRace} variant="standard" />
              <RaceCard race={sampleRace} variant="detailed" />
            </VStack>

            <Heading as="h3" size="lg" color="navy.700" mt={4}>
              Status Indicators
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <RaceCard race={{ ...sampleRace, status: 'upcoming' }} variant="standard" />
              <RaceCard race={{ ...sampleRace, status: 'live' }} variant="standard" />
              <RaceCard race={{ ...sampleRace, status: 'completed' }} variant="standard" />
              <RaceCard race={{ ...sampleRace, status: 'draft' }} variant="standard" />
            </SimpleGrid>
          </VStack>

          {/* LeaderboardCard */}
          <VStack align="stretch" gap={6}>
            <Heading as="h2" size="xl" color="navy.800">
              5. LeaderboardCard Component
            </Heading>
            <Text color="gray.600">
              Compact card optimized for standings/leaderboard lists
            </Text>

            <Heading as="h3" size="lg" color="navy.700">
              Leaderboard Example
            </Heading>
            <VStack align="stretch" gap={2}>
              {sampleLeaderboardEntries.map((entry) => (
                <LeaderboardCard
                  key={entry.rank}
                  entry={entry}
                  isCurrentUser={entry.isCurrentUser}
                  onClick={() => alert(`Clicked team: ${entry.teamName}`)}
                />
              ))}
            </VStack>
          </VStack>

          {/* StatsCard */}
          <VStack align="stretch" gap={6}>
            <Heading as="h2" size="xl" color="navy.800">
              6. StatsCard Component
            </Heading>
            <Text color="gray.600">
              Generic statistics display with multiple value types and trend indicators
            </Text>

            <Heading as="h3" size="lg" color="navy.700">
              Value Types
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
              <StatsCard
                label="Total Points"
                value={847}
                type="number"
                icon={TrophyIcon}
                colorPalette="navy"
              />
              <StatsCard
                label="Total Salary"
                value={28500}
                type="currency"
                icon={UsersIcon}
                colorPalette="gold"
              />
              <StatsCard
                label="Win Rate"
                value={75}
                type="percentage"
                colorPalette="success"
              />
              <StatsCard
                label="Avg Finish"
                value={7842}
                type="time"
                icon={ClockIcon}
                colorPalette="info"
              />
            </SimpleGrid>

            <Heading as="h3" size="lg" color="navy.700" mt={4}>
              Trend Indicators
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
              <StatsCard
                label="Points This Week"
                value={247}
                type="number"
                trend="up"
                comparison="+12%"
                colorPalette="success"
              />
              <StatsCard
                label="Rank Change"
                value={3}
                type="number"
                trend="down"
                comparison="-2"
                colorPalette="error"
              />
              <StatsCard
                label="Average Pace"
                value={4815}
                type="time"
                trend="neutral"
                comparison="±0"
                colorPalette="navy"
              />
            </SimpleGrid>

            <Heading as="h3" size="lg" color="navy.700" mt={4}>
              Sizes
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
              <StatsCard
                label="Small"
                value={123}
                type="number"
                size="sm"
                icon={TrophyIcon}
              />
              <StatsCard
                label="Medium"
                value={456}
                type="number"
                size="md"
                icon={TrophyIcon}
              />
              <StatsCard
                label="Large"
                value={789}
                type="number"
                size="lg"
                icon={TrophyIcon}
              />
            </SimpleGrid>

            <Heading as="h3" size="lg" color="navy.700" mt={4}>
              Preset Cards
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
              <PresetStatsCards.Points value={847} />
              <PresetStatsCards.Currency value={28500} />
              <PresetStatsCards.Athletes value={6} />
              <PresetStatsCards.Rank value={1} />
            </SimpleGrid>
          </VStack>

          {/* Footer */}
          <Box borderTop="1px solid" borderColor="gray.200" pt={8} mt={8}>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Phase 4: Card Components - Marathon Majors Fantasy League
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              All components are WCAG 2.1 AA compliant and fully responsive
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
