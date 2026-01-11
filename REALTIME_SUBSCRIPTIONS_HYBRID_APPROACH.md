# Using Supabase Real-time Subscriptions with Prisma (Hybrid Approach)

## Overview

You can use Supabase real-time subscriptions **WITHOUT migrating from Prisma**. This is a hybrid approach where:
- **Prisma** handles all database writes/reads in the API (server-side)
- **Supabase SDK** is used ONLY for real-time subscriptions (client-side or server-side)

---

## How Real-time Subscriptions Work

### Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Mobile App    │────────▶│  Supabase API    │────────▶│  PostgreSQL  │
│  (Supabase SDK) │         │  (PostgREST +    │         │  (Database)  │
│                 │◀────────│   Realtime)      │◀────────│              │
│  Subscribes to  │         │                  │         │              │
│  table changes  │         │  WebSocket       │         │              │
└─────────────────┘         └──────────────────┘         └──────────────┘
                                      ▲
                                      │
                            ┌─────────┴─────────┐
                            │                   │
                    ┌───────▼──────┐   ┌───────▼──────┐
                    │  API Server  │   │  Other Apps  │
                    │  (Prisma)    │   │  (Writes)    │
                    │  Writes data │   │              │
                    └──────────────┘   └──────────────┘
```

**Key Point**: When your API writes data via Prisma → PostgreSQL → Supabase detects the change → Notifies subscribers via WebSocket

---

## Implementation Strategy

### Option 1: Client-Side Subscriptions (Recommended)

**Use Case**: Mobile/Web apps subscribe to database changes

**How it works**:
1. API writes data using Prisma (as it does now)
2. Mobile app uses Supabase SDK to subscribe to table changes
3. When API writes data, Supabase detects the change and pushes it to mobile app
4. Mobile app updates UI in real-time

**Benefits**:
- No changes needed in API
- Real-time updates in mobile app
- Works with existing Prisma setup

### Option 2: Server-Side Subscriptions (Advanced)

**Use Case**: API needs to react to database changes

**How it works**:
1. API creates a separate Supabase client (read-only, for subscriptions)
2. API subscribes to table changes
3. When changes occur, API can trigger webhooks, notifications, etc.

---

## Detailed Implementation: Client-Side Subscriptions

### Step 1: Enable Realtime in Supabase

**In Supabase Dashboard**:
1. Go to Database → Replication
2. Enable replication for tables you want to subscribe to:
   - `bookings` - for real-time booking updates
   - `pro_profiles` - for availability changes
   - `users` - if needed

**Or via SQL**:
```sql
-- Enable realtime for bookings table
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- Enable realtime for pro_profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE pro_profiles;
```

### Step 2: Create Subscription Hook (Mobile App)

**File**: `apps/mobile/src/hooks/useRealtimeBookings.ts`

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';
import type { Booking } from '@repo/domain';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook to subscribe to real-time booking changes
 * Automatically updates when bookings are created, updated, or deleted
 */
export function useRealtimeBookings(proId?: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create a channel for bookings table
    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookings',
          // Optional: filter by proProfileId
          filter: proId ? `proProfileId=eq.${proId}` : undefined,
        },
        (payload) => {
          console.log('Booking change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // New booking created
            setBookings((prev) => [...prev, payload.new as Booking]);
          } else if (payload.eventType === 'UPDATE') {
            // Booking updated
            setBookings((prev) =>
              prev.map((booking) =>
                booking.id === payload.new.id ? (payload.new as Booking) : booking
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Booking deleted
            setBookings((prev) =>
              prev.filter((booking) => booking.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    setChannel(bookingsChannel);

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(bookingsChannel);
    };
  }, [proId]);

  return { bookings, channel };
}
```

### Step 3: Use in HomeScreen

**File**: `apps/mobile/src/screens/home/HomeScreen.tsx`

```typescript
import { useRealtimeBookings } from '../../hooks/useRealtimeBookings';
import { trpc } from '../../lib/trpc/client';

export function HomeScreen() {
  const router = useRouter();
  
  // Initial data fetch via tRPC (Prisma)
  const { data: initialBookings = [], isLoading, error } = trpc.booking.proInbox.useQuery(
    undefined,
    { retry: false, refetchOnWindowFocus: false }
  );

  // Real-time subscription (Supabase SDK)
  const { bookings: realtimeBookings } = useRealtimeBookings();

  // Merge initial data with real-time updates
  const bookings = realtimeBookings.length > 0 ? realtimeBookings : initialBookings;

  // ... rest of component
}
```

