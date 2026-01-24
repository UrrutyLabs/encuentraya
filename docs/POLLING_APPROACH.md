# Smart Polling Strategy

## Overview

This document explains the smart polling strategy used in the pro mobile app to provide near real-time updates without requiring WebSocket infrastructure or Supabase Realtime setup.

## Strategy

Instead of using WebSocket subscriptions or Supabase Realtime, we use **React Query's `refetchInterval`** combined with **smart polling logic** that:

- ✅ Polls at configured intervals when app is in **foreground**
- ✅ **Stops polling** when app is in **background** (saves battery)
- ✅ **Immediately refetches** when app comes to foreground
- ✅ Works with existing HTTP endpoints (no infrastructure changes)

---

## Implementation

### Smart Polling Hook

**File**: `apps/pro_mobile/src/hooks/useSmartPolling.ts`

A reusable hook that provides smart polling configuration:

```typescript
const pollingOptions = useSmartPolling({
  interval: 10000, // Poll every 10 seconds when in foreground
  enabled: true,
  refetchOnForeground: true,
});
```

**Features:**

- Automatically detects app state (foreground/background) using `AppState` API
- Returns React Query options that can be spread into query configurations
- Pauses polling when app goes to background
- Resumes polling when app comes to foreground

### App State Detection

**File**: `apps/pro_mobile/src/hooks/useAppState.ts`

Tracks whether the app is in foreground or background using React Native's `AppState` API.

---

## Usage in Screens

### HomeScreen

```typescript
const pollingOptions = useSmartPolling({
  interval: 10000, // 10 seconds
  enabled: true,
  refetchOnForeground: true,
});

const { data: bookings = [] } = trpc.booking.proInbox.useQuery(undefined, {
  retry: false,
  ...pollingOptions,
});
```

### JobsScreen

```typescript
const pollingOptions = useSmartPolling({
  interval: 10000, // 10 seconds
  enabled: true,
  refetchOnForeground: true,
});

const { data: bookings = [] } = trpc.booking.proJobs.useQuery(undefined, {
  retry: false,
  ...pollingOptions,
});
```

### BookingDetailScreen

```typescript
const pollingOptions = useSmartPolling({
  interval: 5000, // 5 seconds (more frequent for detail view)
  enabled: !!bookingId,
  refetchOnForeground: true,
});

const { data: booking } = trpc.booking.getById.useQuery(
  { id: bookingId || "" },
  {
    enabled: !!bookingId,
    retry: false,
    ...pollingOptions,
  }
);
```

---

## Polling Intervals

| Screen              | Interval    | Reason                     |
| ------------------- | ----------- | -------------------------- |
| HomeScreen          | 10 seconds  | List view, less critical   |
| JobsScreen          | 10 seconds  | List view, less critical   |
| BookingDetailScreen | 5 seconds   | Detail view, more critical |
| Background          | **Stopped** | No polling (saves battery) |

---

## How It Works

### 1. App in Foreground

- Polls at configured interval (5s for detail, 10s for lists)
- Updates UI automatically when data changes
- Network requests happen at regular intervals

### 2. App in Background

- Polling **stops** (`refetchInterval = false`)
- **No network requests** made
- Saves battery and reduces server load

### 3. App Returns to Foreground

- **Immediately refetches** data (`refetchOnWindowFocus`)
- Resumes polling at configured interval
- User sees latest data right away

---

## Benefits

✅ **Simple**: No WebSocket server needed  
✅ **Works immediately**: No Supabase Realtime setup required  
✅ **No infrastructure changes**: Uses existing HTTP endpoints  
✅ **Battery efficient**: Stops polling when app is in background  
✅ **Good UX**: Immediate refresh when app becomes active  
✅ **Easy to test**: Standard HTTP requests  
✅ **Type-safe**: Full TypeScript support

---

## Trade-offs

⚠️ **Not truly real-time**: 5-10 second delay  
⚠️ **More network requests**: Constant polling when active  
⚠️ **Server load**: More requests than WebSocket (but paused in background)

**For MVP, these trade-offs are acceptable!**

---

## Future Upgrade Path

If you need true real-time later:

1. Keep the polling approach working
2. Add WebSocket server when needed
3. Gradually migrate screens to subscriptions
4. Keep polling as fallback

The smart polling implementation is designed to be easily replaceable with WebSocket subscriptions when needed.

---

## Testing

### Verify Smart Polling Works

1. **Open HomeScreen** - Should poll every 10 seconds
2. **Put app in background** - Polling should stop (check network tab)
3. **Bring app to foreground** - Should immediately refetch
4. **Open BookingDetailScreen** - Should poll every 5 seconds
5. **Navigate away** - Polling should stop when screen unmounts

### Expected Behavior

- ✅ Polling active when screen is visible and app is in foreground
- ✅ Polling stops when app goes to background
- ✅ Immediate refetch when app returns to foreground
- ✅ No unnecessary network requests when app is inactive
