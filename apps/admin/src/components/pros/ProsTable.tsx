"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@repo/ui";
import { useCategories } from "@/hooks/useCategories";

interface ProRow {
  id: string;
  displayName: string;
  email: string;
  status: "pending" | "active" | "suspended";
  completedJobsCount: number;
  isPayoutProfileComplete: boolean;
  createdAt: Date;
  categoryIds?: string[]; // Optional - not yet returned by adminList API
}

interface ProsTableProps {
  pros: ProRow[];
  isLoading?: boolean;
}

export function ProsTable({ pros, isLoading }: ProsTableProps) {
  const router = useRouter();
  const { data: categories } = useCategories();

  // Create category map for lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; isDeleted: boolean }>();
    categories?.forEach((category) => {
      map.set(category.id, {
        name: category.name,
        isDeleted: !!category.deletedAt || !category.isActive,
      });
    });
    return map;
  }, [categories]);

  // Helper to get category names
  const getCategoryNames = (categoryIds?: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return [];
    return categoryIds
      .map((categoryId) => {
        const category = categoryMap.get(categoryId);
        if (!category) return null;
        return category.isDeleted
          ? `${category.name} (eliminada)`
          : category.name;
      })
      .filter((name): name is string => name !== null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-UY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeVariant = (
    status: "pending" | "active" | "suspended"
  ): "info" | "success" | "warning" | "danger" => {
    const statusMap: Record<
      "pending" | "active" | "suspended",
      "info" | "success" | "warning" | "danger"
    > = {
      pending: "warning",
      active: "success",
      suspended: "danger",
    };
    return statusMap[status] || "info";
  };

  const getStatusLabel = (status: "pending" | "active" | "suspended") => {
    const labels: Record<"pending" | "active" | "suspended", string> = {
      pending: "Pendiente",
      active: "Activo",
      suspended: "Suspendido",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={6} />;
  }

  if (pros.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No se encontraron profesionales"
        description="No hay profesionales que coincidan con los filtros seleccionados."
      />
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categorías
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trabajos Completados
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Perfil de Pago
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pros.map((pro) => (
              <tr
                key={pro.id}
                onClick={() => router.push(`/admin/pros/${pro.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <Text variant="body" className="font-medium text-gray-900">
                    {pro.displayName}
                  </Text>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Text variant="body" className="text-gray-600">
                    {pro.email}
                  </Text>
                </td>
                <td className="px-6 py-4">
                  {pro.categoryIds && pro.categoryIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {getCategoryNames(pro.categoryIds).map((name, idx) => (
                        <Badge key={idx} variant="info" className="text-xs">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Text variant="small" className="text-gray-400">
                      —
                    </Text>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getStatusBadgeVariant(pro.status)}>
                    {getStatusLabel(pro.status)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Text variant="body" className="text-gray-900">
                    {pro.completedJobsCount}
                  </Text>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {pro.isPayoutProfileComplete ? (
                    <Badge variant="success">Completo</Badge>
                  ) : (
                    <Badge variant="warning">Incompleto</Badge>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Text variant="small" className="text-gray-500">
                    {formatDate(pro.createdAt)}
                  </Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
