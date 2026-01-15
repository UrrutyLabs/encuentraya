# Offline Support & Performance Optimizations

This document describes the offline support and performance optimizations implemented in the mobile app.

## Phase 4: Performance Optimizations

### React.memo for Presentational Components

**BookingCard** component is now memoized to prevent unnecessary re-renders:
- Only re-renders when booking ID, status, or onPress handler changes
- Reduces render cycles in lists with many items

### useCallback for Event Handlers

Event handlers are memoized using `useCallback`:
- `handleCardPress` in HomeScreen and JobsScreen
- All action handlers in BookingDetailScreen (accept, reject, markOnMyWay, etc.)
- Prevents child components from re-rendering unnecessarily

### useMemo for Computed Values

Expensive computations are memoized:
- Date formatting
- Status labels and variants
- Category labels
- Filtered booking lists

**Benefits**:
- Smoother scrolling in lists
- Reduced CPU usage
- Better battery life
- Faster UI interactions

## Phase 6: Offline Support

### React Query Persistence

Query cache is persisted to AsyncStorage:
- **Storage**: `@react-native-async-storage/async-storage`
- **Key**: `REACT_QUERY_OFFLINE_CACHE`
- **Max Age**: 7 days
- **Throttle**: 1 second (prevents excessive writes)

**How it works**:
- Successful queries are automatically persisted
- On app restart, cache is restored from storage
- Users can view cached data even when offline

### Network Status Detection

Real-time network connectivity monitoring:
- **Hook**: `useNetworkStatus()`
- **Package**: `@react-native-community/netinfo`
- **Returns**: `{ isOnline, isOffline, isChecking }`

**Usage**:
```typescript
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

function MyComponent() {
  const { isOnline, isOffline } = useNetworkStatus();
  
  if (isOffline) {
    // Show offline UI
  }
}
```

### Offline Indicator

Visual indicator when device is offline:
- Shows banner at top of screen
- Displays "Sin conexión" message
- Automatically hides when connection is restored

### Offline-First Mode

React Query configured for offline-first behavior:
- **Queries**: Use cached data when offline, refetch when online
- **Mutations**: Queue when offline, execute when online
- **Network Mode**: `offlineFirst` for both queries and mutations

**Benefits**:
- App works offline with cached data
- Mutations are queued and executed automatically when online
- Seamless transition between online/offline states

## Configuration

### QueryClient Settings

```typescript
{
  queries: {
    networkMode: "offlineFirst", // Use cache when offline
    refetchOnReconnect: true,     // Refetch when back online
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes
  },
  mutations: {
    networkMode: "offlineFirst", // Queue when offline
    retry: 1,                     // Retry once on failure
  },
}
```

### Persistence Settings

```typescript
{
  persister: asyncStoragePersister,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Only persist successful queries
      return query.state.status === "success";
    },
  },
}
```

## Usage Examples

### Check Network Status

```typescript
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

function MyScreen() {
  const { isOnline, isOffline } = useNetworkStatus();
  
  return (
    <View>
      {isOffline && <Text>You're offline</Text>}
      {/* Your content */}
    </View>
  );
}
```

### Access Persisted Cache

The cache is automatically persisted and restored. No additional code needed!

### Offline Mutations

Mutations automatically queue when offline and execute when online:

```typescript
// This mutation will queue if offline and execute when online
const mutation = trpc.booking.accept.useMutation({
  // ... mutation config
});

mutation.mutate({ bookingId: "123" }); // Works offline!
```

## Benefits

### Performance
- ✅ Faster UI interactions
- ✅ Smoother scrolling
- ✅ Reduced re-renders
- ✅ Better battery life

### Offline Support
- ✅ View cached data offline
- ✅ Queue mutations for later
- ✅ Automatic sync when online
- ✅ Visual offline indicator

## Dependencies Added

- `@tanstack/react-query-persist-client`: Query persistence
- `@react-native-async-storage/async-storage`: Storage backend
- `@react-native-community/netinfo`: Network detection

## Future Enhancements

- [ ] Manual sync button
- [ ] Offline queue management UI
- [ ] Conflict resolution for mutations
- [ ] Background sync service
