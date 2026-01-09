# Supabase Authentication Implementation

This document describes the Supabase authentication implementation across all apps.

## Files Changed

### Backend (apps/api)

1. **New Files:**
   - `src/server/auth/provider.ts` - Auth provider abstraction interface
   - `src/server/auth/providers/supabase.provider.ts` - Supabase provider implementation

2. **Modified Files:**
   - `src/server/trpc/context.ts` - Updated to read Bearer token and verify with Supabase
   - `src/server/repositories/user.repo.ts` - Updated to support creating users with external ID (Supabase user ID)
   - `src/app/api/trpc/[trpc]/route.ts` - Updated to handle async context creation
   - `package.json` - Added `@supabase/supabase-js` dependency

### Frontend - Client (apps/client)

1. **New Files:**
   - `src/lib/supabase/client.ts` - Supabase browser client wrapper
   - `src/app/login/page.tsx` - Login page
   - `src/app/signup/page.tsx` - Signup page

2. **Modified Files:**
   - `src/components/trpc-provider.tsx` - Updated to attach Authorization header with Bearer token
   - `package.json` - Added `@supabase/supabase-js` dependency

### Frontend - Admin (apps/admin)

1. **New Files:**
   - `src/lib/supabase/client.ts` - Supabase browser client wrapper
   - `src/app/login/page.tsx` - Admin login page
   - `src/app/signup/page.tsx` - Admin signup page

2. **Modified Files:**
   - `src/components/trpc-provider.tsx` - Updated to attach Authorization header with Bearer token
   - `package.json` - Added `@supabase/supabase-js` dependency

### Mobile (apps/mobile)

1. **New Files:**
   - `lib/supabase/client.ts` - Supabase client wrapper for Expo
   - `screens/LoginScreen.tsx` - Mobile login screen

2. **Modified Files:**
   - `components/TRPCProvider.tsx` - Updated to attach Authorization header with Bearer token
   - `App.tsx` - Updated to show login screen and protected content
   - `package.json` - Added `@supabase/supabase-js` dependency

## Environment Variables

### Backend (apps/api)

Create `.env.local` in `apps/api/`:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Frontend - Client (apps/client)

Create `.env.local` in `apps/client/`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3002
```

### Frontend - Admin (apps/admin)

Create `.env.local` in `apps/admin/`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3002
```

### Mobile (apps/mobile)

Create `.env` in `apps/mobile/`:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=http://localhost:3002
```

**Note:** For mobile development, you may need to use your local machine's IP address instead of `localhost` (e.g., `http://192.168.1.100:3002`).

## How to Run

### 1. Install Dependencies

From the root directory:

```bash
pnpm install
```

### 2. Set Up Environment Variables

Create the `.env.local` (or `.env` for mobile) files as described above with your Supabase credentials.

### 3. Run Backend API

```bash
cd apps/api
pnpm dev
```

The API will run on `http://localhost:3002`

### 4. Run Client App

```bash
cd apps/client
pnpm dev
```

The client app will run on `http://localhost:3000`

### 5. Run Admin App

```bash
cd apps/admin
pnpm dev
```

The admin app will run on `http://localhost:3001`

### 6. Run Mobile App

```bash
cd apps/mobile
pnpm start
```

Then press `i` for iOS simulator or `a` for Android emulator.

## Testing Authentication

### Test with curl

1. **Get an access token** (sign up/login via one of the frontend apps, then get the token from Supabase dashboard or browser dev tools)

2. **Test public endpoint (no auth required):**

```bash
curl http://localhost:3002/api/trpc/health.ping
```

3. **Test protected endpoint (auth required):**

```bash
curl -X POST http://localhost:3002/api/trpc/booking.create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "proId": "pro-123",
    "category": "plumbing",
    "description": "Fix leaky faucet",
    "scheduledAt": "2024-01-15T10:00:00Z",
    "estimatedHours": 2
  }'
```

4. **Test without token (should return UNAUTHORIZED):**

```bash
curl -X POST http://localhost:3002/api/trpc/booking.create \
  -H "Content-Type: application/json" \
  -d '{
    "proId": "pro-123",
    "category": "plumbing",
    "description": "Fix leaky faucet",
    "scheduledAt": "2024-01-15T10:00:00Z",
    "estimatedHours": 2
  }'
```

## Architecture Notes

### Backend Authentication Flow

1. Request comes in with `Authorization: Bearer <token>` header
2. `createContext()` extracts the token
3. `SupabaseAuthProvider.verifyAccessToken()` verifies the token with Supabase
4. If valid, looks up user in our database by Supabase user ID
5. If user doesn't exist, creates a new user with default `CLIENT` role
6. Sets `ctx.actor` with user ID and role
7. Guards (`protectedProcedure`, `proProcedure`, `adminProcedure`) check `ctx.actor`

### Frontend Authentication Flow

1. User signs up/logs in via Supabase auth
2. Supabase stores session (access token) in browser/device storage
3. tRPC client automatically attaches `Authorization: Bearer <token>` header to all requests
4. Backend verifies token and resolves user

### Provider Abstraction

The `AuthProvider` interface allows swapping Supabase for other auth providers in the future without changing the rest of the codebase. Simply implement a new provider class and update the initialization in `context.ts`.

## Verification Checklist

- [x] Backend: protected procedure returns UNAUTHORIZED without token
- [x] Backend: protected procedure succeeds with valid token
- [x] Client app: can sign up/login and call protected endpoint
- [x] Admin app: can sign up/login and call protected endpoint
- [x] Mobile app: can login and call protected endpoint
- [x] Public endpoints (health.ping) work without authentication
