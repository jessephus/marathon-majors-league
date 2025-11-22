/**
 * Form Component Examples - Marathon Majors Fantasy League
 * 
 * Complete collection of form patterns using Chakra UI v3.
 * All examples follow MMFL design guidelines and accessibility standards.
 * 
 * Related Docs:
 * - /docs/DESIGN_SYSTEM.md
 * - /docs/CORE_DESIGN_GUIDELINES.md
 */

import { 
  FormControl, FormLabel, FormHelperText, FormErrorMessage,
  Input, Select, Checkbox, CheckboxGroup, Radio, RadioGroup,
  Textarea, Switch, Button, VStack, HStack, Stack, Box, Text
} from '@chakra-ui/react';
import { useState } from 'react';

// =============================================================================
// TEXT INPUTS
// =============================================================================

/**
 * Basic Text Input
 * 
 * Usage: Single-line text entry (names, emails, etc.)
 * Accessibility: Automatic label association via htmlFor
 */
export function BasicTextInput() {
  return (
    <FormControl>
      <FormLabel htmlFor="teamName">Team Name</FormLabel>
      <Input 
        id="teamName"
        type="text"
        placeholder="Enter your team name"
        focusBorderColor="primary.500"
      />
      <FormHelperText>Choose a unique name for your team</FormHelperText>
    </FormControl>
  );
}

/**
 * Text Input with Validation
 * 
 * Usage: Forms requiring validation feedback
 * Shows error state and message when validation fails
 */
export function ValidatedTextInput() {
  const [teamName, setTeamName] = useState('');
  const isError = teamName.length > 0 && teamName.length < 3;

  return (
    <FormControl isInvalid={isError}>
      <FormLabel>Team Name</FormLabel>
      <Input 
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        placeholder="Enter your team name"
        focusBorderColor="primary.500"
        errorBorderColor="error.500"
      />
      {isError && (
        <FormErrorMessage>
          Team name must be at least 3 characters
        </FormErrorMessage>
      )}
      <FormHelperText>Minimum 3 characters required</FormHelperText>
    </FormControl>
  );
}

/**
 * Email Input
 * 
 * Usage: Email address collection
 * Built-in browser validation with type="email"
 */
export function EmailInput() {
  return (
    <FormControl isRequired>
      <FormLabel>Email Address</FormLabel>
      <Input 
        type="email"
        placeholder="you@example.com"
        focusBorderColor="primary.500"
      />
      <FormHelperText>We'll never share your email</FormHelperText>
    </FormControl>
  );
}

/**
 * Password Input
 * 
 * Usage: Password entry with visibility toggle
 */
export function PasswordInput() {
  const [show, setShow] = useState(false);

  return (
    <FormControl isRequired>
      <FormLabel>Password</FormLabel>
      <HStack>
        <Input 
          type={show ? 'text' : 'password'}
          placeholder="Enter password"
          focusBorderColor="primary.500"
        />
        <Button size="sm" onClick={() => setShow(!show)}>
          {show ? 'Hide' : 'Show'}
        </Button>
      </HStack>
      <FormHelperText>At least 8 characters with letters and numbers</FormHelperText>
    </FormControl>
  );
}

/**
 * Number Input
 * 
 * Usage: Numeric values (age, salary, budget)
 */
export function NumberInput() {
  return (
    <FormControl>
      <FormLabel>Athlete Salary ($)</FormLabel>
      <Input 
        type="number"
        min={500}
        max={5000}
        step={100}
        placeholder="1000"
        focusBorderColor="primary.500"
      />
      <FormHelperText>Range: $500 - $5,000</FormHelperText>
    </FormControl>
  );
}

// =============================================================================
// SELECT DROPDOWNS
// =============================================================================

/**
 * Basic Select
 * 
 * Usage: Single selection from predefined options
 */
export function BasicSelect() {
  return (
    <FormControl>
      <FormLabel>Race</FormLabel>
      <Select 
        placeholder="Select race"
        focusBorderColor="primary.500"
      >
        <option value="nyc">New York City Marathon</option>
        <option value="boston">Boston Marathon</option>
        <option value="chicago">Chicago Marathon</option>
        <option value="london">London Marathon</option>
        <option value="berlin">Berlin Marathon</option>
        <option value="tokyo">Tokyo Marathon</option>
      </Select>
      <FormHelperText>Choose which marathon to compete in</FormHelperText>
    </FormControl>
  );
}

/**
 * Controlled Select
 * 
 * Usage: Select with state management
 */
export function ControlledSelect() {
  const [race, setRace] = useState('');

  return (
    <FormControl>
      <FormLabel>Select Race</FormLabel>
      <Select 
        value={race}
        onChange={(e) => setRace(e.target.value)}
        placeholder="Choose a race"
        focusBorderColor="primary.500"
      >
        <option value="nyc">NYC Marathon</option>
        <option value="boston">Boston Marathon</option>
        <option value="chicago">Chicago Marathon</option>
      </Select>
      {race && (
        <FormHelperText>Selected: {race.toUpperCase()}</FormHelperText>
      )}
    </FormControl>
  );
}

