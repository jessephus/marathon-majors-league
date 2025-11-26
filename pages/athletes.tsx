import { useEffect, useRef, useState } from 'react';
import { Box, Container, Heading, SimpleGrid, Text, Badge, Spinner } from '@chakra-ui/react';
import apiClient from '@/lib/api-client';

type Athlete = {
  id: number;
  name: string;
  country?: string;
  gender?: string;
  personal_best?: string;
  headshot_url?: string;
  marathon_rank?: number;
  overall_rank?: number;
  world_athletics_id?: string;
};

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(40);
  const [loading, setLoading] = useState<boolean>(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiClient.athletes.list();
        const men = Array.isArray((data as any).men) ? (data as any).men : [];
        const women = Array.isArray((data as any).women) ? (data as any).women : [];
        const combined: Athlete[] = [
          ...men.map((a: any) => ({ ...a, gender: 'men' })),
          ...women.map((a: any) => ({ ...a, gender: 'women' })),
        ];
        if (mounted) {
          setAthletes(combined);
        }
      } catch (err) {
        console.error('Failed to load athletes:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;

    // Cleanup existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setVisibleCount((prev) => {
            // Load 30 more at a time, cap at total length
            const next = prev + 30;
            return next > athletes.length ? athletes.length : next;
          });
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 1.0,
      }
    );
    observer.observe(sentinelRef.current);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [athletes.length]);

  const visibleAthletes = athletes.slice(0, visibleCount);

  return (
    <Container maxW="container.xl" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }}>
      <Heading as="h1" size="lg" mb={6} color="navy.900">
        Athletes
      </Heading>

      {loading && (
        <Box display="flex" alignItems="center" justifyContent="center" py={10}>
          <Spinner size="lg" />
        </Box>
      )}

      {!loading && (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
          {visibleAthletes.map((a) => (
            <Box
              key={`${a.id}-${a.gender || ''}`}
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              p={4}
              shadow="sm"
              _hover={{ shadow: 'md', borderColor: 'navy.300', transform: 'translateY(-2px)', transition: 'all 0.15s ease-out' }}
            >
              <Text fontWeight="semibold" color="navy.800">{a.name}</Text>
              <Box mt={2} display="flex" alignItems="center" gap={2}>
                {a.country && (
                  <Badge variant="subtle" colorScheme="navy">{a.country}</Badge>
                )}
                {typeof a.marathon_rank === 'number' && (
                  <Badge bg="gold.500" color="navy.900">Rank #{a.marathon_rank}</Badge>
                )}
                {a.personal_best && (
                  <Badge variant="outline" colorScheme="navy">PB {a.personal_best}</Badge>
                )}
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* Sentinel for infinite scroll */}
      <Box ref={sentinelRef} mt={8} height="24px" />

      {/* Footer note when all loaded */}
      {!loading && visibleCount >= athletes.length && (
        <Text mt={4} color="gray.500" textAlign="center">All athletes loaded</Text>
      )}
    </Container>
  );
}
