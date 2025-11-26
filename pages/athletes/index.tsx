/**
 * New Athletes Browser Page
 * 
 * A completely redesigned athlete browsing experience following MMFL design guidelines.
 * Mobile-first, visually engaging, with Navy/Gold branding.
 * 
 * Features:
 * - Dark navy themed header with MMFL branding
 * - Gender tabs (ALL/MALE/FEMALE)
 * - Search bar with instant filtering
 * - Country filter dropdown
 * - Multiple sort options (Fantasy Score, PB, Rank, Salary, Age)
 * - Visually rich athlete cards with circular photos
 * - Fantasy score badges
 * - Mobile-first responsive design
 * - WCAG 2.1 AA compliant
 * 
 * Inspired by:
 * - MMFL mockup design
 * - Fantasy sports player selection UIs
 * 
 * Part of Phase 5: Feature Pages Implementation
 * Issue: #59 - Redesign UI with Modern Mobile-First Look
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  Input,
  Flex,
  Text,
  VStack,
  HStack,
  Spinner,
} from '@chakra-ui/react';
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import AthleteModal from '@/components/AthleteModal';
import { Button, Badge, AthleteBrowseCard, AthleteBrowseCardSkeleton, Checkbox } from '@/components/chakra';
import Head from 'next/head';

// ===========================
// Types
// ===========================

interface Athlete {
  id: number;
  name: string;
  country: string;
  gender: string;
  pb: string;
  salary: number;
  headshotUrl?: string;
  marathonRank?: number;
  age?: number;
  sponsor?: string;
  seasonBest?: string;
  worldAthleticsProfileUrl?: string;
  nycConfirmed?: boolean; // Deprecated - use raceConfirmed
  raceConfirmed?: boolean; // New field - confirmed for active race
}

type SortOption = 'fantasyScore' | 'pb' | 'rank' | 'salary' | 'age' | 'name';
type GenderFilter = 'all' | 'men' | 'women';

// ===========================
// Constants
// ===========================

/** Default salary for athletes without a salary set */
const DEFAULT_SALARY = 5000;

/** Initial number of athletes to display */
const INITIAL_LOAD_COUNT = 40;

/** Number of athletes to load on each scroll */
const LOAD_MORE_COUNT = 30;

// ===========================
// Helper Functions
// ===========================

/**
 * Calculate a fantasy score for display purposes.
 * Based on ranking, PB performance, and salary.
 */
function calculateFantasyScore(athlete: Athlete): number {
  // Base score from rank (higher rank = better score)
  let score = 0;
  
  if (athlete.marathonRank) {
    // Top ranked gets ~60 points from ranking, lower ranked gets less
    score += Math.max(0, 60 - (athlete.marathonRank - 1) * 0.5);
  } else {
    score += 20; // Unranked athletes get base score
  }
  
  // Add points from salary (higher salary = more fantasy value typically)
  if (athlete.salary) {
    score += (athlete.salary / 1000); // $10,000 = 10 points
  }
  
  // Age factor (prime marathon age is ~28-35)
  if (athlete.age) {
    if (athlete.age >= 28 && athlete.age <= 35) {
      score += 10;
    } else if (athlete.age >= 25 && athlete.age <= 38) {
      score += 5;
    }
  }
  
  return Math.round(Math.min(99, Math.max(1, score)));
}

/**
 * Convert time string to seconds for comparison
 */
function timeToSeconds(timeStr: string): number {
  if (!timeStr) return Infinity;
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return Infinity;
}

/**
 * Get country flag emoji from country code (used in filter dropdown)
 */
