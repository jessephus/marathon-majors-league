/**
 * Test Race Page - Demo Page for Race Design
 * 
 * Demonstrates the new race page design with sample data.
 * This page shows the RaceHero component and CompactAthleteList
 * component with Chakra UI styling.
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { Button, Card, CardBody } from '@/components/chakra';
import { RaceHero, CompactAthleteList } from '@/components/race';
import Footer from '@/components/Footer';

// Sample data
const sampleRace = {
  name: 'Tokyo Marathon',
  date: '2024-03-03T02:10:00Z',
  location: 'Tokyo, Japan',
  logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/38/Tokyo_Marathon_logo.svg/1200px-Tokyo_Marathon_logo.svg.png',
  backgroundImageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&h=600&fit=crop',
  description: 'The Tokyo Marathon is an annual marathon sporting event in Tokyo, Japan. It is a World Marathon Majors race and an IAAF Gold Label event.'
};

const sampleAthletes = [
  { id: 1, name: 'Eliud Kipchoge', country: 'KEN', gender: 'M', headshotUrl: 'https://i.pravatar.cc/150?img=12' },
  { id: 2, name: 'Kenenisa Bekele', country: 'ETH', gender: 'M', headshotUrl: 'https://i.pravatar.cc/150?img=13' },
  { id: 3, name: 'Kelvin Kiptum', country: 'KEN', gender: 'M', headshotUrl: 'https://i.pravatar.cc/150?img=14' },
  { id: 4, name: 'Geoffrey Kamworor', country: 'KEN', gender: 'M', headshotUrl: 'https://i.pravatar.cc/150?img=15' },
  { id: 5, name: 'Lawrence Cherono', country: 'KEN', gender: 'M', headshotUrl: 'https://i.pravatar.cc/150?img=16' },
  { id: 6, name: 'Lelisa Desisa', country: 'ETH', gender: 'M', headshotUrl: 'https://i.pravatar.cc/150?img=17' },
  { id: 7, name: 'Shura Kitata', country: 'ETH', gender: 'M', headshotUrl: 'https://i.pravatar.cc/150?img=18' },
  { id: 8, name: 'Mosinet Geremew', country: 'ETH', gender: 'M', headshotUrl: 'https://i.pravatar.cc/150?img=19' },
  { id: 9, name: 'Brigid Kosgei', country: 'KEN', gender: 'F', headshotUrl: 'https://i.pravatar.cc/150?img=5' },
  { id: 10, name: 'Ruth Chepngetich', country: 'KEN', gender: 'F', headshotUrl: 'https://i.pravatar.cc/150?img=6' },
  { id: 11, name: 'Peres Jepchirchir', country: 'KEN', gender: 'F', headshotUrl: 'https://i.pravatar.cc/150?img=7' },
  { id: 12, name: 'Sifan Hassan', country: 'NED', gender: 'F', headshotUrl: 'https://i.pravatar.cc/150?img=8' },
  { id: 13, name: 'Tigist Assefa', country: 'ETH', gender: 'F', headshotUrl: 'https://i.pravatar.cc/150?img=9' },
  { id: 14, name: 'Ababel Yeshaneh', country: 'ETH', gender: 'F', headshotUrl: 'https://i.pravatar.cc/150?img=10' },
  { id: 15, name: 'Ashete Bekere', country: 'ETH', gender: 'F', headshotUrl: 'https://i.pravatar.cc/150?img=11' },
  { id: 16, name: 'Hellen Obiri', country: 'KEN', gender: 'F', headshotUrl: 'https://i.pravatar.cc/150?img=20' },
];

export default function TestRacePage() {
  return (
    <>
      <Head>
        <title>Test Race Page | Marathon Majors Fantasy League</title>
        <meta name="description" content="Test page for race design with Chakra UI" />
      </Head>

      <Box minHeight="100vh" bg="gray.50">
        {/* Hero Section */}
        <RaceHero
          raceName={sampleRace.name}
          raceDate={sampleRace.date}
          lockTime={null}  // No lock time for this test race
          location={sampleRace.location}
          logoUrl={sampleRace.logoUrl}
          backgroundImageUrl={sampleRace.backgroundImageUrl}
        />

        {/* Main Content */}
        <Container maxW="container.xl" py={{ base: 8, md: 12 }}>
          <VStack gap={{ base: 8, md: 12 }} align="stretch">
            
            {/* Confirmed Athletes Section */}
            <Card variant="elevated" size="lg">
              <CardBody>
                <CompactAthleteList
                  athletes={sampleAthletes}
                  title="Confirmed Athletes"
                  showViewAll={false}
                />
              </CardBody>
            </Card>

            {/* Race News & Updates Section */}
            <Card variant="elevated" size="lg">
              <CardBody>
                <VStack align="stretch" gap={4}>
                  <Heading as="h3" size="lg" color="navy.800">
                    Race News & Updates
                  </Heading>
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
                </VStack>
              </CardBody>
            </Card>

            {/* Race Details Section */}
            <Card variant="elevated" size="lg">
              <CardBody>
                <VStack align="stretch" gap={4}>
                  <Heading as="h3" size="lg" color="navy.800">
                    About the Race
                  </Heading>
                  <Text color="gray.700" lineHeight="tall">
                    {sampleRace.description}
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            {/* Call to Action */}
            <Box textAlign="center" py={8}>
              <Link href="/" passHref legacyBehavior>
                <Button
                  as="a"
                  colorPalette="navy"
                  size="lg"
                >
                  Create Your Fantasy Team
                </Button>
              </Link>
            </Box>
          </VStack>
        </Container>

        <Footer />
      </Box>
    </>
  );
}
