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
 * 
 * Usage:
 *   import { Button, IconButton, ButtonGroup, Badge } from '@/components/chakra';
 *   import { Card, AthleteCard, TeamCard } from '@/components/chakra';
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
 *   <AthleteCard athlete={athleteData} onSelect={handleSelect} />
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
export { TeamCard } from './TeamCard';
export { RaceCard } from './RaceCard';
export { LeaderboardCard } from './LeaderboardCard';
export { StatsCard, PresetStatsCards } from './StatsCard';

// Re-export types
export type { SemanticButtonProps } from './Button';
export type { SemanticIconButtonProps } from './IconButton';
export type { ButtonGroupProps } from './ButtonGroup';
export type { SemanticBadgeProps } from './Badge';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from './Card';
export type { AthleteCardProps, AthleteCardData } from './AthleteCard';
export type { TeamCardProps, TeamCardData } from './TeamCard';
export type { RaceCardProps, RaceCardData } from './RaceCard';
export type { LeaderboardCardProps, LeaderboardEntry } from './LeaderboardCard';
export type { StatsCardProps } from './StatsCard';
