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
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      queryCache: new QueryCache({
        onError: (error: Error) => {
          // Check if it's a JSON parse error (usually means API returned HTML)
          const isJsonParseError = error.message.includes("JSON Parse error");
          const errorContext: Record<string, unknown> = {
            type: "query",
          };

          if (isJsonParseError) {
            errorContext.hint =
              "API may be returning HTML instead of JSON. Check if API server is running and accessible.";
            errorContext.apiUrl =
              process.env.EXPO_PUBLIC_API_URL || "http://localhost:3002";
          }

          logger.error("React Query error", error, errorContext);
          captureException(error, errorContext);
        },
      }),
      mutationCache: new MutationCache({
        onError: (error: Error) => {
          // Check if it's a JSON parse error (usually means API returned HTML)
          const isJsonParseError = error.message.includes("JSON Parse error");
          const errorContext: Record<string, unknown> = {
            type: "mutation",
          };

          if (isJsonParseError) {
            errorContext.hint =
              "API may be returning HTML instead of JSON. Check if API server is running and accessible.";
            errorContext.apiUrl =
              process.env.EXPO_PUBLIC_API_URL || "http://localhost:3002";
          }

          logger.error("React Query mutation error", error, errorContext);
          captureException(error, errorContext);
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
  });

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
 * Get the QueryClient instance (throws if provider not mounted).
 * Use this in hooks that need direct access to queryClient.
 */
export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    throw new Error(
      "QueryClient not initialized. Make sure TRPCProvider is mounted."
    );
  }
  return queryClientInstance;
}

/**
 * Get the QueryClient instance if available (e.g. for sign-out cleanup).
 * Returns null when TRPCProvider has not mounted yet (e.g. early in app load).
 */
export function getQueryClientIfAvailable(): QueryClient | null {
  return queryClientInstance;
}
