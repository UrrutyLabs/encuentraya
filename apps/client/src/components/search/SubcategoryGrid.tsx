"use client";

import { memo } from "react";
import type { Category, Subcategory } from "@repo/domain";
import { useSubcategoriesByCategoryId } from "@/hooks/subcategory";
import { SubcategoryCard } from "./SubcategoryCard";

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/5] bg-muted/30 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (subcategories.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {subcategories.map((subcategory) => (
        <SubcategoryCard
          key={subcategory.id}
          subcategory={subcategory}
          onClick={onSubcategoryClick}
        />
      ))}
    </div>
  );
});
