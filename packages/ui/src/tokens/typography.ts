/**
 * Typography tokens
 * Font family, sizes, line heights, and weights
 */

export const typography = {
  fontFamily: "Inter",

  sizes: {
    display: {
      fontSize: 32,
      lineHeight: 40,
    },
    h1: {
      fontSize: 24,
      lineHeight: 32,
    },
    h2: {
      fontSize: 20,
      lineHeight: 28,
    },
    h3: {
      fontSize: 18,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
    },
    small: {
      fontSize: 14,
      lineHeight: 20,
    },
    xs: {
      fontSize: 12,
      lineHeight: 16,
    },
  },

  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export type Typography = typeof typography;
