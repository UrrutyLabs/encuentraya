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
import { Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Input } from "@repo/ui";
import { Navigation } from "@/components/presentational/Navigation";
import { SearchHero } from "@/components/search/SearchHero";
import { ActiveFilters } from "@/components/search/ActiveFilters";
import { ProList } from "@/components/search/ProList";
import { EmptyState } from "@/components/presentational/EmptyState";
import { SearchError } from "@/components/search/SearchError";
import { useSearchPros } from "@/hooks/pro";
import { useTodayDate } from "@/hooks/shared";
import { useAvailableTimeWindows } from "@/hooks/search";
import { useCategoryBySlug } from "@/hooks/category";
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
  const [showFilters, setShowFilters] = useState(false);

  const searchQuery = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || undefined;
  const dateParam = searchParams.get("date") || "";
  const timeWindowParam = searchParams.get("timeWindow") || "";

  // Fetch category by slug from URL
  const { category } = useCategoryBySlug(categorySlug);

  // Initialize state from URL params (only on mount/param change)
  const [date, setDate] = useState(() => dateParam);
  const [timeWindow, setTimeWindow] = useState<TimeWindow | "">(
    () => (timeWindowParam as TimeWindow) || ""
  );

  const today = useTodayDate();

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

  const { availableTimeWindows, handleDateChange: handleTimeWindowDateChange } =
    useAvailableTimeWindows(date, today, timeWindow, setTimeWindow);

  // Update URL when filters change (debounced to avoid too many navigations)
  const updateFiltersInUrl = useCallback(
    (updates: { date?: string; timeWindow?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      // Remove retry param if it exists
      params.delete("_retry");

      if (updates.date !== undefined) {
        if (updates.date) {
          params.set("date", updates.date);
        } else {
          params.delete("date");
        }
      }

      if (updates.timeWindow !== undefined) {
        if (updates.timeWindow) {
          params.set("timeWindow", updates.timeWindow);
        } else {
          params.delete("timeWindow");
        }
      }

      const queryString = params.toString();
      router.push(`/search/results${queryString ? `?${queryString}` : ""}`, {
        scroll: false, // Don't scroll to top on filter changes
      });
    },
    [searchParams, router]
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = e.target.value;
      setDate(newDate);
      handleTimeWindowDateChange(e);
      updateFiltersInUrl({ date: newDate });
    },
    [handleTimeWindowDateChange, updateFiltersInUrl]
  );

  const handleTimeWindowChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newTimeWindow = e.target.value as TimeWindow | "";
      setTimeWindow(newTimeWindow);
      updateFiltersInUrl({ timeWindow: newTimeWindow });
    },
    [updateFiltersInUrl]
  );

  // Get subcategory slug from URL
  const subcategorySlug = searchParams.get("subcategory") || undefined;

  // Memoize filters
  const filters = useMemo(
    () => ({
      categoryId: category?.id,
      subcategory: subcategorySlug,
      date: date || undefined,
      timeWindow: (timeWindow || undefined) as TimeWindow | undefined,
      // Note: searchQuery is not yet supported by API
      // It's kept in URL for future use
    }),
    [category, subcategorySlug, date, timeWindow]
  );

  const { pros, isLoading, error } = useSearchPros(filters);

  const handleFilterRemove = useCallback(() => {
    // Navigation handled by ActiveFilters component
  }, []);

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
    router.push("/search");
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
    if (suggestions.length === 0) {
      suggestions.push("Explorá las categorías disponibles");
      suggestions.push("Intentá buscar sin filtros");
    }
    return suggestions;
  }, [category, date, timeWindow, searchQuery]);

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={true} showProfile={true} />

      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-30 bg-bg border-b border-border px-4 py-3 md:py-4">
        <div className="max-w-6xl mx-auto">
          <SearchHero initialQuery={searchQuery} preserveParams={true} />
        </div>
      </div>

      <div className="px-4 py-4 md:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Active Filters */}
          <ActiveFilters onFilterRemove={handleFilterRemove} />

          {/* Collapsible Filters - Mobile */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between px-4 py-3 bg-surface border border-border rounded-lg hover:bg-surface/80 transition-colors touch-manipulation"
              aria-expanded={showFilters}
              aria-controls="mobile-filters"
              type="button"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted" />
                <Text variant="body" className="font-medium">
                  Filtros
                </Text>
              </div>
              {showFilters ? (
                <ChevronUp className="w-4 h-4 text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted" />
              )}
            </button>

            {showFilters && (
              <Card
                id="mobile-filters"
                className="p-4 mt-2"
                role="region"
                aria-label="Filtros de búsqueda"
              >
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Fecha
                    </label>
                    <Input
                      type="date"
                      value={date}
                      onChange={handleDateChange}
                      min={today}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Horario
                    </label>
                    <select
                      value={timeWindow}
                      onChange={handleTimeWindowChange}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-text text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent touch-manipulation"
                    >
                      <option value="">Cualquier horario</option>
                      {availableTimeWindows.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Filters - Desktop */}
          <div className="hidden md:block mb-6">
            <Card className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Fecha
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={handleDateChange}
                    min={today}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Horario
                  </label>
                  <select
                    value={timeWindow}
                    onChange={handleTimeWindowChange}
                    className="w-full px-4 py-3 md:px-3 md:py-2 border border-border rounded-lg md:rounded-md bg-surface text-text text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent touch-manipulation"
                  >
                    <option value="">Cualquier horario</option>
                    {availableTimeWindows.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          </div>

          {/* Results */}
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
              <Text variant="h2" className="mb-4 md:mb-6 text-text">
                {pros.length}{" "}
                {pros.length === 1
                  ? "profesional encontrado"
                  : "profesionales encontrados"}
              </Text>
              <ProList pros={pros} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SearchResultsScreen() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg">
          <Navigation showLogin={true} showProfile={true} />
          <div className="px-4 py-4 md:py-8">
            <div className="max-w-6xl mx-auto">
              <div className="h-16 bg-surface border border-border rounded-lg animate-pulse mb-4" />
              <ProList pros={[]} isLoading={true} />
            </div>
          </div>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
