"use client";

import { useState, FormEvent, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@repo/ui";

/**
 * SearchBar Component
 *
 * A compact search bar component for use in navigation headers.
 * Supports preserving existing query parameters when navigating.
 *
 * @example
 * ```tsx
 * <SearchBar initialQuery="plumber" preserveParams={true} />
 * ```
 */
interface SearchBarProps {
  /** Initial search query value */
  initialQuery?: string;
  /** If true, preserve existing query params when navigating */
  preserveParams?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function SearchBar({
  initialQuery = "",
  preserveParams = false,
  className = "",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const prevUrlQueryRef = useRef<string>("");

  // Sync with URL if preserveParams is true
  useEffect(() => {
    if (preserveParams) {
      const urlQuery = searchParams.get("q") || "";
      // Only update if the URL query actually changed
      if (urlQuery !== prevUrlQueryRef.current) {
        prevUrlQueryRef.current = urlQuery;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSearchQuery(urlQuery);
      }
    }
  }, [searchParams, preserveParams]);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;

      // Navigate to results page with search query
      const params = preserveParams
        ? new URLSearchParams(searchParams.toString())
        : new URLSearchParams();

      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      } else {
        params.delete("q");
      }

      router.push(`/search/results?${params.toString()}`);
    },
    [searchQuery, preserveParams, searchParams, router]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex-1 max-w-2xl ${className}`}
      role="search"
    >
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none z-10"
          aria-hidden="true"
        />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            // Submit on Enter key
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
            }
          }}
          placeholder="Describí lo que estás precisando"
          className="!pl-10 !pr-4 py-2 text-sm border-2 border-border focus:border-border focus:outline-none !focus:ring-0 rounded-lg bg-surface shadow-sm focus:shadow-md transition-shadow"
          aria-label="Buscar profesionales"
          autoComplete="off"
        />
      </div>
    </form>
  );
}
