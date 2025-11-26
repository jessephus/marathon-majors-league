/**
 * Chakra UI Custom Components with Semantic Color Support
 * 
 * Re-exports custom-wrapped Chakra components that support the colorPalette prop
 * with proper color rendering in Chakra UI v3.
 * 
 * Phase 4 Components:
 * - Button Components: Button, IconButton, ButtonGroup
 * - Badge Component: Status badges and tags
 * - Card Components: Card, AthleteCard, TeamCard, RaceCard, LeaderboardCard, StatsCard
 * - Form Components: Input, Select, Textarea, Checkbox, Radio, FormControl, FormLabel, FormErrorMessage, FormHelperText
 * 
 * Usage:
 *   import { Button, IconButton, ButtonGroup, Badge } from '@/components/chakra';
 *   import { Card, AthleteCard, TeamCard } from '@/components/chakra';
 *   import { Input, Select, FormControl, FormLabel } from '@/components/chakra';
 *   
 *   <Button colorPalette="primary" size="lg">Submit</Button>
 *   <IconButton aria-label="Delete" colorPalette="error" icon={<TrashIcon />} />
 *   <ButtonGroup spacing={3}>
 *     <Button>Cancel</Button>
 *     <Button colorPalette="primary">Save</Button>
 *   </ButtonGroup>
 *   <Badge colorPalette="success">Success</Badge>
 *   
 *   <Card variant="elevated" size="md">
 *     <CardHeader>Title</CardHeader>
 *     <CardBody>Content</CardBody>
 *   </Card>
 *   
 *   <FormControl isRequired isInvalid={!!error}>
 *     <FormLabel>Team Name</FormLabel>
 *     <Input placeholder="Enter name" />
 *     <FormErrorMessage>{error}</FormErrorMessage>
 *   </FormControl>
 */

// Button Components
export { Button } from './Button';
export { IconButton } from './IconButton';
export { ButtonGroup } from './ButtonGroup';

// Badge Component
export { Badge } from './Badge';

// Card Components
export { Card, CardHeader, CardBody, CardFooter } from './Card';
export { AthleteCard } from './AthleteCard';
export { AthleteBrowseCard, AthleteBrowseCardSkeleton } from './AthleteBrowseCard';
export { TeamCard } from './TeamCard';
export { RaceCard } from './RaceCard';
export { LeaderboardCard } from './LeaderboardCard';
export { StatsCard, PresetStatsCards } from './StatsCard';
export { RaceResultCard } from './RaceResultCard';

// Form Components
export { Input } from './Input';
export { Select } from './Select';
export { Textarea } from './Textarea';
export { Checkbox } from './Checkbox';
export { Radio, RadioGroup } from './Radio';
export { 
  FormControl, 
  FormLabel, 
  FormErrorMessage, 
  FormHelperText,
  FormSuccessMessage 
} from './FormControl';

// Re-export types
export type { SemanticButtonProps } from './Button';
export type { SemanticIconButtonProps } from './IconButton';
export type { ButtonGroupProps } from './ButtonGroup';
export type { SemanticBadgeProps } from './Badge';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from './Card';
export type { AthleteCardProps, AthleteCardData } from './AthleteCard';
export type { AthleteBrowseCardProps, AthleteBrowseData } from './AthleteBrowseCard';
export type { TeamCardProps, TeamCardData } from './TeamCard';
export type { RaceCardProps, RaceCardData } from './RaceCard';
export type { LeaderboardCardProps, LeaderboardEntry } from './LeaderboardCard';
export type { StatsCardProps } from './StatsCard';
export type { RaceResultCardProps } from './RaceResultCard';
export type { InputProps } from './Input';
export type { SelectProps, SelectOption } from './Select';
export type { TextareaProps } from './Textarea';
export type { CheckboxProps } from './Checkbox';
export type { RadioProps, RadioGroupProps } from './Radio';
export type { 
  FormControlProps, 
  FormLabelProps, 
  FormErrorMessageProps, 
  FormHelperTextProps,
  FormSuccessMessageProps 
} from './FormControl';
