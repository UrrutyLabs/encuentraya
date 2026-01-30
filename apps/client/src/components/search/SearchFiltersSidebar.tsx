"use client";

import { useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@repo/ui";
import { AvailabilityFilterSection } from "./AvailabilityFilterSection";
import { DynamicFilterSection } from "./DynamicFilterSection";
import { useCategoryConfig } from "@/hooks/category";
import { useSubcategoryBySlugAndCategoryId } from "@/hooks/subcategory";

interface SearchFiltersSidebarProps {
  categoryId?: string;
  subcategorySlug?: string;
}

/**
 * SearchFiltersSidebar Component
 *
 * Container component that renders:
 * - Static availability filter section
 * - Dynamic filter sections from category/subcategory config
 */
export function SearchFiltersSidebar({
  categoryId,
  subcategorySlug,
}: SearchFiltersSidebarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get subcategory ID if slug is provided
  const { subcategory } = useSubcategoryBySlugAndCategoryId(
    subcategorySlug,
    categoryId
  );

  // Fetch effective config
  const { config, isLoading: isLoadingConfig } = useCategoryConfig(
    categoryId,
    subcategory?.id
  );

  // Get quick_questions from config
  const quickQuestions = useMemo(() => config?.quick_questions || [], [config]);

  // Get all filter_* params from URL
  const filterValues = useMemo(() => {
    const values: Record<string, unknown> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("filter_")) {
        const filterKey = key.replace("filter_", "");
        values[filterKey] = value;
      }
    });
    return values;
  }, [searchParams]);

  // Handle filter value change
  const handleFilterChange = useCallback(
    (questionKey: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      const filterKey = `filter_${questionKey}`;

      if (value === null || value === "") {
        params.delete(filterKey);
      } else {
        params.set(filterKey, value);
      }

      const queryString = params.toString();
      router.push(`/search/results${queryString ? `?${queryString}` : ""}`, {
        scroll: false,
      });
    },
    [searchParams, router]
  );

  // Don't render if no category is selected
  if (!categoryId) {
    return null;
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="space-y-6">
        {/* Static Availability Filter */}
        <AvailabilityFilterSection />

        {/* Dynamic Filter Sections from Config */}
        {isLoadingConfig ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-5 bg-muted/30 rounded w-3/4 animate-pulse" />
                <div className="h-10 bg-muted/30 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          quickQuestions.map((question) => (
            <DynamicFilterSection
              key={question.key}
              question={question}
              value={filterValues[question.key]}
              onChange={(value) =>
                handleFilterChange(question.key, value as string | null)
              }
            />
          ))
        )}
      </div>
    </Card>
  );
}
