# Admin App

The admin dashboard for managing the Arreglatodo marketplace platform.

## Overview

A Next.js web application that provides administrators with tools to:

- Monitor platform metrics and analytics
- Manage professional profiles (approve/suspend)
- View and manage bookings
- Handle payments and payouts
- Process disputes and refunds
- Track notifications and system activity

## Features

- 📊 **Dashboard** - Platform overview with key metrics
- 👥 **Professional Management** - Approve, suspend, and manage professionals
- 📅 **Booking Management** - View and manage all bookings
- 💰 **Payment & Payout Management** - Monitor payments and process payouts
- 🔔 **Notifications** - View notification delivery status
- 📈 **Analytics** - Revenue trends, category performance, booking status breakdown

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **API Client**: tRPC for type-safe API calls
- **Authentication**: Supabase Auth (admin role required)
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm 10.0.0
- API server running (see [API README](../api/README.md))
- Admin user account with `admin` role

### Installation

```bash
# From monorepo root
pnpm install

# Or from this directory
cd apps/admin
pnpm install
```

### Environment Setup

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Configure required environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `NEXT_PUBLIC_API_URL` - API server URL (default: http://localhost:3002)
   - `NEXT_PUBLIC_STAGING_API_URL` - Staging API URL (for preview deployments)

### Development

```bash
# Start development server (port 3001)
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
apps/admin/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── admin/                  # Admin routes (protected)
│   │   │   ├── bookings/          # Booking management
│   │   │   ├── pros/              # Professional management
│   │   │   ├── payments/         # Payment management
│   │   │   ├── payouts/           # Payout management
│   │   │   └── notifications/    # Notification management
│   │   ├── login/                 # Admin login
│   │   └── page.tsx               # Dashboard
│   │
│   ├── components/                 # React components
│   │   ├── ui/                     # UI primitives
│   │   ├── dashboard/             # Dashboard components
│   │   ├── bookings/              # Booking management components
│   │   ├── pros/                  # Professional management components
│   │   ├── payments/              # Payment components
│   │   ├── payouts/               # Payout components
│   │   └── ...
│   │
│   ├── screens/                     # Container components (smart)
│   │   ├── dashboard/             # Dashboard screen
│   │   ├── bookings/              # Booking management screens
│   │   ├── pros/                  # Professional management screens
│   │   ├── payments/              # Payment management screens
│   │   └── payouts/               # Payout management screens
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts             # Admin authentication
│   │   ├── useDashboard.ts        # Dashboard data
│   │   ├── useBookings.ts         # Booking management
│   │   ├── usePros.ts             # Professional management
│   │   ├── usePayments.ts         # Payment management
│   │   └── usePayouts.ts         # Payout management
│   │
│   └── lib/                         # Utilities and configurations
│       ├── trpc/                   # tRPC client setup
│       ├── supabase/               # Supabase client
│       └── env.ts                 # Environment detection
```

## Architecture

This app follows a **layered component architecture**:

1. **Presentational Components** (`components/ui/`, `components/presentational/`) - Pure UI components
2. **Container Components** (`screens/`) - Fetch data, handle state, orchestrate interactions
3. **Hooks** (`hooks/`) - Reusable business logic and data fetching

See [Frontend Best Practices](../../docs/FE_BEST_PRACTICES.md) for detailed architecture guidelines.

## Key Features

### Dashboard

- Platform overview metrics
- Revenue trends and charts
- Booking status breakdown
- Category performance
- Recent activity feed

### Professional Management

- View all professional profiles
- Approve/suspend professionals
- View professional details and audit history
- Filter and search professionals

### Booking Management

- View all bookings across the platform
- Filter by status, date, category
- Force booking status changes (admin override)
- View booking timeline and details

### Payment Management

- View all payment records
- Monitor payment status
- View payment details and history
- Track payment synchronization

### Payout Management

- View payables (earnings ready for payout)
- Process payouts
- View payout history and status
- Track payout failures and retries

### Notifications

- View notification delivery status
- Monitor notification failures
- Track notification channels (email, WhatsApp, push)

## Authentication

The admin app requires:

- User must be authenticated
- User must have `admin` role
- Protected routes automatically redirect non-admin users

See `src/components/auth/AuthenticatedGuard.tsx` for route protection.

## Environment Detection

The app automatically detects the environment and uses the appropriate API URL:

- **Development**: `http://localhost:3002` (or `NEXT_PUBLIC_API_URL`)
- **Preview/Staging**: `NEXT_PUBLIC_STAGING_API_URL` (when `VERCEL_ENV=preview`)
- **Production**: `NEXT_PUBLIC_API_URL` (must be set)

See `src/lib/env.ts` for environment detection logic.

## Deployment

The app is deployed on **Vercel** with automatic deployments:

- **Production**: Deploys on push to `main`
- **Preview**: Deploys on pull requests
- **Environment Variables**: Configured in Vercel dashboard

## Testing

Tests use Vitest and React Testing Library:

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Linting & Type Checking

```bash
# Lint code
pnpm lint

# Type check (from root)
pnpm check-types
```

## Documentation

- **[Frontend Best Practices](../../docs/FE_BEST_PRACTICES.md)** - Architecture and coding guidelines

## Related Apps

- **[API](../api/README.md)** - Backend API server
- **[Client App](../client/README.md)** - Customer web application
- **[Pro Mobile App](../pro_mobile/README.md)** - Professional mobile app
