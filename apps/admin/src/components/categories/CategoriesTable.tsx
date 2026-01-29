"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import { Badge } from "@repo/ui";
import { Button } from "@repo/ui";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@repo/ui";
import type { Category } from "@repo/domain";

interface CategoriesTableProps {
  categories: Category[];
  isLoading?: boolean;
}

export function CategoriesTable({
  categories,
  isLoading,
}: CategoriesTableProps) {
  const router = useRouter();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-UY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    return categories;
  }, [categories]);

  if (isLoading) {
    return <TableSkeleton rows={5} columns={7} />;
  }

  if (filteredCategories.length === 0) {
    return (
      <EmptyState
        icon={Folder}
        title="No se encontraron categorías"
        description="No hay categorías que coincidan con los filtros seleccionados."
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
                Clave
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
                Creada
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCategories.map((category) => (
              <tr
                key={category.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                    onClick={() =>
                      router.push(`/admin/categories/${category.id}`)
                    }
                  >
                    {category.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.key}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.slug}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.sortOrder}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {category.deletedAt ? (
                      <Badge variant="danger" showIcon>
                        Eliminada
                      </Badge>
                    ) : !category.isActive ? (
                      <Badge variant="warning" showIcon>
                        Inactiva
                      </Badge>
                    ) : (
                      <Badge variant="success" showIcon>
                        Activa
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(category.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="text-sm px-3 py-1.5"
                      onClick={() =>
                        router.push(`/admin/categories/${category.id}`)
                      }
                    >
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-sm px-3 py-1.5"
                      onClick={() =>
                        router.push(`/admin/categories/${category.id}/edit`)
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
