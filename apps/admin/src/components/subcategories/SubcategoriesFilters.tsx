"use client";

import { Input } from "@repo/ui";
import { Button } from "@repo/ui";
import { useCategories } from "@/hooks/useCategories";

interface SubcategoriesFiltersProps {
  query: string;
  categoryId: string | undefined;
  onQueryChange: (query: string) => void;
  onCategoryChange: (categoryId: string | undefined) => void;
  onClear: () => void;
}

export function SubcategoriesFilters({
  query,
  categoryId,
  onQueryChange,
  onCategoryChange,
  onClear,
}: SubcategoriesFiltersProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const hasFilters = query || categoryId;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <Input
            type="text"
            placeholder="Nombre, clave o slug"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            value={categoryId || ""}
            onChange={(e) => onCategoryChange(e.target.value || undefined)}
            disabled={categoriesLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Todas las categorías</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {hasFilters && (
        <div>
          <Button variant="ghost" onClick={onClear} className="text-sm">
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
