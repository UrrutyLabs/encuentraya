"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { useState } from "react";
import { trpc } from "@/utils/trpc";

const getBaseUrl = () => {
  // In the API app, we can use relative URLs since we're on the same server
  if (typeof window !== "undefined") {
    return ""; // Browser: use relative URL
  }
  return `http://localhost:${process.env.PORT || 3002}`; // SSR
};

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers: () => {
            // Get headers from localStorage if available (for test page)
            if (typeof window !== "undefined") {
              const userId = localStorage.getItem("test-user-id");
              const userRole = localStorage.getItem("test-user-role");
              const headers: Record<string, string> = {};
              if (userId) headers["x-user-id"] = userId;
              if (userRole) headers["x-user-role"] = userRole;
              return headers;
            }
            return {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}


