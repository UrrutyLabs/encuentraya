# Client App

The customer-facing web application for the EncuentraYa marketplace.

## Overview

A Next.js web application that enables customers to:

- Search for professionals by category, location, and availability
- View professional profiles with ratings and reviews
- Create and manage service bookings
- Process payments securely
- Leave reviews after service completion

## Features

- 🔍 **Professional Search** - Filter by category, date, and time window
- 👤 **Professional Profiles** - View ratings, reviews, and service details
- 📅 **Booking Management** - Create, view, and cancel bookings
- 💳 **Payment Processing** - Secure in-app payments via MercadoPago
- ⭐ **Reviews** - Rate and review completed services
- 🔐 **Authentication** - Secure login and signup with Supabase
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **API Client**: tRPC for type-safe API calls
- **Authentication**: Supabase Auth
- **Error Tracking**: Sentry
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm 10.0.0
- API server running (see [API README](../api/README.md))

### Installation

```bash
# From monorepo root
pnpm install

# Or from this directory
cd apps/client
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
   - `SENTRY_*` - Sentry configuration (optional)

### Development

```bash
# Start development server (port 3000)
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
apps/client/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── (auth)/                 # Auth routes (login, signup, etc.)
│   │   ├── (marketplace)/          # Marketplace routes (search, bookings, etc.)
│   │   ├── pro/                    # Professional pages
│   │   ├── settings/               # User settings
│   │   └── page.tsx                # Landing page
│   │
│   ├── components/                 # React components
│   │   ├── ui/                     # UI primitives (Button, Card, etc.)
│   │   ├── presentational/         # Presentational components
│   │   ├── forms/                  # Form components
│   │   ├── auth/                   # Auth-related components
│   │   └── ...
│   │
│   ├── screens/                     # Container components (smart)
│   │   ├── landing/                # Landing screen
│   │   ├── auth/                   # Auth screens
│   │   ├── search/                 # Search screen
│   │   ├── booking/                # Booking screens
│   │   └── ...
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── auth/                   # Auth hooks
│   │   ├── booking/                # Booking hooks
│   │   ├── pro/                    # Professional hooks
│   │   └── ...
│   │
│   └── lib/                         # Utilities and configurations
│       ├── trpc/                   # tRPC client setup
│       ├── supabase/               # Supabase client
│       ├── auth/                   # Auth utilities
│       └── ...
│
└── docs/
    ├── PROJECT_STRUCTURE.md        # Detailed project structure
    └── MOBILE_MIGRATION_PLAN.md    # Future mobile app plan
```

## Architecture

This app follows a **layered component architecture**:

1. **Presentational Components** (`components/ui/`, `components/presentational/`) - Pure UI components, no API calls
2. **Container Components** (`screens/`) - Fetch data, handle state, orchestrate interactions
3. **Hooks** (`hooks/`) - Reusable business logic and data fetching

See [Frontend Best Practices](../../docs/FE_BEST_PRACTICES.md) for detailed architecture guidelines.

## Key Features

### Authentication

- Login/Signup with email
- Email confirmation
- Password reset
- Protected routes with route guards

### Professional Search

- Filter by category (plumbing, electrical, cleaning, etc.)
- Filter by date and time availability
- View professional profiles with ratings

### Booking Management

- Create bookings with date/time selection
- View upcoming and past bookings
- Cancel bookings
- Rebook from previous bookings

### Payment Flow

- Secure checkout process
- MercadoPago integration
- Payment status tracking
- Success/failure handling

### Reviews

- Create reviews after service completion
- Rate professionals (1-5 stars)
- View review history

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

### Preview Deployments

Preview deployments automatically:

- Use staging API URL (`NEXT_PUBLIC_STAGING_API_URL`)
- Set `VERCEL_ENV=preview`
- Allow testing before production merge

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

Test files are located alongside source files with `.test.ts` or `.test.tsx` extension.

## Linting & Type Checking

```bash
# Lint code
pnpm lint

# Type check (from root)
pnpm check-types
```

## Documentation

- **[Frontend Best Practices](../../docs/FE_BEST_PRACTICES.md)** - Architecture and coding guidelines
- **[Project Structure](./docs/PROJECT_STRUCTURE.md)** - Detailed project structure
- **[Mobile Migration Plan](./docs/MOBILE_MIGRATION_PLAN.md)** - Future mobile app architecture

## Related Apps

- **[API](../api/README.md)** - Backend API server
- **[Admin App](../admin/README.md)** - Admin dashboard
- **[Pro Mobile App](../pro_mobile/README.md)** - Professional mobile app
