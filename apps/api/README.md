# API

The tRPC API server for the EncuentraYa marketplace platform.

## Overview

This Next.js application serves as the backend API for the entire platform, providing type-safe endpoints via tRPC for:

- Client web app
- Admin dashboard
- Professional mobile app

## Features

- **tRPC API**: Type-safe API with automatic type inference
- **Authentication**: Supabase Auth integration
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: MercadoPago integration
- **Notifications**: Email (SendGrid), WhatsApp (Twilio), Push (Expo)
- **Rate Limiting**: Upstash Redis-based rate limiting
- **CORS**: Configurable CORS for cross-origin requests
- **Logging**: Structured logging with Pino
- **Error Tracking**: Sentry integration

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **API**: tRPC v11
- **Database**: PostgreSQL + Prisma
- **Auth**: Supabase Auth
- **Dependency Injection**: TSyringe
- **Validation**: Zod
- **Serialization**: superjson

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL database (or Supabase)
- pnpm 10.0.0

### Installation

```bash
# From monorepo root
pnpm install

# Or from this directory
cd apps/api
pnpm install
```

### Environment Setup

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Configure required environment variables (see `.env.example` for full list):
   - `DATABASE_URL` - PostgreSQL connection string
   - `SUPABASE_URL` - Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
   - `SUPABASE_ANON_KEY` - Supabase anonymous key
   - `MERCADOPAGO_ACCESS_TOKEN` - MercadoPago API token (use `TEST-...` token for development)
   - `MERCADOPAGO_WEBHOOK_SECRET` - MercadoPago webhook secret (optional, recommended for production)
   - `MERCADOPAGO_WEBHOOK_URL` - Mercado Pago webhook URL (optional, use ngrok URL for local development)

   **📖 For local Mercado Pago development with webhooks, see [MERCADOPAGO_LOCAL_DEVELOPMENT.md](./docs/MERCADOPAGO_LOCAL_DEVELOPMENT.md)**
   - `SENDGRID_API_KEY` - SendGrid API key
   - `TWILIO_ACCOUNT_SID` & `TWILIO_AUTH_TOKEN` - Twilio credentials
   - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis
   - `SENTRY_*` - Sentry configuration

### Database Setup

```bash
# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Prisma Studio (optional)
pnpm db:studio
```

### Development

```bash
# Start development server (port 3002)
pnpm dev

# Run with production environment variables locally
pnpm dev:prod

# Build for production
pnpm build:prod

# Start production server locally
pnpm start:prod
```

### Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Project Structure

```
apps/api/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── trpc/
│   │           └── [trpc]/
│   │               └── route.ts    # tRPC route handler
│   │
│   ├── server/
│   │   ├── modules/                 # Domain modules
│   │   │   ├── auth/               # Authentication
│   │   │   ├── booking/            # Booking management
│   │   │   ├── payment/            # Payment processing
│   │   │   ├── payout/             # Payout management
│   │   │   ├── pro/                # Professional profiles
│   │   │   ├── review/             # Reviews
│   │   │   └── ...
│   │   │
│   │   ├── infrastructure/          # Infrastructure layer
│   │   │   ├── auth/               # Auth guards & providers
│   │   │   ├── cors.ts             # CORS configuration
│   │   │   ├── rate-limiter.ts     # Rate limiting
│   │   │   ├── db/                 # Database connection
│   │   │   └── trpc/               # tRPC context
│   │   │
│   │   ├── routers/
│   │   │   └── _app.ts             # Root tRPC router
│   │   │
│   │   └── container/               # Dependency injection
│   │       └── modules/            # DI modules
│   │
│   └── components/
│       └── trpc-provider.tsx       # tRPC React provider
│
└── prisma/
    ├── schema.prisma               # Database schema
    └── migrations/                 # Database migrations
```

## Architecture

This API follows a **layered architecture**:

1. **Routers** (`modules/*/router.ts`) - tRPC procedures, input validation, authorization
2. **Services** (`modules/*/service.ts`) - Business logic, orchestration
3. **Repositories** (`modules/*/repo.ts`) - Data access layer

See [Backend Best Practices](../../docs/BE_BEST_PRACTICES.md) for detailed architecture guidelines.

