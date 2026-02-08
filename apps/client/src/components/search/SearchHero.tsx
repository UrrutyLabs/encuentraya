"use client";

import { useState, FormEvent, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@repo/ui";
import { HeroTitle } from "@/components/presentational/HeroTitle";

/**
 * SearchHero Component
 *
 * A prominent, centered search bar component for searching professionals.
 * Supports preserving existing query parameters when navigating.
 *
 * @example
 * ```tsx
 * <SearchHero initialQuery="plumber" preserveParams={true} />
 * ```
 */
interface SearchHeroProps {
  /** Initial search query value */
  initialQuery?: string;
  /** If true, preserve existing query params when navigating */
  preserveParams?: boolean;
}

export function SearchHero({
  initialQuery = "",
  preserveParams = false,
}: SearchHeroProps) {
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
    <div className="w-full max-w-4xl mx-auto mb-8 md:mb-12">
      <HeroTitle className="mb-6 md:mb-8 px-8">
        ¿Qué necesitás encontrar hoy?
      </HeroTitle>
      <form onSubmit={handleSubmit} className="relative" role="search">
        <div className="relative">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted pointer-events-none z-10"
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
            className="px-0! pl-14! pr-5! py-5 md:py-4 text-xl md:text-lg border-2 border-border focus:border-border focus:outline-none focus:ring-0 rounded-xl md:rounded-lg bg-surface shadow-md focus:shadow-lg transition-shadow"
            aria-label="Buscar profesionales"
            autoComplete="off"
          />
        </div>
      </form>
    </div>
  );
}
