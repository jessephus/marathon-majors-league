/**
 * LandingPage Component
 * 
 * Modern landing page for logged-out users following MMFL design guidelines.
 * Features navy (#161C4F) and gold (#D4AF37) brand palette.
 * 
 * Uses existing Chakra primitives (Box, Flex, Text, Heading, Image, Container)
 * and the migrated Button component from @/components/chakra.
 * 
 * Note: This component relies on the global NavigationWrapper for header/navigation.
 * It does not render its own header.
 * 
 * SSR Optimized:
 * - Race data should be passed via `nextRace` prop from getServerSideProps
 * - No client-side fetching to avoid hydration mismatch
 * - Uses `welcome-card` class for test compatibility
 * 
 * Sections:
 * 1. Hero - Title, description, Get Started CTA
 * 2. How It Works - 3 numbered steps with visual timeline
 * 3. Next Marathon - Countdown timer to next race (from SSR props)
 * 
 * Design Reference: docs/CORE_DESIGN_GUIDELINES.md
 * Phase 5 Implementation: Week 27-28 Home/Welcome Page
 * 
 * @version 1.2.0
 * @date November 2025
 */

import { useState, useEffect } from 'react';
import { Box, Flex, Text, Heading, Image, Container } from '@chakra-ui/react';
import { Button } from '@/components/chakra';

// ===========================
// Types
// ===========================

interface LandingPageProps {
  onGetStarted: () => void;
  nextRace?: {
    name: string;
    date: Date;
  };
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// ===========================
// Constants
// ===========================

// Design colors from CORE_DESIGN_GUIDELINES.md
const COLORS = {
  navy: '#161C4F',
  navyLight: '#E4E9F2',
  navyDark: '#0F1530',
  gold: '#D4AF37',
  goldHover: 'rgba(212, 175, 55, 0.1)',
  cream: '#FFF9E6',
  white: '#FFFFFF',
  grayText: '#4A5568',
  grayLight: '#E2E8F0',
} as const;

const HOW_IT_WORKS_STEPS = [
  {
    number: 1,
    title: 'Create Your Team',
    description: 'Draft a mix of runners before each Marathon Major.',
  },
  {
    number: 2,
    title: 'Watch Them Race',
    description: 'We turn their real race results into points.',
  },
  {
    number: 3,
    title: 'Climb the Leaderboard',
    description: 'Earn the most points to reach the top.',
  },
] as const;

// ===========================
// Helper Functions
// ===========================

function calculateCountdown(targetDate: Date): CountdownTime {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
}

function formatCountdownUnit(value: number): string {
  return value.toString().padStart(2, '0');
}

// ===========================
// Sub-Components
// ===========================

/**
 * Hero section with title and CTA
 */
function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <Box
      bg={COLORS.cream}
      px={{ base: 4, md: 8 }}
      pt={{ base: 6, md: 8 }}
      pb={{ base: 10, md: 16 }}
    >
      <Container maxW="container.lg">
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          align="center"
          justify="space-between"
          gap={{ base: 12, lg: 16 }}
        >
          {/* Text Content */}
          <Box flex="1" textAlign={{ base: 'center', lg: 'left' }}>
            {/* Title with underline accent */}
            <Heading
              as="h1"
              fontSize={{ base: '3xl', md: '4xl', lg: '4xl' }}
              fontWeight="extrabold"
              color={COLORS.navy}
              lineHeight="tight"
              mb={2}
            >
              Marathon Majors
              <br />
              Fantasy League
            </Heading>
            
            {/* Gold underline */}
            <Box
              w={{ base: '120px', md: '180px' }}
              h="4px"
              bg={COLORS.gold}
              mb={6}
              mx={{ base: 'auto', lg: 0 }}
            />

            {/* Description */}
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color={COLORS.grayText}
              mb={8}
              maxW="400px"
              mx={{ base: 'auto', lg: 0 }}
            >
              Bring the excitement of the Marathon Majors to life with your own roster of elite athletes to cheer on race day.
            </Text>

