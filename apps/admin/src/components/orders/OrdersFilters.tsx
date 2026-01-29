"use client";

import { Input } from "@repo/ui";
import { Button } from "@repo/ui";
import { OrderStatus } from "@repo/domain";
import { getOrderStatusLabel } from "@/utils/orderStatus";
import { useCategories } from "@/hooks/useCategories";

interface OrdersFiltersProps {
  status: OrderStatus | undefined;
  query: string;
  categoryId: string | undefined;
  onStatusChange: (status: OrderStatus | undefined) => void;
  onQueryChange: (query: string) => void;
  onCategoryChange: (categoryId: string | undefined) => void;
  onClear: () => void;
}

export function OrdersFilters({
  status,
  query,
  categoryId,
  onStatusChange,
  onQueryChange,
  onCategoryChange,
  onClear,
}: OrdersFiltersProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const statusOptions: Array<{ value: OrderStatus | ""; label: string }> = [
    { value: "", label: "Todos" },
    { value: OrderStatus.DRAFT, label: getOrderStatusLabel(OrderStatus.DRAFT) },
    {
      value: OrderStatus.PENDING_PRO_CONFIRMATION,
      label: getOrderStatusLabel(OrderStatus.PENDING_PRO_CONFIRMATION),
    },
    {
      value: OrderStatus.ACCEPTED,
      label: getOrderStatusLabel(OrderStatus.ACCEPTED),
    },
    {
      value: OrderStatus.CONFIRMED,
      label: getOrderStatusLabel(OrderStatus.CONFIRMED),
    },
    {
      value: OrderStatus.IN_PROGRESS,
      label: getOrderStatusLabel(OrderStatus.IN_PROGRESS),
    },
    {
      value: OrderStatus.AWAITING_CLIENT_APPROVAL,
      label: getOrderStatusLabel(OrderStatus.AWAITING_CLIENT_APPROVAL),
    },
    {
      value: OrderStatus.DISPUTED,
      label: getOrderStatusLabel(OrderStatus.DISPUTED),
    },
    {
      value: OrderStatus.COMPLETED,
      label: getOrderStatusLabel(OrderStatus.COMPLETED),
    },
    {
      value: OrderStatus.PAID,
      label: getOrderStatusLabel(OrderStatus.PAID),
    },
    {
      value: OrderStatus.CANCELED,
      label: getOrderStatusLabel(OrderStatus.CANCELED),
    },
  ];

  const hasFilters = status || query || categoryId;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <Input
            type="text"
            placeholder="ID de pedido"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={status || ""}
            onChange={(e) =>
              onStatusChange(
                e.target.value ? (e.target.value as OrderStatus) : undefined
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
