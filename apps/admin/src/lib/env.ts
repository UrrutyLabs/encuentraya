/**
 * Environment detection and configuration utilities for Admin app
 * 
 * Supports:
 * - Development: localhost
 * - Preview/Staging: Vercel preview deployments
 * - Production: Vercel production deployments
 */

export type Environment = "development" | "preview" | "production";

/**
 * Detect the current environment
 */
export function getEnvironment(): Environment {
  // Vercel provides VERCEL_ENV environment variable
  if (process.env.VERCEL_ENV === "production") {
    return "production";
  }
  if (process.env.VERCEL_ENV === "preview") {
    return "preview";
  }
  // Default to development for local development
  return "development";
}

/**
 * Get the API URL based on the current environment
 * Priority:
 * 1. NEXT_PUBLIC_API_URL (explicit override)
 * 2. Environment-based defaults
 */
export function getApiUrl(): string {
  // Explicit override takes precedence
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  const env = getEnvironment();
  
  switch (env) {
    case "production":
      // Production API URL - should be set in Vercel environment variables
      // Fallback to a placeholder that will fail clearly if not configured
      throw new Error(
        "NEXT_PUBLIC_API_URL must be set for production. " +
        "Configure it in Vercel project settings → Environment Variables"
      );
    case "preview":
      // Staging/preview API URL - can use staging API or production
      // Default to production for preview deployments
      return process.env.NEXT_PUBLIC_STAGING_API_URL || 
             process.env.NEXT_PUBLIC_API_URL || 
             "https://api.arreglatodo.com"; // Update with your staging/production URL
    case "development":
    default:
      return "http://localhost:3002";
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
