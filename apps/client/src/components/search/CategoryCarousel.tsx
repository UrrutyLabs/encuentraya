"use client";

import { memo, useRef, useState, useEffect } from "react";
import type { Category } from "@repo/domain";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCategoryIcon, getCategoryLabel } from "@/lib/search/categoryIcons";
import { CategoryCard } from "./CategoryCard";
import { useCategories } from "@/hooks/category";

interface CategoryCarouselProps {
  selectedCategory: Category | null;
  onCategoryClick: (category: Category) => void;
}

export const CategoryCarousel = memo(function CategoryCarousel({
  selectedCategory,
  onCategoryClick,
}: CategoryCarouselProps) {
  const { categories, isLoading } = useCategories();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const isScrollable = scrollWidth > clientWidth;
    const isAtStart = scrollLeft <= 5; // Small threshold for rounding
    const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 5; // Small threshold for rounding

    setShowLeftArrow(isScrollable && !isAtStart);
    setShowRightArrow(isScrollable && !isAtEnd);
  };

  useEffect(() => {
    // Guard: only run on client
    if (typeof window === "undefined") {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    // Defer initial check to avoid synchronous setState in effect
    setTimeout(() => {
      checkScrollButtons();
    }, 0);

    container.addEventListener("scroll", checkScrollButtons, { passive: true });
    window.addEventListener("resize", checkScrollButtons);

    return () => {
      container.removeEventListener("scroll", checkScrollButtons);
      window.removeEventListener("resize", checkScrollButtons);
    };
  }, [categories, isLoading]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300; // Adjust scroll distance as needed
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;

    const newScroll =
      direction === "left"
        ? Math.max(0, scrollLeft - scrollAmount)
        : Math.min(maxScroll, scrollLeft + scrollAmount);

    scrollContainerRef.current.scrollTo({
      left: newScroll,
      behavior: "smooth",
    });

    // Update button visibility after scroll animation completes
    // Smooth scroll typically takes ~300ms, but we check multiple times for reliability
    const checkInterval = setInterval(() => {
      checkScrollButtons();
    }, 50);

    setTimeout(() => {
      clearInterval(checkInterval);
      checkScrollButtons();
    }, 350);
  };

  // Update scroll buttons when categories change
  useEffect(() => {
    if (!isLoading && categories.length > 0) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        checkScrollButtons();
      }, 0);
    }
  }, [categories, isLoading]);

  // Show loading skeleton while categories are loading (tab style)
  if (isLoading) {
    return (
      <div className="w-full border-b border-border">
        <div className="md:hidden w-full overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 px-4 py-2.5 animate-pulse shrink-0"
              >
                <div className="w-5 h-5 rounded bg-muted/30" />
                <div className="h-3 bg-muted/30 rounded w-14" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:block w-full">
          <div className="flex gap-1 pb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 px-5 py-3 animate-pulse shrink-0"
              >
                <div className="w-6 h-6 rounded bg-muted/30" />
                <div className="h-3 bg-muted/30 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no categories
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full border-b border-border">
      {/* Mobile: Horizontal scroll with optional right arrow */}
      <div className="md:hidden relative w-full">
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-1">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category);
              const label = getCategoryLabel(category);
              return (
                <CategoryCard
                  key={category.id}
                  category={category}
                  icon={Icon}
                  label={label}
                  isSelected={selectedCategory?.id === category.id}
                  onClick={onCategoryClick}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop: Horizontal scroll with arrows */}
      <div className="hidden md:block relative w-full">
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-surface/90 backdrop-blur-sm border border-border rounded-full p-2 shadow-lg hover:bg-surface transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-text" />
          </button>
        )}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-1 px-2">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category);
              const label = getCategoryLabel(category);
              return (
                <CategoryCard
                  key={category.id}
                  category={category}
                  icon={Icon}
                  label={label}
                  isSelected={selectedCategory?.id === category.id}
                  onClick={onCategoryClick}
                />
              );
            })}
          </div>
        </div>
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-surface/90 backdrop-blur-sm border border-border rounded-full p-2 shadow-lg hover:bg-surface transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-text" />
          </button>
        )}
      </div>
    </div>
  );
});
