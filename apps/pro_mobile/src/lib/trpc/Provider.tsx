import { QueryClient, MutationCache, QueryCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState } from "react";
import { trpc } from "./client";
import { createTRPCLinks } from "./links";
import { logger } from "../logger";
import { captureException } from "../crash-reporting";
import { isClientError } from "../react-query/utils";
import { asyncStoragePersister } from "../react-query/persistence";

// Export queryClient instance for use in hooks
let queryClientInstance: QueryClient | null = null;

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => {
      const client = new QueryClient({
        queryCache: new QueryCache({
          onError: (error: Error) => {
            logger.error("React Query error", error, {
              type: "query",
            });
            captureException(error, { type: "react-query-query" });
          },
        }),
        mutationCache: new MutationCache({
          onError: (error: Error) => {
            logger.error("React Query mutation error", error, {
              type: "mutation",
            });
            captureException(error, { type: "react-query-mutation" });
          },
        }),
        defaultOptions: {
          queries: {
            // Retry logic: don't retry on client errors (4xx), retry up to 2 times for server errors
            retry: (failureCount, error) => {
              if (isClientError(error)) {
                return false;
              }
              // Retry up to 2 times for server errors or network errors
              return failureCount < 2;
            },
            // Retry delay: exponential backoff (1s, 2s)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000, // 5 minutes
            // Unused data is kept in cache for 10 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            // Refetch on window focus in production (disabled in dev for better DX)
            refetchOnWindowFocus: !__DEV__,
            // Don't refetch on mount if data is fresh
            refetchOnMount: true,
            // Refetch on reconnect
            refetchOnReconnect: true,
            // Use cached data when offline
            networkMode: "offlineFirst",
          },
          mutations: {
            // Retry mutations once on failure (useful for network errors)
            retry: 1,
            // Retry delay for mutations
            retryDelay: 1000,
            // Use offline-first mode for mutations (queue when offline)
            networkMode: "offlineFirst",
          },
        },
      });
      queryClientInstance = client;
      return client;
    }
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: createTRPCLinks(),
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          // Only persist successful queries
          dehydrateOptions: {
            shouldDehydrateQuery: (query: { state: { status: string } }) => {
              // Don't persist queries that are still loading or have errors
              return query.state.status === "success";
            },
          },
          // Maximum age for persisted data (7 days)
          maxAge: 1000 * 60 * 60 * 24 * 7,
        }}
      >
        {children}
      </PersistQueryClientProvider>
    </trpc.Provider>
  );
}

/**
 * Get the QueryClient instance
 * Use this in hooks that need direct access to queryClient
 */
export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    throw new Error("QueryClient not initialized. Make sure TRPCProvider is mounted.");
  }
  return queryClientInstance;
}
