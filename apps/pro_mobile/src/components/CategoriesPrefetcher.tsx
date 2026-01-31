import { useEffect } from "react";
import { trpc } from "@lib/trpc/client";
import { logger } from "@lib/logger";

/**
 * CategoriesPrefetcher Component
 *
 * Prefetches categories and subcategories on app startup.
 * Runs silently in the background and doesn't block app rendering.
 *
 * Categories are cached with 7-day staleTime, so they'll be available
 * immediately when needed and won't refetch frequently.
 */
export function CategoriesPrefetcher() {
  const utils = trpc.useUtils();

  useEffect(() => {
    // Prefetch categories and subcategories in the background
    // This doesn't block app rendering - it's a background operation
    const prefetchCategories = async () => {
      try {
        // Prefetch categories with 7-day staleTime
        await utils.category.getAll.prefetch(undefined, {
          staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Prefetch subcategories with 7-day staleTime
        await utils.subcategory.getAll.prefetch(undefined, {
          staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        logger.info("Categories and subcategories prefetched successfully");
      } catch (error) {
        // Log error but don't block app - categories will be fetched on-demand
        logger.error(
          "Failed to prefetch categories",
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };

    // Start prefetching immediately (non-blocking)
    prefetchCategories();
  }, [utils]);

  // This component doesn't render anything
  return null;
}
