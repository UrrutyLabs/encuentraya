# Environment Variable Validation

The API uses centralized environment variable validation to ensure all required configuration is present and valid before the application starts.

## How It Works

### 1. Validation Schema

The validation schema is defined in `src/server/infrastructure/env-validation.ts` and includes:

- **Required variables**: Database, Supabase, MercadoPago, SendGrid, Twilio, contact emails
- **Optional variables**: Upstash Redis (for rate limiting), CORS origins, Sentry configuration
- **Custom validators**: URL format, email format, PostgreSQL connection string format, etc.

### 2. Early Validation

Validation runs automatically when the database connection is initialized (in `src/server/infrastructure/db/prisma.ts`):

```typescript
import { initializeEnvValidation } from "../env-validation";

// Validate all environment variables before initializing database connection
initializeEnvValidation();
```

This ensures the app **fails fast** if configuration is missing or invalid, preventing runtime errors.

### 3. Error Messages

If validation fails, you'll see clear error messages:

```
❌ Environment validation failed:

  - Missing required environment variable: DATABASE_URL (PostgreSQL connection string)
  - SUPABASE_URL: Must be a valid URL
  - SENDGRID_FROM_EMAIL: Must be a valid email address

Please check your .env.local file and ensure all required variables are set.
```

## Required Environment Variables

### Core (Always Required)

- `DATABASE_URL` - PostgreSQL connection string (must start with `postgresql://` or `postgres://`)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_ANON_KEY` - Supabase anonymous key

### Payments

- `MERCADOPAGO_ACCESS_TOKEN` - MercadoPago API access token

### Notifications

- `SENDGRID_API_KEY` - SendGrid API key
- `SENDGRID_FROM_EMAIL` - SendGrid sender email (must be valid email)
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_WHATSAPP_FROM_NUMBER` - Twilio WhatsApp number (must start with `whatsapp:+`)

### Contact Form

- `ADMIN_EMAIL` - Admin email address (must be valid email)
- `SUPPORT_EMAIL` - Support email address (must be valid email)

## Optional Environment Variables

These are validated if present but won't cause startup failure if missing:

- `MERCADOPAGO_WEBHOOK_SECRET` - MercadoPago webhook secret for signature verification (recommended for production)
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST URL (for rate limiting)
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST token
- `CORS_ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `SENTRY_DSN` - Sentry DSN for error tracking
- `SENTRY_ORG` - Sentry organization slug
- `SENTRY_PROJECT` - Sentry project name
- `SENTRY_AUTH_TOKEN` - Sentry auth token

## Usage Examples

### Manual Validation (if needed)

You can also call validation manually:

```typescript
import { validateApiEnv } from "@/server/infrastructure/env-validation";

// This will throw if validation fails
validateApiEnv();
```

### Custom Validation

To add custom validation for new environment variables, edit `src/server/infrastructure/env-validation.ts`:

```typescript
export function validateApiEnv(): void {
  requireValidEnv({
    // ... existing validations

    MY_NEW_VAR: {
      required: true,
      validate: (value) => {
        if (value.length < 10) {
          return "Must be at least 10 characters";
        }
        return true;
      },
      description: "My new environment variable",
    },
  });
}
```

## Benefits

1. **Fail Fast**: App won't start with invalid configuration
2. **Clear Errors**: Helpful error messages point to exactly what's wrong
3. **Type Safety**: Uses TypeScript for better IDE support
4. **Centralized**: All validation logic in one place
5. **Reusable**: Uses shared validation utilities from `@repo/monitoring`

## Testing

To test validation, temporarily remove or invalidate a required environment variable:

```bash
# Remove DATABASE_URL from .env.local
# Then try to start the app:
pnpm dev

# You should see validation errors immediately
```