---

## Detailed Implementation: Server-Side Subscriptions (Optional)

### Use Case: API needs to react to changes

**File**: `apps/api/src/server/realtime/subscriptions.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

// Create a separate Supabase client for subscriptions only
// This is READ-ONLY and doesn't interfere with Prisma
const supabaseRealtime = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: { schema: 'public' },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Subscribe to booking changes and trigger webhooks/notifications
 */
export function subscribeToBookings() {
  const channel = supabaseRealtime
    .channel('api-bookings-subscription')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
      },
      async (payload) => {
        console.log('Booking changed:', payload);

        // Example: Send notification when booking is accepted
        if (payload.eventType === 'UPDATE') {
          const booking = payload.new;
          if (booking.status === 'accepted') {
            // Trigger notification service
            // await notificationService.sendBookingAccepted(booking);
          }
        }
      }
    )
    .subscribe();

  return channel;
}
```

---

## What Changes Are Needed

### ✅ Minimal Changes Required

#### 1. **Supabase Dashboard Configuration** (5 minutes)
- Enable replication for tables you want to subscribe to
- No code changes needed

#### 2. **Mobile App** (2-3 hours)
- Create subscription hooks (1-2 hooks)
- Use hooks in screens that need real-time updates
- Keep existing tRPC queries for initial data

#### 3. **API** (Optional - 0 changes if client-side only)
- No changes needed if using client-side subscriptions
- Only add server-side subscriptions if you need them

---

## Code Examples

### Example 1: Real-time Booking Updates

**Scenario**: When a pro accepts a booking, all clients see the update immediately

**Mobile App Hook**:
```typescript
// apps/mobile/src/hooks/useRealtimeBooking.ts
export function useRealtimeBooking(bookingId: string) {
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          setBooking(payload.new as Booking);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  return booking;
}
```

**Usage in BookingDetailScreen**:
```typescript
// Initial fetch via tRPC
const { data: booking } = trpc.booking.getById.useQuery({ id: bookingId });

// Real-time updates via Supabase
const realtimeBooking = useRealtimeBooking(bookingId);

// Use real-time data if available, otherwise use tRPC data
const currentBooking = realtimeBooking || booking;
```

### Example 2: Real-time Availability Changes

**Scenario**: When a pro toggles availability, it updates immediately

