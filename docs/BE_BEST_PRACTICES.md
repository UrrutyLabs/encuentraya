# Backend Best Practices (API)

## Goals

- Keep codebases maintainable as features grow
- Make business logic testable and framework-agnostic
- Enforce consistent boundaries and naming
- Follow SOLID principles pragmatically (no over-engineering)

## API Architecture (tRPC + Next.js)

Even though this isn't Express/Nest, we still follow a Controller → Service → Repository style separation.

### Layers (mapping to tRPC)

#### 1. "Controllers" = tRPC Routers / Procedures

**Location:** `apps/api/src/server/modules/{domain}/{domain}.router.ts`

**Responsibilities:**

- Validate input (Zod schemas from packages/domain)
- Authorization (role-based checks)
- Call service methods
- Translate known failures to TRPCError

**Rules:**

- Keep procedures thin
- No direct DB access in routers
- No third-party SDK calls in routers

#### 2. Services = Business Logic / Use Cases

**Location:** `apps/api/src/server/modules/{domain}/{domain}.service.ts` (or split into multiple service files)

**Responsibilities:**

- Marketplace business rules (booking lifecycle, availability, cancellations, payouts)
- Orchestrate repositories and integrations
- Return domain-friendly results (not HTTP concerns)

**Rules:**

- Services may depend on repositories and integrations
- Services should be unit-testable without Next.js/tRPC
- Services should not import `next/*` or route handler code
- **When a service exceeds ~500 lines, split it by domain use cases** (see "Service Splitting Patterns" below)

#### 3. Repositories = Data Access Layer

**Location:** `apps/api/src/server/repositories/*`

**Responsibilities:**

- All reads/writes to the database (Prisma)
- Encapsulate queries, joins, transactions
- Return plain objects (entities) to services

**Rules:**

- Repositories should not implement business rules
- Repositories should not call external APIs
- Prefer transactions here (or via service orchestration when needed)
- **Prisma types are allowed in `mapPrismaToDomain` methods**: Import `Prisma` types from the generated client to properly type mapper functions. This is the only place where Prisma types should be used - they should not leak to services or other layers.

#### 4. Integrations = External Providers

**Location:** `apps/api/src/server/modules/{domain}/providers/*` (e.g., `modules/payment/providers/mercadoPago.client.ts`)

**Responsibilities:**

- Wrap 3rd party SDKs (Mercado Pago, notifications, identity verification)
- Normalize inputs/outputs
- Verify signatures for webhooks
- Implement provider interfaces (e.g., `PaymentProviderClient`)

**Rules:**

- Expose a small interface used by services
- No business logic in integration modules
- Provider implementations are module-specific and live within the module

#### 5. HTTP Routes (Webhooks/Cron) = Next Route Handlers

**Location:** `apps/api/src/app/api/*`

**Responsibilities:**

- Handle provider callbacks (webhooks)
- Validate signatures and parse payloads
- Call services to update internal state

**Rules:**

- Keep routes thin like controllers
- Do not put business rules inside route handlers

### API Folder Convention (Module-Based Structure)

The API follows a **module-based architecture** where each domain module is self-contained. This structure reflects the dependency injection modules and makes it easy to extract modules into microservices later.

```
apps/api/src/server/
  modules/                    # Domain modules (self-contained)
    booking/                  # Booking domain module
      booking.service.ts      # Business logic
      booking.repo.ts         # Data access
      booking.router.ts       # tRPC routes
      booking.errors.ts       # Domain errors
    payment/                  # Payment domain module
      payment.service.ts
      payment.repo.ts
      paymentEvent.repo.ts
      payment.router.ts
      payment.errors.ts       # (to be added)
      provider.ts             # Payment provider interface
      registry.ts             # Provider registry
      providers/              # Provider implementations
        mercadoPago.client.ts
    pro/                      # Pro domain module
      pro.service.ts
      pro.repo.ts
      availability.repo.ts
      pro.router.ts
      pro.errors.ts           # (to be added)
    review/                   # Review domain module
      review.service.ts
      review.repo.ts
      review.router.ts
      review.errors.ts
    user/                     # User domain module (foundational)
      user.repo.ts
  infrastructure/             # Shared infrastructure
    auth/                     # Authentication & authorization
      roles.ts
      provider.ts
      providers/
        supabase.provider.ts
    db/                       # Database (Prisma client)
      prisma.ts
    utils/                    # Utilities
      logger.ts
    trpc/                     # tRPC setup
      context.ts
    trpc.ts                   # tRPC initialization
  container/                  # Dependency injection
    container.ts              # Main container setup
    tokens.ts                 # DI tokens
    modules/                  # Module registrations
      booking.module.ts
      payment.module.ts
      pro.module.ts
      review.module.ts
      user.module.ts
      infrastructure.module.ts
    index.ts                  # Container exports
  routers/                    # Root router
    _app.ts                   # Main app router (combines module routers)
    auth.router.ts            # Auth routes
  shared/                     # Shared across modules
    errors/                   # Shared error mapper
      error-mapper.ts
```

