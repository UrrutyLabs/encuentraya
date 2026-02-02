# EncuentraYa

A local services marketplace connecting clients with trusted professionals for small jobs.

## 🎯 Overview

EncuentraYa is a TaskRabbit-style marketplace that enables:

- **Clients** to find, book, and pay professionals for services
- **Professionals** to manage availability, accept jobs, and get paid
- **Admins** to oversee operations, approve professionals, and handle disputes

This is a production-oriented MVP built with modern web and mobile technologies.

## ✨ Features

### For Clients

- 🔍 Search professionals by category, location, and availability
- 👤 View professional profiles with ratings and reviews
- 📅 Create and manage bookings (with optional photos of the job)
- 💳 In-app payment processing
- ⭐ Leave reviews after service completion

### For Professionals

- 📱 Mobile app for managing jobs on the go
- ⏰ Set availability and service areas
- 📋 Receive and manage job requests (view client photos; add work proof photos on completion)
- 💰 Track earnings and payouts
- 📊 View booking history and statistics

### For Admins

- ✅ Approve/suspend professionals
- 📊 Monitor platform metrics
- 🔧 Handle disputes and refunds
- 📈 View booking and payment analytics

## 🛠️ Tech Stack

### Frontend

- **Web Apps**: Next.js 16 (App Router), TypeScript, React 19
- **Mobile App**: Expo (React Native), Expo Router
- **State Management**: TanStack Query (React Query)
- **API Client**: tRPC for type-safe API calls

### Backend

- **API**: Next.js API routes with tRPC
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth
- **Payments**: MercadoPago integration
- **Notifications**: SendGrid (email), Twilio (WhatsApp), Expo Push Notifications

### Infrastructure

- **Monorepo**: Turborepo + pnpm workspaces
- **Deployment**: Railway (API), Vercel (Web), EAS (Mobile)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry for error tracking

## 📁 Project Structure

```
encuentraya/
├── apps/
│   ├── api/          # tRPC API server (Next.js)
│   ├── client/       # Client web app (Next.js)
│   ├── admin/        # Admin dashboard (Next.js)
│   └── pro_mobile/   # Professional mobile app (Expo)
│
├── packages/
│   ├── domain/       # Shared Zod schemas & domain types
│   ├── trpc/         # Shared tRPC client helpers
│   ├── ui/           # Shared UI components & design tokens
│   ├── react-query/  # React Query utilities
│   └── monitoring/   # Monitoring & logging utilities
│
└── docs/             # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 18
- **pnpm**: 10.0.0 (specified in `packageManager`)
- **PostgreSQL**: For local database (or use Supabase)
- **Expo CLI**: For mobile development (optional)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd encuentraya

# Install dependencies
pnpm install

# Set up environment variables
# Copy .env.example files in each app directory and configure
```

### Environment Setup

Each app requires its own `.env` file. See:

- `apps/api/.env.example`
- `apps/client/.env.example`
- `apps/admin/.env.example`
- `apps/pro_mobile/.env.example`

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter api dev
pnpm --filter client dev
pnpm --filter admin dev
pnpm --filter pro_mobile dev

# Run with production environment variables (local)
pnpm dev:prod
```

### Building

```bash
# Build all apps
pnpm build

# Build for production (with production env vars)
pnpm build:prod

# Start production builds locally
pnpm start:prod
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific app
pnpm --filter api test
```

### Linting & Type Checking

```bash
# Lint all code
pnpm lint

# Type check all code
pnpm check-types

# Format code
pnpm format
```

## 📚 Documentation

- **[Guidelines](./docs/GUIDELINES.md)** - Project guidelines and architecture rules
- **[Order Flow](./docs/ORDER_FLOW.md)** - Order lifecycle, state machine, and transitions
- **[Pricing and Order Strategy](./docs/PRICING_AND_ORDER_STRATEGY.md)** - How hourly vs fixed (quote) pricing works and how it relates to the order flow
- **[Railway Deployment](./apps/api/docs/RAILWAY.md)** - API deployment on Railway
- **[Authentication](./docs/AUTH_IMPLEMENTATION.md)** - Auth implementation details
- **[Backend Best Practices](./docs/BE_BEST_PRACTICES.md)** - Backend development guidelines
- **[Frontend Best Practices](./docs/FE_BEST_PRACTICES.md)** - Frontend development guidelines
- **[Mobile App Deployment](./apps/pro_mobile/docs/EAS_BUILD_AND_DEPLOYMENT.md)** - Mobile app build & deployment
- **[Versioning Guide](./apps/pro_mobile/docs/VERSIONING.md)** - Mobile app versioning strategy

## 🔄 Development Workflow

### Monorepo Commands

All commands use Turborepo for efficient task execution:

```bash
# Run tasks across affected packages only
pnpm turbo run <task>

# Run tasks for all packages
pnpm turbo run <task> --force

# Available tasks: dev, build, lint, test, check-types
```

### Mobile App Workflow

```bash
# Development
cd apps/pro_mobile
pnpm start

# Release (via GitHub Actions)
# Go to Actions → "Pro Mobile Release"
# Select version type and platform
```

### Database

```bash
# Generate Prisma Client
cd apps/api
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

## 🏗️ Architecture

### Monorepo Strategy

- **Shared packages**: Domain types, tRPC helpers, UI components
- **App-specific**: Each app has its own dependencies and config
- **Turborepo**: Handles task orchestration and caching

### API Architecture

- **tRPC**: Type-safe API with automatic type inference
- **Prisma**: Database ORM with migrations
- **Domain-driven**: Shared domain types in `packages/domain`

### Frontend Architecture

- **Component-based**: Reusable UI components in `packages/ui`
- **Server Components**: Next.js App Router with React Server Components
- **Client State**: TanStack Query for server state management

## 🔐 Environment Variables

Key environment variables needed:

- **Database**: `DATABASE_URL`
- **Supabase**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **MercadoPago**: `MERCADOPAGO_ACCESS_TOKEN`
- **SendGrid**: `SENDGRID_API_KEY`
- **Twilio**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- **Sentry**: `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`

See `.env.example` files in each app directory for complete lists.

## 📱 Mobile App

The professional mobile app is built with Expo and React Native:

- **Platforms**: iOS & Android
- **Build**: EAS Build (cloud-based)
- **Updates**: OTA (Over-The-Air) updates via EAS
- **Versioning**: Semantic versioning with `standard-version`

See [Mobile App Documentation](./apps/pro_mobile/docs/EAS_BUILD_AND_DEPLOYMENT.md) for details.

## 🚢 Deployment

### API (Railway)

- Automatic deployments on push to `main`
- Environment variables configured in Railway dashboard
- Database migrations run automatically

### Web Apps (Vercel)

- Automatic deployments on push to `main`
- Preview deployments for pull requests
- Environment variables configured in Vercel dashboard

### Mobile App (EAS)

- Production builds via GitHub Actions
- Preview builds on pull requests
- OTA updates published automatically

## 🤝 Contributing

This is a private, proprietary project. All rights reserved.

See [LICENSE](./LICENSE) for details.

## 📄 License

Copyright (c) 2025 UrrutyLabs

All rights reserved. See [LICENSE](./LICENSE) for details.

## 🔗 Links

- **API**: [Railway Deployment](./apps/api/docs/RAILWAY.md)
- **Mobile**: [Build & Deployment](./apps/pro_mobile/docs/EAS_BUILD_AND_DEPLOYMENT.md)
- **CI/CD**: [GitHub Actions](./.github/workflows/)

---
