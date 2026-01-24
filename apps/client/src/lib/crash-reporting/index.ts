/**
 * Crash reporting setup and utilities
 * Uses Sentry for error tracking and crash reporting
 * Uses shared monitoring package for utilities
 */

import * as Sentry from "@sentry/nextjs";
import { logger } from "../logger";
import {
  createNextjsAdapter,
  setUserContext as setUserContextShared,
  clearUserContext as clearUserContextShared,
  captureException as captureExceptionShared,
  captureMessage as captureMessageShared,
  addBreadcrumb as addBreadcrumbShared,
} from "@repo/monitoring/sentry";

const adapter = createNextjsAdapter(Sentry);

let isInitialized = false;

/**
 * Initialize Sentry crash reporting
 * Call this early in the app lifecycle (in instrumentation.ts or layout.tsx)
 */
export function initCrashReporting() {
  if (isInitialized) {
    logger.warn("Crash reporting already initialized");
    return;
  }

  try {
    // Sentry is initialized via instrumentation.ts for Next.js
    // This function is mainly for setting up logger integration
    // Configure logger to use Sentry
    logger.setCrashReporter((error, context) => {
      captureExceptionShared(adapter, error, context);
    });

    isInitialized = true;
    const environment =
      process.env.NODE_ENV === "production" ? "production" : "development";
    logger.info("Crash reporting initialized", { environment });
  } catch (error) {
    logger.error(
      "Failed to initialize crash reporting",
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Set user context for crash reports
 */
export function setUserContext(userId: string, email?: string) {
  setUserContextShared(adapter, userId, email);
  logger.debug("User context set for crash reporting", {
    userId,
    hasEmail: !!email,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext() {
  clearUserContextShared(adapter);
  logger.debug("User context cleared");
}

/**
 * Capture a manual error/exception
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
) {
  captureExceptionShared(adapter, error, context);
  logger.error("Exception captured", error, context);
}

/**
 * Capture a message (non-error)
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info"
) {
  captureMessageShared(adapter, message, level);
  logger.info(`Message captured: ${message}`, { level });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  addBreadcrumbShared(adapter, message, category, data);
}

export { logger };
