import { QueryClient, MutationCache, QueryCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState } from "react";
import { trpc } from "./client";
import { createTRPCLinks } from "./links";
import { logger } from "../logger";
import { captureException } from "../crash-reporting";
import { createQueryClientDefaults } from "@repo/react-query/config";
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
        defaultOptions: createQueryClientDefaults({
          refetchOnWindowFocus: !__DEV__,
          queryNetworkMode: "offlineFirst",
          mutationNetworkMode: "offlineFirst",
        }),
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
