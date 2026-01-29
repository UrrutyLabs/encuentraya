"use client";

import { useMemo, memo, useRef, useState, useEffect } from "react";
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
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollButtons();
    container.addEventListener("scroll", checkScrollButtons);
    window.addEventListener("resize", checkScrollButtons);

    return () => {
      container.removeEventListener("scroll", checkScrollButtons);
      window.removeEventListener("resize", checkScrollButtons);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300; // Adjust scroll distance as needed
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const newScroll =
      direction === "left"
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;
    scrollContainerRef.current.scrollTo({
      left: newScroll,
      behavior: "smooth",
    });
  };

  // Update scroll buttons when categories change
  useEffect(() => {
    if (!isLoading && categories.length > 0) {
      checkScrollButtons();
    }
  }, [categories, isLoading]);

  // Show loading skeleton while categories are loading
  if (isLoading) {
    return (
      <div className="w-full flex justify-center">
        <div className="md:hidden w-full overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-[120px] h-[100px] bg-muted/30 rounded-lg animate-pulse shrink-0"
              />
            ))}
          </div>
        </div>
        <div className="hidden md:block w-full">
          <div className="flex gap-4 px-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-[140px] h-[120px] bg-muted/30 rounded-lg animate-pulse shrink-0"
              />
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
    <div className="w-full flex justify-center">
      {/* Mobile: Horizontal Scroll */}
      <div className="md:hidden w-full overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-3">
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

      {/* Desktop: Horizontal Scroll with Arrows */}
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
          className="overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-4 px-2">
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
