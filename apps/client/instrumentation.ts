/**
 * Next.js instrumentation file
 * Runs once when the server starts and once per worker
 * Used to initialize Sentry
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize Sentry server-side
    const Sentry = await import("@sentry/nextjs");
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

    if (dsn) {
      Sentry.init({
        dsn,
        // Adjust this value in production, or use tracesSampler for greater control
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: process.env.NODE_ENV === "development",
        environment: process.env.NODE_ENV === "production" ? "production" : "development",
        // Filter out known non-critical errors
        beforeSend(event, hint) {
          if (event.exception) {
            const error = hint.originalException;
            if (error instanceof Error) {
              // Don't report permission denied errors
              if (error.message.includes("permission") || error.message.includes("Permission")) {
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