## Key Modules

### Authentication (`modules/auth/`)

- User authentication via Supabase
- Role-based access control (client, pro, admin)
- Session management

### Bookings (`modules/booking/`)

- Booking creation and lifecycle management
- Status transitions (pending → accepted → completed)
- Availability checking
- Admin booking management

### Payments (`modules/payment/`)

- MercadoPago integration
- Payment pre-authorization
- Payment capture and refunds
- Payment status synchronization

### Payouts (`modules/payout/`)

- Earnings calculation
- Payout profile management
- Payout processing (MercadoPago, bank transfer, manual)
- Payout status tracking

### Notifications (`modules/notification/`)

- Multi-channel notifications (Email, WhatsApp, Push)
- Notification delivery tracking
- Notification policies

## API Endpoints

The API is accessible at `/api/trpc` and uses tRPC's type-safe RPC protocol.

### Example Usage

```typescript
// From client apps
import { trpc } from "@/lib/trpc/client";

// Query
const bookings = trpc.booking.getMine.useQuery();

// Mutation
const createBooking = trpc.booking.create.useMutation();
```

## Database

### Prisma Schema

The database schema is defined in `prisma/schema.prisma`. Key models:

- `User` - Base user model with roles
- `ProProfile` - Professional profiles
- `ClientProfile` - Client profiles
- `Booking` - Service bookings
- `Payment` - Payment records
- `Payout` - Payout records
- `Review` - Service reviews

### Amount Units Convention

**All monetary amounts are stored in MINOR UNITS (cents) to prevent JavaScript float precision issues.**

- **Storage**: All amount fields (`totalAmount`, `subtotalAmount`, `platformFeeAmount`, `taxAmount`, `hourlyRate`, etc.) are stored as integers representing cents
- **Example**: `402.60 UYU` is stored as `40260` cents
- **Conversion**: Use `toMinorUnits()` and `toMajorUnits()` from `@repo/domain` for conversions
- **Display**: Use `formatCurrency(amount, currency, true)` for formatting (pass `true` to indicate minor units)

**Important**: When working with amounts:

- ✅ Store amounts in minor units (cents)
- ✅ Perform calculations in minor units
- ✅ Convert to major units only for display/API responses
- ❌ Never mix major and minor units in calculations

See `packages/domain/src/utils/amount.ts` for conversion utilities.

### Migrations

```bash
# Create a new migration
pnpm db:migrate

# Reset database (development only)
pnpm db:migrate reset
```

## Environment Variables

See `.env.example` for complete list. Key variables:

- **Database**: `DATABASE_URL`
- **Supabase**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- **MercadoPago**: `MERCADOPAGO_ACCESS_TOKEN`
- **SendGrid**: `SENDGRID_API_KEY`
- **Twilio**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- **Upstash**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **CORS**: `CORS_ALLOWED_ORIGINS` (comma-separated)

## Deployment

The API is deployed on **Railway**. See [Railway Deployment Guide](./docs/RAILWAY.md) for complete setup and deployment instructions.

### Deployment Process

1. Push to `main` branch
2. Railway automatically builds and deploys
3. Database migrations run automatically
4. Health checks verify deployment

## Testing

Tests are located alongside source files with `.test.ts` extension.

```bash
# Run all tests
pnpm test

# Run tests for specific module
pnpm test booking

# Watch mode
pnpm test:watch
```

## Linting & Type Checking

```bash
# Lint code
pnpm lint

# Type check (from root)
pnpm check-types
```

## Documentation

- **[Backend Best Practices](../../docs/BE_BEST_PRACTICES.md)** - Architecture and coding guidelines
- **[Railway Deployment](./docs/RAILWAY.md)** - Complete Railway deployment guide
- **[Authentication](../../docs/AUTH_IMPLEMENTATION.md)** - Auth implementation details
- **[Mercado Pago Local Development](./docs/MERCADOPAGO_LOCAL_DEVELOPMENT.md)** - Guide for local Mercado Pago development with webhooks

## Related Apps

- **[Client App](../client/README.md)** - Customer web application
- **[Admin App](../admin/README.md)** - Admin dashboard
- **[Pro Mobile App](../pro_mobile/README.md)** - Professional mobile app