**Mobile App Hook**:
```typescript
// apps/mobile/src/hooks/useRealtimeAvailability.ts
export function useRealtimeAvailability(proId: string) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`pro-availability-${proId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pro_profiles',
          filter: `userId=eq.${proId}`,
        },
        (payload) => {
          const pro = payload.new;
          // Assuming availability is stored as a field or calculated
          setIsAvailable(pro.isAvailable || false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [proId]);

  return isAvailable;
}
```

### Example 3: Real-time New Bookings for Pro

**Scenario**: When a new booking is created, pro sees it immediately in their inbox

**Mobile App Hook**:
```typescript
// apps/mobile/src/hooks/useRealtimeNewBookings.ts
export function useRealtimeNewBookings(proId: string) {
  const [newBookings, setNewBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel('new-bookings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `proProfileId=eq.${proId}`,
        },
        (payload) => {
          const newBooking = payload.new as Booking;
          setNewBookings((prev) => [newBooking, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [proId]);

  return newBookings;
}
```

---

## How It Works with Prisma

### Data Flow

1. **API writes data via Prisma**:
   ```typescript
   // In your API (using Prisma, as you do now)
   await prisma.booking.update({
     where: { id: bookingId },
     data: { status: 'accepted' }
   });
   ```

2. **PostgreSQL receives the change**:
   - Prisma executes SQL UPDATE
   - PostgreSQL updates the row
   - PostgreSQL triggers are fired (if any)

3. **Supabase detects the change**:
   - Supabase's replication system detects the PostgreSQL change
   - PostgREST captures the change event
   - Realtime service broadcasts via WebSocket

4. **Mobile app receives update**:
   - Supabase SDK WebSocket connection receives the event
   - Your subscription callback is triggered
   - UI updates automatically

**Key Point**: Prisma writes to PostgreSQL → Supabase reads from PostgreSQL → Supabase broadcasts changes

---

## Benefits of This Approach

### ✅ **No Migration Needed**
- Keep all your Prisma code
- Keep all your repositories
- Keep all your migrations
- Zero breaking changes

### ✅ **Best of Both Worlds**
- **Prisma**: Type safety, migrations, complex queries, server-side operations
- **Supabase Realtime**: Real-time subscriptions, WebSocket connections, live updates

### ✅ **Minimal Code Changes**
- Add 2-3 hooks in mobile app
- Use hooks in 2-3 screens
- No API changes needed (if client-side only)

### ✅ **Performance**
- Prisma writes are fast (direct PostgreSQL)
- Real-time subscriptions are efficient (WebSocket)
- No performance penalty

### ✅ **Flexibility**
- Can enable/disable real-time per feature
- Can use real-time selectively
- Easy to remove if not needed

---

## Limitations & Considerations

### ⚠️ **Supabase Realtime Limitations**

1. **Connection Limits**:
   - Free tier: 200 concurrent connections
   - Pro tier: 500 concurrent connections
   - May need to manage connection lifecycle carefully

2. **Message Size**:
   - WebSocket messages have size limits
   - Large payloads may need to be split

3. **Filtering**:
   - Can filter by column values
   - Complex filters may not be supported
   - May need to filter in application code

4. **Schema Changes**:
   - When you change Prisma schema, need to update Supabase replication
   - Need to re-enable replication after migrations

### ⚠️ **Data Consistency**

1. **Initial Load**:
   - Still use tRPC/Prisma for initial data
   - Real-time only for updates

2. **Race Conditions**:
   - Real-time update might arrive before initial fetch completes
   - Need to handle merge logic carefully

3. **Error Handling**:
   - WebSocket connections can drop
   - Need reconnection logic
   - Fallback to polling if real-time fails

---

## Implementation Checklist

### Phase 1: Setup (30 minutes)
- [ ] Enable replication in Supabase dashboard for `bookings` table
- [ ] Enable replication for `pro_profiles` table (if needed)
- [ ] Test replication is working (check Supabase logs)

### Phase 2: Mobile App Hooks (2-3 hours)
- [ ] Create `useRealtimeBookings` hook
- [ ] Create `useRealtimeBooking` hook (single booking)
- [ ] Create `useRealtimeAvailability` hook (if needed)
- [ ] Add error handling and reconnection logic

### Phase 3: Integrate in Screens (1-2 hours)
- [ ] Update `HomeScreen` to use real-time bookings
- [ ] Update `BookingDetailScreen` to use real-time updates
- [ ] Update `AvailabilityScreen` to use real-time (if needed)
- [ ] Test that updates appear in real-time

### Phase 4: Testing (1-2 hours)
- [ ] Test subscription works when API updates via Prisma
- [ ] Test reconnection when connection drops
- [ ] Test multiple clients receiving same update
- [ ] Test performance with many subscriptions

---

## Code Structure After Implementation

```
apps/
  mobile/
    src/
      hooks/
        useRealtimeBookings.ts      # NEW - Subscribe to bookings
        useRealtimeBooking.ts       # NEW - Subscribe to single booking
        useRealtimeAvailability.ts  # NEW - Subscribe to availability
        useAuth.ts                  # Existing
        useBookingActions.ts        # Existing
        useAvailability.ts         # Existing
      
      screens/
        home/
          HomeScreen.tsx            # UPDATED - Add real-time hook
        booking/
          BookingDetailScreen.tsx   # UPDATED - Add real-time hook
        availability/
          AvailabilityScreen.tsx   # UPDATED - Add real-time hook (if needed)

  api/
    src/
      server/
        repositories/              # NO CHANGES - Still use Prisma
        services/                   # NO CHANGES - Still use Prisma
        db/
          prisma.ts                 # NO CHANGES - Still use Prisma
```

---

## Example: Complete Real-time Booking Flow

### 1. Pro accepts booking (API - Prisma)
```typescript
// apps/api/src/server/services/booking.service.ts
// (No changes - existing code)
await prisma.booking.update({
  where: { id: bookingId },
  data: { status: 'accepted' }
});
```

### 2. Mobile app receives update (Real-time)
```typescript
// apps/mobile/src/screens/booking/BookingDetailScreen.tsx
const { data: booking } = trpc.booking.getById.useQuery({ id: bookingId });
const realtimeBooking = useRealtimeBooking(bookingId);

// When pro accepts, realtimeBooking updates automatically
// UI shows "Aceptada" status immediately
```

### 3. Other pros see update (Real-time)
```typescript
// apps/mobile/src/screens/home/HomeScreen.tsx
const { bookings } = useRealtimeBookings();

// When booking is accepted, it moves from "Solicitudes nuevas" 
// to "Próximos trabajos" automatically
```

---

## Performance Considerations

### Connection Management

**Best Practice**: Create one channel per screen, cleanup on unmount

```typescript
useEffect(() => {
  const channel = supabase.channel('bookings').subscribe();
  
  return () => {
    supabase.removeChannel(channel); // IMPORTANT: Cleanup
  };
}, []);
```

### Subscription Filtering

**Optimize**: Filter subscriptions to only relevant data

```typescript
// Good: Filter by proProfileId
.filter(`proProfileId=eq.${proId}`)

// Bad: Subscribe to all bookings
// (receives updates for all pros)
```

### Reconnection Strategy

**Handle**: WebSocket connections can drop

```typescript
const channel = supabase
  .channel('bookings')
  .on('postgres_changes', ...)
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected to real-time');
    } else if (status === 'CHANNEL_ERROR') {
      console.error('Real-time error, reconnecting...');
      // Supabase SDK handles reconnection automatically
    }
  });
