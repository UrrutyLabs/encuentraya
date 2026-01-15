/**
 * Next.js instrumentation file
 * Runs once when the server starts and once per worker
 * Used to initialize Sentry
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initCrashReporting } = await import("./src/lib/crash-reporting");
    initCrashReporting();
  }
}
