"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/presentational/AppShell";
import { StickySearchBar } from "@/components/presentational/StickySearchBar";
import { Container } from "@/components/presentational/Container";
import { SearchHero } from "@/components/search/SearchHero";
import { CategoryCarousel } from "@/components/search/CategoryCarousel";
import { SubcategoryGrid } from "@/components/search/SubcategoryGrid";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingWhyEncuentraYa } from "@/components/landing/LandingWhyEncuentraYa";
import { LandingForProfessionals } from "@/components/landing/LandingForProfessionals";
import { LandingFooter } from "@/components/landing/LandingFooter";
import type { Category, Subcategory } from "@repo/domain";
import { useCategories } from "@/hooks/category";
import { useMediaQuery } from "@/hooks/shared/useMediaQuery";
import { useSearchLocation } from "@/contexts/SearchLocationContext";

/**
 * SearchScreen Component
 *
 * Main search page that displays:
 * - Centered search bar
 * - Horizontal category carousel
 * - Subcategory grid (shown when category is selected)
 *
 * Handles navigation to search results page when:
 * - User submits search query
 * - User clicks on a subcategory
 *
 * @example
 * ```tsx
 * <SearchScreen />
 * ```
 */
export function SearchScreen() {
  const router = useRouter();
  const { categories } = useCategories();
  const { initialLocation, initialZipCode } = useSearchLocation();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [showSearchInHeader, setShowSearchInHeader] = useState(false);
  const subcategoriesRef = useRef<HTMLDivElement | null>(null);
  const isFirstIntersectionRef = useRef(true);
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Show sticky search bar when the subcategories block has left the viewport
  // (inverted from observing "how it works": we show when subcategories are gone).
  // Hysteresis: show when subcategories fully out (ratio 0), hide when back in view (ratio >= 0.1).
  useEffect(() => {
    if (!selectedCategory) {
      isFirstIntersectionRef.current = true;
      queueMicrotask(() => setShowSearchInHeader(false));
      return;
    }
    const section = subcategoriesRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isFirstIntersectionRef.current) {
          isFirstIntersectionRef.current = false;
          setShowSearchInHeader(!entry.isIntersecting);
          return;
        }
        // Show bar when subcategories leave viewport, hide when they're back in view
        const ratio = entry.intersectionRatio;
        if (ratio === 0) setShowSearchInHeader(true);
        else if (ratio >= 0.1) setShowSearchInHeader(false);
      },
      { threshold: [0, 0.05, 0.1], rootMargin: "0px" }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [selectedCategory]);

  // Set default selected category to first category when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      // Defer setState to avoid synchronous state updates in effect
      setTimeout(() => {
        setSelectedCategory(categories[0]);
      }, 0);
    }
  }, [categories, selectedCategory]);

  const handleCategoryClick = useCallback(
    (category: Category) => {
      setSelectedCategory(category);
      // Scroll to subcategories if on mobile (only on client)
      if (isMobile && typeof document !== "undefined") {
        setTimeout(() => {
          const element = document.getElementById("subcategories");
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
    },
    [isMobile]
  );

  const handleSubcategoryClick = useCallback(
    (subcategory: Subcategory) => {
      // Navigate to results page with category slug and subcategory slug
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.set("category", selectedCategory.slug);
      }
      params.set("subcategory", subcategory.slug);
      if (initialLocation?.trim())
        params.set("location", initialLocation.trim());
      if (initialZipCode?.trim()) params.set("zipCode", initialZipCode.trim());
      router.push(`/search/results?${params.toString()}`);
    },
    [router, selectedCategory, initialLocation, initialZipCode]
  );

  return (
    <AppShell showLogin={true}>
      {showSearchInHeader && <StickySearchBar />}

      <div className="px-4 py-6 md:py-12">
        <Container maxWidth="4xl">
          {/* Search Hero - Centered */}
          <div className="flex justify-center mb-8 md:mb-12 animate-[fadeInDown_0.6s_ease-out]">
            <SearchHero />
          </div>

          {/* Category tabs - just above subcategories */}
          <div className="animate-[fadeIn_0.6s_ease-out_0.15s_both]">
            <CategoryCarousel
              selectedCategory={selectedCategory}
              onCategoryClick={handleCategoryClick}
            />
          </div>

          {/* Subcategory Grid - directly below category tabs */}
          {selectedCategory && (
            <div
              ref={subcategoriesRef}
              id="subcategories"
              className="mt-4 animate-[fadeIn_0.6s_ease-out_0.3s_both]"
            >
              <SubcategoryGrid
                category={selectedCategory}
                onSubcategoryClick={handleSubcategoryClick}
              />
            </div>
          )}
        </Container>
      </div>

      <section id="how-it-works" aria-label="Cómo funciona">
        <LandingHowItWorks />
      </section>
      <section id="why-us" aria-label="Por qué EncuentraYa">
        <LandingWhyEncuentraYa />
      </section>
      <section id="for-professionals" aria-label="Para profesionales">
        <LandingForProfessionals />
      </section>
      <LandingFooter />
    </AppShell>
  );
}
