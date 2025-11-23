/**
 * CompactAthleteList Component
 * 
 * Compact display of confirmed athletes with headshots and names.
 * Links to athlete page for more details.
 * Used in race pages to show confirmed participants.
 * 
 * Features:
 * - Compact layout with headshots
 * - Name below each headshot
 * - Links to athlete detail page
 * - "View All" button to see full list
 * - Mobile-first responsive grid
 */

import { Box, Flex, Grid, Heading, Text, VStack, Image, Link as ChakraLink } from '@chakra-ui/react';
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
}

export interface CompactAthleteListProps {
  athletes: CompactAthlete[];
  maxDisplay?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  title?: string;
}

// ===========================
// CompactAthleteList Component
// ===========================

export function CompactAthleteList({
  athletes,
  maxDisplay = 10,
  showViewAll = true,
  onViewAll,
  title = 'Confirmed Athletes',
}: CompactAthleteListProps) {
  
  const displayAthletes = athletes.slice(0, maxDisplay);
  const hasMore = athletes.length > maxDisplay;

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
        {showViewAll && hasMore && (
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

      <Grid
        templateColumns={{
          base: 'repeat(3, 1fr)',
          sm: 'repeat(4, 1fr)',
          md: 'repeat(5, 1fr)',
          lg: 'repeat(6, 1fr)',
          xl: 'repeat(8, 1fr)',
        }}
        gap={{ base: 4, md: 6 }}
      >
        {displayAthletes.map((athlete) => (
          <Link
            key={athlete.id}
            href={`/athlete?id=${athlete.id}`}
            passHref
            legacyBehavior
          >
            <ChakraLink
              display="block"
              textDecoration="none"
              _hover={{ textDecoration: 'none' }}
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
            </ChakraLink>
          </Link>
        ))}
      </Grid>
    </Box>
  );
}
