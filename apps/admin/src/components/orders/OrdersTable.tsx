"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CalendarX } from "lucide-react";
import { Badge } from "@repo/ui";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@repo/ui";
import { formatCurrency, toMajorUnits } from "@repo/domain";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
} from "@/utils/orderStatus";
import { ORDER_LABELS } from "@/utils/orderLabels";
import type { Order } from "@repo/domain";
import { useCategories } from "@/hooks/useCategories";

interface OrdersTableProps {
  orders: Order[];
  isLoading?: boolean;
}

export function OrdersTable({ orders, isLoading }: OrdersTableProps) {
  const router = useRouter();
  const { data: categories } = useCategories();

  // Create a map of categoryId -> Category for quick lookup
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

  // Helper to get category name or fallback
  const getCategoryName = (categoryId: string) => {
    const category = categoryMap.get(categoryId);
    if (!category) {
      return "Categoría desconocida";
    }
    if (category.isDeleted) {
      return `${category.name} (eliminada)`;
    }
    return category.name;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-UY", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={6} />;
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={CalendarX}
        title={`No se encontraron ${ORDER_LABELS.plural.toLowerCase()}`}
        description={`No hay ${ORDER_LABELS.plural.toLowerCase()} que coincidan con los filtros seleccionados.`}
      />
    );
  }

  // Calculate display amount for each order
  // All amounts are in minor units, convert to major units for display
  const getDisplayAmount = (order: Order) => {
    const amountMinor = order.totalAmount
      ? order.totalAmount
      : order.hourlyRateSnapshotAmount * order.estimatedHours;
    return toMajorUnits(amountMinor);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {ORDER_LABELS.orderNumber}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Horas estimadas
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => router.push(`/admin/orders/${order.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.displayId || order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getOrderStatusVariant(order.status)} showIcon>
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.categoryId ? getCategoryName(order.categoryId) : "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(getDisplayAmount(order), order.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.estimatedHours}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