**Module Structure:**
Each module (`modules/{domain}/`) contains:

- `{domain}.service.ts` - Business logic (or split into `{domain}.{useCase}.service.ts` files)
- `{domain}.helpers.ts` - Shared utilities (optional, for large modules)
- `{domain}.repo.ts` - Data access (may have multiple repos)
- `{domain}.router.ts` - tRPC routes
- `{domain}.errors.ts` - Domain-specific errors
- Domain-specific files (e.g., `payment/provider.ts`, `payment/registry.ts`)

**Benefits:**

- Clear module boundaries for microservices extraction
- Self-contained modules (easy to test in isolation)
- Matches DI module structure
- Easy to find all code related to a domain

### Dependency Injection with TSyringe

The API uses **TSyringe** for dependency injection, enabling modular architecture and easy testing.

**Container Setup:**

- Main container: `container/container.ts`
- Module registrations: `container/modules/{domain}.module.ts`
- DI tokens: `container/tokens.ts`

**Module Registration:**
Each module registers its dependencies in `container/modules/{domain}.module.ts`:

```typescript
export function registerBookingModule(container: DependencyContainer): void {
  container.register<BookingRepository>(TOKENS.BookingRepository, {
    useClass: BookingRepositoryImpl,
  });
  container.register<BookingService>(TOKENS.BookingService, {
    useClass: BookingService,
  });
}
```

**Using DI in Services:**

```typescript
@injectable()
export class BookingService {
  constructor(
    @inject(TOKENS.BookingRepository)
    private readonly bookingRepository: BookingRepository,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository
  ) {}
}
```

**Using DI in Routers:**

```typescript
import { container, TOKENS } from "../../container";
const bookingService = container.resolve<BookingService>(TOKENS.BookingService);
```

**Rules:**

- All services and repositories are `@injectable()`
- Use `@inject(TOKENS.TokenName)` for constructor injection
- Import types with `import type` when used in decorators
- Cross-module dependencies are injected via DI (not direct imports)
- Container is initialized once at startup in `container/container.ts`

### Service Splitting Patterns

When a service grows beyond ~500 lines, split it by **domain use cases** (Option 4 pattern) rather than by technical layers. This keeps business logic cohesive and makes it easier to understand and maintain.

**Pattern: Domain-Driven Service Split**

Split services by business use cases, not by technical concerns:

```
modules/{domain}/
  {domain}.creation.service.ts    # Creation workflow (create, validation)
  {domain}.lifecycle.service.ts   # State transitions (accept, reject, cancel, etc.)
  {domain}.completion.service.ts  # Completion workflow (complete, payment capture, earning creation)
  {domain}.query.service.ts       # Read operations (getById, list, search)
  {domain}.admin.service.ts       # Admin operations (adminList, adminGetById, forceStatus)
  {domain}.helpers.ts             # Shared utilities (notification, mapping, state machine, authorization)
```

**Example: Booking Service Split**

Instead of one `booking.service.ts` (1058 lines), split into:

