/**
 * Environment variable validation for Admin app
 *
 * Validates all required environment variables at startup.
 * This runs early to fail fast if configuration is missing or invalid.
 */

import { requireValidEnv, validators } from "@repo/monitoring/env-validation";

/**
 * Validate all required environment variables for the Admin app
 * This function throws an error and exits if validation fails
 */
export function validateAdminEnv(): void {
  requireValidEnv({
    // Supabase - Required
    NEXT_PUBLIC_SUPABASE_URL: {
      required: true,
      validate: validators.url,
      description: "Supabase project URL",
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      required: true,
      validate: validators.nonEmpty,
      description: "Supabase anonymous key",
    },

    // API URL - Required in production, optional in development
    NEXT_PUBLIC_API_URL: {
      required: process.env.NODE_ENV === "production",
      validate: (value) => {
        if (!value && process.env.NODE_ENV === "production") {
          return "Required in production";
        }
        if (value) {
          return validators.url(value);
        }
        return true;
      },
      description: "API server URL (required in production)",
    },

    // Staging API URL - Optional
    NEXT_PUBLIC_STAGING_API_URL: {
      required: false,
      validate: validators.url,
      description: "Staging API URL (optional, for preview deployments)",
    },
  });
}

/**
 * Call this function early in the application lifecycle
 * Best practice: Call it in instrumentation.ts (runs on server startup)
 *
 * @example
 * ```ts
 * // In instrumentation.ts
 * import { initializeEnvValidation } from "@/lib/env-validation";
 *
 * export async function register() {
 *   initializeEnvValidation();
 *   // ... rest of initialization
 * }
 * ```
 */
export function initializeEnvValidation(): void {
  try {
    validateAdminEnv();
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Admin app environment variables validated successfully");
    }
  } catch (error) {
    // Error is already logged by requireValidEnv
    // Re-throw to prevent app from starting with invalid config
    throw error;
  }
}