function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    // Americas
    'USA': '🇺🇸', 'CAN': '🇨🇦', 'MEX': '🇲🇽', 'BRA': '🇧🇷',
    'ARG': '🇦🇷', 'CHI': '🇨🇱', 'COL': '🇨🇴', 'PER': '🇵🇪',
    'ECU': '🇪🇨', 'VEN': '🇻🇪', 'BOL': '🇧🇴', 'URU': '🇺🇾',
    // Europe
    'GBR': '🇬🇧', 'GER': '🇩🇪', 'FRA': '🇫🇷', 'ITA': '🇮🇹',
    'ESP': '🇪🇸', 'NED': '🇳🇱', 'BEL': '🇧🇪', 'SUI': '🇨🇭',
    'NOR': '🇳🇴', 'SWE': '🇸🇪', 'DEN': '🇩🇰', 'FIN': '🇫🇮',
    'IRL': '🇮🇪', 'POR': '🇵🇹', 'POL': '🇵🇱', 'CZE': '🇨🇿',
    'HUN': '🇭🇺', 'AUT': '🇦🇹', 'ROU': '🇷🇴', 'BLR': '🇧🇾',
    'UKR': '🇺🇦', 'RUS': '🇷🇺', 'GRE': '🇬🇷', 'TUR': '🇹🇷',
    // Africa
    'KEN': '🇰🇪', 'ETH': '🇪🇹', 'UGA': '🇺🇬', 'ERI': '🇪🇷',
    'TAN': '🇹🇿', 'RWA': '🇷🇼', 'BDI': '🇧🇮', 'RSA': '🇿🇦',
    'MAR': '🇲🇦', 'ALG': '🇩🇿', 'TUN': '🇹🇳', 'EGY': '🇪🇬',
    'DJI': '🇩🇯', 'LES': '🇱🇸', 'NAM': '🇳🇦', 'ZIM': '🇿🇼',
    // Asia
    'JPN': '🇯🇵', 'CHN': '🇨🇳', 'KOR': '🇰🇷', 'IND': '🇮🇳',
    'BRN': '🇧🇭', 'ISR': '🇮🇱', 'KAZ': '🇰🇿', 'UZB': '🇺🇿',
    'KGZ': '🇰🇬', 'THA': '🇹🇭', 'VIE': '🇻🇳', 'SIN': '🇸🇬',
    'MGL': '🇲🇳', 'PRK': '🇰🇵',
    // Oceania
    'AUS': '🇦🇺', 'NZL': '🇳🇿', 'PNG': '🇵🇬', 'FIJ': '🇫🇯',
  };
  return flags[countryCode] || '🏃';
}

// ===========================
// Main Page Component
// ===========================

