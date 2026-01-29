"use client";

import { memo } from "react";
import { LucideIcon } from "lucide-react";
import { Text } from "@repo/ui";
import type { Category } from "@repo/domain";

/**
 * CategoryCard Component
 *
 * Displays a single category with icon and label.
 * Highlights when selected and triggers onClick callback.
 *
 * @example
 * ```tsx
 * <CategoryCard
 *   category={categoryObject}
 *   icon={Wrench}
 *   label="Plomería"
 *   isSelected={true}
 *   onClick={handleCategoryClick}
 * />
 * ```
 */
interface CategoryCardProps {
  /** The category object from API */
  category: Category;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Display label for the category */
  label: string;
  /** Whether this category is currently selected */
  isSelected: boolean;
  /** Callback when category is clicked */
  onClick: (category: Category) => void;
}

export const CategoryCard = memo(function CategoryCard({
  category,
  icon: Icon,
  label,
  isSelected,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      onClick={() => onClick(category)}
      onKeyDown={(e) => {
        // Handle Enter and Space keys
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(category);
        }
      }}
      aria-pressed={isSelected}
      aria-label={`${label}${isSelected ? " (seleccionado)" : ""}`}
      className={`flex flex-col items-center gap-2 px-6 py-3 md:px-6 md:py-4 w-[120px] md:w-[140px] min-h-[44px] md:min-h-0 rounded-lg transition-all touch-manipulation shrink-0 ${
        isSelected
          ? "bg-primary/10 border-2 border-primary"
          : "bg-surface border-2 border-transparent hover:bg-surface/80 hover:border-border"
      }`}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
          isSelected
            ? "bg-primary text-white scale-110"
            : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="w-6 h-6 md:w-7 md:h-7" />
      </div>

      {/* Category Name */}
      <Text
        variant="small"
        className={`font-medium ${isSelected ? "text-primary" : "text-text"}`}
      >
        {label}
      </Text>
    </button>
  );
});