            {/* CTA Button */}
            <Button
              size="lg"
              onClick={onGetStarted}
              bg={COLORS.navy}
              color={COLORS.white}
              px={10}
              py={6}
              fontSize="lg"
              fontWeight="bold"
              borderRadius="lg"
              _hover={{
                bg: COLORS.navyLight,
                transform: 'translateY(-2px)',
                shadow: 'lg',
              }}
              _active={{
                bg: COLORS.navyDark,
                transform: 'translateY(0)',
              }}
            >
              Get Started
            </Button>
          </Box>

          {/* Hero Image placeholder - hidden on mobile, visible on large screens */}
          <Box
            display={{ base: 'none', lg: 'block' }}
            flex="1"
            maxW="400px"
          >
            <Box
              borderRadius="lg"
              h="280px"
              w="100%"
              overflow="hidden"
            >
              <Image
                src="/assets/foggy-morning-warmup.jpg"
                alt="Marathon Majors Fantasy League"
                w="100%"
                h="100%"
                objectFit="cover"
              />
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}

/**
 * Image section between Hero and How It Works (mobile only)
 */
function ImageBreakSection() {
  return (
    <Box
      w="100%"
      h={{ base: '200px', md: '280px', lg: '320px' }}
      overflow="hidden"
      display={{ base: 'block', lg: 'none' }}
    >
      <Image
        src="/assets/foggy-morning-warmup.jpg"
        alt="Marathon runners in foggy morning warmup"
        w="100%"
        h="100%"
        objectFit="cover"
        objectPosition="center"
      />
    </Box>
  );
}

/**
 * "How it works" section with numbered steps
 */
function HowItWorksSection() {
  return (
    <Box
      bg={COLORS.navyLight}
      px={{ base: 4, md: 8 }}
      py={{ base: 8, md: 12 }}
      borderTop="1px solid"
      borderColor={COLORS.grayLight}
    >
      <Container maxW="container.lg">
        <Heading
          as="h2"
          fontSize={{ base: 'xl', md: '2xl' }}
          fontWeight="bold"
          color={COLORS.navy}
          mb={8}
        >
          How Does This Work?
          <br></br>
        </Heading>

        {/* Steps Timeline */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'center', md: 'flex-start' }}
          justify="space-between"
          gap={{ base: 6, md: 4 }}
        >
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <Flex
              key={step.number}
              direction={{ base: 'row', md: 'column' }}
              align={{ base: 'flex-start', md: 'center' }}
              flex="1"
              position="relative"
            >
              {/* Step Number Circle */}
              <Flex
                w={{ base: '36px', md: '40px' }}
                h={{ base: '36px', md: '40px' }}
                borderRadius="full"
                bg={COLORS.cream}
                border="2px solid"
                borderColor={COLORS.gold}
                color={COLORS.navy}
                fontWeight="bold"
                fontSize={{ base: 'md', md: 'lg' }}
                align="center"
                justify="center"
                flexShrink={0}
                zIndex={1}
              >
                {step.number}
              </Flex>

              {/* Connecting Line (desktop only) */}
              {index < HOW_IT_WORKS_STEPS.length - 1 && (
                <Box
                  display={{ base: 'none', md: 'block' }}
                  position="absolute"
                  top="20px"
                  left="calc(50% + 24px)"
                  right="-50%"
                  h="2px"
                  bg={COLORS.gold}
                  opacity={0.5}
                />
              )}

              {/* Step Content */}
              <Box
                ml={{ base: 4, md: 0 }}
                mt={{ base: 0, md: 4 }}
                textAlign={{ base: 'center', md: 'center' }}
              >
                <Text
                  fontWeight="bold"
                  color={COLORS.navy}
                  fontSize={{ base: 'md', md: 'md' }}
                  mb={1}
                >
                  {step.title}
                </Text>
                <Text
                  fontSize="sm"
                  color={COLORS.grayText}
                  maxW="200px"
                  mx={{ base: 0, md: 'auto' }}
                >
                  {step.description}
                </Text>
              </Box>
            </Flex>
          ))}
        </Flex>
      </Container>
    </Box>
  );
}

/**
 * Next marathon countdown section
 */
