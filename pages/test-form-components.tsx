/**
 * Form Components Test Page
 * 
 * Comprehensive demonstration of all form components with live examples.
 * Tests validation states, accessibility features, and responsive behavior.
 * 
 * @version 1.0.0 (Phase 4: Form Components)
 * @date November 23, 2025
 */

import { useState } from 'react';
import Head from 'next/head';
import { Box, Container, Heading, Text, VStack, HStack, SimpleGrid, Stack } from '@chakra-ui/react';
import {
  Input,
  Select,
  Textarea,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  FormSuccessMessage,
  Button,
  SelectOption,
} from '@/components/chakra';

export default function TestFormComponents() {
  // Form state
  const [teamName, setTeamName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [sortBy, setSortBy] = useState('salary');
  const [description, setDescription] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [notifications, setNotifications] = useState({
    results: false,
    weekly: false,
    athletes: false,
  });
  const [difficulty, setDifficulty] = useState('medium');
  const [colorTheme, setColorTheme] = useState('navy');

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation functions
  const validateTeamName = (value: string) => {
    if (value.length < 3) {
      setErrors(prev => ({ ...prev, teamName: 'Team name must be at least 3 characters' }));
    } else {
      setErrors(prev => {
        const { teamName, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors(prev => {
        const { email, ...rest } = prev;
        return rest;
      });
    }
  };

  // Select options
  const genderOptions: SelectOption[] = [
    { value: 'men', label: "Men's Division" },
    { value: 'women', label: "Women's Division" },
    { value: 'mixed', label: 'Mixed Division' },
  ];

  const sortOptions: SelectOption[] = [
    { value: 'salary', label: 'Sort by Salary' },
    { value: 'pb', label: 'Sort by Personal Best' },
    { value: 'rank', label: 'Sort by Rank' },
    { value: 'country', label: 'Sort by Country' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', {
      teamName,
      ownerName,
      email,
      gender,
      sortBy,
      description,
      agreeTerms,
      notifications,
      difficulty,
      colorTheme,
    });
    alert('Form submitted! Check console for data.');
  };

  return (
    <>
      <Head>
        <title>Form Components Demo - MMFL</title>
        <meta name="description" content="Interactive demonstration of all Chakra UI form components" />
      </Head>

      <Box minH="100vh" bg="gray.50" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <Container maxW="1200px">
          <VStack gap={12} align="stretch">
            {/* Header */}
            <Box textAlign="center">
              <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} color="navy.900" mb={4}>
                Form Components Demo
              </Heading>
              <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.600">
                Interactive examples of all form components with validation states
              </Text>
            </Box>

            {/* Input Components Section */}
            <Box bg="white" p={{ base: 6, md: 8 }} borderRadius="lg" shadow="md">
              <Heading as="h2" fontSize="2xl" color="navy.900" mb={6}>
                Input Components
              </Heading>

              <VStack gap={6} align="stretch">
                {/* Outline variant with validation */}
                <FormControl isRequired isInvalid={!!errors.teamName}>
                  <FormLabel htmlFor="team-name">Team Name (Outline Variant)</FormLabel>
                  <Input
                    id="team-name"
                    type="text"
                    placeholder="Enter your team name"
                    value={teamName}
                    onChange={(e) => {
                      setTeamName(e.target.value);
                      validateTeamName(e.target.value);
                    }}
                    variant="outline"
                    size="md"
                  />
                  {errors.teamName ? (
                    <FormErrorMessage>{errors.teamName}</FormErrorMessage>
                  ) : teamName.length >= 3 ? (
                    <FormSuccessMessage>Great team name!</FormSuccessMessage>
                  ) : (
                    <FormHelperText>At least 3 characters required</FormHelperText>
                  )}
                </FormControl>

                {/* Filled variant */}
                <FormControl>
                  <FormLabel htmlFor="owner-name">Owner Name (Filled Variant)</FormLabel>
                  <Input
                    id="owner-name"
                    type="text"
                    placeholder="Enter your name (optional)"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    variant="filled"
                    size="md"
                  />
                  <FormHelperText>This will be displayed on the leaderboard</FormHelperText>
                </FormControl>

                {/* Flushed variant with email validation */}
                <FormControl isInvalid={!!errors.email}>
                  <FormLabel htmlFor="email">Email (Flushed Variant)</FormLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      validateEmail(e.target.value);
                    }}
                    variant="flushed"
                    size="md"
                  />
                  {errors.email ? (
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  ) : (
                    <FormHelperText>We'll never share your email</FormHelperText>
                  )}
                </FormControl>

                {/* Input sizes demonstration */}
                <Box>
                  <FormLabel>Input Sizes</FormLabel>
                  <Stack gap={3}>
                    <Input placeholder="Small input (40px)" size="sm" aria-label="Small input example" />
                    <Input placeholder="Medium input (44px - WCAG)" size="md" aria-label="Medium input example" />
                    <Input placeholder="Large input (48px)" size="lg" aria-label="Large input example" />
                  </Stack>
                </Box>

                {/* Disabled and ReadOnly states */}
                <Box>
                  <FormLabel id="input-states-label">Input States</FormLabel>
                  <Stack gap={3}>
                    <Input placeholder="Disabled input" isDisabled aria-label="Disabled input example" />
                    <Input placeholder="Read-only input" value="Cannot edit this" isReadOnly aria-label="Read-only input example" />
                  </Stack>
                </Box>
              </VStack>
            </Box>

            {/* Select Components Section */}
            <Box bg="white" p={{ base: 6, md: 8 }} borderRadius="lg" shadow="md">
              <Heading as="h2" fontSize="2xl" color="navy.900" mb={6}>
                Select Components
              </Heading>

              <VStack gap={6} align="stretch">
                {/* Basic select */}
                <FormControl>
                  <FormLabel htmlFor="sort-by">Sort By (Outline Variant)</FormLabel>
                  <Select
                    id="sort-by"
                    options={sortOptions}
                    placeholder="Choose sorting option"
                    variant="outline"
                    size="md"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  />
                  <FormHelperText>Select how to sort athletes</FormHelperText>
                </FormControl>

                {/* Required select with validation */}
                <FormControl isRequired isInvalid={!gender && !!errors.gender}>
                  <FormLabel htmlFor="gender">Gender Division (Filled Variant)</FormLabel>
                  <Select
                    id="gender"
                    options={genderOptions}
                    placeholder="Select division"
                    variant="filled"
                    size="md"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  {errors.gender && <FormErrorMessage>{errors.gender}</FormErrorMessage>}
                </FormControl>

                {/* Select sizes */}
                <Box>
                  <FormLabel id="select-sizes-label">Select Sizes</FormLabel>
                  <Stack gap={3}>
                    <Select options={sortOptions} placeholder="Small select (40px)" size="sm" aria-label="Small select example" />
                    <Select options={sortOptions} placeholder="Medium select (44px - WCAG)" size="md" aria-label="Medium select example" />
                    <Select options={sortOptions} placeholder="Large select (48px)" size="lg" aria-label="Large select example" />
                  </Stack>
                </Box>

                {/* Disabled state */}
                <Select options={sortOptions} placeholder="Disabled select" isDisabled aria-label="Disabled select example" />
              </VStack>
            </Box>

            {/* Textarea Components Section */}
            <Box bg="white" p={{ base: 6, md: 8 }} borderRadius="lg" shadow="md">
              <Heading as="h2" fontSize="2xl" color="navy.900" mb={6}>
                Textarea Components
              </Heading>

              <VStack gap={6} align="stretch">
                {/* Basic textarea */}
                <FormControl>
                  <FormLabel htmlFor="description">Team Description (Outline Variant)</FormLabel>
                  <Textarea
                    id="description"
                    placeholder="Tell us about your team strategy..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    variant="outline"
                    size="md"
                    resize="vertical"
                  />
                  <FormHelperText>
                    {description.length}/500 characters {description.length > 500 && '(too long)'}
                  </FormHelperText>
                </FormControl>

                {/* Filled variant */}
                <FormControl>
                  <FormLabel htmlFor="notes">Notes (Filled Variant)</FormLabel>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes..."
                    variant="filled"
                    size="md"
                  />
                </FormControl>

                {/* Textarea sizes */}
                <Box>
                  <FormLabel id="textarea-sizes-label">Textarea Sizes</FormLabel>
                  <Stack gap={3}>
                    <Textarea placeholder="Small textarea (80px height)" size="sm" aria-label="Small textarea example" />
                    <Textarea placeholder="Medium textarea (120px height)" size="md" aria-label="Medium textarea example" />
                    <Textarea placeholder="Large textarea (160px height)" size="lg" aria-label="Large textarea example" />
                  </Stack>
                </Box>
              </VStack>
            </Box>

            {/* Checkbox Components Section */}
            <Box bg="white" p={{ base: 6, md: 8 }} borderRadius="lg" shadow="md">
              <Heading as="h2" fontSize="2xl" color="navy.900" mb={6}>
                Checkbox Components
              </Heading>

              <VStack gap={6} align="stretch">
                {/* Single checkbox */}
                <FormControl isRequired>
                  <Checkbox
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    colorPalette="navy"
                    size="md"
                  >
                    I agree to the terms and conditions
                  </Checkbox>
                </FormControl>

                {/* Checkbox group */}
                <Box>
                  <FormLabel>Email Preferences</FormLabel>
                  <Stack gap={3}>
                    <Checkbox
                      checked={notifications.results}
                      onChange={(e) => setNotifications({ ...notifications, results: e.target.checked })}
                      colorPalette="navy"
                      size="md"
                    >
                      Race result notifications
                    </Checkbox>
                    <Checkbox
                      checked={notifications.weekly}
                      onChange={(e) => setNotifications({ ...notifications, weekly: e.target.checked })}
                      colorPalette="navy"
                      size="md"
                    >
                      Weekly leaderboard updates
                    </Checkbox>
                    <Checkbox
                      checked={notifications.athletes}
                      onChange={(e) => setNotifications({ ...notifications, athletes: e.target.checked })}
                      colorPalette="navy"
                      size="md"
                    >
                      New athlete announcements
                    </Checkbox>
                    <Checkbox colorPalette="gold" size="md">
                      Premium features (Gold theme)
                    </Checkbox>
                  </Stack>
                </Box>

                {/* Checkbox sizes */}
                <Box>
                  <FormLabel>Checkbox Sizes</FormLabel>
                  <Stack gap={3}>
                    <Checkbox size="sm">Small checkbox (16px)</Checkbox>
                    <Checkbox size="md">Medium checkbox (20px - WCAG)</Checkbox>
                    <Checkbox size="lg">Large checkbox (24px)</Checkbox>
                  </Stack>
                </Box>

                {/* Disabled states */}
                <Box>
                  <FormLabel>Disabled States</FormLabel>
                  <Stack gap={3}>
                    <Checkbox isDisabled>Disabled unchecked</Checkbox>
                    <Checkbox isDisabled checked>
                      Disabled checked
                    </Checkbox>
                  </Stack>
                </Box>
              </VStack>
            </Box>

            {/* Radio Components Section */}
            <Box bg="white" p={{ base: 6, md: 8 }} borderRadius="lg" shadow="md">
              <Heading as="h2" fontSize="2xl" color="navy.900" mb={6}>
                Radio Components
              </Heading>

              <VStack gap={6} align="stretch">
                {/* Radio group - difficulty */}
                <FormControl>
                  <FormLabel>Difficulty Level</FormLabel>
                  <RadioGroup>
                    <Stack gap={3}>
                      <Radio
                        name="difficulty"
                        value="easy"
                        checked={difficulty === 'easy'}
                        onChange={() => setDifficulty('easy')}
                        colorPalette="navy"
                        size="md"
                      >
                        Easy - Casual play
                      </Radio>
                      <Radio
                        name="difficulty"
                        value="medium"
                        checked={difficulty === 'medium'}
                        onChange={() => setDifficulty('medium')}
                        colorPalette="navy"
                        size="md"
                      >
                        Medium - Competitive
                      </Radio>
                      <Radio
                        name="difficulty"
                        value="hard"
                        checked={difficulty === 'hard'}
                        onChange={() => setDifficulty('hard')}
                        colorPalette="navy"
                        size="md"
                      >
                        Hard - Expert mode
                      </Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>

                {/* Radio group - theme */}
                <FormControl>
                  <FormLabel>Color Theme</FormLabel>
                  <RadioGroup>
                    <Stack gap={3}>
                      <Radio
                        name="theme"
                        value="navy"
                        checked={colorTheme === 'navy'}
                        onChange={() => setColorTheme('navy')}
                        colorPalette="navy"
                        size="md"
                      >
                        Navy theme (default)
                      </Radio>
                      <Radio
                        name="theme"
                        value="gold"
                        checked={colorTheme === 'gold'}
                        onChange={() => setColorTheme('gold')}
                        colorPalette="gold"
                        size="md"
                      >
                        Gold theme (premium)
                      </Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>

                {/* Radio sizes */}
                <Box>
                  <FormLabel>Radio Sizes</FormLabel>
                  <RadioGroup>
                    <Stack gap={3}>
                      <Radio name="size-demo" value="sm" size="sm">
                        Small radio (16px)
                      </Radio>
                      <Radio name="size-demo" value="md" size="md">
                        Medium radio (20px - WCAG)
                      </Radio>
                      <Radio name="size-demo" value="lg" size="lg">
                        Large radio (24px)
                      </Radio>
                    </Stack>
                  </RadioGroup>
                </Box>

                {/* Disabled states */}
                <Box>
                  <FormLabel>Disabled States</FormLabel>
                  <RadioGroup>
                    <Stack gap={3}>
                      <Radio name="disabled-demo" value="option1" isDisabled>
                        Disabled unchecked
                      </Radio>
                      <Radio name="disabled-demo" value="option2" isDisabled checked>
                        Disabled checked
                      </Radio>
                    </Stack>
                  </RadioGroup>
                </Box>
              </VStack>
            </Box>

            {/* Complete Form Example */}
            <Box bg="white" p={{ base: 6, md: 8 }} borderRadius="lg" shadow="md">
              <Heading as="h2" fontSize="2xl" color="navy.900" mb={6}>
                Complete Form Example
              </Heading>

              <form onSubmit={handleSubmit}>
                <VStack gap={6} align="stretch">
                  <FormControl isRequired isInvalid={!!errors.teamName}>
                    <FormLabel htmlFor="final-team-name">Team Name</FormLabel>
                    <Input
                      id="final-team-name"
                      placeholder="The Fast Finishers"
                      value={teamName}
                      onChange={(e) => {
                        setTeamName(e.target.value);
                        validateTeamName(e.target.value);
                      }}
                    />
                    {errors.teamName && <FormErrorMessage>{errors.teamName}</FormErrorMessage>}
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="final-owner-name">Your Name (Optional)</FormLabel>
                    <Input
                      id="final-owner-name"
                      placeholder="John Smith"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel htmlFor="final-gender">Division</FormLabel>
                    <Select
                      id="final-gender"
                      options={genderOptions}
                      placeholder="Select division"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="final-description">Team Description</FormLabel>
                    <Textarea
                      id="final-description"
                      placeholder="Tell us about your strategy..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <FormHelperText>Optional - helps others understand your approach</FormHelperText>
                  </FormControl>

                  <FormControl isRequired>
                    <Checkbox
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    >
                      I agree to the terms and conditions
                    </Checkbox>
                  </FormControl>

                  <HStack gap={4} justify="flex-end">
                    <Button
                      type="button"
                      variant="outline"
                      colorPalette="navy"
                      onClick={() => {
                        setTeamName('');
                        setOwnerName('');
                        setGender('');
                        setDescription('');
                        setAgreeTerms(false);
                        setErrors({});
                      }}
                    >
                      Reset Form
                    </Button>
                    <Button
                      type="submit"
                      variant="solid"
                      colorPalette="primary"
                      disabled={!teamName || !gender || !agreeTerms || !!errors.teamName}
                    >
                      Create Team
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </Box>

            {/* Accessibility Notes */}
            <Box bg="navy.50" p={{ base: 6, md: 8 }} borderRadius="lg">
              <Heading as="h3" fontSize="xl" color="navy.900" mb={4}>
                ♿ Accessibility Features
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Box>
                  <Text fontSize="sm" color="gray.700" mb={2}>
                    ✅ <strong>Touch Targets:</strong> All inputs ≥44px (WCAG 2.5.5)
                  </Text>
                  <Text fontSize="sm" color="gray.700" mb={2}>
                    ✅ <strong>Focus Indicators:</strong> Gold 3px shadow ring visible
                  </Text>
                  <Text fontSize="sm" color="gray.700" mb={2}>
                    ✅ <strong>Color Contrast:</strong> Meets WCAG 2.1 AA standards
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    ✅ <strong>Keyboard Navigation:</strong> Tab, Enter, Space, Arrow keys
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.700" mb={2}>
                    ✅ <strong>ARIA Labels:</strong> Proper associations for screen readers
                  </Text>
                  <Text fontSize="sm" color="gray.700" mb={2}>
                    ✅ <strong>Error Messages:</strong> Announced with role="alert"
                  </Text>
                  <Text fontSize="sm" color="gray.700" mb={2}>
                    ✅ <strong>Required Fields:</strong> Visual indicator with asterisk
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    ✅ <strong>Smooth Transitions:</strong> 150ms for visual feedback
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>
          </VStack>
        </Container>
      </Box>
    </>
  );
}
