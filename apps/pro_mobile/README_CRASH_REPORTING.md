# Crash Reporting & Logging Setup

This app includes structured logging and crash reporting using Sentry.

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Sentry (Optional)

1. Create a Sentry account at https://sentry.io
2. Create a new project for React Native
3. Get your DSN from the project settings
4. Add it to your `.env` file:

```bash
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
```

If you don't set the DSN, crash reporting will be disabled but logging will still work.

### 3. Usage

#### Logging

```typescript
import { logger } from "@/lib/logger";

// Debug logs (only in development)
logger.debug("Debug message", { context: "value" });

// Info logs
logger.info("User logged in", { userId: "123" });

// Warning logs
logger.warn("API request failed", { endpoint: "/api/users" });

// Error logs (automatically reported to Sentry in production)
logger.error("Failed to save data", error, { userId: "123" });
```

#### Crash Reporting

```typescript
import { captureException, setUserContext, clearUserContext } from "@/lib/crash-reporting";

// Manually capture an exception
captureException(error, { additionalContext: "value" });

// Set user context (automatically called on login)
setUserContext(userId, email);

// Clear user context (automatically called on logout)
clearUserContext();
```

## Features

- **Structured Logging**: Log levels (DEBUG, INFO, WARN, ERROR) with context
- **Data Sanitization**: Automatically redacts sensitive information (passwords, tokens, etc.)
- **Error Boundary**: Catches React component errors and prevents full app crashes
- **Crash Reporting**: Automatic error tracking with Sentry (when configured)
- **User Context**: Automatically tracks user ID and email in crash reports
- **React Query Integration**: Automatic error logging for failed queries/mutations

## Development vs Production

- **Development**: All logs are shown in console, crash reporting is disabled
- **Production**: Only WARN and ERROR logs are shown, crash reporting is enabled (if DSN is set)

## Error Boundary

The app includes a global Error Boundary that:
- Catches React component errors
- Shows a user-friendly error screen
- Logs errors with context
- Reports to Sentry (if configured)
- Allows users to retry

## React Query Error Handling

React Query errors are automatically:
- Logged with context
- Reported to Sentry
- Retried up to 2 times (except for 4xx errors)