- `booking.creation.service.ts` - `createBooking()` and creation validation
- `booking.lifecycle.service.ts` - All state transition methods (`acceptBooking`, `rejectBooking`, `cancelBooking`, `markOnMyWay`, `arriveBooking`)
- `booking.completion.service.ts` - `completeBooking()` with payment capture and earning creation logic
- `booking.query.service.ts` - `getBookingById()`, `getClientBookings()`, `getProBookings()`, `getRebookTemplate()`
- `booking.admin.service.ts` - `adminListBookings()`, `adminGetBookingById()`, `adminForceStatus()`
- `booking.helpers.ts` - `sendClientNotification()`, `validateStateTransition()`, `mapBookingEntityToDomain()`, authorization helpers

**Benefits:**

- Each service focuses on a single business use case
- Easier to understand and maintain
- Better alignment with domain boundaries
- Easier to extract into microservices later
- Shared helpers prevent duplication

**Registration:**
Register all services in `container/modules/{domain}.module.ts`:

```typescript
container.register<BookingCreationService>(TOKENS.BookingCreationService, {
  useClass: BookingCreationService,
});
container.register<BookingLifecycleService>(TOKENS.BookingLifecycleService, {
  useClass: BookingLifecycleService,
});
// ... etc
```

**Dependencies:**

- Services can depend on each other via DI (e.g., `BookingCompletionService` may depend on `BookingLifecycleService`)
- Shared helpers (`{domain}.helpers.ts`) are pure functions or classes that can be imported directly (no DI needed)
- Repositories and cross-module services are injected via DI

**When to Split:**

- Service exceeds ~500 lines
- Service handles multiple distinct business use cases
- Service has multiple responsibilities (creation, lifecycle, completion, queries, admin)

**When NOT to Split:**

- Service is cohesive and under ~500 lines
- Splitting would create artificial boundaries
- All methods are tightly coupled to a single workflow

### SOLID rules for the API

#### Single Responsibility

- Routers validate + authorize + delegate
- Services handle business rules (split by use case when >500 lines)
- Repos handle persistence only

#### Open/Closed

- Add new behavior by adding new services/procedures
- Avoid modifying a "god service" for unrelated features

#### Liskov Substitution

- If introducing interfaces (e.g., PaymentProvider), implement them consistently
- Tests should pass regardless of provider implementation

#### Interface Segregation

- Prefer small interfaces:
  - `PaymentProvider.charge()` vs a huge "PaymentService" with 30 methods

#### Dependency Inversion

- Services depend on abstractions when it helps (e.g., `PaymentProviderClient`)
- Concrete implementations live in module `providers/` directories
- Use TSyringe DI container (`container/`) to assemble dependencies
- Modules register their dependencies in `container/modules/{module}.module.ts`
- Cross-module dependencies are injected via DI (e.g., `BookingService` depends on `PaymentServiceFactory`)

### Module Boundaries and Cross-Module Dependencies

**Module Independence:**

- Each module (`modules/{domain}/`) is self-contained
- Modules can depend on other modules via DI (injected dependencies)
- Avoid circular dependencies between modules

**Dependency Flow:**

```
User (foundation)
  ↓
Pro, Review (depend on User)
  ↓
Booking, Payment (depend on Pro/Review)
```

**Cross-Module Access:**

- Use dependency injection to access other modules
- Import types with `import type` for cross-module type references
- Access via container: `container.resolve<ServiceType>(TOKENS.ServiceToken)`
- Do NOT import services/repos directly across modules (use DI)

### Naming Conventions (API)

- **Routers:** `{domain}.router.ts` (e.g., `booking.router.ts`, `payment.router.ts`)
- **Services:** `{domain}.service.ts` (e.g., `booking.service.ts`, `payment.service.ts`)
- **Repositories:** `{domain}.repo.ts` or `{domain}{entity}.repo.ts` (e.g., `booking.repo.ts`, `paymentEvent.repo.ts`)
- **Errors:** `{domain}.errors.ts` (e.g., `booking.errors.ts`, `payment.errors.ts`)
- **Providers:** `{provider}.client.ts` (e.g., `mercadoPago.client.ts`) in `modules/{domain}/providers/`
- **Module Registration:** `{domain}.module.ts` in `container/modules/`
- **Zod schemas:** `BookingCreateInputSchema`, `ProOnboardInputSchema` (in `@repo/domain`)
- **Tests:** `{domain}.{file}.test.ts` in `modules/{domain}/__tests__/` (e.g., `booking.creation.service.test.ts`)

