"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCategories } from "@/hooks/useCategories";
import { CategoriesTable } from "@/components/categories/CategoriesTable";
import { CategoriesFilters } from "@/components/categories/CategoriesFilters";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Text } from "@repo/ui";
import { Button } from "@repo/ui";

export function CategoriesListScreen() {
  const router = useRouter();
  const [queryFilter, setQueryFilter] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [showInactive, setShowInactive] = useState(true);

  const { data: categories, isLoading } = useCategories({
    includeDeleted: showDeleted,
  });

  // Filter categories based on query and active status
  const filteredCategories = useMemo(() => {
    if (!categories) return [];

    let filtered = categories;

    // Filter by query (name, key, or slug)
    if (queryFilter) {
      const query = queryFilter.toLowerCase();
      filtered = filtered.filter(
        (category) =>
          category.name.toLowerCase().includes(query) ||
          category.key.toLowerCase().includes(query) ||
          category.slug.toLowerCase().includes(query)
      );
    }

    // Filter by active status
    if (!showInactive) {
      filtered = filtered.filter((category) => category.isActive);
    }

    // Sort by sortOrder, then by name
    return filtered.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });
  }, [categories, queryFilter, showInactive]);

  const handleClearFilters = () => {
    setQueryFilter("");
    setShowDeleted(false);
    setShowInactive(true);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Categorías" }]} />
      <div className="flex items-center justify-between">
        <Text variant="h1">Categorías</Text>
        <Button onClick={() => router.push("/admin/categories/new")}>
          Crear Categoría
        </Button>
      </div>

      <CategoriesFilters
        query={queryFilter}
        showDeleted={showDeleted}
        showInactive={showInactive}
        onQueryChange={setQueryFilter}
        onShowDeletedChange={setShowDeleted}
        onShowInactiveChange={setShowInactive}
        onClear={handleClearFilters}
      />

      <CategoriesTable categories={filteredCategories} isLoading={isLoading} />
    </div>
  );
}