```

---

## Cost Analysis

### Supabase Realtime Pricing

- **Free Tier**: 200 concurrent connections, 2GB bandwidth/month
- **Pro Tier**: 500 concurrent connections, 50GB bandwidth/month
- **Team Tier**: Unlimited connections, 200GB bandwidth/month

### Your Use Case

- **Estimated connections**: 1-2 per active user (one for bookings, one for availability)
- **Estimated bandwidth**: Low (only change events, not full data)
- **Recommendation**: Free tier likely sufficient for MVP, Pro tier for production

---

## Comparison: Real-time vs Polling

### Current Approach (Polling)
```typescript
// Refetch every 30 seconds
const { data } = trpc.booking.proInbox.useQuery(undefined, {
  refetchInterval: 30000
});
```

**Issues**:
- Delayed updates (up to 30 seconds)
- Unnecessary network requests
- Battery drain on mobile
- Server load from constant polling

### Real-time Approach
```typescript
// Updates instantly when change occurs
const { bookings } = useRealtimeBookings();
```

**Benefits**:
- Instant updates (< 1 second)
- Efficient (only when changes occur)
- Better battery life
- Lower server load

---

## Security Considerations

### Row Level Security (RLS)

**Important**: Even with real-time subscriptions, RLS policies apply

```sql
-- Example: Pros can only see their own bookings
CREATE POLICY "Pros can view their bookings"
ON bookings FOR SELECT
USING (
  proProfileId IN (
    SELECT id FROM pro_profiles WHERE userId = auth.uid()
  )
);
```

**Current Setup**: You're using service role key (bypasses RLS)
- Real-time subscriptions from mobile app use user's access token
- RLS policies will be enforced
- Need to ensure RLS is configured correctly

### Authentication

**Mobile App Subscriptions**:
- Use user's access token (from `supabase.auth.getSession()`)
- RLS policies automatically applied
- User only receives updates they're allowed to see

---

## Migration Path (If You Want Real-time Later)

### Phase 1: Add Real-time (Current Plan)
- Keep Prisma
- Add Supabase subscriptions
- **Time**: 2-3 hours

### Phase 2: Evaluate (After 1-2 weeks)
- Measure real-time usage
- Check performance
- Gather feedback

### Phase 3: Optimize (If needed)
- Add more subscriptions
- Optimize filters
- Add server-side subscriptions (if needed)

### Phase 4: Full Migration (Only if needed)
- Only migrate if you need features not available with hybrid approach
- Current hybrid approach covers 90% of use cases

---

## Conclusion

**You can use Supabase real-time subscriptions WITHOUT migrating from Prisma.**

**Effort**: **LOW** (2-3 hours)
**Benefits**: **HIGH** (real-time updates, better UX)
**Risk**: **LOW** (additive, doesn't break existing code)

**Recommended Approach**:
1. Enable replication in Supabase dashboard
2. Create 2-3 subscription hooks in mobile app
3. Use hooks in screens that need real-time updates
4. Keep all existing Prisma code unchanged

This gives you real-time capabilities with minimal effort and zero risk to your existing codebase.
