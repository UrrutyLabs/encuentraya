"use client";

import { SearchBar } from "@/components/search/SearchBar";
import { Container } from "./Container";

/**
 * Minimal sticky header that shows only the search bar.
 * Used on the home page when the user scrolls into "Cómo Funciona" –
 * it fades in from the top and stays sticky.
 */
export function StickySearchBar() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-border bg-surface px-4 py-3 animate-[slideInFromTop_0.25s_ease-out_both]"
      role="banner"
    >
      <Container maxWidth="full" className="flex justify-center">
        <div className="w-full max-w-4xl">
          <SearchBar preserveParams={false} size="large" />
        </div>
      </Container>
    </header>
  );
}
