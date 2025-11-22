/**
 * Athletes Browser Page
 * 
 * Browse and filter elite marathon runners for team selection.
 * 
 * Features:
 * - Search by name or country
 * - Filter by gender
 * - Sort by ranking, personal best, or name
 * - Responsive grid layout (1/2/3 columns)
 * - Athlete detail modal on click
 * - Mobile-first design
 * 
 * Part of Phase 5: Feature Pages Implementation
 * Parent Issue: #126 - Page: Athlete Browser
 * Grand-parent Issue: #59 - Redesign UI with Modern Mobile-First Look
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Heading,
  Input,
  Flex,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Spinner,
  Badge,
  Image,
  Select,
} from '@chakra-ui/react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import AthleteModal from '@/components/AthleteModal';
import Head from 'next/head';

interface Athlete {
  id: number;
  name: string;
  country: string;
  gender: string;
  pb: string;
  headshotUrl?: string;
  marathonRank?: number;
  age?: number;
  sponsor?: string;
  seasonBest?: string;
}

type SortOption = 'rank' | 'pb' | 'name' | 'age';
type GenderFilter = 'all' | 'men' | 'women';

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('rank');
  
  // Modal state
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch athletes
  useEffect(() => {
    async function fetchAthletes() {
      try {
        setLoading(true);
        const response = await fetch('/api/athletes');
        
        if (!response.ok) {
          throw new Error('Failed to fetch athletes');
        }
        
        const data = await response.json();
        
        // Combine men and women into single array
        const allAthletes = [
          ...(data.men || []),
          ...(data.women || []),
        ];
        
        setAthletes(allAthletes);
        setError(null);
      } catch (err) {
        console.error('Error fetching athletes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load athletes');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAthletes();
  }, []);

  // Filter and sort athletes
  const filteredAthletes = useMemo(() => {
    let filtered = [...athletes];
    
    // Apply gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter(a => a.gender === genderFilter);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.country.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return (a.marathonRank || 999) - (b.marathonRank || 999);
        case 'pb':
          return a.pb.localeCompare(b.pb);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'age':
          return (a.age || 99) - (b.age || 99);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [athletes, genderFilter, searchQuery, sortBy]);

  const handleAthleteClick = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAthlete(null);
  };

  return (
    <>
      <Head>
        <title>Athletes Browser - Marathon Majors Fantasy League</title>
        <meta name="description" content="Browse elite marathon runners and view detailed athlete profiles" />
      </Head>

      <Container maxW="container.xl" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }}>
        {/* Header */}
        <VStack align="stretch" gap={6} mb={8}>
          <Heading as="h1" size={{ base: 'xl', md: '2xl' }} color="navy.900">
            Elite Athletes
          </Heading>
          
          <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.600">
            Browse the world's top marathon runners. Click any athlete to view detailed stats.
          </Text>
        </VStack>

        {/* Filters and Search */}
        <Box
          bg="white"
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.200"
          p={{ base: 4, md: 6 }}
          mb={6}
          shadow="sm"
        >
          <VStack align="stretch" gap={4}>
            {/* Search Input */}
            <Box position="relative">
              <MagnifyingGlassIcon
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: 'var(--chakra-colors-gray-400)',
                  pointerEvents: 'none',
                }}
              />
              <Input
                placeholder="Search by name or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                pl="44px"
                size="lg"
                borderColor="gray.300"
                _hover={{ borderColor: 'navy.400' }}
                _focus={{ borderColor: 'navy.500', boxShadow: '0 0 0 1px var(--chakra-colors-navy-500)' }}
              />
            </Box>

            {/* Filter Controls */}
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              gap={3}
              align={{ sm: 'center' }}
            >
              <HStack flex={1} gap={2}>
                <FunnelIcon style={{ width: '20px', height: '20px', color: 'var(--chakra-colors-gray-500)' }} />
                <Text fontSize="sm" fontWeight="medium" color="gray.700" whiteSpace="nowrap">
                  Filters:
                </Text>
              </HStack>
              
              <Flex gap={3} flex={2} direction={{ base: 'column', sm: 'row' }}>
                {/* Gender Filter */}
                <Box flex={1}>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value as GenderFilter)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #E4E4E7',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                    }}
                  >
                    <option value="all">All Athletes</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                  </select>
                </Box>

                {/* Sort Dropdown */}
                <Box flex={1}>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #E4E4E7',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                    }}
                  >
                    <option value="rank">Sort by Rank</option>
                    <option value="pb">Sort by PB</option>
                    <option value="name">Sort by Name</option>
                    <option value="age">Sort by Age</option>
                  </select>
                </Box>
              </Flex>
            </Flex>
          </VStack>
        </Box>

        {/* Results Count */}
        {!loading && (
          <Text fontSize="sm" color="gray.600" mb={4}>
            Showing {filteredAthletes.length} of {athletes.length} athletes
          </Text>
        )}

        {/* Loading State */}
        {loading && (
          <Flex justify="center" align="center" py={20}>
            <VStack gap={4}>
              <Spinner size="xl" color="navy.500" />
              <Text color="gray.600">Loading athletes...</Text>
            </VStack>
          </Flex>
        )}

        {/* Error State */}
        {error && (
          <Box
            bg="red.50"
            border="1px solid"
            borderColor="red.200"
            borderRadius="lg"
            p={6}
            textAlign="center"
          >
            <Text color="red.700" fontWeight="medium" mb={2}>
              Failed to load athletes
            </Text>
            <Text color="red.600" fontSize="sm">
              {error}
            </Text>
          </Box>
        )}

        {/* Athletes Grid */}
        {!loading && !error && filteredAthletes.length === 0 && (
          <Box
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            p={8}
            textAlign="center"
          >
            <Text color="gray.600" fontSize="lg" mb={2}>
              No athletes found
            </Text>
            <Text color="gray.500" fontSize="sm">
              Try adjusting your search or filters
            </Text>
          </Box>
        )}

        {!loading && !error && filteredAthletes.length > 0 && (
          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 3 }}
            gap={{ base: 4, md: 6 }}
          >
            {filteredAthletes.map((athlete) => (
              <Box
                key={athlete.id}
                bg="white"
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.200"
                overflow="hidden"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                  borderColor: 'navy.300',
                  shadow: 'md',
                  transform: 'translateY(-2px)',
                }}
                onClick={() => handleAthleteClick(athlete)}
              >
                {/* Athlete Photo */}
                <Box
                  bg="gray.100"
                  h="200px"
                  position="relative"
                  overflow="hidden"
                >
                  {athlete.headshotUrl ? (
                    <Image
                      src={athlete.headshotUrl}
                      alt={athlete.name}
                      objectFit="cover"
                      w="100%"
                      h="100%"
                    />
                  ) : (
                    <Flex
                      align="center"
                      justify="center"
                      h="100%"
                      bg="navy.50"
                    >
                      <Text color="navy.400" fontSize="4xl" fontWeight="bold">
                        {athlete.name.charAt(0)}
                      </Text>
                    </Flex>
                  )}
                  
                  {/* Ranking Badge */}
                  {athlete.marathonRank && athlete.marathonRank <= 10 && (
                    <Badge
                      position="absolute"
                      top={3}
                      right={3}
                      bg="gold.500"
                      color="navy.900"
                      fontSize="sm"
                      fontWeight="bold"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      #{athlete.marathonRank}
                    </Badge>
                  )}
                </Box>

                {/* Athlete Info */}
                <VStack align="stretch" p={4} gap={2}>
                  <Heading as="h3" size="md" color="navy.900" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {athlete.name}
                  </Heading>
                  
                  <HStack gap={2} flexWrap="wrap">
                    <Badge colorScheme="navy" fontSize="xs">
                      {athlete.country}
                    </Badge>
                    {athlete.marathonRank && (
                      <Badge variant="outline" colorScheme="gray" fontSize="xs">
                        Rank #{athlete.marathonRank}
                      </Badge>
                    )}
                  </HStack>

                  <VStack align="stretch" gap={1} mt={2}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Personal Best
                      </Text>
                      <Text fontSize="sm" fontWeight="semibold" color="navy.700">
                        {athlete.pb}
                      </Text>
                    </HStack>
                    
                    {athlete.age && (
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Age
                        </Text>
                        <Text fontSize="sm" color="gray.700">
                          {athlete.age}
                        </Text>
                      </HStack>
                    )}
                    
                    {athlete.sponsor && (
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Sponsor
                        </Text>
                        <Text fontSize="sm" color="gray.700" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                          {athlete.sponsor}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Container>

      {/* Athlete Detail Modal */}
      {selectedAthlete && (
        <AthleteModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          athlete={selectedAthlete}
        />
      )}
    </>
  );
}
