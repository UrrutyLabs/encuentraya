/**
 * Environment variable validation for API
 *
 * Validates all required environment variables at startup.
 * This runs early to fail fast if configuration is missing or invalid.
 */

import { requireValidEnv, validators } from "@repo/monitoring/env-validation";

/**
 * Validate all required environment variables for the API
 * This function throws an error and exits if validation fails
 */
export function validateApiEnv(): void {
  requireValidEnv({
    // Database - Required
    DATABASE_URL: {
      required: true,
      validate: validators.postgresUrl,
      description: "PostgreSQL connection string",
    },

    // Supabase - Required
    SUPABASE_URL: {
      required: true,
      validate: validators.url,
      description: "Supabase project URL",
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      required: true,
      validate: validators.nonEmpty,
      description: "Supabase service role key (admin privileges)",
    },
    SUPABASE_ANON_KEY: {
      required: true,
      validate: validators.nonEmpty,
      description: "Supabase anonymous key",
    },

    // MercadoPago - Required for payment processing
    MERCADOPAGO_ACCESS_TOKEN: {
      required: true,
      validate: validators.nonEmpty,
      description: "MercadoPago API access token",
    },
    // MercadoPago Webhook Secret - Optional but recommended for production
    // Used to verify webhook signatures for security
    MERCADOPAGO_WEBHOOK_SECRET: {
      required: false,
      validate: validators.nonEmpty,
      description:
        "MercadoPago webhook secret for signature verification (recommended for production)",
    },
    // Client App URL - Required for payment return URLs
    // This is the URL of the client app where payment return pages are hosted
    // In development: http://localhost:3000 (client app port)
    // In production: https://encuentraya.com (or your production client URL)
    CLIENT_URL: {
      required: false,
      validate: (value) => {
        if (!value) return true; // Optional, will use defaults
        return validators.url(value);
      },
      description:
        "Client app URL for payment return redirects (defaults to http://localhost:3000 in dev)",
    },

    // SendGrid - Required for email notifications
    SENDGRID_API_KEY: {
      required: true,
      validate: validators.nonEmpty,
      description: "SendGrid API key for email sending",
    },
    SENDGRID_FROM_EMAIL: {
      required: true,
      validate: validators.email,
      description: "SendGrid sender email address",
    },

    // Twilio - Required for WhatsApp notifications
    TWILIO_ACCOUNT_SID: {
      required: true,
      validate: validators.nonEmpty,
      description: "Twilio account SID",
    },
    TWILIO_AUTH_TOKEN: {
      required: true,
      validate: validators.nonEmpty,
      description: "Twilio authentication token",
    },
    TWILIO_WHATSAPP_FROM_NUMBER: {
      required: true,
      validate: (value) => {
        // Twilio WhatsApp numbers should start with whatsapp:+
        if (!value.startsWith("whatsapp:+")) {
          return "Must start with 'whatsapp:+' (e.g., whatsapp:+14155238886)";
        }
        return true;
      },
      description: "Twilio WhatsApp sender number",
    },

    // Contact form emails - Required
    ADMIN_EMAIL: {
      required: true,
      validate: validators.email,
      description: "Admin email for contact form submissions",
    },
    SUPPORT_EMAIL: {
      required: true,
      validate: validators.email,
      description: "Support email address",
    },

    // Upstash Redis - Optional (falls back to in-memory rate limiting)
    UPSTASH_REDIS_REST_URL: {
      required: false,
      validate: (value) => {
        if (!value) return true; // Optional
        return validators.url(value);
      },
      description: "Upstash Redis REST URL (optional, for rate limiting)",
    },
    UPSTASH_REDIS_REST_TOKEN: {
      required: false,
      validate: validators.nonEmpty,
      description: "Upstash Redis REST token (optional)",
    },

    // CORS - Optional (defaults to "*" in development)
    CORS_ALLOWED_ORIGINS: {
      required: false,
      validate: (value) => {
        if (!value) return true; // Optional
        // Should be comma-separated URLs
        const origins = value.split(",").map((o) => o.trim());
        for (const origin of origins) {
          const urlResult = validators.url(origin);
          if (urlResult !== true) {
            return `Invalid origin in CORS_ALLOWED_ORIGINS: ${origin}`;
          }
        }
        return true;
      },
      description: "Comma-separated list of allowed CORS origins (optional)",
    },

    // Sentry - Optional (for error tracking)
    SENTRY_DSN: {
      required: false,
      validate: validators.url,
      description: "Sentry DSN for error tracking (optional)",
    },
    SENTRY_ORG: {
      required: false,
      validate: validators.nonEmpty,
      description: "Sentry organization slug (optional)",
    },
    SENTRY_PROJECT: {
      required: false,
      validate: validators.nonEmpty,
      description: "Sentry project name (optional)",
    },
    SENTRY_AUTH_TOKEN: {
      required: false,
      validate: validators.nonEmpty,
      description: "Sentry auth token (optional)",
    },
  });
}

/**
 * Call this function early in the application lifecycle
 * Best practice: Call it before initializing database connections or other services
 *
 * @example
 * ```ts
 * // In prisma.ts or at the top of your main entry point
 * import { validateApiEnv } from "@/server/infrastructure/env-validation";
 *
 * // Validate environment variables before doing anything else
 * validateApiEnv();
 * ```
 */
export function initializeEnvValidation(): void {
  try {
    validateApiEnv();
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Environment variables validated successfully");
    }
  } catch (error) {
    // Error is already logged by requireValidEnv
    // Re-throw to prevent app from starting with invalid config
    throw error;
  }
}
