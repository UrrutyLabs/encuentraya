# Optimistic Updates & Query Invalidation Opportunities

This document identifies all the places in the mobile app where optimistic updates and query invalidation can improve UX.

## 🎯 High Priority - Immediate UX Impact

### 1. **Booking Actions** (`useBookingActions.ts`)

**Current**: Manual refetch after mutations, status updates feel slow
**Impact**: ⭐⭐⭐⭐⭐ (Very High)

**Mutations to enhance**:

- `acceptBooking` - Changes status from PENDING → ACCEPTED
- `rejectBooking` - Changes status from PENDING → REJECTED
- `markOnMyWay` - Changes status from ACCEPTED → ON_MY_WAY
- `arriveBooking` - Changes status from ON_MY_WAY → ARRIVED
- `completeBooking` - Changes status from ARRIVED → COMPLETED

**Queries affected**:

- `booking.proInbox` (HomeScreen) - Accept/reject removes from pending list
- `booking.proJobs` (JobsScreen) - Status changes affect upcoming/completed lists
- `booking.getById` (BookingDetailScreen) - Status badge updates instantly

**Implementation**:

```typescript
// In useBookingActions.ts
import { useQueryClient } from "./useQueryClient";
import { invalidateRelatedQueries } from "../lib/react-query/utils";
import { createOptimisticUpdate } from "../lib/react-query/utils";

const queryClient = useQueryClient();

const acceptMutation = trpc.booking.accept.useMutation({
  ...createOptimisticUpdate(queryClient, {
    queryKey: [["booking", "getById", { id: bookingId }]],
    optimisticData: () => ({
      ...booking,
      status: BookingStatus.ACCEPTED,
    }),
  }),
  ...invalidateRelatedQueries(queryClient, [
    [["booking", "proInbox"]],
    [["booking", "proJobs"]],
  ]),
});
```

**Benefits**:

- Instant status badge updates in BookingDetailScreen
- Immediate removal from pending list in HomeScreen
- Smooth status transitions without loading states

---

### 2. **Availability Toggle** (`useAvailability.ts`)

**Current**: Uses `invalidateQueries` but no optimistic update
**Impact**: ⭐⭐⭐⭐⭐ (Very High)

**Mutation**: `setAvailability` - Toggles availability on/off

**Queries affected**:

- `pro.getMyProfile` - Availability status shown in UI

**Implementation**:

```typescript
const setAvailabilityMutation = trpc.pro.setAvailability.useMutation({
  ...createOptimisticUpdate(queryClient, {
    queryKey: [["pro", "getMyProfile"]],
    optimisticData: (variables) => ({
      ...pro,
      isAvailable: variables.isAvailable,
    }),
  }),
});
```

**Benefits**:

- Instant toggle feedback (no delay waiting for server)
- Better UX for a frequently used feature

---

## 🔄 Medium Priority - Multi-Query Updates

### 3. **Payout Info Update** (`PayoutInfoScreen.tsx`)

**Current**: Shows alert on success, no query invalidation
**Impact**: ⭐⭐⭐⭐ (High)

**Mutation**: `proPayout.updateMine` - Updates payout information

**Queries affected**:

- `proPayout.getMine` - Current payout profile
- `pro.getMyProfile` - May affect profile completeness status

**Implementation**:

```typescript
import { invalidateRelatedQueries } from "@/lib/react-query/utils";

const updateMutation = trpc.proPayout.updateMine.useMutation({
  ...invalidateRelatedQueries(queryClient, [
    [["proPayout", "getMine"]],
    [["pro", "getMyProfile"]], // If profile completeness depends on payout
  ]),
  onSuccess: () => {
    Alert.alert(
      "Guardado",
      "Tus datos de cobro fueron guardados correctamente."
    );
  },
});
```

**Benefits**:

- Form reflects saved data immediately
- Status card updates if completeness changes

---

### 4. **Onboarding Completion** (`useOnboarding.ts`)

**Current**: Navigates away on success
**Impact**: ⭐⭐⭐ (Medium)

**Mutation**: `pro.convertToPro` - Creates pro profile

**Queries affected**:

- `pro.getMyProfile` - New profile created
- `auth.me` - Role may change

**Implementation**:

```typescript
const convertToProMutation = trpc.pro.convertToPro.useMutation({
  ...invalidateRelatedQueries(queryClient, [
    [["pro", "getMyProfile"]],
    [["auth", "me"]],
  ]),
  onSuccess: () => {
    router.replace("/(tabs)/home");
  },
});
```

**Benefits**:

- Ensures fresh data when navigating to home screen
- Prevents stale data issues

---

## 📱 Lower Priority - Background Operations

### 5. **Push Token Registration** (`usePushToken.ts`)

**Current**: Silent background operation
**Impact**: ⭐⭐ (Low - already works well)

**Mutations**:

- `push.registerToken`
- `push.unregisterToken`

**Note**: These are background operations that don't affect UI, so optimistic updates aren't necessary. Current implementation is fine.

---

### 6. **Pro Signup** (`useProSignup.ts`)

**Current**: Navigates to confirmation screen
**Impact**: ⭐ (Very Low - one-time operation)

**Mutation**: `auth.proSignup` - Creates account

**Note**: This is a one-time operation that navigates away, so no optimistic updates needed.

---

## 📊 Summary by Impact

### Immediate Implementation (High ROI)

1. ✅ **Booking Actions** - 5 mutations, affects 3 screens
2. ✅ **Availability Toggle** - 1 mutation, frequently used

### Next Phase (Medium ROI)

3. **Payout Info Update** - Better form UX
4. **Onboarding Completion** - Data consistency

### Not Needed

- Push token operations (background, no UI impact)
- Signup (one-time, navigates away)

---

## 🛠️ Implementation Strategy

### Phase 1: Booking Actions (Week 1)

- Implement optimistic updates for all 5 booking status mutations
- Add query invalidation for inbox/jobs queries
- Test status transitions thoroughly

### Phase 2: Availability Toggle (Week 1)

- Add optimistic update to availability mutation
- Test toggle responsiveness

### Phase 3: Other Mutations (Week 2)

- Add query invalidation to payout updates
- Add query invalidation to onboarding

---

## 📝 Notes

- **Optimistic updates** are best for:
  - Status changes (booking status, availability)
  - Toggles (on/off states)
  - Simple updates where the new state is predictable

- **Query invalidation** is best for:
  - Updates that affect multiple queries
  - Complex data that needs server calculation
  - When optimistic data is hard to predict

- **Avoid optimistic updates** for:
  - Operations that navigate away
  - Background/silent operations
  - One-time operations (signup, etc.)