function NextMarathonSection({ race }: { race?: { name: string; date: Date } }) {
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!race?.date) return;

    // Initial calculation
    setCountdown(calculateCountdown(race.date));

    // Update every second
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(race.date));
    }, 1000);

    return () => clearInterval(interval);
  }, [race?.date]);

  if (!race) return null;

  return (
    <Box
      bg={COLORS.navy}
      px={{ base: 4, md: 8 }}
      py={{ base: 6, md: 8 }}
      borderBottomRadius={{ base: 0, md: 'xl' }}
    >
      <Container maxW="container.lg">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'center', md: 'center' }}
          justify="space-between"
          gap={{ base: 4, md: 6 }}
        >
          {/* Race Info */}
          <Box textAlign={{ base: 'center', md: 'left' }}>
            <Text
              fontSize="sm"
              color={COLORS.gold}
              fontWeight="medium"
              textTransform="uppercase"
              letterSpacing="wide"
              mb={1}
            >
              Next marathon
            </Text>
            <Heading
              as="h3"
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="bold"
              color={COLORS.white}
            >
              {race.name}
            </Heading>
          </Box>

          {/* Countdown Timer */}
          <Flex
            border="2px solid"
            borderColor={COLORS.gold}
            borderRadius="lg"
            px={{ base: 6, md: 8, lg: 10 }}
            py={{ base: 4, md: 5, lg: 6 }}
            gap={{ base: 2, md: 3, lg: 4 }}
            align="center"
          >
            <CountdownUnit value={countdown.days} label="D" />
            <CountdownSeparator />
            <CountdownUnit value={countdown.hours} label="H" />
            <CountdownSeparator />
            <CountdownUnit value={countdown.minutes} label="M" />
            <CountdownSeparator />
            <CountdownUnit value={countdown.seconds} label="S" />
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}

/**
 * Countdown unit display
 */
function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <Flex direction="row" align="center" gap={{ base: 2, md: 3 }}>
      <Text
        fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }}
        fontWeight="bold"
        fontFamily="mono"
        lineHeight="1"
        style={{ color: 'white', margin: 0 }}
      >
        {formatCountdownUnit(value)}
      </Text>
      <Text
        fontSize={{ base: 'xs', md: 'sm' }}
        textTransform="uppercase"
        style={{ margin: 0 }}
      >
        {label}
      </Text>
    </Flex>
  );
}

/**
 * Countdown separator
 */
function CountdownSeparator() {
  return (
    <Text
      fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }}
      fontWeight="bold"
      px={{ base: 1, md: 2 }}
      lineHeight="1"
      style={{ color: '#FFFFFF', margin: 0 }}
    >
      :
    </Text>
  );
}

// ===========================
// Main Component
// ===========================

/**
 * LandingPage component for logged-out users.
 * 
 * SSR Optimized:
 * - Race data should be passed via `nextRace` prop from getServerSideProps
 * - Falls back to a hardcoded default if no prop is provided
 * - No client-side fetching to avoid hydration mismatch
 * 
 * @param onGetStarted - Callback when "Get Started" is clicked
 * @param nextRace - Next race data (name and date), passed from SSR
 */
export default function LandingPage({
  onGetStarted,
  nextRace: nextRaceProp,
}: LandingPageProps) {
  // Fallback race for when SSR doesn't provide race data
  // This ensures the countdown always has something to display
  const fallbackRace = {
    name: 'Error Marathon',
    date: new Date('3026-03-01T09:10:00+09:00'), // March 1, 3026
  };
  
  // Use prop if provided, otherwise use fallback
  // Race data should come from SSR (getServerSideProps in pages/index.js)
  const race = nextRaceProp || fallbackRace;

  return (
    <Box
      className="welcome-card"
      maxW="container.xl"
      mx="auto"
      my={{ base: 0, md: 4 }}
      borderRadius={{ base: 0, md: 'xl' }}
      overflow="hidden"
      shadow={{ base: 'none', md: 'xl' }}
    >
      <HeroSection onGetStarted={onGetStarted} />
      <ImageBreakSection />
      <HowItWorksSection />
      <NextMarathonSection race={race} />
    </Box>
  );
}

export type { LandingPageProps };
