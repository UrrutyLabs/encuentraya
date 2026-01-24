# Usage Examples

## Mobile App (React Native)

### Setup (`apps/pro_mobile/src/lib/crash-reporting/index.ts`)

```typescript
import * as Sentry from "@sentry/react-native";
import { createLogger, LogLevel } from "@repo/monitoring/logger";
import {
  createReactNativeAdapter,
  setUserContext as setUserContextShared,
  clearUserContext as clearUserContextShared,
  captureException as captureExceptionShared,
  captureMessage as captureMessageShared,
  addBreadcrumb as addBreadcrumbShared,
} from "@repo/monitoring/sentry";

const adapter = createReactNativeAdapter(Sentry);
const logger = createLogger({
  minLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.WARN,
  enableConsole: true,
  enableCrashReporting: !__DEV__,
});

export function initCrashReporting() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    logger.warn("Sentry DSN not configured. Crash reporting disabled.");
    return;
  }

  Sentry.init({
    dsn,
    debug: __DEV__,
    environment: __DEV__ ? "development" : "production",
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
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

  // Connect logger to Sentry
  logger.setCrashReporter((error, context) => {
    captureExceptionShared(adapter, error, context);
  });

  logger.info("Crash reporting initialized", {
    environment: __DEV__ ? "development" : "production",
  });
}

export function setUserContext(userId: string, email?: string) {
  setUserContextShared(adapter, userId, email);
  logger.debug("User context set", { userId, hasEmail: !!email });
}

export function clearUserContext() {
  clearUserContextShared(adapter);
  logger.debug("User context cleared");
}

export function captureException(
  error: Error,
  context?: Record<string, unknown>
) {
  captureExceptionShared(adapter, error, context);
  logger.error("Exception captured", error, context);
}

export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info"
) {
  captureMessageShared(adapter, message, level);
  logger.info(`Message captured: ${message}`, { level });
}

export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  addBreadcrumbShared(adapter, message, category, data);
}

export { logger };
```

## Client/Admin App (Next.js)

### Setup (`apps/client/src/lib/crash-reporting/index.ts` or `apps/admin/src/lib/crash-reporting/index.ts`)

```typescript
import * as Sentry from "@sentry/nextjs";
import { createLogger, LogLevel } from "@repo/monitoring/logger";
import {
  createNextjsAdapter,
  setUserContext as setUserContextShared,
  clearUserContext as clearUserContextShared,
  captureException as captureExceptionShared,
  captureMessage as captureMessageShared,
  addBreadcrumb as addBreadcrumbShared,
} from "@repo/monitoring/sentry";

const adapter = createNextjsAdapter(Sentry);
const isDevelopment = process.env.NODE_ENV === "development";
const logger = createLogger({
  minLevel: isDevelopment ? LogLevel.DEBUG : LogLevel.WARN,
  enableConsole: true,
  enableCrashReporting: !isDevelopment,
});

export function initCrashReporting() {
  // Sentry is initialized via sentry.client.config.ts and sentry.server.config.ts
  // This function is mainly for setting up logger integration
  logger.setCrashReporter((error, context) => {
    captureExceptionShared(adapter, error, context);
  });

  const environment = isDevelopment ? "development" : "production";
  logger.info("Crash reporting initialized", { environment });
}

export function setUserContext(userId: string, email?: string) {
  setUserContextShared(adapter, userId, email);
  logger.debug("User context set", { userId, hasEmail: !!email });
}

export function clearUserContext() {
  clearUserContextShared(adapter);
  logger.debug("User context cleared");
}

export function captureException(
  error: Error,
  context?: Record<string, unknown>
) {
  captureExceptionShared(adapter, error, context);
  logger.error("Exception captured", error, context);
}

export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info"
) {
  captureMessageShared(adapter, message, level);
  logger.info(`Message captured: ${message}`, { level });
}

export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  addBreadcrumbShared(adapter, message, category, data);
}

export { logger };
```

## Benefits

1. **Code Reuse**: Logger and Sentry utilities are shared across all apps
2. **Consistency**: Same logging and error reporting patterns everywhere
3. **Maintainability**: Fix bugs or add features in one place
4. **Type Safety**: Shared types ensure consistency
5. **Platform Flexibility**: Adapter pattern allows different Sentry SDKs
6. **Easy Migration**: Can migrate apps one at a time without breaking changes
