# Pro Mobile App

The professional mobile application for the Arreglatodo marketplace platform.

## Overview

An Expo (React Native) mobile application that enables professionals to:

- Manage availability and service areas
- Receive and respond to job requests
- Track bookings and job status
- View earnings and payout information
- Complete jobs and manage their professional profile

## Features

- 📱 **Native Mobile App** - iOS and Android support
- ⏰ **Availability Management** - Set available time slots
- 📋 **Job Management** - Accept, reject, and complete bookings
- 💰 **Earnings Tracking** - View earnings summary and payout history
- 🔔 **Push Notifications** - Real-time job request notifications
- 🌐 **Offline Support** - Works offline with sync when online
- 🐛 **Crash Reporting** - Sentry integration for error tracking

## Tech Stack

- **Framework**: Expo (React Native)
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript
- **State Management**: TanStack Query (React Query)
- **API Client**: tRPC for type-safe API calls
- **Authentication**: Supabase Auth
- **Build & Deploy**: EAS Build & EAS Update
- **Error Tracking**: Sentry
- **Testing**: Jest + React Native Testing Library

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm 10.0.0
- Expo CLI (optional, can use `npx expo`)
- API server running (see [API README](../api/README.md))
- iOS Simulator (macOS) or Android Emulator (optional)

### Installation

```bash
# From monorepo root
pnpm install

# Or from this directory
cd apps/pro_mobile
pnpm install
```

### Environment Setup

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Configure required environment variables:
   - `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `EXPO_PUBLIC_API_URL` - API server URL
   - `EXPO_PUBLIC_LOCAL_API_URL` - Local API URL for device testing (your computer's LAN IP)
   - `EXPO_PUBLIC_STAGING_API_URL` - Staging API URL (optional)
   - `EXPO_PUBLIC_SENTRY_DSN` - Sentry DSN (optional)

### Development

```bash
# Start Expo development server
pnpm start

# Start with production environment
pnpm start:prod

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android

# Run on web (for testing)
pnpm web
```

### Testing on Physical Device

1. Ensure your phone and computer are on the same network
2. Set `EXPO_PUBLIC_LOCAL_API_URL` to your computer's LAN IP (e.g., `http://192.168.1.100:3002`)
3. Start the dev server: `pnpm start`
4. Scan QR code with Expo Go app (iOS) or Camera app (Android)

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
apps/pro_mobile/
├── app/                            # Expo Router routes
│   ├── _layout.tsx                # Root layout
│   ├── index.tsx                  # Auth guard & redirect
│   ├── (tabs)/                    # Tab navigator
│   │   ├── home.tsx               # Home tab
│   │   ├── jobs.tsx               # Jobs tab
│   │   ├── availability.tsx      # Availability tab
│   │   └── profile.tsx           # Profile tab
│   ├── auth/                      # Auth routes
│   ├── booking/                   # Booking routes
│   └── settings/                  # Settings routes
│
├── src/
│   ├── components/                # React components
│   │   ├── ui/                    # UI primitives
│   │   └── presentational/        # Presentational components
│   │
│   ├── screens/                    # Container components (smart)
│   │   ├── home/                  # Home screen
│   │   ├── jobs/                  # Jobs screen
│   │   ├── booking/               # Booking detail screen
│   │   ├── availability/          # Availability screen
│   │   └── ...
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── auth/                  # Auth hooks
│   │   ├── booking/               # Booking hooks
│   │   ├── pro/                   # Professional hooks
│   │   └── ...
│   │
│   └── lib/                        # Utilities and configurations
│       ├── trpc/                   # tRPC client setup
│       ├── supabase/               # Supabase client
│       ├── env.ts                  # Environment detection
│       └── crash-reporting/        # Sentry setup
│
└── docs/                           # App-specific documentation
    ├── EAS_BUILD_AND_DEPLOYMENT.md # Build & deployment guide
    ├── VERSIONING.md               # Versioning strategy
    ├── RELEASE_WORKFLOW.md         # Release workflow
    └── ...
