# Frontend Best Practices

## Goals

- Keep frontend codebases maintainable as features grow
- Enforce consistent boundaries and separation of concerns
- Follow SOLID principles pragmatically
- Make components testable and reusable
- Keep business logic out of UI components

## Architecture Layers

### 1. Presentational Components (UI-only)

**Location:** `src/components/ui/` and `src/components/{domain}/` (domain-specific presentational)

**Responsibilities:**

- Render UI from props
- No API calls
- No global state access
- Minimal logic (formatting, simple conditionals)
- No direct tRPC access

**Examples:**

- `Button`, `Card`, `Text`, `Badge`
- `ProCard`, `BookingForm`, `RatingStars`
- `PayoutStatusBadge`, `PayoutSummary`, `PayoutEarningsList`

**Rule of thumb:**
If it can be rendered in Storybook with mock props, it's presentational.

**Rules:**

- ✅ Accept all data via props
- ✅ Call callbacks (`onClick`, `onChange`, etc.) passed as props
- ✅ Use utility functions for formatting (e.g., `formatDate`, `formatCurrency`)
- ❌ Never import `trpc` or hooks that call APIs
- ❌ Never access router directly (use callbacks)
- ❌ Never manage loading/error states internally

### 2. Container Components / Screens

**Location:** `src/screens/` (for full-page screens) or `src/components/containers/` (for reusable containers)

**Responsibilities:**

- Fetch data using hooks (not direct tRPC access)
- Call mutations using hooks
- Handle loading/error states
- Map API/domain data to UI props
- Orchestrate user interactions

**Examples:**

- `PayoutsListScreen`, `PayablesScreen`, `BookingDetailScreen`
- `SearchProsScreen`, `BookingCreateScreen`

**Rules:**

- ✅ Use custom hooks (e.g., `usePayouts`, `useBookings`) instead of direct `trpc` access
- ✅ Pass data and callbacks to presentational components
- ✅ Handle loading/error states at screen level
- ✅ Extract complex UI logic into subcomponents
- ❌ Never call `trpc.*` directly in screens
- ❌ Never put formatting logic in screens (use utility functions or presentational components)
- ❌ Never put complex UI rendering in screens (extract to subcomponents)

### 3. Hooks (Reusable Logic)

**Location:** `src/hooks/`

**Responsibilities:**

- Encapsulate tRPC queries and mutations
- Handle cache invalidation
- Provide consistent API for screens
- Transform data if needed (though prefer doing this in presentational components)

**Examples:**

- `usePayouts()`, `usePayout()`, `useCreatePayout()`, `useSendPayout()`
- `useBookings()`, `useBooking()`, `useCancelBooking()`
- `usePayments()`, `usePayment()`, `useSyncPaymentStatus()`
- `usePros()`, `usePro()`

**Rules:**

- ✅ One hook per tRPC procedure (or related group)
- ✅ Handle cache invalidation in mutation hooks using `trpc.useUtils()`
- ✅ Return standard React Query return values (`data`, `isLoading`, `error`, etc.)
- ✅ Export both query hooks and mutation hooks
- ❌ Never put UI logic in hooks
- ❌ Never import UI components in hooks
- ❌ Never access router in hooks (screens handle navigation)

**Hook Naming Convention:**

- Query hooks: `use{Entity}` (singular) or `use{Entities}` (plural)
  - `usePayout(payoutId)` - get single payout
  - `usePayouts(limit?)` - list payouts
- Mutation hooks: `use{Action}{Entity}`
  - `useCreatePayout()` - create payout mutation
  - `useSendPayout()` - send payout mutation
  - `useCancelBooking()` - cancel booking mutation

**Example Hook Structure:**

```typescript
// hooks/usePayouts.ts
import { trpc } from "@/lib/trpc/client";

export function usePayouts(limit?: number) {
  return trpc.payout.list.useQuery({ limit });
}

export function usePayout(payoutId: string) {
  return trpc.payout.get.useQuery({ payoutId });
}

export function useCreatePayout() {
  const utils = trpc.useUtils();

  return trpc.payout.createForPro.useMutation({
    onSuccess: () => {
      utils.payout.listPayablePros.invalidate();
    },
  });
}
```

