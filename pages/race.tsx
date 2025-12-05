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
import { Box, Container, Heading, Text, VStack, SimpleGrid, Flex } from '@chakra-ui/react';
import { apiClient } from '@/lib/api-client';
import { useGameState } from '@/lib/state-provider';
import { Button, Card, CardBody } from '@/components/chakra';
import { RaceHero, CompactAthleteList } from '@/components/race';
import Footer from '@/components/Footer';
import AthleteModal from '@/components/AthleteModal';
import { hasActiveCommissionerSession } from '@/lib/session-manager';
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

interface RaceNews {
  id: number;
  raceId: number;
  headline: string;
  description?: string;
  articleUrl?: string;
  imageUrl?: string;
  publishedDate?: string;
  displayOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RacePageProps {
  raceId: string | null;
  initialGameId: string; // Added to pass SSR cookie reading
  initialActiveRaceId: number | null; // Added to eliminate client-side wait
  initialRace: Race | null; // SSR-provided full race data for immediate rendering
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.query;
  
  // Read current_game_id cookie (commissioner's selected game) or use default
  // This ensures fresh read on every page load, respects logout
    // Determine commissioner status server-side, then pick gameId accordingly
    const cookies = context.req.headers.cookie || '';

    const isCommissioner = hasActiveCommissionerSession(cookies);

    let gameId = DEFAULT_GAME_ID;
    if (isCommissioner) {
      const cookieMatch = cookies.match(/current_game_id=([^;]+)/);
      if (cookieMatch) {
        gameId = cookieMatch[1];
      }
    }
  
  // Fetch game state server-side to get activeRaceId immediately
  // This eliminates the "race not found" delay on page load
  let activeRaceId: number | null = null;
  let initialRace: Race | null = null;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/game-state?gameId=${gameId}`);
    if (response.ok) {
      const data = await response.json();
      activeRaceId = data.activeRaceId || null;
    }
  } catch (err) {
    console.error('[Race SSR] Failed to fetch game state:', err);
    // Continue with null - component will handle gracefully
  }
  
  // Fetch full race data server-side for SEO and immediate rendering
  // This eliminates the "Race not found" flicker on initial page load
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // If a specific race ID is provided, fetch that race
    // Otherwise, fetch the active race for the game
    const targetRaceId = id ? parseInt(String(id)) : activeRaceId;
    
    if (targetRaceId) {
      const raceResponse = await fetch(
        `${baseUrl}/api/races?id=${targetRaceId}&includeAthletes=true`
      );
      
      if (raceResponse.ok) {
        const raceData = await raceResponse.json();
        
        // API returns single object when id is specified
        if (raceData && typeof raceData === 'object' && !Array.isArray(raceData)) {
          initialRace = raceData;
        } else if (Array.isArray(raceData) && raceData.length > 0) {
          initialRace = raceData[0];
        }
      }
    }
  } catch (err) {
    console.error('[Race SSR] Failed to fetch race data:', err);
    // Continue with null - component will handle gracefully
  }
  
  return {
    props: {
      raceId: id ? String(id) : null,
      initialGameId: gameId, // Pass to component for initialization
      initialActiveRaceId: activeRaceId, // Pass activeRaceId from SSR
      initialRace, // Pass full race data from SSR for immediate rendering
    },
  };
}

export default function RacePage({ raceId, initialGameId, initialActiveRaceId, initialRace }: RacePageProps) {
  const router = useRouter();
  const { gameState, setGameState } = useGameState();
  const [race, setRace] = useState<Race | null>(initialRace); // Initialize with SSR data
  const [loading, setLoading] = useState(!initialRace); // Only show loading if SSR didn't provide data
  const [error, setError] = useState<string | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newsItems, setNewsItems] = useState<RaceNews[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  // Initialize game state with SSR-provided activeRaceId (eliminates client-side wait)
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
    
    // Set initial activeRaceId from SSR immediately (no wait)
    if (initialActiveRaceId !== null) {
      setGameState({
        activeRaceId: initialActiveRaceId,
      });
    }
    
    // Still load full game state for other properties (draft status, etc.)
    loadGameState();
  }, [initialGameId, initialActiveRaceId, setGameState]);

  // Load race details when dependencies change - uses SSR-provided activeRaceId
  useEffect(() => {
    loadRaceDetails();
  }, [raceId, initialActiveRaceId, gameState.activeRaceId]);

  // Load race news when race is loaded
  useEffect(() => {
    if (race?.id) {
      loadRaceNews(race.id);
    }
  }, [race?.id]);

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

  const loadRaceNews = async (raceId: number) => {
    try {
      setLoadingNews(true);
      const news = await apiClient.raceNews.list({ raceId });
      setNewsItems(news || []);
    } catch (err: any) {
      console.error('Failed to load race news:', err);
      setNewsItems([]);
    } finally {
      setLoadingNews(false);
    }
  };

  const loadRaceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If no race ID provided, use the game's active race
      if (!raceId) {
        // Use SSR-provided activeRaceId first (immediate, no wait!)
        // Falls back to gameState if SSR didn't provide it
        const activeRaceId = initialActiveRaceId || gameState.activeRaceId;
        
        // OPTIMIZATION: Use SSR data immediately if available and unchanged
        // Skip fetch if:
        // 1. We have SSR race data (initialRace)
        // 2. No specific race ID requested (raceId)
        // 3. The game hasn't changed (gameState.gameId matches initialGameId)
        const gameChanged = gameState.gameId && gameState.gameId !== initialGameId;
        if (initialRace && !gameChanged && race === initialRace) {
          console.log('[Race Page] Using SSR race data (no fetch needed)');
          setLoading(false);
          return;
        }
        
        console.log('[Race Page] gameState.activeRaceId:', gameState.activeRaceId);
        console.log('[Race Page] initialActiveRaceId (SSR):', initialActiveRaceId);
        console.log('[Race Page] gameState.gameId:', gameState.gameId);
        
        // Check if we have an activeRaceId
        if (activeRaceId === undefined || activeRaceId === null) {
          // No activeRaceId available (shouldn't happen with SSR, but handle gracefully)
          console.log('[Race Page] No activeRaceId available');
          setError('Race not found');
          setLoading(false);
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

  const getBaseDomain = (url) => {
  try {
    const { hostname } = new URL(url);
    // Remove "www." if present
    return hostname.replace(/^www\./, "");
  } catch {
    return "Read Full Article";
  }
};

  return (
    <>
      <Head>
        <title>{race.name} | Marathon Majors Fantasy League</title>
        <meta name="description" content={race.description || `${race.name} - ${race.location}`} />
        
        {/* Open Graph Meta Tags for Facebook/LinkedIn */}
        <meta property="og:title" content={`${race.name} | Marathon Majors Fantasy League`} />
        <meta property="og:description" content={race.description || `${race.name} - ${race.location}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://marathonmajorsfantasy.com/race`} />
        {(race.backgroundImageUrl || race.logoUrl) && (
          <meta property="og:image" content={race.backgroundImageUrl || race.logoUrl || ''} />
        )}
        <meta property="og:site_name" content="Marathon Majors Fantasy League" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${race.name} | Marathon Majors Fantasy League`} />
        <meta name="twitter:description" content={race.description || `${race.name} - ${race.location}`} />
        {(race.backgroundImageUrl || race.logoUrl) && (
          <meta name="twitter:image" content={race.backgroundImageUrl || race.logoUrl || ''} />
        )}
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
          <Container maxW="container.xl" mx="auto" py={{ base: 4, md: 6 }}>
            <VStack gap={{ base: 6, md: 8 }} align="stretch">
              
              {/* Race News & Updates Section */}
              <Card variant="filled" size="lg">
                <CardBody>
                  <VStack align="stretch" gap={4}>
                    <Heading as="h3" size="lg" color="navy.800">
                      Race News & Updates
                    </Heading>
                    {loadingNews ? (
                      <Box py={8} textAlign="center">
                        <Text color="gray.500">Loading news...</Text>
                      </Box>
                    ) : newsItems.length === 0 ? (
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
                    ) : (
                      <VStack align="stretch" gap={4}>
                        {newsItems.map((newsItem) => (
                          <Box
                            key={newsItem.id}
                            p={4}
                            borderRadius="md"
                            bg="white"
                            border="1px solid"
                            borderColor="gray.200"
                            _hover={{ shadow: 'md', borderColor: 'navy.300' }}
                            transition="all 0.2s"
                          >
                            <Flex
                              direction={{ base: 'column', md: 'row' }}
                              gap={{ base: 3, md: 4 }}
                              align="stretch"
                            >
                              {/* Content Section (left side on desktop) */}
                              <VStack
                                align="stretch"
                                gap={3}
                                flex={{ base: '1', md: newsItem.imageUrl ? '1' : '1' }}
                              >
                                <Heading as="h4" size="md" color="navy.800">
                                  {newsItem.headline}
                                </Heading>
                                {newsItem.description && (
                                  <Text color="gray.700" fontSize="md">
                                    {newsItem.description}
                                  </Text>
                                )}
                                {newsItem.publishedDate && (
                                  <Text color="gray.500" fontSize="sm">
                                    {new Date(newsItem.publishedDate).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </Text>
                                )}
                                {newsItem.articleUrl && (
                                  <Box>
                                    <Link href={newsItem.articleUrl} target="_blank" rel="noopener noreferrer" passHref legacyBehavior>
                                      <Button
                                        as="a"
                                        colorPalette="navy"
                                        variant="outline"
                                        size="sm"
                                      >
                                        {getBaseDomain(newsItem.articleUrl)} →
                                      </Button>
                                    </Link>
                                  </Box>
                                )}
                              </VStack>

                              {/* Image Section (right side on desktop, top on mobile) */}
                              {newsItem.imageUrl && (
                                <Box
                                  width={{ base: '100%', md: '280px' }}
                                  height={{ base: '200px', md: 'auto' }}
                                  minHeight={{ md: '180px' }}
                                  borderRadius="md"
                                  overflow="hidden"
                                  bg="gray.100"
                                  flexShrink={0}
                                  order={{ base: -1, md: 1 }}
                                >
                                  <img
                                    src={newsItem.imageUrl}
                                    alt={newsItem.headline}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                  />
                                </Box>
                              )}
                            </Flex>
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </VStack>
                </CardBody>
              </Card>

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
