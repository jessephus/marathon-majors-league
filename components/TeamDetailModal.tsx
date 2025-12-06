/**
 * TeamDetailModal Component
 * 
 * Shows detailed breakdown of a team's roster and scoring.
 * Displays all athletes with their individual points, placements, and performance.
 * 
 * Features:
 * - Complete roster display (3 men + 3 women)
 * - Individual athlete scoring breakdown
 * - Gender-based sections
 * - Total team points
 * - Click to view athlete details
 * - Mobile-responsive layout
 * - WCAG 2.1 AA compliant
 * 
 * Based on legacy implementation:
 * https://github.com/jessephus/marathon-majors-league/blob/f346d44/public/app.js#L5704
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Flex,
  Text,
  Heading,
  VStack,
  HStack,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { Button } from './chakra/Button';
import { RaceResultCard } from './chakra';
import { TrophyIcon } from '@heroicons/react/24/solid';
import { athleteApi } from '@/lib/api-client';
import AthleteModal from './AthleteModal';

// ===========================
// Types
// ===========================

interface TeamAthlete {
  athlete_id: number;
  athlete_name: string;
  country: string;
  gender: 'men' | 'women';
  personal_best?: string;
  headshot_url?: string;
  placement?: number | null;
  finish_time?: string | null;
  total_points: number;
  breakdown?: any;
  world_athletics_id?: string;
  marathon_rank?: number;
  age?: number;
  sponsor?: string;
}

interface TeamDetailData {
  player_code: string;
  rank: number;
  total_points: number;
  wins: number;
  top3: number;
  athletes: TeamAthlete[];
}

interface TeamDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCode: string;
  gameId: string;
}

// ===========================
// TeamDetailModal Component
// ===========================

export default function TeamDetailModal({
  isOpen,
  onClose,
  playerCode,
  gameId,
}: TeamDetailModalProps) {
  const [teamData, setTeamData] = useState<TeamDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Athlete modal state (manual state management for portal approach)
  const [isAthleteModalOpen, setIsAthleteModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<{
    athlete: any;
    scoringData: any;
  } | null>(null);

  // Fetch team details when modal opens
  useEffect(() => {
    if (isOpen && playerCode && gameId) {
      fetchTeamDetails();
    }
  }, [isOpen, playerCode, gameId]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const fetchTeamDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch team details from new API endpoint
      const response = await fetch(
        `/api/team-details?gameId=${encodeURIComponent(gameId)}&playerCode=${encodeURIComponent(playerCode)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch team details');
      }

      const data = await response.json();
      setTeamData(data);
    } catch (err) {
      console.error('Error fetching team details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  // Handle athlete click - show athlete modal with scoring
  const handleAthleteClick = (athlete: TeamAthlete) => {
    // Convert athlete data to format expected by AthleteModal
    const athleteData = {
      id: athlete.athlete_id,
      name: athlete.athlete_name,
      country: athlete.country,
      gender: athlete.gender,
      pb: athlete.personal_best || '',
      headshotUrl: athlete.headshot_url,
      worldAthleticsId: athlete.world_athletics_id,
      marathonRank: athlete.marathon_rank,
      age: athlete.age,
      sponsor: athlete.sponsor,
    };

    setSelectedAthlete({
      athlete: athleteData,
      scoringData: {
        totalPoints: athlete.total_points || 0,
        breakdown: athlete.breakdown,
        finishTime: athlete.finish_time,
        placement: athlete.placement,
      },
    });

    setIsAthleteModalOpen(true);
  };

  // Format points with commas
  const formatPoints = (points: number) => {
    return new Intl.NumberFormat('en-US').format(points);
  };

  // Get points breakdown shorthand (e.g., "P10+G5+B3")
  const getPointsShorthand = (athlete: TeamAthlete): string => {
    if (!athlete.breakdown) return '-';
    
    const parts: string[] = [];
    
    // Placement points
    if (athlete.breakdown.placement?.points > 0) {
      parts.push(`P${athlete.breakdown.placement.points}`);
    }
    
    // Time gap points
    if (athlete.breakdown.time_gap?.points > 0) {
      parts.push(`G${athlete.breakdown.time_gap.points}`);
    }
    
    // Performance and record bonuses combined
    const perfBonus = athlete.breakdown.performance_bonuses?.reduce((sum, b) => sum + b.points, 0) || 0;
    const recBonus = athlete.breakdown.record_bonuses?.reduce((sum, b) => sum + b.points, 0) || 0;
    const totalBonus = perfBonus + recBonus;
    
    if (totalBonus > 0) {
      parts.push(`B${totalBonus}`);
    }
    
    return parts.length > 0 ? parts.join('+') : '-';
  };

  // Get medal display for rank
  type ColorPalette = 'error' | 'gold' | 'secondary' | 'warning' | 'navy' | 'primary' | 'success' | 'info';

  const getMedalDisplay = (rank: number): { icon: string; color: ColorPalette; label: string } | null => {
    if (rank === 1) {
      return { icon: '🥇', color: 'gold', label: '1st Place' };
    }
    if (rank === 2) {
      // Use semantic palette keys compatible with our chakra Badge
      return { icon: '🥈', color: 'secondary', label: '2nd Place' };
    }
    if (rank === 3) {
      // Map orange visual to the semantic 'warning' palette
      return { icon: '🥉', color: 'warning', label: '3rd Place' };
    }
    return null;
  };

  // Separate athletes by gender
  const menAthletes = teamData?.athletes.filter((a) => a.gender === 'men') || [];
  const womenAthletes = teamData?.athletes.filter((a) => a.gender === 'women') || [];

  const medal = teamData ? getMedalDisplay(teamData.rank) : null;

  // Portal-based modal rendering (Chakra UI v3 compatible)
  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <Box
        position="fixed"
        inset={0}
        bg="blackAlpha.600"
        zIndex={1400}
        onClick={onClose}
      />

      {/* Modal Content */}
      <Box
        position="fixed"
        inset={0}
        zIndex={1500}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={{ base: 0, md: 4 }}
        pointerEvents="none"
      >
        <Box
          bg="white"
          borderRadius={{ base: 'none', md: 'lg' }}
          boxShadow="2xl"
          maxW={{ base: '100%', md: '2xl' }}
          w="100%"
          maxH="90vh"
          display="flex"
          flexDirection="column"
          pointerEvents="auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <Box bg="navy.900" color="white" borderTopRadius="lg" p={4} position="relative">
            <VStack align="stretch" gap={2}>
              <HStack justify="space-between">
                <Heading as="h2" size="lg">
                  {playerCode}
                </Heading>
                {medal && (
                  <Badge
                    colorPalette={medal.color}
                    bg={`${medal.color}.600`}
                    color="white"
                    size="lg"
                  >
                    {medal.icon} {medal.label}
                  </Badge>
                )}
              </HStack>
              {teamData && (
                <HStack gap={4} fontSize="sm" opacity={0.9}>
                  <Text>
                    <TrophyIcon
                      style={{ width: '16px', height: '16px', display: 'inline-block' }}
                    />{' '}
                    {teamData.wins} wins
                  </Text>
                  <Text>•</Text>
                  <Text>{teamData.top3} top-3 finishes</Text>
                  <Text>•</Text>
                  <Text fontWeight="bold">{formatPoints(teamData.total_points)} pts</Text>
                </HStack>
              )}
            </VStack>

            {/* Close Button */}
            <Button
              position="absolute"
              top={2}
              right={2}
              variant="ghost"
              size="sm"
              onClick={onClose}
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              aria-label="Close modal"
            >
              ✕
            </Button>
          </Box>

          {/* Body */}
          <Box py={6} px={6} overflowY="auto" flex={1}>
            {loading && (
              <Flex justify="center" align="center" minH="200px">
                <Spinner size="xl" color="navy.500" />
              </Flex>
            )}

            {error && (
              <Box
                p={4}
                bg="error.50"
                borderRadius="md"
                border="1px solid"
                borderColor="error.200"
              >
                <Text color="error.700" fontWeight="medium">
                  {error}
                </Text>
              </Box>
            )}

            {!loading && !error && teamData && (
              <VStack align="stretch" gap={6}>
                {/* All Athletes */}
                <VStack align="stretch" gap={2}>
                  {[...menAthletes, ...womenAthletes].length === 0 ? (
                    <Text color="gray.500" fontSize="sm">
                      No athletes on this team
                    </Text>
                  ) : (
                    [...menAthletes, ...womenAthletes].map((athlete) => (
                      <RaceResultCard
                        key={athlete.athlete_id}
                        placement={athlete.placement || 0}
                        athleteName={athlete.athlete_name}
                        athleteId={athlete.athlete_id}
                        headshotUrl={athlete.headshot_url}
                        country={athlete.country}
                        personalBest={athlete.personal_best || ''}
                        finishTime={athlete.finish_time || 'DNS'}
                        gap=""
                        totalPoints={athlete.total_points}
                        breakdown={getPointsShorthand(athlete)}
                        gender={athlete.gender}
                        isDNS={!athlete.finish_time}
                        isDNF={false}
                        onClick={() => handleAthleteClick(athlete)}
                      />
                    ))
                  )}
                </VStack>

                {/* Total Points Summary */}
                {teamData && (
                  <Box
                    p={4}
                    bg="navy.50"
                    borderRadius="md"
                    border="2px solid"
                    borderColor="navy.200"
                  >
                    <Flex justify="space-between" align="center">
                      <Text fontSize="lg" fontWeight="semibold" color="navy.800">
                        Total Team Points
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold" color="navy.700">
                        {formatPoints(teamData.total_points)}
                      </Text>
                    </Flex>
                  </Box>
                )}
              </VStack>
            )}
          </Box>
        </Box>
      </Box>

      {/* Athlete Detail Modal */}
      {selectedAthlete && (
        <AthleteModal
          isOpen={isAthleteModalOpen}
          onClose={() => setIsAthleteModalOpen(false)}
          athlete={selectedAthlete.athlete}
          scoringData={selectedAthlete.scoringData}
        />
      )}
    </>,
    document.body
  );
}
