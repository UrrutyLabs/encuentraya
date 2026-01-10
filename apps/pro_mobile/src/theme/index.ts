/**
 * Theme module for mobile app
 * Exports design tokens from @repo/ui for use in React Native components
 */
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} from "@repo/ui";

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
};

export type Theme = typeof theme;
