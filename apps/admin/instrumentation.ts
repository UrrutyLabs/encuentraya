/**
 * Next.js instrumentation file
 * Runs once when the server starts and once per worker
 * Used to validate environment variables
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Validate environment variables before initializing anything else
    const { initializeEnvValidation } =
      await import("./src/lib/env-validation");
    initializeEnvValidation();
  }
}
