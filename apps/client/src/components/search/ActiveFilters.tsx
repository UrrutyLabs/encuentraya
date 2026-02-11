"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Text } from "@repo/ui";
import { getCategoryLabel } from "@/lib/search/categoryIcons";
import { useCategoryBySlug } from "@/hooks/category";
import { useSubcategoryBySlugAndCategoryId } from "@/hooks/subcategory";

/**
 * ActiveFilters Component
 *
 * Displays active search filters as removable chips.
 * Shows search query, category, and subcategory. Location is always included in search but not shown (not removable).
 *
 * @example
 * ```tsx
 * <ActiveFilters onFilterRemove={handleFilterRemove} />
 * ```
 */
interface ActiveFiltersProps {
  /** Reserved for future use - callback when a filter is removed */
  onFilterRemove?: (filterType: "q" | "category" | "subcategory") => void;
}

export function ActiveFilters({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onFilterRemove: _onFilterRemove,
}: ActiveFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQuery = searchParams.get("q");
  const categorySlug = searchParams.get("category") || undefined;
  const subcategorySlug = searchParams.get("subcategory") || undefined;

  // Fetch category by slug from URL
  const { category } = useCategoryBySlug(categorySlug);

  // Fetch subcategory by slug and categoryId
  const { subcategory } = useSubcategoryBySlugAndCategoryId(
    subcategorySlug,
    category?.id
  );

  const hasFilters = !!(searchQuery || category || subcategory);

  if (!hasFilters) {
    return null;
  }

  const handleRemove = (filterType: "q" | "category" | "subcategory") => {
    const params = new URLSearchParams(searchParams.toString());

    if (filterType === "q") {
      params.delete("q");
    } else if (filterType === "category") {
      params.delete("category");
      params.delete("subcategory"); // Also remove subcategory if removing category
    } else if (filterType === "subcategory") {
      params.delete("subcategory");
    }
    // Location is not removable - always preserved when removing other filters

    const queryString = params.toString();
    router.push(`/search/results${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
      {searchQuery && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <Text variant="small" className="text-primary font-medium">
            &quot;{searchQuery}&quot;
          </Text>
          <button
            onClick={() => handleRemove("q")}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-primary/20 transition-colors touch-manipulation"
            aria-label={`Remover búsqueda "${searchQuery}"`}
            type="button"
          >
            <X className="w-3 h-3 text-primary" aria-hidden="true" />
          </button>
        </div>
      )}

      {category && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <Text variant="small" className="text-primary font-medium">
            {getCategoryLabel(category)}
          </Text>
          <button
            onClick={() => handleRemove("category")}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-primary/20 transition-colors touch-manipulation"
            aria-label={`Remover categoría ${getCategoryLabel(category)}`}
            type="button"
          >
            <X className="w-3 h-3 text-primary" aria-hidden="true" />
          </button>
        </div>
      )}

      {subcategory && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <Text variant="small" className="text-primary font-medium">
            {subcategory.name}
          </Text>
          <button
            onClick={() => handleRemove("subcategory")}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-primary/20 transition-colors touch-manipulation"
            aria-label={`Remover subcategoría ${subcategory.name}`}
            type="button"
          >
            <X className="w-3 h-3 text-primary" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
