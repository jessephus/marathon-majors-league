/**
 * Component Overrides - Marathon Majors Fantasy League
 * 
 * Chakra UI component-specific theme customizations.
 * Defines default variants, sizes, and styles for common components.
 * 
 * NOTE: This file serves as reference documentation for Chakra UI v3.
 * Component overrides in Chakra v3 use a different API (recipes/slots).
 * This file is kept for:
 * 1. Documentation of desired component behaviors
 * 2. Reference when implementing v3 recipes
 * 3. Migration guide for future component customization
 * 
 * For Chakra v3, component styles are better implemented using:
 * - Recipe overrides in theme configuration
 * - Inline style props on components
 * - Custom wrapper components in /components/chakra/
 * 
 * Reference: docs/CORE_DESIGN_GUIDELINES.md
 */

export const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      letterSpacing: 'wide',
      borderRadius: 'md',
      transition: 'all 0.2s',
    },
    variants: {
      solid: (props: any) => {
        if (props.colorScheme === 'navy') {
          return {
            bg: 'navy.500',
            color: 'white',
            _hover: {
              bg: 'navy.600',
              transform: 'translateY(-2px)',
              shadow: 'md',
            },
            _active: {
              bg: 'navy.700',
              transform: 'translateY(0)',
            },
          };
        }
        if (props.colorScheme === 'gold') {
          return {
            bg: 'gold.500',
            color: 'navy.900',
            _hover: {
              bg: 'gold.600',
              transform: 'translateY(-2px)',
              shadow: 'md',
            },
            _active: {
              bg: 'gold.700',
              transform: 'translateY(0)',
            },
          };
        }
      },
      outline: (props: any) => {
        if (props.colorScheme === 'navy') {
          return {
            borderColor: 'navy.500',
            color: 'navy.500',
            _hover: {
              bg: 'navy.50',
              borderColor: 'navy.600',
            },
          };
        }
      },
    },
    defaultProps: {
      size: 'md',
      variant: 'solid',
      colorScheme: 'navy',
    },
  },

  Card: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        overflow: 'hidden',
      },
    },
    variants: {
      elevated: {
        container: {
          bg: 'white',
          boxShadow: 'md',
          _hover: {
            boxShadow: 'lg',
            transform: 'translateY(-2px)',
            transition: 'all 0.2s',
          },
        },
      },
      outline: {
        container: {
          borderWidth: '1px',
          borderColor: 'gray.200',
        },
      },
    },
    defaultProps: {
      variant: 'elevated',
    },
  },

  Heading: {
    baseStyle: {
      fontFamily: 'heading',
      fontWeight: 'bold',
      color: 'navy.900',
    },
    sizes: {
      '4xl': {
        fontSize: { base: '2xl', md: '4xl' }, // Responsive: 24px mobile, 36px desktop
        lineHeight: 'tight',
        letterSpacing: 'tight',
      },
      '3xl': {
        fontSize: { base: 'xl', md: '3xl' }, // Responsive: 20px mobile, 30px desktop
        lineHeight: 'tight',
        letterSpacing: 'tight',
      },
      '2xl': {
        fontSize: { base: 'lg', md: '2xl' }, // Responsive: 18px mobile, 24px desktop
        lineHeight: 'snug',
        fontWeight: 'semibold',
      },
      xl: {
        fontSize: 'xl', // 20px
        lineHeight: 'snug',
        fontWeight: 'semibold',
      },
    },
  },

  Input: {
    variants: {
      outline: {
        field: {
          borderColor: 'gray.200',
          _hover: {
            borderColor: 'gray.300',
          },
          _focus: {
            borderColor: 'navy.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-navy-500)',
          },
        },
      },
    },
    defaultProps: {
      focusBorderColor: 'navy.500',
      errorBorderColor: 'error.500',
    },
  },

  Modal: {
    baseStyle: {
      header: {
        bg: 'navy.900',
        color: 'white',
        fontWeight: 'bold',
      },
      closeButton: {
        color: 'white',
        _hover: {
          bg: 'navy.800',
        },
      },
      dialog: {
        borderRadius: 'lg',
      },
    },
  },

  Badge: {
    baseStyle: {
      fontWeight: 'semibold',
      fontSize: 'xs',
      px: 2,
      py: 1,
      borderRadius: 'md',
    },
    variants: {
      solid: (props: any) => {
        if (props.colorScheme === 'navy') {
          return {
            bg: 'navy.500',
            color: 'white',
          };
        }
        if (props.colorScheme === 'gold') {
          return {
            bg: 'gold.500',
            color: 'navy.900',
          };
        }
      },
    },
  },

  Table: {
    variants: {
      striped: {
        thead: {
          tr: {
            bg: 'navy.900',
            th: {
              color: 'white',
              fontWeight: 'semibold',
              textTransform: 'uppercase',
              fontSize: 'xs',
              letterSpacing: 'wider',
            },
          },
        },
        tbody: {
          tr: {
            _odd: {
              bg: 'gray.50',
            },
            _hover: {
              bg: 'navy.50',
            },
          },
        },
      },
    },
    defaultProps: {
      variant: 'striped',
      colorScheme: 'navy',
    },
  },

  Link: {
    baseStyle: {
      color: 'navy.500',
      _hover: {
        color: 'navy.600',
        textDecoration: 'underline',
      },
    },
  },
};
