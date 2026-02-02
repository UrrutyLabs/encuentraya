"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/presentational/Navigation";
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
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [showSearchInHeader, setShowSearchInHeader] = useState(false);
  const howItWorksRef = useRef<HTMLElement>(null);
  const isFirstIntersectionRef = useRef(true);
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Show search bar in sticky header only when scrolling into "Cómo Funciona"
  useEffect(() => {
    const section = howItWorksRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Ignore first callback to avoid flash on reload (layout may report wrong intersection)
        if (isFirstIntersectionRef.current) {
          isFirstIntersectionRef.current = false;
          setShowSearchInHeader(false);
          return;
        }
        setShowSearchInHeader(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px" }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

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
      router.push(`/search/results?${params.toString()}`);
    },
    [router, selectedCategory]
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Main nav scrolls away with the page (not sticky) */}
      <Navigation showLogin={true} showProfile={true} />

      {/* Sticky search-only bar appears when scrolling into "Cómo Funciona" */}
      {showSearchInHeader && <StickySearchBar />}

      <div className="px-4 py-6 md:py-12">
        <Container maxWidth="4xl">
          {/* Search Hero - Centered */}
          <div className="flex justify-center mb-8 md:mb-12 animate-[fadeInDown_0.6s_ease-out]">
            <SearchHero />
          </div>

          {/* Category Carousel - Centered horizontal list */}
          <div className="mb-8 md:mb-12 animate-[fadeIn_0.6s_ease-out_0.15s_both]">
            <CategoryCarousel
              selectedCategory={selectedCategory}
              onCategoryClick={handleCategoryClick}
            />
          </div>

          {/* Subcategory Grid - Shows when category is selected */}
          {selectedCategory && (
            <div
              id="subcategories"
              className="mt-8 md:mt-12 animate-[fadeIn_0.6s_ease-out_0.3s_both]"
            >
              <SubcategoryGrid
                category={selectedCategory}
                onSubcategoryClick={handleSubcategoryClick}
              />
            </div>
          )}
        </Container>
      </div>

      {/* About: How it works, Why us, For professionals */}
      <section ref={howItWorksRef} id="how-it-works" aria-label="Cómo funciona">
        <LandingHowItWorks />
        <LandingWhyEncuentraYa />
        <LandingForProfessionals />
      </section>

      <LandingFooter />
    </div>
  );
}
