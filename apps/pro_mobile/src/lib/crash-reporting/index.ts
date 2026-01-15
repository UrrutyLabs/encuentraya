/**
 * Crash reporting setup and utilities
 * Uses Sentry for error tracking and crash reporting
 */

import * as Sentry from "@sentry/react-native";
import { logger } from "../logger";

let isInitialized = false;

/**
 * Initialize Sentry crash reporting
 * Call this early in the app lifecycle (in _layout.tsx or index.tsx)
 */
export function initCrashReporting() {
  if (isInitialized) {
    logger.warn("Crash reporting already initialized");
    return;
  }

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    logger.warn("Sentry DSN not configured. Crash reporting disabled.", {
      hint: "Set EXPO_PUBLIC_SENTRY_DSN in your .env file",
    });
    return;
  }

  try {
    Sentry.init({
      dsn,
      debug: __DEV__, // Enable debug mode in development
      environment: __DEV__ ? "development" : "production",
      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
      tracesSampleRate: __DEV__ ? 1.0 : 0.1,
      // Attach user context when available
      beforeSend(event, hint) {
        // Filter out known non-critical errors
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error) {
            // Don't report permission denied errors for push notifications
            if (error.message.includes("permission") || error.message.includes("notification")) {
              return null;
            }
          }
        }
        return event;
      },
    });

    // Configure logger to use Sentry
    logger.setCrashReporter((error, context) => {
      Sentry.captureException(error, {
        extra: context,
      });
    });

    isInitialized = true;
    logger.info("Crash reporting initialized", { environment: __DEV__ ? "development" : "production" });
  } catch (error) {
    logger.error("Failed to initialize crash reporting", error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Set user context for crash reports
 */
export function setUserContext(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email,
  });
  logger.debug("User context set for crash reporting", { userId, hasEmail: !!email });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
  logger.debug("User context cleared");
}

/**
 * Capture a manual error/exception
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
  logger.error("Exception captured", error, context);
}

/**
 * Capture a message (non-error)
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  Sentry.captureMessage(message, {
    level: level as Sentry.SeverityLevel,
  });
  logger.info(`Message captured: ${message}`, { level });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}
