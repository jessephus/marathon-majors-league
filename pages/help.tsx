/**
 * Help Page - Marathon Majors Fantasy League
 * 
 * Comprehensive help and FAQ page for users to understand how to play
 * the fantasy game, bookmark their team, and get answers to common questions.
 * 
 * Features:
 * - How to Play section with step-by-step instructions
 * - FAQ section with expandable questions
 * - Casual, fun, friendly voice for novice users
 * - Mobile-first responsive design with Chakra UI
 * - Navy/gold branding consistent with design guidelines
 * 
 * Voice & Tone:
 * - Casual, fun, friendly, and inviting
 * - Aimed at someone who is novice to both fantasy sports and elite marathon racing
 * - Encouraging and helpful
 * 
 * References:
 * - Design: docs/CORE_DESIGN_GUIDELINES.md
 * - User Guide: docs/CORE_USER_GUIDE.md
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getValidTeamSession } from '@/lib/session-manager';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Separator,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  TrophyIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BookmarkIcon,
  QuestionMarkCircleIcon,
  StarIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  ShareIcon,
  HomeModernIcon
} from '@heroicons/react/24/outline';
import { Button, Card, CardBody } from '@/components/chakra';
import Footer from '@/components/Footer';

/**
 * Brand color constants for inline styles
 * These match the theme tokens in theme/colors.ts
 * Used when Chakra color tokens can't be applied (e.g., SVG icon colors)
 */
const BRAND_COLORS = {
  gold: '#D4AF37',      // gold.500
  navy: '#4A5F9D',      // navy.500
  navyDark: '#161C4F',  // navy.900
} as const;

/**
 * Icon component type for Heroicons
 */
type HeroIconComponent = React.ComponentType<{ style?: React.CSSProperties }>;

/**
 * Step card for the How to Play section
 */
interface StepCardProps {
  stepNumber: number;
  icon: HeroIconComponent;
  title: string;
  description: string;
}

function StepCard({ stepNumber, icon: IconComponent, title, description }: StepCardProps) {
  return (
    <Card variant="filled" size="md">
      <CardBody>
        <VStack align="start" gap={3}>
          <HStack gap={3}>
            <Box
              bg="navy.500"
              color="white"
              borderRadius="full"
              w="32px"
              h="32px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="sm"
              fontWeight="bold"
              flexShrink={0}
            >
              {stepNumber}
            </Box>
            <Box
              bg="gold.100"
              borderRadius="md"
              p={2}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <IconComponent style={{ width: '24px', height: '24px', color: BRAND_COLORS.gold }} />
            </Box>
          </HStack>
          <Heading as="h3" size="md" color="navy.800">
            {title}
          </Heading>
          <Text color="gray.600" fontSize="md" lineHeight="tall">
            {description}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  );
}

/**
 * FAQ item interface
 */
interface FAQItemData {
  question: string;
  answer: React.ReactNode;
  icon: HeroIconComponent;
}

/**
 * Expandable FAQ item component using React state
 */
interface FAQCardProps {
  item: FAQItemData;
  defaultOpen?: boolean;
}

function FAQCard({ item, defaultOpen = false }: FAQCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const IconComponent = item.icon;
  
  return (
    <Card variant="outline" size="md">
      <Box
        as="button"
        width="100%"
        cursor="pointer"
        _hover={{ bg: 'gray.50' }}
        transition="background-color 0.2s"
        onClick={() => setIsOpen(!isOpen)}
        textAlign="left"
      >
        <CardBody>
          <HStack justify="space-between" align="center">
            <HStack gap={3} align="center" flex={1}>
              <Box
                bg="navy.100"
                borderRadius="md"
                p={2}
                display={{ base: 'none', sm: 'flex' }}
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <IconComponent style={{ width: '20px', height: '20px', color: BRAND_COLORS.navy }} />
              </Box>
              <Text
                fontWeight="semibold"
                color="navy.800"
                fontSize={{ base: 'md', md: 'lg' }}
                textAlign="left"
              >
                {item.question}
              </Text>
            </HStack>
            <Box
              transition="transform 0.2s"
              transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
              flexShrink={0}
            >
              <ChevronDownIcon style={{ width: '20px', height: '20px', color: BRAND_COLORS.navy }} />
            </Box>
          </HStack>
        </CardBody>
      </Box>
      {isOpen && (
        <Box
          px={{ base: 4, md: 6 }}
          pb={4}
          color="gray.700"
          fontSize="md"
          lineHeight="tall"
          borderTop="1px solid"
          borderTopColor="gray.100"
          pt={4}
        >
          {item.answer}
        </Box>
      )}
    </Card>
  );
}