```

## Architecture

This app follows a **layered component architecture**:

1. **Presentational Components** (`components/presentational/`) - Pure UI components
2. **Container Components** (`screens/`) - Fetch data, handle state, orchestrate interactions
3. **Hooks** (`hooks/`) - Reusable business logic and data fetching

See [Frontend Best Practices](../../docs/FE_BEST_PRACTICES.md) for architecture guidelines.

## Key Features

### Home Tab

- New job requests
- Upcoming jobs
- Quick actions (accept/reject)

### Jobs Tab

- List of all jobs (upcoming, completed)
- Job status tracking
- Job details and actions

### Availability Tab

- Set available time slots
- Toggle availability on/off
- Manage service areas

### Profile Tab

- Professional profile information
- Earnings summary
- Payout history
- Settings and help

### Booking Management

- Accept/reject job requests
- Update job status (on my way, arrived, completed)
- View booking details
- Cancel bookings

## Environment Detection

The app automatically detects the environment and uses the appropriate API URL:

- **Development**: Uses `EXPO_PUBLIC_LOCAL_API_URL` or falls back to `localhost:3002`
- **Preview**: Uses `EXPO_PUBLIC_STAGING_API_URL` (when `EXPO_PUBLIC_ENVIRONMENT=preview`)
- **Production**: Uses `EXPO_PUBLIC_API_URL` (must be set)

See `src/lib/env.ts` for environment detection logic.

## Building & Deployment

The app uses **EAS Build** for cloud-based builds and **EAS Update** for OTA updates.

### Build Profiles

- **development** - Development client builds
- **preview** - Preview builds for testing (PR builds)
- **production** - Production builds for app stores

### Building

```bash
# Build for iOS (preview)
eas build --platform ios --profile preview

# Build for Android (preview)
eas build --platform android --profile preview

# Build for both platforms (production)
eas build --platform all --profile production
```

### OTA Updates

```bash
# Publish OTA update to production branch
eas update --branch production --message "Update message"

# Publish to preview branch
eas update --branch preview --message "Preview update"
```

### Release Workflow

Releases are handled via GitHub Actions. See:

- **[Release Workflow](./docs/RELEASE_WORKFLOW.md)** - How to release
- **[Versioning Guide](./docs/VERSIONING.md)** - Version management
- **[EAS Build & Deployment](./docs/EAS_BUILD_AND_DEPLOYMENT.md)** - Complete build guide

## Testing

Tests use Jest and React Native Testing Library:

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Offline Support

The app includes offline support with:

- Query persistence (React Query)
- Network status detection
- Automatic retry when online
- Offline indicators

See [Offline Support Documentation](./docs/README_OFFLINE_SUPPORT.md) for details.

## Crash Reporting

Sentry is integrated for crash reporting and error tracking:

- Automatic error capture
- Performance monitoring
- User context tracking
- Source maps for debugging

See [Crash Reporting Documentation](./docs/README_CRASH_REPORTING.md) for details.

## Documentation

- **[EAS Build & Deployment](./docs/EAS_BUILD_AND_DEPLOYMENT.md)** - Complete build and deployment guide
- **[Versioning Guide](./docs/VERSIONING.md)** - Version management strategy
- **[Release Workflow](./docs/RELEASE_WORKFLOW.md)** - GitHub Actions release process
- **[React Query Guide](./docs/README_REACT_QUERY.md)** - React Query usage
- **[Offline Support](./docs/README_OFFLINE_SUPPORT.md)** - Offline capabilities
- **[Crash Reporting](./docs/README_CRASH_REPORTING.md)** - Sentry integration
- **[Expo Go Setup](./docs/EXPO_GO_SETUP.md)** - Development setup

## Related Apps

- **[API](../api/README.md)** - Backend API server
- **[Client App](../client/README.md)** - Customer web application
- **[Admin App](../admin/README.md)** - Admin dashboard
