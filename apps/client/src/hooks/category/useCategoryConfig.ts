import { trpc } from "@/lib/trpc/client";

/**
 * Category/Subcategory config structure
 * Based on CATEGORIES.md specification
 */
export interface CategoryConfig {
  default_estimated_hours?: number;
  min_hours?: number;
  max_hours?: number;
  hour_step?: number;
  suggested_photos?: string[];
  quick_questions?: QuickQuestion[];
  disclaimer?: string;
  allow_tips?: boolean;
  show_arrived_step?: boolean;
  [key: string]: unknown; // Allow additional config keys
}

export interface QuickQuestion {
  key: string;
  label: string;
  type: "boolean" | "select" | "text" | "number";
  options?: string[]; // For select type
  required?: boolean;
}

/**
 * Hook to fetch effective config for a category/subcategory combination
 * Merges: system defaults → category config → subcategory config
 */
export function useCategoryConfig(categoryId?: string, subcategoryId?: string) {
  const {
    data: config,
    isLoading,
    error,
  } = trpc.category.getEffectiveConfig.useQuery(
    {
      categoryId: categoryId!,
      subcategoryId: subcategoryId,
    },
    {
      enabled: !!categoryId,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes (configs don't change often)
    }
  );

  return {
    config: (config as CategoryConfig | undefined) ?? null,
    isLoading,
    error,
  };
}
