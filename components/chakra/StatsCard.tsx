/**
 * StatsCard Component
 * 
 * Generic statistics display card for dashboards and reports.
 * Supports various stat types (number, currency, percentage, time).
 * 
 * Features:
 * - Multiple variants (number, currency, percentage, time, custom)
 * - Trend indicators (up/down/neutral)
 * - Icon support
 * - Comparison values (vs previous)
 * - Loading skeleton
 * - Color customization
 * - WCAG 2.1 AA compliant
 * 
 * @example
 * ```tsx
 * <StatsCard
 *   label="Total Points"
 *   value={847}
 *   type="number"
 *   icon={TrophyIcon}
 *   trend="up"
 *   comparison="+12%"
 * />
 * ```
 */

import { Box, Flex, Text, VStack, HStack } from '@chakra-ui/react';
import { Card } from './Card';
import { forwardRef, ComponentType } from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';

// ===========================
// Types
// ===========================

export interface StatsCardProps {
  label: string;
  value: number | string;
  type?: 'number' | 'currency' | 'percentage' | 'time' | 'custom';
  icon?: ComponentType<any>;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  comparison?: string;
  description?: string;
  colorPalette?: 'navy' | 'gold' | 'success' | 'warning' | 'error' | 'info' | 'gray';
  variant?: 'elevated' | 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  [key: string]: any;
}

// ===========================
// StatsCard Component
// ===========================

export const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(({
  label,
  value,
  type = 'number',
  icon: Icon,
  iconColor,
  trend,
  comparison,
  description,
  colorPalette = 'navy',
  variant = 'elevated',
  size = 'md',
  isLoading = false,
  ...props
}, ref) => {
  
  // Format value based on type
  const formatValue = (val: number | string, type: string) => {
    if (typeof val === 'string') return val;
    
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(val);
      case 'percentage':
        return `${val}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(val);
      case 'time':
        // Assume val is in seconds, format as HH:MM:SS or MM:SS
        const hours = Math.floor(val / 3600);
        const minutes = Math.floor((val % 3600) / 60);
        const seconds = Math.floor(val % 60);
        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      default:
        return val;
    }
  };

  // Get trend icon and color
  const getTrendDisplay = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return {
          icon: ArrowUpIcon,
          color: 'success.600',
          bg: 'success.50'
        };
      case 'down':
        return {
          icon: ArrowDownIcon,
          color: 'error.600',
          bg: 'error.50'
        };
      case 'neutral':
        return {
          icon: MinusIcon,
          color: 'gray.500',
          bg: 'gray.50'
        };
    }
  };

  const trendDisplay = trend ? getTrendDisplay(trend) : null;

  // Size-based styles
  const sizeStyles = {
    sm: {
      iconSize: '32px',
      valueSize: 'xl',
      labelSize: 'xs',
    },
    md: {
      iconSize: '40px',
      valueSize: '2xl',
      labelSize: 'sm',
    },
    lg: {
      iconSize: '56px',
      valueSize: '4xl',
      labelSize: 'md',
    },
  };

  const sizes = sizeStyles[size];

  // Color palette mapping
  const colorMap = {
    navy: { color: 'navy.600', bg: 'navy.50' },
    gold: { color: 'gold.600', bg: 'gold.50' },
    success: { color: 'success.600', bg: 'success.50' },
    warning: { color: 'warning.600', bg: 'warning.50' },
    error: { color: 'error.600', bg: 'error.50' },
    info: { color: 'info.600', bg: 'info.50' },
    gray: { color: 'gray.600', bg: 'gray.50' },
  };

  const colors = colorMap[colorPalette];

  return (
    <Card
      ref={ref}
      variant={variant}
      size={size}
      isLoading={isLoading}
      {...props}
    >
      <Flex align="flex-start" gap={4}>
        {/* Icon */}
        {Icon && (
          <Flex
            width={sizes.iconSize}
            height={sizes.iconSize}
            borderRadius="lg"
            bg={colors.bg}
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon style={{
              width: size === 'lg' ? '32px' : size === 'md' ? '24px' : '20px',
              height: size === 'lg' ? '32px' : size === 'md' ? '24px' : '20px',
              color: iconColor || `var(--chakra-colors-${colors.color.replace('.', '-')})`
            }} />
          </Flex>
        )}

        {/* Content */}
        <VStack align="stretch" flex={1} gap={1}>
          <Text
            fontSize={sizes.labelSize}
            color="gray.500"
            textTransform="uppercase"
            letterSpacing="wider"
            fontWeight="medium"
          >
            {label}
          </Text>

          <Flex align="baseline" gap={2} flexWrap="wrap">
            <Text
              fontSize={sizes.valueSize}
              fontWeight="bold"
              color={colors.color}
              lineHeight="1"
            >
              {formatValue(value, type)}
            </Text>

            {/* Trend indicator */}
            {trendDisplay && (
              <Flex
                align="center"
                gap={1}
                px={2}
                py={1}
                borderRadius="md"
                bg={trendDisplay.bg}
                fontSize="xs"
                fontWeight="medium"
                color={trendDisplay.color}
              >
                <trendDisplay.icon style={{ width: '12px', height: '12px' }} />
                {comparison && <Text>{comparison}</Text>}
              </Flex>
            )}
          </Flex>

          {/* Description */}
          {description && (
            <Text fontSize="xs" color="gray.600" lineHeight="short">
              {description}
            </Text>
          )}
        </VStack>
      </Flex>
    </Card>
  );
});

StatsCard.displayName = 'StatsCard';

// ===========================
// Preset Stat Cards
// ===========================

/**
 * PresetStatsCards - Common stat card configurations
 */
export const PresetStatsCards = {
  /**
   * Points card for displaying team/player points
   */
  Points: (props: Partial<StatsCardProps>) => (
    <StatsCard
      label="Total Points"
      type="number"
      colorPalette="navy"
      {...props}
    />
  ),

  /**
   * Currency card for displaying monetary values
   */
  Currency: (props: Partial<StatsCardProps>) => (
    <StatsCard
      label="Salary"
      type="currency"
      colorPalette="gold"
      {...props}
    />
  ),

  /**
   * Athletes card for displaying athlete count
   */
  Athletes: (props: Partial<StatsCardProps>) => (
    <StatsCard
      label="Athletes"
      type="number"
      colorPalette="info"
      {...props}
    />
  ),

  /**
   * Rank card for displaying ranking position
   */
  Rank: (props: Partial<StatsCardProps>) => (
    <StatsCard
      label="Current Rank"
      type="number"
      colorPalette="success"
      {...props}
    />
  ),
};
