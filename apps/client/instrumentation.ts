/**
 * Next.js instrumentation file
 * Runs once when the server starts and once per worker
 * Used to initialize Sentry and validate environment variables
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Validate environment variables before initializing anything else
    const { initializeEnvValidation } =
      await import("./src/lib/env-validation");
    initializeEnvValidation();
    // Initialize Sentry server-side
    const Sentry = await import("@sentry/nextjs");
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

    if (dsn) {
      Sentry.init({
        dsn,
        // Adjust this value in production, or use tracesSampler for greater control
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        // Disable debug mode to prevent console output in development
        debug: false,
        environment:
          process.env.NODE_ENV === "production" ? "production" : "development",
        // Filter out known non-critical errors
        beforeSend(event, hint) {
          // Prevent sending events in non-production environments
          if (process.env.NODE_ENV !== "production") {
            return null;
          }

          if (event.exception) {
            const error = hint.originalException;
            if (error instanceof Error) {
              // Don't report permission denied errors
              if (
                error.message.includes("permission") ||
                error.message.includes("Permission")
              ) {
                return null;
              }
            }
          }
          return event;
        },
      });
    }
    const { initCrashReporting } = await import("./src/lib/crash-reporting");
    initCrashReporting();
  }
}
