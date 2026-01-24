# Crash Reporting & Logging Setup

This app includes structured logging and crash reporting using Sentry.

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

The following packages are required for full Sentry integration:

- `@sentry/react-native` - Sentry SDK for React Native
- `expo-application` - App information for Sentry context
- `expo-device` - Device information for Sentry context
- `expo-updates` - OTA updates integration
- `expo-constants` - Environment constants

### 2. Configure Sentry

#### Local Development

1. Create a Sentry account at https://sentry.io
2. Create a new project for React Native
3. Get your DSN from the project settings
4. Add it to your `.env` file:

```bash
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
```

If you don't set the DSN, crash reporting will be disabled but logging will still work.

#### Production Builds (EAS Build)

For production builds with native crash reporting and source maps, you need to configure the Expo plugin in `app.json` and set up EAS secrets:

1. **Configure Environment Variables in EAS:**

```bash
# Set these in EAS secrets or your CI/CD environment
eas secret:create --scope project --name SENTRY_ORG --value your-org-slug
eas secret:create --scope project --name SENTRY_PROJECT --value your-project-name
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value your-auth-token
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value https://your-dsn@sentry.io/your-project-id
```

2. **Get Sentry Auth Token:**
   - Go to Sentry Settings → Auth Tokens
   - Create a new token with scopes: `project:releases`, `org:read`, `project:read`, `project:write`
   - Use this token for `SENTRY_AUTH_TOKEN`

3. **The Expo Plugin:**

   The `@sentry/react-native/expo` plugin is already configured in `app.json`. It automatically:
   - Uploads source maps during EAS builds
   - Uploads native symbols for iOS/Android
   - Creates releases in Sentry
   - Links commits to releases

   The plugin uses environment variables:
   - `SENTRY_ORG` - Your Sentry organization slug
   - `SENTRY_PROJECT` - Your Sentry project name
   - `SENTRY_AUTH_TOKEN` - Auth token (optional, can be set in plugin config)
   - `SENTRY_URL` - Sentry server URL (defaults to https://sentry.io/)

**Note:** The plugin configuration in `app.json` uses environment variable placeholders that are resolved during EAS builds. Make sure these are set in your EAS secrets or build environment.

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
import {
  captureException,
  setUserContext,
  clearUserContext,
} from "@/lib/crash-reporting";

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
  - **JavaScript Errors**: Captured automatically via error boundaries and unhandled promise rejections
  - **Native Crashes**: iOS/Android native crashes are captured and symbolicated (requires EAS build with plugin)
  - **Source Maps**: Automatically uploaded during EAS builds for readable stack traces
  - **Release Tracking**: Releases are automatically created and linked to commits
- **User Context**: Automatically tracks user ID and email in crash reports
- **React Query Integration**: Automatic error logging for failed queries/mutations
- **Device Context**: Automatically includes device info, app version, and environment details

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
