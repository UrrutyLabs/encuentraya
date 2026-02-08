"use client";

import { memo } from "react";
import { LucideIcon } from "lucide-react";
import { Text } from "@repo/ui";
import type { Category } from "@repo/domain";

/**
 * CategoryTab Component
 *
 * Tab-style category: icon above label, active state = underline + bold.
 * No card background; used in a horizontal tab bar above subcategories.
 */
interface CategoryCardProps {
  category: Category;
  icon: LucideIcon;
  label: string;
  isSelected: boolean;
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
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(category);
        }
      }}
      aria-pressed={isSelected}
      aria-label={`${label}${isSelected ? " (seleccionado)" : ""}`}
      className={`flex flex-col items-center gap-1.5 px-4 py-2.5 md:px-5 md:py-3 shrink-0 border-b-2 transition-all touch-manipulation cursor-pointer ${
        isSelected
          ? "border-primary text-primary -mb-px"
          : "border-transparent text-neutral-500 hover:text-primary/80 hover:border-border"
      }`}
    >
      <Icon className="w-5 h-5 md:w-6 md:h-6 text-current" />
      <Text
        variant="body"
        className={`text-base md:text-lg text-neutral-500 text-center whitespace-nowrap ${isSelected ? "font-bold" : "font-medium"}`}
      >
        {label}
      </Text>
    </button>
  );
});
