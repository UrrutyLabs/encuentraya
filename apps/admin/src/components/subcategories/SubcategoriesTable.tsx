"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { FolderTree } from "lucide-react";
import { Badge } from "@repo/ui";
import { Button } from "@repo/ui";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@repo/ui";
import type { Subcategory } from "@repo/domain";
import { useCategories } from "@/hooks/useCategories";

interface SubcategoriesTableProps {
  subcategories: Subcategory[];
  isLoading?: boolean;
}

export function SubcategoriesTable({
  subcategories,
  isLoading,
}: SubcategoriesTableProps) {
  const router = useRouter();
  const { data: categories } = useCategories();

  // Create category map for lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string }>();
    categories?.forEach((category) => {
      map.set(category.id, { name: category.name });
    });
    return map;
  }, [categories]);

  const getCategoryName = (categoryId: string) => {
    return categoryMap.get(categoryId)?.name || "Categoría desconocida";
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={7} />;
  }

  if (subcategories.length === 0) {
    return (
      <EmptyState
        icon={FolderTree}
        title="No se encontraron subcategorías"
        description="No hay subcategorías que coincidan con los filtros seleccionados."
      />
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orden
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subcategories.map((subcategory) => (
              <tr
                key={subcategory.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                    onClick={() =>
                      router.push(`/admin/subcategories/${subcategory.id}`)
                    }
                  >
                    {subcategory.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getCategoryName(subcategory.categoryId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {subcategory.slug}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {subcategory.displayOrder}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    variant={subcategory.isActive ? "success" : "warning"}
                    showIcon
                  >
                    {subcategory.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="text-sm px-3 py-1.5"
                      onClick={() =>
                        router.push(`/admin/subcategories/${subcategory.id}`)
                      }
                    >
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-sm px-3 py-1.5"
                      onClick={() =>
                        router.push(
                          `/admin/subcategories/${subcategory.id}/edit`
                        )
                      }
                    >
                      Editar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
