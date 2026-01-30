# API

The tRPC API server for the Arreglatodo marketplace platform.

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
   - `MERCADOPAGO_ACCESS_TOKEN` - MercadoPago API token
   - `MERCADOPAGO_WEBHOOK_SECRET` - MercadoPago webhook secret (optional, recommended for production)
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

## Related Apps

- **[Client App](../client/README.md)** - Customer web application
- **[Admin App](../admin/README.md)** - Admin dashboard
- **[Pro Mobile App](../pro_mobile/README.md)** - Professional mobile app