// =============================================================================
// CHECKBOXES
// =============================================================================

/**
 * Single Checkbox
 * 
 * Usage: Boolean options (agree to terms, enable feature)
 */
export function SingleCheckbox() {
  return (
    <FormControl>
      <Checkbox colorPalette="primary">
        I agree to the terms and conditions
      </Checkbox>
    </FormControl>
  );
}

/**
 * Checkbox Group
 * 
 * Usage: Multiple selections from options
 * Example: Filter athletes by gender, nationality, status
 */
export function CheckboxGroupExample() {
  const [filters, setFilters] = useState<string[]>([]);

  return (
    <FormControl>
      <FormLabel>Filter Athletes</FormLabel>
      <CheckboxGroup value={filters} onChange={(values) => setFilters(values as string[])}>
        <VStack align="start" spacing={2}>
          <Checkbox value="men" colorPalette="primary">Men</Checkbox>
          <Checkbox value="women" colorPalette="primary">Women</Checkbox>
          <Checkbox value="confirmed" colorPalette="primary">Confirmed Only</Checkbox>
          <Checkbox value="top100" colorPalette="primary">Top 100</Checkbox>
        </VStack>
      </CheckboxGroup>
      <FormHelperText>
        Selected: {filters.length} filters
      </FormHelperText>
    </FormControl>
  );
}

// =============================================================================
// RADIO BUTTONS
// =============================================================================

/**
 * Radio Group
 * 
 * Usage: Single selection from mutually exclusive options
 * Example: Gender selection, game mode, payment method
 */
export function RadioGroupExample() {
  const [gameMode, setGameMode] = useState('salary-cap');

  return (
    <FormControl>
      <FormLabel>Game Mode</FormLabel>
      <RadioGroup value={gameMode} onChange={setGameMode}>
        <Stack spacing={3}>
          <Radio value="salary-cap" colorPalette="primary">
            <VStack align="start" spacing={0}>
              <Text fontWeight="semibold">Salary Cap Draft</Text>
              <Text fontSize="sm" color="gray.600">
                Build your team within a $30,000 budget
              </Text>
            </VStack>
          </Radio>
          <Radio value="snake-draft" colorPalette="primary">
            <VStack align="start" spacing={0}>
              <Text fontWeight="semibold">Snake Draft (Legacy)</Text>
              <Text fontSize="sm" color="gray.600">
                Take turns picking athletes
              </Text>
            </VStack>
          </Radio>
        </Stack>
      </RadioGroup>
    </FormControl>
  );
}

// =============================================================================
// TEXTAREA
// =============================================================================

/**
 * Textarea
 * 
 * Usage: Multi-line text entry (descriptions, comments, notes)
 */
export function TextareaExample() {
  return (
    <FormControl>
      <FormLabel>Team Description</FormLabel>
      <Textarea 
        placeholder="Tell us about your team strategy..."
        rows={4}
        focusBorderColor="primary.500"
      />
      <FormHelperText>Optional - share your draft strategy</FormHelperText>
    </FormControl>
  );
}

// =============================================================================
// SWITCH
// =============================================================================

/**
 * Switch Toggle
 * 
 * Usage: Binary on/off settings
 * Example: Enable notifications, private team, auto-save
 */
export function SwitchExample() {
  const [isEnabled, setIsEnabled] = useState(false);

  return (
    <FormControl display="flex" alignItems="center">
      <FormLabel htmlFor="notifications" mb={0}>
        Enable Notifications
      </FormLabel>
      <Switch 
        id="notifications"
        colorPalette="primary"
        isChecked={isEnabled}
        onChange={(e) => setIsEnabled(e.target.checked)}
      />
    </FormControl>
  );
}

/**
 * Switch with Description
 * 
 * Usage: Toggles that need additional context
 */
export function SwitchWithDescription() {
  return (
    <FormControl>
      <HStack justify="space-between" align="start">
        <Box>
          <FormLabel mb={1}>Private Team</FormLabel>
          <FormHelperText mt={0}>
            Only you can see your team roster
          </FormHelperText>
        </Box>
        <Switch colorPalette="primary" />
      </HStack>
    </FormControl>
  );
}

// =============================================================================
// COMPLETE FORMS
// =============================================================================

/**
 * Team Creation Form
 * 
 * Usage: Complete form with multiple field types
 * Features: Validation, error states, submit handling
 */