export default function AthletesBrowsePage() {
  // Data state
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('fantasyScore');
  const [showConfirmedOnly, setShowConfirmedOnly] = useState(false);
  
  // Pagination state
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD_COUNT);
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  // Modal state
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Demo data for when API is unavailable (development/preview)
  const demoAthletes: Athlete[] = [
    { id: 1, name: 'Eliud Kipchoge', country: 'KEN', gender: 'men', pb: '2:01:09', salary: 12500, marathonRank: 1, age: 39, headshotUrl: 'https://media.aws.iaaf.org/athletes/137210.jpg' },
    { id: 2, name: 'Kelvin Kiptum', country: 'KEN', gender: 'men', pb: '2:00:35', salary: 15000, marathonRank: 2, age: 24 },
    { id: 3, name: 'Kenenisa Bekele', country: 'ETH', gender: 'men', pb: '2:01:41', salary: 11000, marathonRank: 3, age: 42 },
    { id: 4, name: 'Geoffrey Kamworor', country: 'KEN', gender: 'men', pb: '2:04:46', salary: 9500, marathonRank: 8, age: 31 },
    { id: 5, name: 'Birhanu Legese', country: 'ETH', gender: 'men', pb: '2:02:48', salary: 10000, marathonRank: 5, age: 30 },
    { id: 6, name: 'Evans Chebet', country: 'KEN', gender: 'men', pb: '2:04:30', salary: 9000, marathonRank: 6, age: 35 },
    { id: 7, name: 'Sisay Lemma', country: 'ETH', gender: 'men', pb: '2:03:36', salary: 8500, marathonRank: 7, age: 33 },
    { id: 8, name: 'Tamirat Tola', country: 'ETH', gender: 'men', pb: '2:03:39', salary: 8000, marathonRank: 4, age: 32 },
    { id: 9, name: 'Conner Mantz', country: 'USA', gender: 'men', pb: '2:07:47', salary: 6500, marathonRank: 25, age: 27 },
    { id: 10, name: 'Galen Rupp', country: 'USA', gender: 'men', pb: '2:06:07', salary: 7000, marathonRank: 15, age: 38 },
    { id: 11, name: 'Tigst Assefa', country: 'ETH', gender: 'women', pb: '2:11:53', salary: 14000, marathonRank: 1, age: 30 },
    { id: 12, name: 'Sifan Hassan', country: 'NED', gender: 'women', pb: '2:13:44', salary: 12000, marathonRank: 2, age: 31 },
    { id: 13, name: 'Peres Jepchirchir', country: 'KEN', gender: 'women', pb: '2:16:16', salary: 11000, marathonRank: 3, age: 30 },
    { id: 14, name: 'Brigid Kosgei', country: 'KEN', gender: 'women', pb: '2:14:04', salary: 10500, marathonRank: 4, age: 30 },
    { id: 15, name: 'Ruth Chepngetich', country: 'KEN', gender: 'women', pb: '2:14:18', salary: 10000, marathonRank: 5, age: 30 },
    { id: 16, name: 'Molly Seidel', country: 'USA', gender: 'women', pb: '2:24:42', salary: 7500, marathonRank: 20, age: 30 },
    { id: 17, name: 'Emily Sisson', country: 'USA', gender: 'women', pb: '2:18:29', salary: 8500, marathonRank: 10, age: 32 },
    { id: 18, name: 'Hellen Obiri', country: 'KEN', gender: 'women', pb: '2:21:38', salary: 9000, marathonRank: 8, age: 34 },
  ];

  // Fetch athletes on mount
  useEffect(() => {
    async function fetchAthletes() {
      try {
        setLoading(true);
        const response = await fetch('/api/athletes');
        
        if (!response.ok) {
          // Use demo data if API fails (development/preview environments)
          console.log('API unavailable, using demo data');
          setAthletes(demoAthletes);
          setError(null);
          return;
        }
        
        const data = await response.json();
        
        // Combine men and women into single array with salary defaults
        const allAthletes: Athlete[] = [
          ...(data.men || []).map((a: any) => ({ ...a, salary: a.salary || DEFAULT_SALARY })),
          ...(data.women || []).map((a: any) => ({ ...a, salary: a.salary || DEFAULT_SALARY })),
        ];
        
        // If no athletes returned, use demo data
        if (allAthletes.length === 0) {
          setAthletes(demoAthletes);
        } else {
          setAthletes(allAthletes);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching athletes, using demo data:', err);
        // Use demo data as fallback
        setAthletes(demoAthletes);
        setError(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAthletes();
  }, []);

  // Get unique countries for dropdown
  const countries = useMemo(() => {
    const uniqueCountries = new Set(athletes.map(a => a.country));
    return Array.from(uniqueCountries).sort();
  }, [athletes]);

  // Filter and sort athletes
  const filteredAthletes = useMemo(() => {
    let filtered = [...athletes];
    
    // Apply gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter(a => a.gender === genderFilter);
    }
    
    // Apply country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter(a => a.country === countryFilter);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.country.toLowerCase().includes(query)
      );
    }
    
    // Apply confirmation filter (supports both old and new field names)
    if (showConfirmedOnly) {
      filtered = filtered.filter(a => a.raceConfirmed === true || a.nycConfirmed === true);
    }
    
    // Calculate fantasy scores for sorting
    const withScores = filtered.map(a => ({
      athlete: a,
      score: calculateFantasyScore(a),
    }));
    
    // Apply sorting
    withScores.sort((a, b) => {
      switch (sortBy) {
        case 'fantasyScore':
          return b.score - a.score;
        case 'rank':
          return (a.athlete.marathonRank || 999) - (b.athlete.marathonRank || 999);
        case 'pb':
          return timeToSeconds(a.athlete.pb) - timeToSeconds(b.athlete.pb);
        case 'salary':
          return (b.athlete.salary || 0) - (a.athlete.salary || 0);
        case 'age':
          return (a.athlete.age || 99) - (b.athlete.age || 99);
        case 'name':
          return a.athlete.name.localeCompare(b.athlete.name);
        default:
          return 0;
      }
    });
    
    return withScores;
  }, [athletes, genderFilter, countryFilter, searchQuery, sortBy, showConfirmedOnly]);

  // Visible athletes for pagination (slice based on visibleCount)
  const visibleAthletes = useMemo(() => {
    return filteredAthletes.slice(0, visibleCount);
  }, [filteredAthletes, visibleCount]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD_COUNT);
  }, [searchQuery, genderFilter, countryFilter, showConfirmedOnly, sortBy]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && visibleCount < filteredAthletes.length) {
          setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, filteredAthletes.length));
        }
      },
      { rootMargin: '100px' } // Start loading slightly before sentinel is visible
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [visibleCount, filteredAthletes.length]);

  // Handlers
  const handleAthleteClick = useCallback((athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedAthlete(null), 200);
  }, []);

  return (
    <>
      <Head>
        <title>Athletes - Marathon Majors Fantasy League</title>
        <meta name="description" content="Browse elite marathon athletes. Filter by country, sort by fantasy score, PB, or ranking." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>

      <Box minH="100vh" bg="white">
        {/* Header Section - Compact filter controls */}
        <Box 
          bg="white" 
          borderBottom="1px solid" 
          borderColor="gray.200"
          position="sticky"
          top={{ base: '60px', md: '72px' }}
          zIndex={100}
          py={{ base: 2, md: 3 }}
        >
          <Container maxW="container.xl" px={{ base: 4, md: 6 }}>
            {/* Responsive controls - reordered per user request */}
            <Flex 
              gap={2}
              flexWrap="wrap"
              align="center"
            >
              {/* Gender Tabs - Always first */}
              <HStack gap={0} flexShrink={0}>
                {(['all', 'men', 'women'] as GenderFilter[]).map((gender) => (
                  <Button
                    key={gender}
                    onClick={() => setGenderFilter(gender)}
                    variant={genderFilter === gender ? 'solid' : 'ghost'}
                    colorPalette={genderFilter === gender ? 'gold' : 'navy'}
                    size="sm"
                    borderRadius="full"
                    px={{ base: 3, md: 4 }}
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    fontSize="xs"
                    _hover={{
                      bg: genderFilter === gender ? 'gold.600' : 'gray.100',
                    }}
                  >
                    {gender === 'all' ? 'ALL' : gender === 'men' ? 'MALE' : 'FEMALE'}
                  </Button>
                ))}
              </HStack>

              {/* Search Bar - On first row, fills available space */}
              <Box position="relative" flex={{ base: '1 1 auto', md: '1 1 auto' }} minW="200px">
                <MagnifyingGlassIcon
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '18px',
                    height: '18px',
                    color: '#6B7280',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                />
                <Input
                  placeholder="Search athletes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  pl="40px"
                  pr={searchQuery ? "40px" : "12px"}
                  size="sm"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  color="gray.900"
                  borderRadius="lg"
                  _placeholder={{ color: 'gray.400' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{ 
                    borderColor: 'navy.500', 
                    boxShadow: '0 0 0 1px var(--chakra-colors-navy-500)',
                    outline: 'none',
                    bg: 'white',
                  }}
                  aria-label="Search athletes by name or country"
                />
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery('')}
                    position="absolute"
                    right="4px"
                    top="50%"
                    transform="translateY(-50%)"
                    variant="ghost"
                    size="xs"
                    minW="auto"
                    h="24px"
                    px={2}
                    color="gray.500"
                    _hover={{ color: 'gray.700', bg: 'gray.100' }}
                    aria-label="Clear search"
                  >
                    ✕
                  </Button>
                )}
              </Box>

              {/* Confirmation Toggle - On first row, wraps to second on mobile */}
              <Checkbox
                checked={showConfirmedOnly}
                onChange={(e) => setShowConfirmedOnly(e.target.checked)}
                size="sm"
                colorPalette="navy"
              >
                Confirmed Only
              </Checkbox>

              {/* Country Filter - Wraps to second row on mobile */}
              <Box flex={{ base: '0 1 auto', md: '0 1 150px' }} minW={{ base: '100px', md: '120px' }}>
                <Box position="relative">
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    aria-label="Filter by country"
                    style={{
                      width: '100%',
                      padding: '8px 32px 8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#F9FAFB',
                      color: '#374151',
                      fontSize: '14px',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                    }}
                  >
                    <option value="all">Country</option>
                    {countries.map(country => (
                      <option key={country} value={country}>
                        {getCountryFlag(country)} {country}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '16px',
                      height: '16px',
                      color: '#6B7280',
                      pointerEvents: 'none',
                    }}
                  />
                </Box>
              </Box>

              {/* Sort By Filter - Wraps to second row on mobile */}
              <Box flex={{ base: '0 1 auto', md: '0 1 150px' }} minW={{ base: '100px', md: '120px' }}>
                <Box position="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    aria-label="Sort athletes"
                    style={{
                      width: '100%',
                      padding: '8px 32px 8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#F9FAFB',
                      color: '#374151',
                      fontSize: '14px',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                    }}
                  >
                    <option value="rank">Sort By</option>
                    <option value="rank">World Rank</option>
                    <option value="pb">Personal Best</option>
                    <option value="salary">Salary</option>
                    <option value="age">Age</option>
                    <option value="name">Name</option>
                  </select>
                  <ChevronDownIcon
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '16px',
                      height: '16px',
                      color: '#6B7280',
                      pointerEvents: 'none',
                    }}
                  />
                </Box>
              </Box>
            </Flex>
          </Container>
        </Box>

        {/* Main Content */}
        <Container maxW="container.xl" px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
          {/* Results Count */}
          {!loading && (
            <Text fontSize="sm" color="gray.600" mb={4}>
              Showing {visibleAthletes.length} of {filteredAthletes.length} athlete{filteredAthletes.length !== 1 ? 's' : ''}
            </Text>
          )}

          {/* Loading State */}
          {loading && (
            <VStack gap={4} align="stretch">
              {[1, 2, 3, 4, 5].map((i) => (
                <AthleteBrowseCardSkeleton key={i} />
              ))}
            </VStack>
          )}

          {/* Error State */}
          {error && (
            <Box
              bg="red.50"
              border="1px solid"
              borderColor="red.200"
              borderRadius="xl"
              p={6}
              textAlign="center"
            >
              <Text color="red.700" fontWeight="medium" mb={2}>
                Failed to load athletes
              </Text>
              <Text color="red.600" fontSize="sm">
                {error}
              </Text>
              <Button
                onClick={() => window.location.reload()}
                colorPalette="error"
                variant="outline"
                size="sm"
                mt={4}
              >
                Try Again
              </Button>
            </Box>
          )}

          {/* Empty State */}
          {!loading && !error && filteredAthletes.length === 0 && (
            <Box
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="xl"
              p={8}
              textAlign="center"
            >
              <Text color="gray.700" fontSize="lg" mb={2}>
                No athletes found
              </Text>
              <Text color="gray.500" fontSize="sm">
                Try adjusting your search or filters
              </Text>
            </Box>
          )}

          {/* Athletes List */}
          {!loading && !error && filteredAthletes.length > 0 && (
            <>
              <VStack gap={4} align="stretch">
                {visibleAthletes.map(({ athlete, score }) => (
                  <AthleteBrowseCard
                    key={athlete.id}
                    athlete={athlete}
                    fantasyScore={score}
                    onClick={() => handleAthleteClick(athlete)}
                  />
                ))}
              </VStack>
              
              {/* Sentinel element for intersection observer */}
              <div ref={sentinelRef} style={{ height: '20px', marginTop: '20px' }} />
              
              {/* Loading more indicator */}
              {visibleCount < filteredAthletes.length && (
                <Flex justify="center" py={6}>
                  <Spinner size="lg" color="navy.500" />
                </Flex>
              )}
              
              {/* All loaded message */}
              {visibleCount >= filteredAthletes.length && filteredAthletes.length > INITIAL_LOAD_COUNT && (
                <Text 
                  textAlign="center" 
                  py={6} 
                  color="gray.500" 
                  fontSize="sm"
                >
                  All athletes loaded
                </Text>
              )}
            </>
          )}
        </Container>
      </Box>

      {/* Athlete Detail Modal */}
      {selectedAthlete && (
        <AthleteModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          athlete={selectedAthlete}
        />
      )}

      {/* Custom styles for select options */}
      <style jsx global>{`
        select option {
          background-color: white;
          color: #374151;
          padding: 8px;
        }
      `}</style>
    </>
  );
}
