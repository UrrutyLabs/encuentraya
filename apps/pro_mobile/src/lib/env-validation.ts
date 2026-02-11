/**
 * Environment variable validation for Pro Mobile app
 *
 * Validates all required environment variables at startup.
 * This runs early to fail fast if configuration is missing or invalid.
 *
 * Note: In Expo, environment variables are available at build time,
 * so validation should run early in the app lifecycle.
 */

import { requireValidEnv, validators } from "@repo/monitoring/env-validation";

/**
 * Validate all required environment variables for the Pro Mobile app
 * This function throws an error if validation fails
 *
 * Note: In development, some variables may be optional (e.g., API URL defaults to localhost)
 */
export function validateMobileEnv(): void {
  const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === "production";
  const isDevelopment =
    __DEV__ || process.env.EXPO_PUBLIC_ENVIRONMENT === "development";

  void isDevelopment; // Reserved for future development-specific validation

  requireValidEnv({
    // Supabase - Required
    EXPO_PUBLIC_SUPABASE_URL: {
      required: true,
      validate: validators.url,
      description: "Supabase project URL",
    },
    EXPO_PUBLIC_SUPABASE_ANON_KEY: {
      required: true,
      validate: validators.nonEmpty,
      description: "Supabase anonymous key",
    },

    // API URL - Required in production builds, optional in development
    EXPO_PUBLIC_API_URL: {
      required: isProduction,
      validate: (value) => {
        if (!value && isProduction) {
          return "Required in production builds (set in eas.json or EAS secrets)";
        }
        if (value) {
          return validators.url(value);
        }
        return true; // Optional in development
      },
      description: "API server URL (required in production)",
    },

    // Local API URL - Optional (for physical device testing)
    EXPO_PUBLIC_LOCAL_API_URL: {
      required: false,
      validate: validators.url,
      description:
        "Local API URL for device testing (optional, e.g., http://192.168.1.100:3002)",
    },

    // Staging API URL - Optional
    EXPO_PUBLIC_STAGING_API_URL: {
      required: false,
      validate: validators.url,
      description: "Staging API URL (optional, for preview builds)",
    },

    // Sentry - Optional
    EXPO_PUBLIC_SENTRY_DSN: {
      required: false,
      validate: validators.url,
      description: "Sentry DSN for error tracking (optional)",
    },
    SENTRY_ORG: {
      required: false,
      validate: validators.nonEmpty,
      description: "Sentry organization slug (optional, for EAS builds)",
    },
    SENTRY_PROJECT: {
      required: false,
      validate: validators.nonEmpty,
      description: "Sentry project name (optional, for EAS builds)",
    },
    SENTRY_AUTH_TOKEN: {
      required: false,
      validate: validators.nonEmpty,
      description: "Sentry auth token (optional, for EAS builds)",
    },
  });
}

/**
 * Call this function early in the application lifecycle
 * Best practice: Call it in app/_layout.tsx before rendering
 *
 * @example
 * ```ts
 * // In app/_layout.tsx
 * import { initializeEnvValidation } from "@/lib/env-validation";
 *
 * export default function RootLayout() {
 *   useEffect(() => {
 *     initializeEnvValidation();
 *   }, []);
 *   // ... rest of component
 * }
 * ```
 */
export function initializeEnvValidation(): void {
  try {
    validateMobileEnv();
    if (__DEV__) {
      console.log("✅ Mobile app environment variables validated successfully");
    }
  } catch (error) {
    // Error is already logged by requireValidEnv
    // In mobile, we might want to show a user-friendly error screen
    // For now, we'll log and re-throw
    console.error("❌ Environment validation failed:", error);
    throw error;
  }
}
