/**
 * Shared Sentry utilities
 * Platform-agnostic functions that work with any Sentry SDK via adapter pattern
 */

import type { SentryAdapter } from "./adapters";

export type { SentryAdapter } from "./adapters";
export { createReactNativeAdapter, createNextjsAdapter } from "./adapters";

/**
 * Set user context for crash reports
 * Works with any Sentry SDK via adapter pattern
 */
export function setUserContext(
  adapter: SentryAdapter,
  userId: string,
  email?: string
) {
  adapter.setUser({
    id: userId,
    email,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext(adapter: SentryAdapter) {
  adapter.setUser(null);
}

/**
 * Capture a manual error/exception
 */
export function captureException(
  adapter: SentryAdapter,
  error: Error,
  context?: Record<string, unknown>
) {
  adapter.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message (non-error)
 */
export function captureMessage(
  adapter: SentryAdapter,
  message: string,
  level: "info" | "warning" | "error" = "info"
) {
  adapter.captureMessage(message, {
    level,
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  adapter: SentryAdapter,
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  adapter.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}
