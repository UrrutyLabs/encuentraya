# @repo/monitoring

Shared monitoring utilities for logging and crash reporting across all apps (mobile, client, admin).

## Features

- **Structured Logging**: Platform-agnostic logger with levels, sanitization, and crash reporting integration
- **Sentry Utilities**: Shared functions for user context, error capture, and breadcrumbs
- **Platform Adapters**: Adapters for React Native and Next.js Sentry SDKs

## Installation

Add to your app's `package.json`:

```json
{
  "dependencies": {
    "@repo/monitoring": "workspace:*"
  }
}
```

## Usage

### Logger

```typescript
import { createLogger, LogLevel } from "@repo/monitoring/logger";

const logger = createLogger({
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableCrashReporting: true,
});

logger.info("User logged in", { userId: "123" });
logger.error("Failed to fetch data", error, { endpoint: "/api/data" });
```

### Sentry Utilities

```typescript
import {
  createReactNativeAdapter,
  setUserContext,
  captureException,
} from "@repo/monitoring/sentry";
import * as Sentry from "@sentry/react-native";

const adapter = createReactNativeAdapter(Sentry);

// Set user context
setUserContext(adapter, "user-123", "user@example.com");

// Capture exception
captureException(adapter, error, { context: "booking" });
```

## Platform-Specific Setup

Each app should:

1. Install the appropriate Sentry SDK (`@sentry/react-native` or `@sentry/nextjs`)
2. Initialize Sentry with platform-specific config
3. Create an adapter and pass it to the shared utilities
4. Create a logger instance with platform-specific environment detection

See [EXAMPLES.md](./EXAMPLES.md) for complete setup examples for each platform.
