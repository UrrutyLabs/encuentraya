# React Query Configuration & Optimistic Updates

This app uses React Query (TanStack Query) with enhanced configuration and optimistic update utilities.

## Features

### Enhanced QueryClient Configuration

- **Smart Retry Logic**: 
  - No retries for client errors (4xx)
  - Up to 2 retries for server errors (5xx) with exponential backoff
  - Mutations retry once on failure

- **Cache Management**:
  - `staleTime`: 5 minutes (data is fresh for 5 minutes)
  - `gcTime`: 10 minutes (unused data kept for 10 minutes)
  - Automatic refetch on reconnect
  - Refetch on window focus (production only)

- **Error Handling**:
  - Global error handlers for queries and mutations
  - Automatic error logging and crash reporting

### Optimistic Updates

Optimistic updates provide instant UI feedback by updating the cache immediately, then rolling back if the mutation fails.

#### Basic Usage

```typescript
import { useQueryClient } from "@/hooks/useQueryClient";
import { createOptimisticUpdate } from "@/lib/react-query/utils";
import { trpc } from "@/lib/trpc/client";

function useUpdateBooking() {
  const queryClient = useQueryClient();

  const mutation = trpc.booking.update.useMutation({
    ...createOptimisticUpdate(queryClient, {
      queryKey: [["booking", "detail", { id: bookingId }]],
      optimisticData: (variables) => ({
        ...currentBooking,
        ...variables.updates,
      }),
      rollback: (previousData) => previousData, // Optional: custom rollback
    }),
    onSuccess: () => {
      // Additional success handling
    },
  });

  return mutation;
}
```

#### Advanced: Multiple Query Updates

```typescript
import { invalidateRelatedQueries } from "@/lib/react-query/utils";

const mutation = trpc.booking.accept.useMutation({
  ...invalidateRelatedQueries(queryClient, [
    [["booking", "proInbox"]],
    [["booking", "proJobs"]],
    [["booking", "detail", { id: bookingId }]],
  ]),
});
```

### Query Invalidation Helpers

#### Invalidate Related Queries

```typescript
import { invalidateRelatedQueries } from "@/lib/react-query/utils";

const mutation = trpc.booking.complete.useMutation({
  ...invalidateRelatedQueries(queryClient, [
    [["booking", "proJobs"]],
    [["booking", "detail", { id: bookingId }]],
  ]),
});
```

#### Refetch Queries

```typescript
import { refetchQueries } from "@/lib/react-query/utils";

const mutation = trpc.pro.updateProfile.useMutation({
  ...refetchQueries(queryClient, [
    [["pro", "getMyProfile"]],
  ]),
});
```

### Error Utilities

```typescript
import { isClientError, isServerError } from "@/lib/react-query/utils";

// Check error types
if (isClientError(error)) {
  // Handle client error (4xx)
}

if (isServerError(error)) {
  // Handle server error (5xx)
}
```

### Accessing QueryClient

```typescript
import { useQueryClient } from "@/hooks/useQueryClient";

function MyComponent() {
  const queryClient = useQueryClient();

  // Manual cache operations
  queryClient.setQueryData(["key"], data);
  queryClient.getQueryData(["key"]);
  queryClient.invalidateQueries({ queryKey: ["key"] });
}
```

## Best Practices

1. **Use Optimistic Updates** for mutations that update local state (toggles, status changes)
2. **Use Query Invalidation** for mutations that affect multiple queries
3. **Use Refetch** when you need the latest data immediately
4. **Handle Errors** appropriately - client errors shouldn't retry, server errors should

## Example: Optimistic Toggle

```typescript
const toggleMutation = trpc.pro.setAvailability.useMutation({
  ...createOptimisticUpdate(queryClient, {
    queryKey: [["pro", "getMyProfile"]],
    optimisticData: (variables) => ({
      ...currentProfile,
      isAvailable: variables.isAvailable,
    }),
  }),
});
```

## Configuration

The QueryClient is configured in `src/lib/trpc/Provider.tsx`. Key settings:

- **Retry**: Smart retry logic based on error type
- **Stale Time**: 5 minutes
- **GC Time**: 10 minutes
- **Refetch**: On reconnect, on window focus (prod only)
