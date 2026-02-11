"use client";

import {
  useState,
  useMemo,
  useCallback,
  Suspense,
  useEffect,
  useRef,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Text } from "@repo/ui";
import { AppShell } from "@/components/presentational/AppShell";
import { SearchBar } from "@/components/search/SearchBar";
import { ProList } from "@/components/search/ProList";
import { EmptyState } from "@/components/presentational/EmptyState";
import { SearchError } from "@/components/search/SearchError";
import { SearchFiltersSidebar } from "@/components/search/SearchFiltersSidebar";
import { AvailabilityFilterSectionSkeleton } from "@/components/search/AvailabilityFilterSection";
import { useSearchPros } from "@/hooks/pro";
import { useCategoryBySlug, useCategoryConfig } from "@/hooks/category";
import { useSubcategoryBySlugAndCategoryId } from "@/hooks/subcategory";
import type { TimeWindow } from "@repo/domain";

/**
 * SearchResultsContent Component
 *
 * Displays search results with:
 * - Sticky search bar at top
 * - Active filters display
 * - Collapsible filters (mobile) / Always visible filters (desktop)
 * - Professional list or empty state
 *
 * Manages URL state synchronization for filters and browser history support.
 */
function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQuery = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || undefined;
  const dateParam = searchParams.get("date") || "";
  const timeWindowParam = searchParams.get("timeWindow") || "";
  const locationParam = searchParams.get("location") || undefined;
  const zipCodeParam = searchParams.get("zipCode") || undefined;

  // Fetch category by slug from URL
  const { category } = useCategoryBySlug(categorySlug);

  // Initialize state from URL params (only on mount/param change)
  const [date, setDate] = useState(() => dateParam);
  const [timeWindow, setTimeWindow] = useState<TimeWindow | "">(
    () => (timeWindowParam as TimeWindow) || ""
  );

  // Refs to track previous URL params for syncing with browser history
  const prevDateParamRef = useRef(dateParam);
  const prevTimeWindowParamRef = useRef(timeWindowParam);

  // Update local state when URL params change (e.g., browser back/forward)
  // This is necessary to sync form inputs with browser history navigation
  // Note: Syncing state from URL params is a valid use case for browser history
  useEffect(() => {
    if (prevDateParamRef.current !== dateParam) {
      prevDateParamRef.current = dateParam;
      // Defer setState to avoid synchronous state updates in effect
      setTimeout(() => {
        setDate(dateParam);
      }, 0);
    }
  }, [dateParam]);

  useEffect(() => {
    if (prevTimeWindowParamRef.current !== timeWindowParam) {
      prevTimeWindowParamRef.current = timeWindowParam;
      // Defer setState to avoid synchronous state updates in effect
      setTimeout(() => {
        setTimeWindow((timeWindowParam as TimeWindow) || "");
      }, 0);
    }
  }, [timeWindowParam]);

  // Get subcategory slug from URL
  const subcategorySlug = searchParams.get("subcategory") || undefined;

  // Get subcategory for config fetching
  const { subcategory } = useSubcategoryBySlugAndCategoryId(
    subcategorySlug,
    category?.id
  );

  // Fetch config for dynamic filters
  const { config } = useCategoryConfig(category?.id, subcategory?.id);

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

  // When q is in URL (text search), pass it so API resolves to category/subcategory.
  // When category/subcategory are in URL (from typeahead or category picker), use those.
  // location (full address) enables radius filter and distance sort.
  const filters = useMemo(
    () => ({
      categoryId: category?.id,
      subcategory: subcategorySlug,
      q: searchQuery.trim() || undefined,
      date: date || undefined,
      timeWindow: (timeWindow || undefined) as TimeWindow | undefined,
      location: locationParam?.trim() || undefined,
    }),
    [
      category?.id,
      subcategorySlug,
      searchQuery,
      date,
      timeWindow,
      locationParam,
    ]
  );

  const { pros: allPros, isLoading, error } = useSearchPros(filters);

  // Client-side filtering based on filter_* params
  const pros = useMemo(() => {
    if (!config?.quick_questions || Object.keys(filterValues).length === 0) {
      return allPros;
    }

    // For MVP, we don't filter pros client-side since they don't have this metadata
    // The filters are stored in URL and will be used when creating orders
    // This is a placeholder for future filtering logic
    return allPros;
  }, [allPros, config, filterValues]);

  const handleRetry = useCallback(() => {
    // Force refetch by removing retry param if it exists and refreshing
    const params = new URLSearchParams(searchParams.toString());
    params.delete("_retry");
    const queryString = params.toString();
    router.push(`/search/results${queryString ? `?${queryString}` : ""}`);
    // Force a page refresh to retry the query
    router.refresh();
  }, [searchParams, router]);

  const handleClearFilters = useCallback(() => {
    // Clear all filters and reset to base search page
    router.push("/");
  }, [router]);

  // Generate suggestions based on active filters
  const emptyStateSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    if (category) {
      suggestions.push("Intentá buscar en otra categoría");
    }
    if (date) {
      suggestions.push("Probá con otra fecha");
    }
    if (timeWindow) {
      suggestions.push("Intentá con otro horario");
    }
    if (searchQuery) {
      suggestions.push("Probá con otras palabras clave");
    }
    if (locationParam || zipCodeParam) {
      suggestions.push("Probá con otra ubicación");
    }
    if (suggestions.length === 0) {
      suggestions.push("Explorá las categorías disponibles");
      suggestions.push("Intentá buscar sin filtros");
    }
    return suggestions;
  }, [category, date, timeWindow, searchQuery, locationParam, zipCodeParam]);

  const searchBarInitialQuery = searchQuery || subcategory?.name || "";

  return (
    <AppShell
      showLogin={true}
      centerContent={
        <SearchBar initialQuery={searchBarInitialQuery} preserveParams={true} />
      }
    >
      <div className="px-4 py-4 md:py-8">
        {/* Layout: Sidebar + Results (lg+) - contained like other pages */}
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Filters (Desktop lg+) */}
          {(categorySlug || category?.id) && (
            <aside className="hidden lg:block lg:w-80 lg:shrink-0 lg:self-start">
              <div className="sticky top-24">
                {category?.id ? (
                  <SearchFiltersSidebar
                    categoryId={category.id}
                    subcategorySlug={subcategorySlug}
                  />
                ) : (
                  <Card className="p-4 md:p-6">
                    <AvailabilityFilterSectionSkeleton />
                  </Card>
                )}
              </div>
            </aside>
          )}

          {/* Main Content - Results */}
          <div className="flex-1 min-w-0">
            {/* Results Container - Centered with max-width */}
            <div className="max-w-4xl mx-auto">
              {error ? (
                <SearchError
                  error={
                    error instanceof Error
                      ? error
                      : new Error(error?.message || "Error desconocido")
                  }
                  onRetry={handleRetry}
                />
              ) : isLoading ? (
                <ProList pros={[]} isLoading={true} />
              ) : pros.length === 0 ? (
                <EmptyState
                  title="No se encontraron profesionales"
                  description="Intentá ajustar los filtros o buscar otra categoría."
                  icon="filter"
                  suggestions={emptyStateSuggestions}
                  onClearFilters={handleClearFilters}
                />
              ) : (
                <>
                  {(searchQuery.trim() || subcategory?.name) && (
                    <Text variant="small" className="mb-1 text-muted" as="p">
                      Resultados para «
                      {searchQuery.trim() || subcategory?.name || ""}»
                    </Text>
                  )}
                  <Text variant="h2" className="mb-4 md:mb-6 text-text">
                    {pros.length}{" "}
                    {pros.length === 1
                      ? "profesional encontrado"
                      : "profesionales encontrados"}
                  </Text>
                  <ProList
                    pros={pros}
                    categoryId={category?.id}
                    categorySlug={category?.slug}
                    subcategorySlug={subcategorySlug}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export function SearchResultsScreen() {
  return (
    <Suspense
      fallback={
        <AppShell showLogin={true}>
          <div className="px-4 py-4 md:py-8">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
              {/* Sidebar skeleton (Desktop lg+) */}
              <aside className="hidden lg:block lg:w-80 lg:shrink-0 lg:self-start">
                <div className="sticky top-24">
                  <Card className="p-4 md:p-6">
                    <AvailabilityFilterSectionSkeleton />
                  </Card>
                </div>
              </aside>
              {/* Main content skeleton */}
              <div className="flex-1 min-w-0">
                <div className="max-w-4xl mx-auto">
                  <div className="h-16 bg-surface border border-border rounded-lg animate-pulse mb-4" />
                  <ProList pros={[]} isLoading={true} />
                </div>
              </div>
            </div>
          </div>
        </AppShell>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
