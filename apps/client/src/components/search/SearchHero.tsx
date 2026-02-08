"use client";

import { SearchBar } from "@/components/search/SearchBar";
import { HeroTitle } from "@/components/presentational/HeroTitle";

/**
 * SearchHero Component
 *
 * A prominent, centered search bar for the search landing page.
 * Uses the same SearchBar as the sticky header (typeahead, FTS, navigate on select/submit).
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
  return (
    <div className="w-full max-w-4xl mx-auto mb-8 md:mb-12">
      <HeroTitle className="mb-6 md:mb-8 px-8">
        ¿Qué necesitás encontrar hoy?
      </HeroTitle>
      <SearchBar
        initialQuery={initialQuery}
        preserveParams={preserveParams}
        size="large"
        className="px-0"
      />
    </div>
  );
}
