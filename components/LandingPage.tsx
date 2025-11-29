/**
 * LandingPage Component
 * 
 * Modern landing page for logged-out users following MMFL design guidelines.
 * Features navy (#161C4F) and gold (#D4AF37) brand palette.
 * 
 * Uses existing Chakra primitives (Box, Flex, Text, Heading, Image, Container)
 * and the migrated Button component from @/components/chakra.
 * 
 * Sections:
 * 1. Header - Logo + Login/Sign Up buttons
 * 2. Hero - Title, description, Get Started CTA
 * 3. How It Works - 3 numbered steps with visual timeline
 * 4. Next Marathon - Countdown timer to next race
 * 
 * Design Reference: docs/CORE_DESIGN_GUIDELINES.md
 * Phase 5 Implementation: Week 27-28 Home/Welcome Page
 * 
 * @version 1.0.0
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
  onLogin?: () => void;
  onSignUp?: () => void;
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
  navyLight: '#1F2847',
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
    description: 'Sign up and build your fantasy team within a $30,000 salary cap.',
  },
  {
    number: 2,
    title: 'Draft Elite Runners',
    description: 'Choose 3 men and 3 women from the world\'s top marathoners.',
  },
  {
    number: 3,
    title: 'Race Day Glory',
    description: 'Watch your team compete and climb the leaderboard in real-time.',
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
 * Header with logo and auth buttons
 */
function LandingHeader({ onLogin, onSignUp }: { onLogin?: () => void; onSignUp?: () => void }) {
  return (
    <Flex
      as="header"
      bg={COLORS.navy}
      px={{ base: 4, md: 8 }}
      py={4}
      justify="space-between"
      align="center"
      borderTopRadius={{ base: 0, md: 'xl' }}
    >
      {/* Logo */}
      <Flex align="center" gap={2}>
        <Image
          src="/assets/mmfl-logo.png"
          alt="Marathon Majors Fantasy League"
          boxSize={{ base: '48px', md: '56px' }}
          objectFit="contain"
        />
      </Flex>

      {/* Auth Buttons */}
      <Flex gap={2}>
        <Button
          variant="outline"
          size="md"
          onClick={onLogin}
          borderColor={COLORS.gold}
          color={COLORS.gold}
          _hover={{
            bg: COLORS.goldHover,
            borderColor: COLORS.gold,
          }}
        >
          Log in
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={onSignUp}
          borderColor={COLORS.gold}
          color={COLORS.gold}
          _hover={{
            bg: COLORS.goldHover,
            borderColor: COLORS.gold,
          }}
        >
          Sign Up
        </Button>
      </Flex>
    </Flex>
  );
}

/**
 * Hero section with title and CTA
 */
function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <Box
      bg={COLORS.cream}
      px={{ base: 4, md: 8 }}
      py={{ base: 10, md: 16 }}
    >
      <Container maxW="container.lg">
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          align="center"
          justify="space-between"
          gap={{ base: 8, lg: 12 }}
        >
          {/* Text Content */}
          <Box flex="1" textAlign={{ base: 'center', lg: 'left' }}>
            {/* Title with underline accent */}
            <Heading
              as="h1"
              fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
              fontWeight="extrabold"
              color={COLORS.navy}
              lineHeight="tight"
              mb={2}
            >
              Fantasy
              <br />
              Marathon
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
              Draft and manage teams of runners to compete for points in the marathon majors.
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
              bg={COLORS.grayLight}
              borderRadius="lg"
              h="280px"
              w="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Image
                src="/assets/mmfl-logo.png"
                alt="Marathon Majors Fantasy League"
                boxSize="180px"
                objectFit="contain"
                opacity={0.3}
              />
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}

/**
 * "How it works" section with numbered steps
 */
function HowItWorksSection() {
  return (
    <Box
      bg={COLORS.cream}
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
          How it works
        </Heading>

        {/* Steps Timeline */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'flex-start', md: 'flex-start' }}
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
                textAlign={{ base: 'left', md: 'center' }}
              >
                <Text
                  fontWeight="semibold"
                  color={COLORS.navy}
                  fontSize={{ base: 'sm', md: 'md' }}
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
          align={{ base: 'flex-start', md: 'center' }}
          justify="space-between"
          gap={{ base: 4, md: 0 }}
        >
          {/* Race Info */}
          <Box>
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
            px={{ base: 4, md: 6 }}
            py={3}
            gap={{ base: 1, md: 2 }}
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
    <Flex direction="column" align="center" minW={{ base: '36px', md: '48px' }}>
      <Text
        fontSize={{ base: 'xl', md: '2xl' }}
        fontWeight="bold"
        color={COLORS.gold}
        fontFamily="mono"
      >
        {formatCountdownUnit(value)}
      </Text>
      <Text
        fontSize="xs"
        color="gray.400"
        textTransform="uppercase"
        display={{ base: 'none', md: 'block' }}
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
      fontSize={{ base: 'xl', md: '2xl' }}
      fontWeight="bold"
      color={COLORS.gold}
      px={1}
    >
      :
    </Text>
  );
}

// ===========================
// Main Component
// ===========================

export default function LandingPage({
  onGetStarted,
  onLogin,
  onSignUp,
  nextRace,
}: LandingPageProps) {
  // Default next race if not provided - Tokyo Marathon 2026
  // Using a future date to ensure countdown works correctly
  const defaultNextRace = {
    name: 'Tokyo Marathon',
    date: new Date('2026-03-01T09:10:00+09:00'), // First Sunday of March 2026
  };

  const race = nextRace || defaultNextRace;

  return (
    <Box
      maxW="container.xl"
      mx="auto"
      my={{ base: 0, md: 4 }}
      borderRadius={{ base: 0, md: 'xl' }}
      overflow="hidden"
      shadow={{ base: 'none', md: 'xl' }}
    >
      <LandingHeader onLogin={onLogin || onGetStarted} onSignUp={onSignUp || onGetStarted} />
      <HeroSection onGetStarted={onGetStarted} />
      <HowItWorksSection />
      <NextMarathonSection race={race} />
    </Box>
  );
}

export type { LandingPageProps };
