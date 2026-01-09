/**
 * Calm Trust color palette tokens
 * Universal color definitions for consistent theming
 */
export const colors = {
  // Primary palette
  primary: "#1F3A5F",
  secondary: "#4A6FA5",
  accent: "#2CB1BC",

  // Background and surface
  bg: "#F7F9FC",
  surface: "#FFFFFF",

  // Text colors
  text: "#0F172A",
  muted: "#64748B",

  // Borders
  border: "#E2E8F0",

  // Semantic colors
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#DC2626",
  info: "#2563EB",
} as const;

export type Colors = typeof colors;
