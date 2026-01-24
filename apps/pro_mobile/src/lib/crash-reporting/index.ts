/**
 * Crash reporting setup and utilities
 * Uses Sentry for error tracking and crash reporting
 * Uses shared monitoring package for utilities
 *
 * Note: Sentry is disabled when running in Expo Go (no custom native modules supported)
 */

import Constants from "expo-constants";
import { logger } from "../logger";

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === "storeClient";

// Conditionally import Sentry only if not in Expo Go
let Sentry: typeof import("@sentry/react-native") | null = null;
let adapter: ReturnType<
  typeof import("@repo/monitoring/sentry").createReactNativeAdapter
> | null = null;

if (!isExpoGo) {
  try {
    Sentry = require("@sentry/react-native");
    const { createReactNativeAdapter } = require("@repo/monitoring/sentry");
    adapter = createReactNativeAdapter(Sentry);
  } catch (error) {
    logger.warn("Sentry not available (may be running in Expo Go)", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

let isInitialized = false;

/**
 * Initialize Sentry crash reporting
 * Call this early in the app lifecycle (in _layout.tsx or index.tsx)
 *
 * Note: Automatically disabled when running in Expo Go
 */
export function initCrashReporting() {
  if (isInitialized) {
    logger.warn("Crash reporting already initialized");
    return;
  }

  // Skip Sentry initialization in Expo Go (custom native modules not supported)
  if (isExpoGo) {
    logger.info(
      "Running in Expo Go - Sentry disabled (custom native modules not supported)"
    );
    isInitialized = true; // Mark as initialized to prevent retries
    return;
  }

  // Check if Sentry is available
  if (!Sentry || !adapter) {
    logger.warn("Sentry not available. Crash reporting disabled.", {
      hint: "Sentry requires a development build or production build (not Expo Go)",
    });
    isInitialized = true;
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
    // Determine environment: use EXPO_PUBLIC_ENVIRONMENT if set, otherwise infer from __DEV__
    const environment =
      process.env.EXPO_PUBLIC_ENVIRONMENT ||
      (__DEV__ ? "development" : "production");

    // Lower sample rate for preview builds to reduce noise
    const isPreview = environment === "preview";
    const tracesSampleRate = __DEV__ ? 1.0 : isPreview ? 0.05 : 0.1; // 5% for preview, 10% for production

    Sentry.init({
      dsn,
      debug: false, // Disable debug mode to prevent console output
      environment,
      // Set tracesSampleRate based on environment
      tracesSampleRate,
      // Attach user context when available
      beforeSend(event, hint) {
        // Prevent sending events in non-production environments
        if (__DEV__) {
          return null;
        }

        // Filter out known non-critical errors
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error) {
            // Don't report permission denied errors for push notifications
            if (
              error.message.includes("permission") ||
              error.message.includes("notification")
            ) {
              return null;
            }
          }
        }
        return event;
      },
    });

    // Configure logger to use Sentry
    const {
      captureException: captureExceptionShared,
    } = require("@repo/monitoring/sentry");
    logger.setCrashReporter((error, context) => {
      if (adapter) {
        captureExceptionShared(adapter, error, context);
      }
    });

    isInitialized = true;
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
 * No-op when running in Expo Go
 */
export function setUserContext(userId: string, email?: string) {
  if (!adapter || isExpoGo) {
    logger.debug("User context set (Sentry disabled)", {
      userId,
      hasEmail: !!email,
    });
    return;
  }
  const {
    setUserContext: setUserContextShared,
  } = require("@repo/monitoring/sentry");
  setUserContextShared(adapter, userId, email);
  logger.debug("User context set for crash reporting", {
    userId,
    hasEmail: !!email,
  });
}

/**
 * Clear user context (e.g., on logout)
 * No-op when running in Expo Go
 */
export function clearUserContext() {
  if (!adapter || isExpoGo) {
    logger.debug("User context cleared (Sentry disabled)");
    return;
  }
  const {
    clearUserContext: clearUserContextShared,
  } = require("@repo/monitoring/sentry");
  clearUserContextShared(adapter);
  logger.debug("User context cleared");
}

/**
 * Capture a manual error/exception
 * No-op when running in Expo Go
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
) {
  if (!adapter || isExpoGo) {
    // In Expo Go, just log the error (Sentry is disabled)
    // Don't show "Sentry disabled" for expected errors to reduce noise
    const isJsonParseError = error.message.includes("JSON Parse error");
    if (isJsonParseError && context?.apiUrl) {
      logger.error("API connection error", error, {
        ...context,
        message: `Cannot connect to API at ${context.apiUrl}. Make sure API server is running and accessible.`,
      });
    } else {
      logger.error("Exception captured", error, context);
    }
    return;
  }
  const {
    captureException: captureExceptionShared,
  } = require("@repo/monitoring/sentry");
  captureExceptionShared(adapter, error, context);
  logger.error("Exception captured", error, context);
}

/**
 * Capture a message (non-error)
 * No-op when running in Expo Go
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info"
) {
  if (!adapter || isExpoGo) {
    logger.info(`Message captured (Sentry disabled): ${message}`, { level });
    return;
  }
  const {
    captureMessage: captureMessageShared,
  } = require("@repo/monitoring/sentry");
  captureMessageShared(adapter, message, level);
  logger.info(`Message captured: ${message}`, { level });
}

/**
 * Add breadcrumb for debugging
 * No-op when running in Expo Go
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  if (!adapter || isExpoGo) {
    return;
  }
  const {
    addBreadcrumb: addBreadcrumbShared,
  } = require("@repo/monitoring/sentry");
  addBreadcrumbShared(adapter, message, category, data);
}

export { logger };
