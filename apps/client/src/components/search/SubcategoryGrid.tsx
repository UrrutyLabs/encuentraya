"use client";

import { memo } from "react";
import type { Category, Subcategory } from "@repo/domain";
import { useSubcategoriesByCategoryId } from "@/hooks/subcategory";
import { SubcategoryCard } from "./SubcategoryCard";
import { Text } from "@repo/ui";
import { getCategoryLabel } from "@/lib/search/categoryIcons";

interface SubcategoryGridProps {
  category: Category;
  onSubcategoryClick: (subcategory: Subcategory) => void;
}

export const SubcategoryGrid = memo(function SubcategoryGrid({
  category,
  onSubcategoryClick,
}: SubcategoryGridProps) {
  const { subcategories, isLoading } = useSubcategoriesByCategoryId(
    category.id
  );
  const categoryLabel = getCategoryLabel(category);

  if (isLoading) {
    return (
      <div>
        <Text
          variant="h2"
          className="mb-4 md:mb-6 text-text text-center md:text-left"
        >
          {categoryLabel}
        </Text>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-muted/30 rounded-lg mb-2" />
              <div className="h-4 bg-muted/30 rounded w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subcategories.length === 0) {
    return null;
  }

  return (
    <div>
      <Text
        variant="h2"
        className="mb-4 md:mb-6 text-text text-center md:text-left"
      >
        {categoryLabel}
      </Text>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {subcategories.map((subcategory) => (
          <SubcategoryCard
            key={subcategory.id}
            subcategory={subcategory}
            onClick={onSubcategoryClick}
          />
        ))}
      </div>
    </div>
  );
});
