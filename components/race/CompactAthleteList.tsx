/**
 * CompactAthleteList Component
 * 
 * Compact display of confirmed athletes with headshots and names.
 * Links to athlete page for more details.
 * Used in race pages to show confirmed participants.
 * 
 * Features:
 * - Horizontally scrollable rows (one for men, one for women)
 * - Compact layout with headshots
 * - Name below each headshot
 * - Links to athlete detail page
 * - Maximum 2 rows for confirmed athletes section
 * - Mobile-first responsive design
 */

import { Box, Flex, Heading, Text, VStack, Image, Link as ChakraLink } from '@chakra-ui/react';
import Link from 'next/link';
import { Button } from '@/components/chakra';

// ===========================
// Types
// ===========================

export interface CompactAthlete {
  id: number;
  name: string;
  headshotUrl?: string;
  country?: string;
  gender?: string;
}

export interface CompactAthleteListProps {
  athletes: CompactAthlete[];
  showViewAll?: boolean;
  onViewAll?: () => void;
  onAthleteClick?: (athleteId: number) => void;
  title?: string;
}

// ===========================
// CompactAthleteList Component
// ===========================

export function CompactAthleteList({
  athletes,
  showViewAll = true,
  onViewAll,
  onAthleteClick,
  title = 'Confirmed Athletes',
}: CompactAthleteListProps) {
  
  // Separate athletes by gender
  const menAthletes = athletes.filter(a => 
    a.gender === 'M' || a.gender === 'men' || a.gender === 'Men'
  );
  const womenAthletes = athletes.filter(a => 
    a.gender === 'F' || a.gender === 'women' || a.gender === 'Women'
  );

  if (athletes.length === 0) {
    return (
      <Box>
        <Heading as="h3" size="lg" mb={4} color="navy.800">
          {title}
        </Heading>
        <Text color="gray.500">No athletes confirmed yet.</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h3" size="lg" color="navy.800">
          {title} ({athletes.length})
        </Heading>
        {showViewAll && (
          <Button
            colorPalette="navy"
            variant="ghost"
            size="sm"
            onClick={onViewAll}
          >
            View All
          </Button>
        )}
      </Flex>

      <VStack gap={6} align="stretch">
        {/* Men's Row */}
        {menAthletes.length > 0 && (
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="navy.700"
              mb={3}
              textTransform="uppercase"
              letterSpacing="wide"
            >
              Men ({menAthletes.length})
            </Text>
            <Box
              overflowX="auto"
              overflowY="hidden"
              css={{
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#cbd5e0',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#a0aec0',
                },
              }}
            >
              <Flex gap={{ base: 4, md: 6 }} pb={2}>
                {menAthletes.map((athlete) => (
                  <AthleteCard key={athlete.id} athlete={athlete} onAthleteClick={onAthleteClick} />
                ))}
              </Flex>
            </Box>
          </Box>
        )}

        {/* Women's Row */}
        {womenAthletes.length > 0 && (
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="navy.700"
              mb={3}
              textTransform="uppercase"
              letterSpacing="wide"
            >
              Women ({womenAthletes.length})
            </Text>
            <Box
              overflowX="auto"
              overflowY="hidden"
              css={{
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#cbd5e0',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#a0aec0',
                },
              }}
            >
              <Flex gap={{ base: 4, md: 6 }} pb={2}>
                {womenAthletes.map((athlete) => (
                  <AthleteCard key={athlete.id} athlete={athlete} onAthleteClick={onAthleteClick} />
                ))}
              </Flex>
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

// ===========================
// AthleteCard Subcomponent
// ===========================

interface AthleteCardProps {
  athlete: CompactAthlete;
  onAthleteClick?: (athleteId: number) => void;
}

function AthleteCard({ athlete, onAthleteClick }: AthleteCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onAthleteClick) {
      e.preventDefault();
      onAthleteClick(athlete.id);
    }
  };

  const content = (
    <Box
      as={onAthleteClick ? 'button' : undefined}
      onClick={onAthleteClick ? handleClick : undefined}
      display="block"
      textDecoration="none"
      _hover={{ textDecoration: 'none' }}
      flexShrink={0}
      cursor="pointer"
      bg="transparent"
      border="none"
      p={0}
      width="auto"
    >
        <VStack
          gap={2}
          align="center"
          transition="all 0.2s"
          _hover={{
            transform: 'translateY(-4px)',
          }}
        >
          <Box
            position="relative"
            boxSize={{ base: '60px', md: '80px' }}
            borderRadius="full"
            overflow="hidden"
            border="2px solid"
            borderColor="gray.200"
            bg="gray.100"
            transition="all 0.2s"
            _hover={{
              borderColor: 'navy.400',
              shadow: 'md',
            }}
          >
            {athlete.headshotUrl ? (
              <Image
                src={athlete.headshotUrl}
                alt={athlete.name}
                objectFit="cover"
                width="100%"
                height="100%"
              />
            ) : (
              <Flex
                align="center"
                justify="center"
                height="100%"
                fontSize={{ base: 'xl', md: '2xl' }}
                fontWeight="bold"
                color="navy.600"
                bg="navy.50"
              >
                {athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </Flex>
            )}
          </Box>
          <Text
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight="medium"
            color="gray.700"
            textAlign="center"
            lineHeight="tight"
            maxW="100px"
            lineClamp={2}
          >
            {athlete.name}
          </Text>
        </VStack>
    </Box>
  );

  if (onAthleteClick) {
    return content;
  }

  return (
    <Link
      href={`/athlete?id=${athlete.id}`}
      passHref
      legacyBehavior
    >
      <ChakraLink
        display="block"
        textDecoration="none"
        _hover={{ textDecoration: 'none' }}
        flexShrink={0}
      >
        {content}
      </ChakraLink>
    </Link>
  );
}