### 4. Subcomponents (Domain-Specific Presentational)

**Location:** `src/components/{domain}/` (e.g., `components/admin/payouts/`, `components/admin/modals/`)

**Responsibilities:**

- Break down complex screens into smaller, focused components
- Encapsulate domain-specific UI patterns
- Reusable across multiple screens

**Examples:**

- `PayoutSummary` - displays payout summary card
- `PayoutEarningsList` - displays earnings table
- `ConfirmModal` - reusable confirmation modal
- `PayoutStatusBadge` - status badge with formatting

**Rules:**

- ✅ Keep components focused on a single responsibility
- ✅ Accept all data via props
- ✅ Use utility functions for formatting
- ✅ Can import other presentational components
- ❌ Never access hooks or tRPC directly
- ❌ Never manage state beyond UI state (e.g., modal open/close)

### 5. Utility Functions

**Location:** `src/components/{domain}/utils/` or `src/utils/`

**Responsibilities:**

- Pure functions for formatting and transformation
- Reusable across components
- No side effects

**Examples:**

- `formatDate()`, `formatDateShort()` - date formatting
- `getStatusBadgeVariant()` - status badge variant mapping
- `getStatusLabel()` - status label mapping

**Rules:**

- ✅ Pure functions (no side effects)
- ✅ Well-typed inputs and outputs
- ✅ Can be tested independently
- ❌ Never access APIs or hooks
- ❌ Never have side effects

## Folder Structure

**Next.js apps (apps/client, apps/admin)**

```
src/
  app/                    # Next routes + layouts
  screens/                # Container-level screens (smart)
    admin/                # Admin screens
      PayoutsListScreen.tsx
      PayablesScreen.tsx
      PayoutDetailScreen.tsx
  components/
    ui/                   # Generic presentational components
      Button.tsx
      Card.tsx
      Text.tsx
      Badge.tsx
    admin/                # Admin-specific components
      modals/             # Modal components
        ConfirmModal.tsx
      utils/              # Utility functions
        formatDate.ts
        PayoutStatusBadge.tsx
      payouts/            # Payout-specific subcomponents
        PayoutSummary.tsx
        PayoutEarningsList.tsx
      PayoutsTable.tsx    # Table components
      PayablesTable.tsx
  hooks/                  # Reusable hooks
    usePayouts.ts
    useBookings.ts
    usePayments.ts
    usePros.ts
  lib/
    trpc/                 # tRPC client setup + providers
  utils/                  # Shared utilities (if needed)
```

## SOLID Principles for Frontend

### Single Responsibility

- **Screens:** Orchestrate data fetching + user actions
- **Presentational Components:** Render UI only
- **Hooks:** Encapsulate API calls and cache management
- **Subcomponents:** Handle a single UI concern (e.g., summary card, earnings list)

**Example:**

```typescript
// ❌ BAD: Screen doing too much
export function PayoutDetailScreen({ payoutId }: Props) {
  const { data } = trpc.payout.get.useQuery({ payoutId }); // Direct tRPC
  const formatDate = (date: Date) => { /* ... */ }; // Formatting logic
  return (
    <div>
      {/* 200 lines of JSX */}
    </div>
  );
}

// ✅ GOOD: Separated concerns
export function PayoutDetailScreen({ payoutId }: Props) {
  const { data: payout, isLoading } = usePayout(payoutId); // Hook
  return (
    <div>
      <PayoutSummary {...payout} /> {/* Subcomponent */}
      <PayoutEarningsList earnings={payout.earnings} /> {/* Subcomponent */}
    </div>
  );
}
```

### Open/Closed

- Extend UI via new presentational components
- Add new hooks for new API endpoints
- Avoid modifying existing components for unrelated features

**Example:**

```typescript
// ✅ GOOD: Extend via composition
export function PayoutDetailScreen({ payoutId }: Props) {
  const payout = usePayout(payoutId);
  return (
    <div>
      <PayoutSummary {...payout} />
      <PayoutEarningsList earnings={payout.earnings} />
      {/* New feature: Add new subcomponent without modifying existing ones */}
      <PayoutTimeline events={payout.events} />
    </div>
  );
}
```

### Interface Segregation

- Keep component props small and specific
- Prefer composition over large prop interfaces

