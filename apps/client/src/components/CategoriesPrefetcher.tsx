"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { logger } from "@/lib/logger";

/**
 * CategoriesPrefetcher Component
 *
 * Prefetches categories and all subcategories on app mount
 * Ensures this data is always available in React Query cache
 * Runs silently in the background - doesn't block rendering
 */
export function CategoriesPrefetcher() {
  const utils = trpc.useUtils();

  useEffect(() => {
    // Prefetch categories and all subcategories in parallel (non-blocking)
    const prefetchData = async () => {
      try {
        await Promise.all([
          utils.category.getAll.prefetch({ includeDeleted: false }),
          utils.subcategory.getAll.prefetch(),
        ]);
      } catch (error) {
        logger.error(
          "Failed to prefetch categories/subcategories",
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };

    void prefetchData();
  }, [utils]);

  // This component doesn't render anything
  return null;
}
