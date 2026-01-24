/**
 * Platform-specific Sentry adapters
 * These adapters wrap platform-specific Sentry SDKs to provide a common interface
 */

export interface SentryAdapter {
  setUser: (user: { id: string; email?: string } | null) => void;
  captureException: (
    error: Error,
    options?: { extra?: Record<string, unknown> }
  ) => void;
  captureMessage: (
    message: string,
    options?: { level?: string } | string
  ) => void;
  addBreadcrumb: (breadcrumb: {
    message: string;
    category: string;
    data?: Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sentry level can be string or enum
    level?: string | any;
  }) => void;
}

/**
 * Create a Sentry adapter from @sentry/react-native
 *
 * @example
 * ```typescript
 * import * as Sentry from "@sentry/react-native";
 * const adapter = createReactNativeAdapter(Sentry);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sentry SDK types vary by platform
export function createReactNativeAdapter(sentry: any): SentryAdapter {
  return {
    setUser: (user) => sentry.setUser(user),
    captureException: (error, options) =>
      sentry.captureException(error, options),
    captureMessage: (message, options) => {
      // Handle both object and string level options
      if (typeof options === "string") {
        sentry.captureMessage(message, options);
      } else if (options && typeof options === "object" && "level" in options) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sentry level type compatibility
        sentry.captureMessage(message, { level: options.level as any });
      } else {
        sentry.captureMessage(message);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sentry breadcrumb type compatibility
    addBreadcrumb: (breadcrumb) => sentry.addBreadcrumb(breadcrumb as any),
  };
}

/**
 * Create a Sentry adapter from @sentry/nextjs
 * Works for both client and admin Next.js apps
 *
 * @example
 * ```typescript
 * import * as Sentry from "@sentry/nextjs";
 * const adapter = createNextjsAdapter(Sentry);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sentry SDK types vary by platform
export function createNextjsAdapter(sentry: any): SentryAdapter {
  return {
    setUser: (user) => sentry.setUser(user),
    captureException: (error, options) =>
      sentry.captureException(error, options),
    captureMessage: (message, options) => {
      // Handle both object and string level options
      if (typeof options === "string") {
        sentry.captureMessage(message, options);
      } else if (options && typeof options === "object" && "level" in options) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sentry level type compatibility
        sentry.captureMessage(message, { level: options.level as any });
      } else {
        sentry.captureMessage(message);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sentry breadcrumb type compatibility
    addBreadcrumb: (breadcrumb) => sentry.addBreadcrumb(breadcrumb as any),
  };
}
