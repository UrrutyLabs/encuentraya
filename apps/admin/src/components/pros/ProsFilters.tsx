"use client";

import { Text } from "@repo/ui";
import { Button } from "@repo/ui";
import { Card } from "@repo/ui";
import { useCategories } from "@/hooks/useCategories";

interface ProsFiltersProps {
  status?: "pending" | "active" | "suspended";
  query: string;
  categoryId?: string;
  onStatusChange: (
    status: "pending" | "active" | "suspended" | undefined
  ) => void;
  onQueryChange: (query: string) => void;
  onCategoryChange: (categoryId: string | undefined) => void;
  onClear: () => void;
}

export function ProsFilters({
  status,
  query,
  categoryId,
  onStatusChange,
  onQueryChange,
  onCategoryChange,
  onClear,
}: ProsFiltersProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const hasFilters = status || query || categoryId;

  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Text variant="small" className="mb-2 text-gray-600">
            Buscar
          </Text>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="md:w-48">
          <Text variant="small" className="mb-2 text-gray-600">
            Estado
          </Text>
          <select
            value={status || ""}
            onChange={(e) =>
              onStatusChange(
                e.target.value
                  ? (e.target.value as "pending" | "active" | "suspended")
                  : undefined
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="active">Activo</option>
            <option value="suspended">Suspendido</option>
          </select>
        </div>
        <div className="md:w-48">
          <Text variant="small" className="mb-2 text-gray-600">
            Categoría
          </Text>
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
        {hasFilters && (
          <div className="flex items-end">
            <Button variant="ghost" onClick={onClear}>
              Limpiar
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