/**
 * Help Page Component
 */
export default function HelpPage() {
  const [hasActiveSession, setHasActiveSession] = useState(false);

  // Check for active session on mount
  useEffect(() => {
    const session = getValidTeamSession();
    setHasActiveSession(!!session);
  }, []);

  // FAQ data - casual, friendly language for novice users
  const faqItems: FAQItemData[] = [
    {
      question: 'What is Marathon Majors Fantasy League?',
      answer: (
        <Text>
          Think of it like fantasy football, but for marathon running! You draft a team of 
          elite runners from the world&apos;s biggest marathons (like NYC, Boston, Chicago, and London). 
          Your team earns points based on how they perform in the race. It&apos;s a super fun way 
          to get more invested in watching marathons with friends!
        </Text>
      ),
      icon: TrophyIcon,
    },
    {
      question: 'How do I save or bookmark my team?',
      answer: (
        <VStack align="start" gap={3}>
          <Text>
            Great question! Your team is automatically saved when you create it. Here&apos;s how to 
            bookmark it for easy access:
          </Text>
          <VStack align="start" gap={2} pl={4}>
            <Text>
              <strong>On iPhone Safari:</strong> Tap the share button (square with arrow), then 
              &quot;Add to Home Screen&quot;
            </Text>
            <Text>
              <strong>On Android Chrome:</strong> Tap the three dots menu, then &quot;Add to Home Screen&quot;
            </Text>
            <Text>
              <strong>On Desktop:</strong> Press Ctrl+D (Windows) or Cmd+D (Mac) to bookmark the page
            </Text>
          </VStack>
          <Text>
            Pro tip: Bookmark your team page URL (it looks like <code>/team/your-team-code</code>) 
            so you can jump straight back to your roster anytime!
          </Text>
        </VStack>
      ),
      icon: BookmarkIcon,
    },
    {
      question: 'How does the salary cap work?',
      answer: (
        <VStack align="start" gap={3}>
          <Text>
            You get a $30,000 budget to build your dream team. Each athlete has a &quot;price&quot; based 
            on how fast they are and how likely they are to win. Elite runners like Sabastian Sawe 
            or Tigst Assefa cost more, while up-and-comers are more affordable.
          </Text>
          <Text>
            The strategy is balancing star power with finding hidden gems! Sometimes a less 
            expensive runner has a breakthrough race and outscores everyone.
          </Text>
        </VStack>
      ),
      icon: CurrencyDollarIcon,
    },
    {
      question: 'How many athletes do I need to pick?',
      answer: (
        <Text>
          You&apos;ll draft 6 athletes total: 3 men and 3 women. This gives you a balanced team 
          and makes sure everyone has skin in the game for both the men&apos;s and women&apos;s races. 
          Trust us, it makes watching the marathon twice as exciting!
        </Text>
      ),
      icon: UserGroupIcon,
    },
    {
      question: 'When does my roster lock?',
      answer: (
        <VStack align="start" gap={3}>
          <Text>
            Your roster locks when the race starts! This is usually around 8:00 AM local time 
            on race day. The exact lock time is shown on the Race page and your team page.
          </Text>
          <Text>
            Make sure to finalize your team before then. Once the race starts, you can&apos;t make 
            any changes. This keeps things fair and adds to the excitement!
          </Text>
        </VStack>
      ),
      icon: ClockIcon,
    },
    {
      question: 'How is scoring calculated?',
      answer: (
        <VStack align="start" gap={3}>
          <Text>
            Athletes earn points based on their performance. Here&apos;s how it breaks down:
          </Text>
          <VStack align="start" gap={2} pl={4}>
            <Text><strong>Placement Points:</strong> Extra points for top 10 finishes</Text>
            <Text><strong>Time Gap Bonus:</strong> Closer to the winner = more points</Text>
            <Text><strong>Personal Best:</strong> Bonus for negative splits and fast finishing kicks</Text>
            <Text><strong>Record Setters:</strong> Big bonuses for breaking records</Text>
          </VStack>
          <Text>
            Your team&apos;s total score is the sum of all 6 athletes. The highest score wins! 
            Check the Standings page during the race to see how you&apos;re doing.
          </Text>
        </VStack>
      ),
      icon: ChartBarIcon,
    },
    {
      question: 'Can I share my team with friends?',
      answer: (
        <VStack align="start" gap={3}>
          <Text>
            Absolutely! Sharing is half the fun. You can:
          </Text>
          <VStack align="start" gap={2} pl={4}>
            <Text>Copy your team page URL and send it to friends</Text>
            <Text>Take a screenshot of your roster to share on social media</Text>
            <Text>Invite friends to create their own teams and compete against you</Text>
          </VStack>
          <Text>
            Marathon watching is always better with friendly competition!
          </Text>
        </VStack>
      ),
      icon: ShareIcon,
    },
    {
      question: 'What if an athlete doesn\'t finish the race?',
      answer: (
        <Text>
          It happens sometimes! If one of your athletes drops out (DNF - Did Not Finish), 
          they won&apos;t earn any points for that race. That&apos;s why picking 6 athletes helps 
          spread the risk. Even the best runners have off days, so don&apos;t put all your 
          eggs in one basket!
        </Text>
      ),
      icon: QuestionMarkCircleIcon,
    },
    {
      question: 'Do I need to watch the marathon live?',
      answer: (
        <VStack align="start" gap={3}>
          <Text>
            You don&apos;t <em>have</em> to, but it&apos;s way more fun if you do! Following along 
            live as your athletes run through the streets is an amazing experience.
          </Text>
          <Text>
            If you can&apos;t watch live, no worries — check the Standings page after the race 
            to see how your team did. Results are updated in real-time, so you&apos;ll know 
            exactly how things played out.
          </Text>
        </VStack>
      ),
      icon: DevicePhoneMobileIcon,
    },
    {
      question: 'What are the \"Marathon Majors\"?',
      answer: (
        <VStack align="start" gap={3}>
          <Text>
            The Abbott World Marathon Majors are the seven (soon to be nine) biggest and most 
            prestigious marathons in the world:
          </Text>
          <VStack align="start" gap={1} pl={4}>
            <Text>New York City Marathon</Text>
            <Text>Boston Marathon</Text>
            <Text>Chicago Marathon</Text>
            <Text>London Marathon</Text>
            <Text>Berlin Marathon</Text>
            <Text>Tokyo Marathon</Text>
            <Text>Sydney Marathon</Text>
            <Text>(Shanghai and Cape Town are expected to be added in coming years)</Text>
          </VStack>
          <Text>
            These races attract the fastest runners on the planet and offer massive prize 
            money. Winning all six is the ultimate achievement in marathon running!
          </Text>
        </VStack>
      ),
      icon: StarIcon,
    },
    {
      question: 'So what\'s up with having the Valencia Marathon?',
      answer: (
        <VStack align="start" gap={3}>
          <Text>
            Although not a Major, the Valencia Marathon is a World Athletics Platinum Label race. 
            Known for its exceptionally flat and fast course and €1M prize for anyone that breaks a 
            World Record, the race is ideal for achieving fast times and attracts the most elite 
            athletes in the world. So we can do fantasy with it.
          </Text>
        </VStack>
      ),
      icon: HomeModernIcon,
    },
  ];

  return (
    <>
      <Head>
        <title>Help & FAQ | Marathon Majors Fantasy League</title>
        <meta 
          name="description" 
          content="Learn how to play Marathon Majors Fantasy League, save your team, understand scoring, and get answers to common questions." 
        />
      </Head>

      <Box minHeight="100vh" bg="gray.50">
        {/* Hero Section */}
        <Box
          bg="navy.900"
          color="white"
          py={{ base: 12, md: 16 }}
          px={4}
          position="relative"
          overflow="hidden"
        >
          {/* Decorative background elements */}
          <Box
            position="absolute"
            top="-50%"
            right="-10%"
            w="400px"
            h="400px"
            borderRadius="full"
            bg="gold.500"
            opacity={0.05}
            transform="rotate(45deg)"
          />
          <Box
            position="absolute"
            bottom="-30%"
            left="-5%"
            w="300px"
            h="300px"
            borderRadius="full"
            bg="gold.500"
            opacity={0.03}
          />
          {/* Winged shoe logo in center */}
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            w={{ base: "200px", md: "300px" }}
            h={{ base: "200px", md: "300px" }}
            opacity={0.08}
            pointerEvents="none"
          >
            <img
              src="/assets/winged-shoe.png"
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>
          
          <Container maxW="container.xl" position="relative">
            <VStack gap={4} align="center" textAlign="center">
              <HStack gap={3}>
                <QuestionMarkCircleIcon style={{ width: '40px', height: '40px', color: BRAND_COLORS.gold }} />
              </HStack>
              <Heading
                as="h1"
                size={{ base: '2xl', md: '3xl', lg: '4xl' }}
                fontWeight="extrabold"
                lineHeight="tight"
              >
                Help & FAQ
              </Heading>
              <Text
                fontSize={{ base: 'lg', md: 'xl' }}
                opacity={0.9}
                maxW="600px"
              >
                Everything you need to know about playing Marathon Majors Fantasy League. 
                Let&apos;s get you up to speed!
              </Text>
            </VStack>
          </Container>
        </Box>

        {/* Main Content */}
        <Container maxW="container.xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
          <VStack gap={{ base: 10, md: 16 }} align="stretch">
            
            {/* How to Play Section */}
            <Box
              bg="white"
              borderRadius="lg"
              p={{ base: 6, md: 8 }}
              shadow="sm"
              border="1px solid"
              borderColor="gray.200"
            >
              <VStack gap={6} align="stretch">
                <VStack align={{ base: 'center', md: 'start' }} gap={2}>
                  <Heading
                    as="h2"
                    size={{ base: 'xl', md: '2xl' }}
                    color="navy.900"
                    textAlign={{ base: 'center', md: 'left' }}
                  >
                    How to Play
                  </Heading>
                  <Text
                    color="gray.600"
                    fontSize={{ base: 'md', md: 'lg' }}
                    textAlign={{ base: 'center', md: 'left' }}
                  >
                    It&apos;s easier than you think! Here&apos;s how to get started.
                  </Text>
                </VStack>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                  <StepCard
                    stepNumber={1}
                    icon={UserGroupIcon}
                    title="Create Your Team"
                    description="Click 'Create Team' and give your team a fun name. You're now ready to start drafting your dream roster of elite marathon runners!"
                  />
                  <StepCard
                    stepNumber={2}
                    icon={CurrencyDollarIcon}
                    title="Draft Athletes"
                    description="Browse the athlete pool and pick 3 men and 3 women that fit within your $30,000 budget. Mix superstars with value picks!"
                  />
                  <StepCard
                    stepNumber={3}
                    icon={ClockIcon}
                    title="Save Before Lock"
                    description="Make sure to finalize your roster before the race starts. Once locked, you can't make changes — but you can start cheering!"
                  />
                  <StepCard
                    stepNumber={4}
                    icon={DevicePhoneMobileIcon}
                    title="Watch the Race"
                    description="Follow along as your athletes compete. Check the Standings page for live scoring updates throughout the marathon."
                  />
                  <StepCard
                    stepNumber={5}
                    icon={ChartBarIcon}
                    title="Track Your Score"
                    description="Points add up based on finish times, placements, and bonus achievements. Keep an eye on the leaderboard!"
                  />
                  <StepCard
                    stepNumber={6}
                    icon={TrophyIcon}
                    title="Celebrate Victory"
                    description="When the race ends, the team with the most points wins. Bragging rights are on the line — make sure to share your glory!"
                  />
                </SimpleGrid>
              </VStack>
            </Box>

            {/* Quick Tips Section */}
            <Box
              bg="white"
              borderRadius="lg"
              p={{ base: 6, md: 8 }}
              shadow="sm"
              border="1px solid"
              borderColor="gray.200"
            >
              <VStack gap={6} align="stretch">
                <VStack align={{ base: 'center', md: 'start' }} gap={2}>
                  <Heading
                    as="h2"
                    size={{ base: 'xl', md: '2xl' }}
                    color="navy.900"
                    textAlign={{ base: 'center', md: 'left' }}
                  >
                    Pro Tips for Beginners
                  </Heading>
                  <Text
                    color="gray.600"
                    fontSize={{ base: 'md', md: 'lg' }}
                    textAlign={{ base: 'center', md: 'left' }}
                  >
                    Little tricks to help you get the most out of your first fantasy marathon.
                  </Text>
                </VStack>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Card variant="outline" size="md">
                    <CardBody>
                      <HStack align="start" gap={4}>
                        <Box
                          bg="gold.100"
                          borderRadius="md"
                          p={2}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <BookmarkIcon style={{ width: '24px', height: '24px', color: BRAND_COLORS.gold }} />
                        </Box>
                        <VStack align="start" gap={1}>
                          <Text fontWeight="semibold" color="navy.800">
                            Bookmark Your Team Page
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            Add your team page to your home screen for one-tap access on race day!
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>

                  <Card variant="outline" size="md">
                    <CardBody>
                      <HStack align="start" gap={4}>
                        <Box
                          bg="gold.100"
                          borderRadius="md"
                          p={2}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <StarIcon style={{ width: '24px', height: '24px', color: BRAND_COLORS.gold }} />
                        </Box>
                        <VStack align="start" gap={1}>
                          <Text fontWeight="semibold" color="navy.800">
                            Don&apos;t Blow Your Budget on One Star
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            Spread your salary across all 6 picks — depth beats a single superstar!
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>

                  <Card variant="outline" size="md">
                    <CardBody>
                      <HStack align="start" gap={4}>
                        <Box
                          bg="gold.100"
                          borderRadius="md"
                          p={2}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <ClockIcon style={{ width: '24px', height: '24px', color: BRAND_COLORS.gold }} />
                        </Box>
                        <VStack align="start" gap={1}>
                          <Text fontWeight="semibold" color="navy.800">
                            Check Personal Bests (PBs)
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            An athlete&apos;s PB shows their potential. Look for consistent sub-2:05 men and sub-2:20 women.
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>

                  <Card variant="outline" size="md">
                    <CardBody>
                      <HStack align="start" gap={4}>
                        <Box
                          bg="gold.100"
                          borderRadius="md"
                          p={2}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <ShareIcon style={{ width: '24px', height: '24px', color: BRAND_COLORS.gold }} />
                        </Box>
                        <VStack align="start" gap={1}>
                          <Text fontWeight="semibold" color="navy.800">
                            Invite Friends!
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            The more friends playing, the more fun. Share the link and start a league!
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </VStack>
            </Box>

            {/* FAQ Section */}
            <Box
              bg="white"
              borderRadius="lg"
              p={{ base: 6, md: 8 }}
              shadow="sm"
              border="1px solid"
              borderColor="gray.200"
            >
              <VStack gap={6} align="stretch">
                <VStack align={{ base: 'center', md: 'start' }} gap={2}>
                  <Heading
                    as="h2"
                    size={{ base: 'xl', md: '2xl' }}
                    color="navy.900"
                    textAlign={{ base: 'center', md: 'left' }}
                  >
                    Frequently Asked Questions
                  </Heading>
                  <Text
                    color="gray.600"
                    fontSize={{ base: 'md', md: 'lg' }}
                    textAlign={{ base: 'center', md: 'left' }}
                  >
                    Got questions? We&apos;ve got answers.
                  </Text>
                </VStack>

                <VStack gap={4} align="stretch">
                  {faqItems.map((item, index) => (
                    <FAQCard 
                      key={index} 
                      item={item} 
                      defaultOpen={index === 0}
                    />
                  ))}
                </VStack>
              </VStack>
            </Box>

            {/* Call to Action - Only show if no active session */}
            {!hasActiveSession && (
              <Box
                textAlign="center"
                py={{ base: 4, md: 8 }}
                bg="white"
                borderRadius="lg"
                p={{ base: 6, md: 8 }}
                shadow="sm"
                border="1px solid"
                borderColor="gray.200"
              >
              <VStack gap={6}>
                <VStack gap={2}>
                  <Heading
                    as="h2"
                    size={{ base: 'lg', md: 'xl' }}
                    color="navy.900"
                  >
                    Ready to Play?
                  </Heading>
                  <Text
                    color="gray.600"
                    fontSize={{ base: 'md', md: 'lg' }}
                    maxW="500px"
                  >
                    Create your team now and join the excitement of marathon fantasy sports!
                  </Text>
                </VStack>
                <HStack gap={4} justify="center" flexWrap="wrap">
                  <Link href="/?action=create-team" passHref legacyBehavior>
                    <Button
                      as="a"
                      colorPalette="navy"
                      size="lg"
                      px={8}
                    >
                      Create Your Team
                    </Button>
                  </Link>
                  <Link href="/athletes" passHref legacyBehavior>
                    <Button
                      as="a"
                      colorPalette="navy"
                      variant="outline"
                      size="lg"
                      px={8}
                    >
                      Browse Athletes
                    </Button>
                  </Link>
                </HStack>
              </VStack>
            </Box>
            )}

          </VStack>
        </Container>

        <Footer />
      </Box>
    </>
  );
}
