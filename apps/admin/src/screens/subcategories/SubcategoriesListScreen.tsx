"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAllSubcategories } from "@/hooks/useSubcategories";
import { SubcategoriesTable } from "@/components/subcategories/SubcategoriesTable";
import { SubcategoriesFilters } from "@/components/subcategories/SubcategoriesFilters";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Text } from "@repo/ui";
import { Button } from "@repo/ui";

export function SubcategoriesListScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [queryFilter, setQueryFilter] = useState("");
  const [categoryIdFilter, setCategoryIdFilter] = useState<string | undefined>(
    searchParams.get("categoryId") || undefined
  );

  const { data: subcategories, isLoading } = useAllSubcategories();

  // Filter subcategories based on query and category
  const filteredSubcategories = useMemo(() => {
    if (!subcategories) return [];

    let filtered = subcategories;

    // Filter by category
    if (categoryIdFilter) {
      filtered = filtered.filter(
        (subcategory) => subcategory.categoryId === categoryIdFilter
      );
    }

    // Filter by query (name or slug)
    if (queryFilter) {
      const query = queryFilter.toLowerCase();
      filtered = filtered.filter(
        (subcategory) =>
          subcategory.name.toLowerCase().includes(query) ||
          subcategory.slug.toLowerCase().includes(query)
      );
    }

    // Sort by category, then displayOrder, then name
    return filtered.sort((a, b) => {
      if (a.categoryId !== b.categoryId) {
        return a.categoryId.localeCompare(b.categoryId);
      }
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return a.name.localeCompare(b.name);
    });
  }, [subcategories, queryFilter, categoryIdFilter]);

  const handleClearFilters = () => {
    setQueryFilter("");
    setCategoryIdFilter(undefined);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Subcategorías" }]} />
      <div className="flex items-center justify-between">
        <Text variant="h1">Subcategorías</Text>
        <Button onClick={() => router.push("/admin/subcategories/new")}>
          Crear Subcategoría
        </Button>
      </div>

      <SubcategoriesFilters
        query={queryFilter}
        categoryId={categoryIdFilter}
        onQueryChange={setQueryFilter}
        onCategoryChange={setCategoryIdFilter}
        onClear={handleClearFilters}
      />

      <SubcategoriesTable
        subcategories={filteredSubcategories}
        isLoading={isLoading}
      />
    </div>
  );
}
