/**
 * Environment detection and configuration utilities for Mobile app
 * 
 * Supports:
 * - Development: local development with Expo Go
 * - Preview: EAS preview builds
 * - Production: EAS production builds
 */

export type Environment = "development" | "preview" | "production";

/**
 * Detect the current environment
 */
export function getEnvironment(): Environment {
  // EAS Build provides EXPO_PUBLIC_ENVIRONMENT or we can check __DEV__
  if (process.env.EXPO_PUBLIC_ENVIRONMENT === "production") {
    return "production";
  }
  if (process.env.EXPO_PUBLIC_ENVIRONMENT === "preview") {
    return "preview";
  }
  // __DEV__ is true in development mode (Expo Go, development builds)
  if (__DEV__) {
    return "development";
  }
  // Default to production for release builds
  return "production";
}

/**
 * Get the API URL based on the current environment
 * Priority:
 * 1. EXPO_PUBLIC_API_URL (explicit override)
 * 2. Environment-based defaults
 */
export function getApiUrl(): string {
  // Explicit override takes precedence
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const env = getEnvironment();
  
  switch (env) {
    case "production":
      // Production API URL - should be set in EAS secrets or eas.json
      throw new Error(
        "EXPO_PUBLIC_API_URL must be set for production builds. " +
        "Configure it in eas.json build profiles or EAS secrets"
      );
    case "preview":
      // Preview/staging API URL
      return process.env.EXPO_PUBLIC_STAGING_API_URL || 
             "https://api-staging.arreglatodo.com"; // Update with your staging URL
    case "development":
    default:
      // For local development, try to detect local IP or use localhost
      // Note: localhost won't work on physical devices
      return process.env.EXPO_PUBLIC_LOCAL_API_URL || 
             "http://localhost:3002";
  }
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvironment() === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

/**
 * Check if running in preview/staging
 */
export function isPreview(): boolean {
  return getEnvironment() === "preview";
}
