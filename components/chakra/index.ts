/**
 * Chakra UI Custom Components with Semantic Color Support
 * 
 * Re-exports custom-wrapped Chakra components that support the colorPalette prop
 * with proper color rendering in Chakra UI v3.
 * 
 * Phase 4 Components (Button Variants):
 * - Button: Primary button component with all variants
 * - IconButton: Icon-only button variant
 * - ButtonGroup: Group multiple buttons with consistent spacing
 * - Badge: Status badges and tags
 * 
 * Usage:
 *   import { Button, IconButton, ButtonGroup, Badge } from '@/components/chakra';
 *   
 *   <Button colorPalette="primary" size="lg">Submit</Button>
 *   <IconButton aria-label="Delete" colorPalette="error" icon={<TrashIcon />} />
 *   <ButtonGroup spacing={3}>
 *     <Button>Cancel</Button>
 *     <Button colorPalette="primary">Save</Button>
 *   </ButtonGroup>
 *   <Badge colorPalette="success">Success</Badge>
 */

export { Button } from './Button';
export { IconButton } from './IconButton';
export { ButtonGroup } from './ButtonGroup';
export { Badge } from './Badge';

// Re-export types
export type { SemanticButtonProps } from './Button';
export type { SemanticIconButtonProps } from './IconButton';
export type { ButtonGroupProps } from './ButtonGroup';