**Example:**

```typescript
// ❌ BAD: Too many props
<ProCard
  pro={pro}
  onSelect={onSelect}
  showRating={true}
  showPrice={true}
  showAvailability={true}
  showDistance={true}
  onFavorite={onFavorite}
  onShare={onShare}
  // ... 20 more props
/>

// ✅ GOOD: Focused props
<ProCard pro={pro} onSelect={onSelect} />
<ProRating rating={pro.rating} />
<ProPrice price={pro.price} />
```

### Dependency Inversion

- UI depends on abstractions (hooks), not direct API calls
- Screens depend on hooks, not `trpc` directly
- Presentational components depend on props, not hooks

**Example:**

```typescript
// ❌ BAD: Screen depends on concrete tRPC implementation
export function PayoutsListScreen() {
  const { data } = trpc.payout.list.useQuery({ limit: 100 });
  // ...
}

// ✅ GOOD: Screen depends on hook abstraction
export function PayoutsListScreen() {
  const { data } = usePayouts(100);
  // ...
}
```

## Data Flow

```
tRPC API
  ↓
Hooks (usePayouts, useCreatePayout, etc.)
  ↓
Screens (PayoutsListScreen, PayablesScreen, etc.)
  ↓
Presentational Components (PayoutsTable, PayoutSummary, etc.)
  ↓
UI Utilities (formatDate, PayoutStatusBadge, etc.)
```

## "Do / Don't" Summary

### DO

- ✅ Use hooks for all tRPC queries and mutations
- ✅ Extract complex UI into subcomponents
- ✅ Keep presentational components pure (props in, JSX out)
- ✅ Use utility functions for formatting
- ✅ Handle loading/error states at screen level
- ✅ Extract modals and complex UI patterns into reusable components
- ✅ Group related components in domain folders (e.g., `components/admin/payouts/`)

### DON'T

- ❌ Don't call `trpc.*` directly in screens or components
- ❌ Don't put formatting logic in screens (use utilities or presentational components)
- ❌ Don't put complex UI rendering directly in screens (extract to subcomponents)
- ❌ Don't put API logic in presentational components
- ❌ Don't access router directly in presentational components (use callbacks)
- ❌ Don't create "god components" that do everything
- ❌ Don't duplicate formatting logic across components (use utilities)
- ❌ Don't mix data fetching and UI rendering in the same component

## Component Organization Examples

### Simple List Screen

```typescript
// screens/admin/PayoutsListScreen.tsx
export function PayoutsListScreen() {
  const { data: payouts, isLoading } = usePayouts(100);

  return (
    <div>
      <Text variant="h1">Cobros</Text>
      <PayoutsTable payouts={payouts || []} isLoading={isLoading} />
    </div>
  );
}
```

### Complex Detail Screen with Subcomponents

```typescript
// screens/admin/PayoutDetailScreen.tsx
export function PayoutDetailScreen({ payoutId }: Props) {
  const { data: payout, isLoading, refetch } = usePayout(payoutId);
  const sendMutation = useSendPayout();

  if (isLoading) return <LoadingState />;
  if (!payout) return <NotFoundState />;

  return (
    <div>
      <Header payoutId={payout.id} status={payout.status} />
      <PayoutSummary {...payout} />
      <PayoutEarningsList earnings={payout.earnings} currency={payout.currency} />
      {payout.status === "FAILED" && (
        <RetryActions
          onRetry={() => sendMutation.mutate({ payoutId }, { onSuccess: refetch })}
        />
      )}
    </div>
  );
}
```

### Modal Extraction

```typescript
// components/admin/modals/ConfirmModal.tsx
export function ConfirmModal({ title, message, onConfirm, onCancel, isPending }: Props) {
  return (
    <div className="modal-overlay">
      <Card>
        <Text variant="h2">{title}</Text>
        <Text variant="body">{message}</Text>
        <Button onClick={onConfirm} disabled={isPending}>Confirmar</Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </Card>
    </div>
  );
}

// screens/admin/PayablesScreen.tsx
export function PayablesScreen() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      {/* ... */}
      {showModal && (
        <ConfirmModal
          title="Crear payout"
          message="¿Estás seguro?"
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
```