### Testing Strategy

The API uses a **hybrid testing approach** combining fast unit tests with integration tests for critical workflows.

#### Test Organization

**Location:** `apps/api/src/server/modules/{domain}/__tests__/`

```
modules/{domain}/
  ├── __tests__/
  │   ├── {domain}.{service}.test.ts        # Unit tests (mocked dependencies)
  │   ├── {domain}.{repo}.test.ts          # Unit tests (mocked Prisma)
  │   ├── integration/                     # Integration tests (optional)
  │   │   ├── {domain}.workflow.test.ts    # Full workflow tests (real repos)
  │   │   └── {domain}.authorization.test.ts
  │   └── fixtures/                        # Test data builders (optional)
  │       └── {domain}.fixtures.ts
  ├── {domain}.service.ts
  ├── {domain}.repo.ts
  └── {domain}.router.ts
```

#### Unit Tests (Primary Strategy)

**Purpose:** Test business logic in isolation with mocked dependencies.

**What to Mock:**

- **Repositories** - Mock all repository methods (services test business logic, not data access)
- **External Services** - Mock NotificationService, PaymentServiceFactory, etc.
- **Cross-Module Services** - Mock or use real (prefer mock for unit tests, real for integration)

**What NOT to Mock:**

- **Domain Types** - Use real types from `@repo/domain`
- **Helpers** - Use real helper functions (they're pure functions)
- **Error Classes** - Use real error classes

**Example Structure:**

```typescript
// apps/api/src/server/modules/booking/__tests__/booking.creation.service.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { BookingCreationService } from "../booking.creation.service";
import type { BookingRepository } from "../booking.repo";
import type { ProRepository } from "@modules/pro/pro.repo";

describe("BookingCreationService", () => {
  let service: BookingCreationService;
  let mockBookingRepo: vi.Mocked<BookingRepository>;
  let mockProRepo: vi.Mocked<ProRepository>;

  beforeEach(() => {
    // Create mocks
    mockBookingRepo = {
      create: vi.fn(),
      findById: vi.fn(),
    } as any;

    mockProRepo = {
      findById: vi.fn(),
    } as any;

    // Create service with mocked dependencies
    service = new BookingCreationService(
      mockBookingRepo,
      mockProRepo,
      mockClientProfileService,
      mockNotificationService
    );
  });

  it("should create booking when pro exists and is active", async () => {
    // Arrange
    const mockPro = { id: "pro-1", status: "active", hourlyRate: 100 };
    mockProRepo.findById.mockResolvedValue(mockPro as any);
    mockBookingRepo.create.mockResolvedValue({
      id: "booking-1",
      // ... booking entity
    } as any);

    // Act
    const result = await service.createBooking(actor, input);

    // Assert
    expect(mockBookingRepo.create).toHaveBeenCalledWith({
      clientUserId: actor.id,
      proProfileId: input.proId,
    });
    expect(result).toMatchObject({ id: "booking-1" });
  });
});
```

**Benefits:**

- Fast execution (no database)
- Isolated tests (test only business logic)
- Easy to test edge cases
- Clear test boundaries

#### Integration Tests (Secondary Strategy)

**Purpose:** Test full workflows with real repositories and test database.

**Location:** `modules/{domain}/__tests__/integration/`

**What to Use:**

- **Real Repositories** - Use actual repository implementations
- **Test Database** - Use separate test database or in-memory SQLite
- **Real Services** - Use real service implementations (or mock only external APIs)

**When to Use:**

- Critical business workflows (e.g., booking creation → payment → completion)
- Authorization flows across multiple services
- Complex state transitions
- End-to-end module behavior

**Example Structure:**

```typescript
// apps/api/src/server/modules/booking/__tests__/integration/booking.workflow.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { BookingCreationService } from "../../booking.creation.service";
import { BookingRepositoryImpl } from "../../booking.repo";
import { prisma } from "@infra/db/prisma";

describe("BookingCreationService (integration)", () => {
  let service: BookingCreationService;
  let bookingRepo: BookingRepositoryImpl;

  beforeEach(async () => {
    bookingRepo = new BookingRepositoryImpl();
    service = new BookingCreationService(
      bookingRepo,
      proRepo,
      clientProfileService,
      mockNotificationService
    );
    // Setup test data
  });

  afterEach(async () => {
    // Cleanup test data
    await prisma.booking.deleteMany();
  });

  it("should create booking and persist to database", async () => {
    const result = await service.createBooking(actor, input);
    const booking = await prisma.booking.findUnique({
      where: { id: result.id },
    });
    expect(booking).toBeTruthy();
  });
});
```

**Benefits:**

- Tests real repository behavior
- Catches integration bugs
- More confidence in data layer
- Validates full workflow

#### Test Utilities

Create shared test utilities for common patterns:

```typescript
// apps/api/src/server/modules/{domain}/__tests__/test-utils.ts
import type { Actor } from "@infra/auth/roles";
import { Role } from "@repo/domain";

export function createMockActor(role: Role, id = "test-user"): Actor {
  return { id, role };
}

export function createMockBooking(
  input?: Partial<BookingEntity>
): BookingEntity {
  return {
    id: "booking-1",
    status: BookingStatus.PENDING,
    clientUserId: "client-1",
    proProfileId: "pro-1",
    // ... defaults
    ...input,
  };
}
```

#### Testing Rules

**DO:**

- Write unit tests for all service methods
- Mock repositories in unit tests
- Test business rules and edge cases
- Use descriptive test names (`should {action} when {condition}`)
- Keep tests isolated (no shared state between tests)
- Use test fixtures/builders for complex data
- **Always run tests for the module as the last step when making changes** (see "Development Workflow" below)

**DON'T:**

- Don't test implementation details (test behavior, not internals)
- Don't mock domain types (use real types)
- Don't write tests that require database in unit tests (use integration tests)
- Don't test framework code (tRPC, Next.js) - test business logic
- Don't create circular test dependencies

#### Test Framework

**Recommended:** Vitest (faster, Vite-based, TypeScript-first)

**Configuration:** `apps/api/vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@modules": path.resolve(__dirname, "./src/server/modules"),
      "@infra": path.resolve(__dirname, "./src/server/infrastructure"),
      "@shared": path.resolve(__dirname, "./src/server/shared"),
      "@repo/domain": path.resolve(__dirname, "../../packages/domain/src"),
    },
  },
});
```

**Scripts:** Add to `apps/api/package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

**Setup File:** Create `apps/api/src/test-setup.ts`:

```typescript
import "reflect-metadata";
```

This ensures TSyringe decorators work correctly in tests.

### Development Workflow

**When making changes to a module, always run tests as the last step:**

1. Make your changes to the module (service, repository, router, etc.)
2. Run tests for that specific module:

   ```bash
   # Run all tests
   pnpm test

   # Run tests for a specific module (watch mode)
   pnpm test --watch src/server/modules/{domain}/

   # Run tests with coverage
   pnpm test:coverage
   ```

3. Ensure all tests pass before committing
4. If tests fail, fix the issues before proceeding

**Why this matters:**

- Catches regressions immediately
- Ensures business logic still works after refactoring
- Validates that new features don't break existing functionality
- Maintains code quality and confidence in changes

## Frontend Architecture

For frontend-specific best practices, see [FE_BEST_PRACTICES.md](./FE_BEST_PRACTICES.md).

**Key Points:**

- Frontend uses hooks to encapsulate tRPC queries/mutations (no direct `trpc` access in screens)
- Screens orchestrate data fetching and user actions
- Presentational components are pure (props in, JSX out)
- Complex UI is broken into subcomponents
- Utility functions handle formatting and transformations

## "Do / Don't" Summary

### DO

- Keep routers thin
- Put business rules in services
- Put DB queries in repositories
- Use integrations for external APIs
- Use containers/screens for data fetching
- Keep components presentational when possible

### DON'T

- Don't query Prisma inside routers
- Don't put business logic in route handlers
- Don't create "god services" that own everything
- Don't import services/repos directly across modules (use DI)
- Don't use lazy imports (`await import()`) unless absolutely necessary (DI handles dependencies)
- Don't create circular dependencies between modules
