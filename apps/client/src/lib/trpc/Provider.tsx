"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { useState } from "react";
import { trpc } from "./client";
import { createTRPCLinks } from "./links";
import { logger } from "../logger";
import { captureException } from "../crash-reporting";
import { createQueryClientDefaults } from "@repo/react-query/config";
import { NetworkErrorHandler } from "./NetworkErrorHandler";

// Export queryClient instance for use in hooks
let queryClientInstance: QueryClient | null = null;

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
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
        refetchOnWindowFocus: process.env.NODE_ENV === "production",
        queryNetworkMode: "online",
        mutationNetworkMode: "online",
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
      <QueryClientProvider client={queryClient}>
        <NetworkErrorHandler />
        {children}
      </QueryClientProvider>
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
