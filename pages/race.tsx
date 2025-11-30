/**
 * Race Detail Page
 * 
 * Modern race page with hero section featuring:
 * - Full-width background image with race logo
 * - Bold race name and date/time
 * - Compact confirmed athletes display
 * - Race news & updates section
 * - Mobile-first responsive design with Chakra UI
 * 
 * Follows CORE_DESIGN_GUIDELINES.md navy/gold color scheme
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import Link from 'next/link';
import { Box, Container, Heading, Text, VStack, SimpleGrid } from '@chakra-ui/react';
import { apiClient } from '@/lib/api-client';
import { useGameState } from '@/lib/state-provider';
import { Button, Card, CardBody } from '@/components/chakra';
import { RaceHero, CompactAthleteList } from '@/components/race';
import Footer from '@/components/Footer';
import AthleteModal from '@/components/AthleteModal';
import { DEFAULT_GAME_ID } from '@/config/constants';

interface Race {
  id: number;
  name: string;
  date: string;
  lockTime?: string | null;
  location: string;
  distance: string;
  eventType: string;
  worldAthleticsEventId?: string;
  description?: string;
  isActive: boolean;
  logoUrl?: string;
  backgroundImageUrl?: string;
  athletes?: {
    men: Athlete[];
    women: Athlete[];
  };
}

interface Athlete {
  id: number;
  name: string;
  country: string;
  gender: string;
  pb: string;
  headshotUrl?: string;
  marathonRank?: number;
  bibNumber?: string;
}

interface RacePageProps {
  raceId: string | null;
  initialGameId: string; // Added to pass SSR cookie reading
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.query;
  
  // Read current_game_id cookie (commissioner's selected game) or use default
  // This ensures fresh read on every page load, respects logout
  const gameIdCookie = context.req.cookies.current_game_id;
  const gameId = gameIdCookie || DEFAULT_GAME_ID;
  
  return {
    props: {
      raceId: id ? String(id) : null,
      initialGameId: gameId, // Pass to component for initialization
    },
  };
}

export default function RacePage({ raceId, initialGameId }: RacePageProps) {
  const router = useRouter();
  const { gameState, setGameState } = useGameState();
  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load game state from API using SSR-provided gameId (respects logout)
  useEffect(() => {
    const loadGameState = async () => {
      try {
        const response = await fetch(`/api/game-state?gameId=${initialGameId}`);
        if (response.ok) {
          const data = await response.json();
          setGameState({
            activeRaceId: data.activeRaceId,
            draftComplete: data.draftComplete,
            resultsFinalized: data.resultsFinalized,
            rosterLockTime: data.rosterLockTime,
          });
        }
      } catch (err) {
        console.error('Failed to load game state:', err);
      }
    };
    loadGameState();
  }, [initialGameId, setGameState]);

  useEffect(() => {
    loadRaceDetails();
  }, [raceId, gameState.activeRaceId]);

  const handleViewAll = () => {
    router.push('/athletes');
  };

  const handleAthleteClick = (athleteId: number) => {
    setSelectedAthleteId(athleteId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAthleteId(null);
  };

  const loadRaceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If no race ID provided, use the game's active race
      if (!raceId) {
        const activeRaceId = gameState.activeRaceId;
        
        console.log('[Race Page] gameState.activeRaceId:', activeRaceId);
        console.log('[Race Page] gameState.gameId:', gameState.gameId);
        
        // Wait for gameState to be loaded (activeRaceId will be set from API)
        if (activeRaceId === undefined || activeRaceId === null) {
          // GameState not yet loaded, keep loading state
          console.log('[Race Page] activeRaceId is null/undefined, waiting for gameState to load...');
          setLoading(true);
          return;
        }
        
        console.log('[Race Page] Fetching race with ID:', activeRaceId);
        
        // Fetch the game's active race with athletes
        const raceData = await apiClient.races.list({ 
          id: activeRaceId, 
          includeAthletes: true 
        });
        
        // Handle response type - could be object or array
        if (Array.isArray(raceData) && raceData.length > 0) {
          setRace(raceData[0]);
        } else if (!Array.isArray(raceData) && raceData) {
          setRace(raceData);
        } else {
          setError('Race not found');
        }
        return;
      }
      
      // Fetch race with athletes
      // NOTE: When an ID is provided, the API returns a single race object, not an array
      const raceData = await apiClient.races.list({ 
        id: parseInt(raceId!), 
        includeAthletes: true 
      });
      
      // Check if we received a race object (API returns single object when id is specified)
      if (raceData && typeof raceData === 'object' && !Array.isArray(raceData)) {
        setRace(raceData);
      } else {
        setError('Race not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load race details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Race... | Marathon Majors Fantasy League</title>
        </Head>
        <Box minHeight="100vh" bg="gray.50">
          <Container maxW="container.xl" py={8}>
            <Text color="gray.600">Loading race details...</Text>
          </Container>
        </Box>
      </>
    );
  }

  if (error || !race) {
    return (
      <>
        <Head>
          <title>Race Not Found | Marathon Majors Fantasy League</title>
        </Head>
        <Box minHeight="100vh" bg="gray.50">
          <Container maxW="container.xl" py={8}>
            <VStack gap={4} align="center" py={16}>
              <Heading as="h2" size="xl" color="error.600">
                Race Not Found
              </Heading>
              <Text color="gray.600">
                {error || 'The requested race could not be found.'}
              </Text>
              <Link href="/" passHref legacyBehavior>
                <Button as="a" colorPalette="navy" size="lg">
                  Return to Home
                </Button>
              </Link>
            </VStack>
          </Container>
        </Box>
      </>
    );
  }

  // Combine all athletes for compact display with gender info
  const allAthletes = [
    ...(race.athletes?.men || []).map(athlete => ({
      id: athlete.id,
      name: athlete.name,
      headshotUrl: athlete.headshotUrl,
      country: athlete.country,
      gender: 'M' as const,
    })),
    ...(race.athletes?.women || []).map(athlete => ({
      id: athlete.id,
      name: athlete.name,
      headshotUrl: athlete.headshotUrl,
      country: athlete.country,
      gender: 'F' as const,
    }))
  ];

  return (
    <>
      <Head>
        <title>{race.name} | Marathon Majors Fantasy League</title>
        <meta name="description" content={race.description || `${race.name} - ${race.location}`} />
      </Head>

      <Box minHeight="100vh" position="relative" zIndex={1}>
        {/* Hero Section */}
        <RaceHero
          raceName={race.name}
          raceDate={race.date}
          lockTime={race.lockTime}
          location={race.location}
          logoUrl={race.logoUrl}
          backgroundImageUrl={race.backgroundImageUrl}
        />

        {/* Scrolling Overlay - Fades from transparent to solid gray.50 */}
        <Box
          position="relative"
          background="rgba(247, 250, 252, 1)"
          minHeight="100vh"
        >
          {/* Main Content */}
          <Container maxW="container.xl" py={{ base: 4, md: 6 }}>
            <VStack gap={{ base: 6, md: 8 }} align="stretch">
              
              {/* Confirmed Athletes Section */}
              {allAthletes.length > 0 && (
                <Card variant="filled" size="md">
                  <CardBody>
                    <CompactAthleteList
                      athletes={allAthletes}
                      title="Confirmed Athletes"
                      showViewAll={true}
                      onViewAll={handleViewAll}
                      onAthleteClick={handleAthleteClick}
                    />
                  </CardBody>
                </Card>
              )}

              {/* Race News & Updates Section */}
              <Card variant="filled" size="lg">
                <CardBody>
                  <VStack align="stretch" gap={4}>
                    <Heading as="h3" size="lg" color="navy.800">
                      Race News & Updates
                    </Heading>
                    <Box
                      py={8}
                      textAlign="center"
                      borderRadius="md"
                      bg="gray.50"
                    >
                      <Text color="gray.500" fontSize="lg">
                        No updates yet.
                      </Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              {/* Race Details Section */}
              {race.description && (
                <Card variant="filled" size="lg">
                  <CardBody>
                    <VStack align="stretch" gap={4}>
                      <Heading as="h3" size="lg" color="navy.800">
                        About the Race
                      </Heading>
                      <Text color="gray.700" lineHeight="tall">
                        {race.description}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              )}


            </VStack>
          </Container>

          <Footer />
        </Box>
      </Box>

      {/* Athlete Detail Modal */}
      {isModalOpen && selectedAthleteId && (() => {
        // Find the selected athlete from the race data
        const selectedAthlete = race?.athletes?.men?.find(a => a.id === selectedAthleteId) ||
                                race?.athletes?.women?.find(a => a.id === selectedAthleteId) ||
                                null;
        
        return (
          <AthleteModal
            athlete={selectedAthlete}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
        );
      })()}
    </>
  );
}
