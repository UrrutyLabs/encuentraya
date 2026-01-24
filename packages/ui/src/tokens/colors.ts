/**
 * Calm Trust color palette tokens
 * Universal color definitions for consistent theming
 */
export const colors = {
  // Primary palette
  primary: "#2563eb" /* trust-600 */,
  secondary: "#3b82f6" /* trust-500 */,
  accent: "#2CB1BC",

  // Background and surface
  bg: "#f8f9fa" /* calm-50 */,
  surface: "#FFFFFF",

  // Text colors
  text: "#212529" /* calm-900 */,
  muted: "#868e96" /* calm-600 */,

  // Borders
  border: "#e9ecef" /* calm-200 */,

  // Semantic colors
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#DC2626",
  info: "#2563eb" /* trust-600 */,
} as const;

export type Colors = typeof colors;
