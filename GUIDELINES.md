# Uruguay Services Marketplace (TaskRabbit-style) — MVP

## 1. Goal

Build an MVP for a local services marketplace in Uruguay.

Clients can find, book, and pay trusted local professionals for small jobs.

Pros (service providers) can onboard, manage availability, accept jobs, complete work, and get paid.

Admins can approve/suspend pros, handle disputes/refunds, and monitor basic metrics.

This is a production-oriented MVP, not a demo or throwaway prototype.

## 2. MVP Scope

### 2.1 Client (Customer)

- Browse service categories (3–5 initially)
- Search pros (category + location + time)
- View pro profiles (rate, skills, reviews)
- Create bookings
- Cancel / reschedule bookings
- Pay in-app (cashless)
- Leave reviews after completion

### 2.2 Pro (Service Provider)

- Onboard as independent provider
- Set services, hourly rate
- Set availability and service area
- Receive job requests
- Accept / reject jobs
- Mark job as complete
- View earnings summary

### 2.3 Admin

- Approve / suspend pros
- View bookings
- Handle disputes & refunds (manual at MVP)
- Basic metrics (completed jobs, GMV, active pros)

## 3. Tech Stack (Decided)

### Monorepo

- Turborepo
- pnpm workspaces

### Web (Client + Admin)

- Next.js (App Router)
- TypeScript

### Mobile (Pros)

- Expo + React Native
- TypeScript

### API

- tRPC
- Zod
- superjson

### Data

- PostgreSQL
- Prisma (initially inside apps/api)

## 4. Repository Structure

```
apps/
  client/  # Next.js customer web app
  admin/   # Next.js admin dashboard
  api/     # Next.js app hosting the tRPC server
  mobile/  # Expo React Native pro app

packages/
  domain/  # Shared Zod schemas + domain types (pure TS)
  trpc/    # Shared tRPC client helpers (superjson, links)
  config/  # Shared tsconfig/eslint presets
  ui/      # Shared design tokens + web UI components (client/admin)

tooling/
  eslint/
  tsconfig/
```

## 5. Architecture Rules

### 5.1 Shared packages must be universal

Everything under `packages/*` must be:

- Web + mobile compatible
- Pure TypeScript
- Safe to import anywhere

**Not allowed:**

- Node-only APIs (fs, path, etc.)
- DOM globals (window, document)
- Framework-specific code (Next / Expo)

### 5.2 Shared UI Components (Web Only)

**Location:** `packages/ui/`

**Structure:**
- `tokens/` - Design tokens (colors, typography, spacing, radius, shadows) - universal
- `web/atoms/` - Atomic components (Button, Card, Text, Badge, Input, Select) - web only
- `web/molecules/` - Composite components (EmptyState) - web only

**Rationale:**
- Share common UI components between `client` and `admin` apps (both use Next.js + Tailwind)
- Reduces duplication and ensures consistency
- Design tokens remain universal and can be used by mobile app
- Mobile app has separate component implementations (React Native)

**Rules:**
- ✅ Web components use Tailwind CSS v4 with CSS variables for colors
- ✅ Use inline styles for colors when Tailwind class detection is unreliable
- ✅ Components must work identically in both client and admin apps
- ✅ Design tokens are universal and can be imported by mobile
- ❌ Do not share React Native components with web (platform-specific implementations)

## 6. Local Development Conventions

### 6.1 Ports (suggested)

- **client:** http://localhost:3000
- **admin:** http://localhost:3001
- **api:** http://localhost:3002
- **mobile:** Expo dev server

### 6.2 Environment variables

- **Web apps:** `NEXT_PUBLIC_API_URL`
- **Mobile app:** `EXPO_PUBLIC_API_URL`

## 7. Runbook — Steps to Create the System

### Step 1 — Prerequisites

**Install:**

- Node.js (LTS)
- pnpm

**Verify:**

```bash
node -v
pnpm -v
```

### Step 2 — Create Turborepo

```bash
pnpm create turbo@latest
git init
```

**Choose:**

- pnpm as package manager
- minimal monorepo template

### Step 3 — Create folders

```bash
mkdir -p apps/{client,admin,api,mobile} \
  packages/{domain,trpc,config,ui} \
  tooling/{eslint,tsconfig}
```

### Step 4 — Create Next.js apps

**Client:**

```bash
cd apps/client
pnpm create next-app@latest . --ts --eslint --tailwind --app --src-dir --import-alias "@/*"
```

**Admin:**

```bash
cd ../admin
pnpm create next-app@latest . --ts --eslint --tailwind --app --src-dir --import-alias "@/*"
```

**API:**

```bash
cd ../api
pnpm create next-app@latest . --ts --eslint --app --src-dir --import-alias "@/*"
```

If the directory already exists:

Rename it first: `mv apps/api apps/api-template`

Then recreate apps/api

**Verify each app runs:**

```bash
pnpm -C apps/client dev
pnpm -C apps/admin dev
pnpm -C apps/api dev
```

### Step 5 — Create Expo app

```bash
cd apps/mobile
pnpm dlx create-expo-app@latest . --template blank-typescript
pnpm start
```

### Step 6 — Configure pnpm workspaces

Ensure `pnpm-workspace.yaml` includes:

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tooling/*"
```

### Step 7 — Create packages/domain

- **Name:** `@acme/domain`
- **Pure TypeScript**
- **Install zod**

**Example exports:**

- Category enum
- Booking status enum
- Zod schemas

### Step 8 — Create packages/trpc

- **Name:** `@acme/trpc`
- **Shared tRPC client helpers**
- **Uses superjson**
- **Must stay universal (no Node or DOM APIs).**

### Step 9 — Implement tRPC server (apps/api)

**Add:**

- `src/server/trpc.ts`
- `src/server/routers/_app.ts`
- `src/app/api/trpc/[trpc]/route.ts`

**Add procedure:**

- `health.ping` → `{ ok: true, time: Date }`

**Verify:**

```bash
pnpm -C apps/api dev
```

### Step 10 — Wire tRPC into Next client/admin

- Add tRPC + React Query providers
- Add demo page calling `health.ping`

**Verify:**

```bash
pnpm -C apps/client dev
pnpm -C apps/admin dev
```

### Step 11 — Wire tRPC into Expo mobile

- Add tRPC + React Query provider
- Configure Metro for monorepo
- Add screen calling `health.ping`

**Verify:**

```bash
pnpm -C apps/mobile start
```

## 8. Cursor Agent Guidelines

- One task per prompt
- Do not refactor unrelated files
- Do not add new libraries unless requested
- Always run the app/build after changes
- Stop and report files changed and commands run

**Use this prompt pattern:**

```
Follow the repository README as the source of truth.

Task: <one clear task>
Constraints:
- No unrelated refactors
- No new libraries unless requested
- Keep packages/* universal

After changes:
- run <commands>
- fix errors
- stop and report
```

## 9. Non-goals (MVP)

We explicitly do NOT build:

- Shared cross-platform UI components (web and mobile use separate implementations)
- Dynamic pricing
- Multi-city support
- Subscriptions / loyalty / referrals
- Automated dispute resolution

**Note:** We DO share web UI components between client and admin apps via `packages/ui/web/` for consistency and DRY principles.

## 10. Source of Truth

This GUIDELINES is the source of truth for architecture and setup.
If a suggestion conflicts with this file, follow the GUIDELINES.