export function TeamCreationForm() {
  const [formData, setFormData] = useState({
    teamName: '',
    race: '',
    gameMode: 'salary-cap',
    isPrivate: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.teamName.length < 3) {
      newErrors.teamName = 'Team name must be at least 3 characters';
    }
    
    if (!formData.race) {
      newErrors.race = 'Please select a race';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form submitted:', formData);
      // Handle form submission
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        {/* Team Name */}
        <FormControl isInvalid={!!errors.teamName} isRequired>
          <FormLabel>Team Name</FormLabel>
          <Input 
            value={formData.teamName}
            onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
            placeholder="Enter your team name"
            focusBorderColor="primary.500"
          />
          {errors.teamName && (
            <FormErrorMessage>{errors.teamName}</FormErrorMessage>
          )}
          <FormHelperText>Choose a unique name</FormHelperText>
        </FormControl>

        {/* Race Selection */}
        <FormControl isInvalid={!!errors.race} isRequired>
          <FormLabel>Race</FormLabel>
          <Select 
            value={formData.race}
            onChange={(e) => setFormData({ ...formData, race: e.target.value })}
            placeholder="Select race"
            focusBorderColor="primary.500"
          >
            <option value="nyc">New York City Marathon</option>
            <option value="boston">Boston Marathon</option>
            <option value="chicago">Chicago Marathon</option>
          </Select>
          {errors.race && (
            <FormErrorMessage>{errors.race}</FormErrorMessage>
          )}
        </FormControl>

        {/* Game Mode */}
        <FormControl isRequired>
          <FormLabel>Game Mode</FormLabel>
          <RadioGroup 
            value={formData.gameMode}
            onChange={(value) => setFormData({ ...formData, gameMode: value })}
          >
            <Stack spacing={2}>
              <Radio value="salary-cap" colorPalette="primary">
                Salary Cap Draft
              </Radio>
              <Radio value="snake-draft" colorPalette="primary">
                Snake Draft (Legacy)
              </Radio>
            </Stack>
          </RadioGroup>
        </FormControl>

        {/* Privacy Toggle */}
        <FormControl display="flex" alignItems="center">
          <FormLabel mb={0}>Private Team</FormLabel>
          <Switch 
            colorPalette="primary"
            isChecked={formData.isPrivate}
            onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
          />
        </FormControl>

        {/* Submit Buttons */}
        <HStack spacing={3} justify="flex-end">
          <Button variant="ghost" type="button">
            Cancel
          </Button>
          <Button colorPalette="primary" type="submit">
            Create Team
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

/**
 * Search Filter Form
 * 
 * Usage: Inline filters for data tables/lists
 * Features: Horizontal layout, instant filtering
 */
export function SearchFilterForm() {
  return (
    <Stack direction={{ base: 'column', md: 'row' }} spacing={4} align="end">
      <FormControl flex={1}>
        <FormLabel>Search Athletes</FormLabel>
        <Input 
          placeholder="Search by name..."
          focusBorderColor="primary.500"
        />
      </FormControl>

      <FormControl maxW={{ base: 'full', md: '200px' }}>
        <FormLabel>Gender</FormLabel>
        <Select focusBorderColor="primary.500">
          <option value="">All</option>
          <option value="men">Men</option>
          <option value="women">Women</option>
        </Select>
      </FormControl>

      <FormControl maxW={{ base: 'full', md: '200px' }}>
        <FormLabel>Status</FormLabel>
        <Select focusBorderColor="primary.500">
          <option value="">All</option>
          <option value="confirmed">Confirmed</option>
          <option value="probable">Probable</option>
        </Select>
      </FormControl>

      <Button colorPalette="primary">
        Search
      </Button>
    </Stack>
  );
}

// =============================================================================
// ACCESSIBILITY BEST PRACTICES
// =============================================================================

/**
 * Accessible Form Patterns
 * 
 * ✅ DO:
 * - Always use FormLabel with htmlFor matching input id
 * - Provide FormHelperText for instructions
 * - Show FormErrorMessage for validation errors
 * - Mark required fields with isRequired
 * - Use appropriate input types (email, tel, number, etc.)
 * - Group related fields with fieldset/legend
 * - Provide clear error messages
 * - Make error states visually distinct
 * 
 * ❌ DON'T:
 * - Use placeholder as label replacement
 * - Hide labels visually (screen readers need them)
 * - Use generic error messages ("Invalid input")
 * - Validate on every keystroke (wait for blur or submit)
 * - Disable submit button while loading (show loading state)
 */

// =============================================================================
// USAGE DEMO
// =============================================================================

export function FormExamplesDemo() {
  return (
    <VStack spacing={12} align="stretch" p={6} maxW="600px">
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>Text Inputs</Text>
        <VStack spacing={6}>
          <BasicTextInput />
          <ValidatedTextInput />
          <EmailInput />
          <NumberInput />
        </VStack>
      </Box>

      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>Selects</Text>
        <VStack spacing={6}>
          <BasicSelect />
          <ControlledSelect />
        </VStack>
      </Box>

      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>Checkboxes & Radios</Text>
        <VStack spacing={6}>
          <CheckboxGroupExample />
          <RadioGroupExample />
        </VStack>
      </Box>

      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>Other Inputs</Text>
        <VStack spacing={6}>
          <TextareaExample />
          <SwitchExample />
          <SwitchWithDescription />
        </VStack>
      </Box>

      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>Complete Form</Text>
        <TeamCreationForm />
      </Box>
    </VStack>
  );
}

export default FormExamplesDemo;
