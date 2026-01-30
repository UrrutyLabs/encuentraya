"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/presentational/Navigation";
import { Container } from "@/components/presentational/Container";
import { SearchHero } from "@/components/search/SearchHero";
import { CategoryCarousel } from "@/components/search/CategoryCarousel";
import { SubcategoryGrid } from "@/components/search/SubcategoryGrid";
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
  const isMobile = useMediaQuery("(max-width: 767px)");

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
      // Scroll to subcategories if on mobile
      if (isMobile) {
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
      <Navigation showLogin={true} showProfile={true} />
      <div className="px-4 py-6 md:py-12">
        <Container maxWidth="4xl">
          {/* Search Hero - Centered */}
          <div className="flex justify-center mb-8 md:mb-12">
            <SearchHero />
          </div>

          {/* Category Carousel - Centered horizontal list */}
          <div className="mb-8 md:mb-12">
            <CategoryCarousel
              selectedCategory={selectedCategory}
              onCategoryClick={handleCategoryClick}
            />
          </div>

          {/* Subcategory Grid - Shows when category is selected */}
          {selectedCategory && (
            <div id="subcategories" className="mt-8 md:mt-12">
              <SubcategoryGrid
                category={selectedCategory}
                onSubcategoryClick={handleSubcategoryClick}
              />
            </div>
          )}
        </Container>
      </div>
    </div>
  );
}
