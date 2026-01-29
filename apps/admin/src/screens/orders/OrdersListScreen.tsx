"use client";

import { useState } from "react";
import { OrderStatus, type Order } from "@repo/domain";
import { useOrders } from "@/hooks/useOrders";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrdersFilters } from "@/components/orders/OrdersFilters";
import { Text } from "@repo/ui";
import { ORDER_LABELS } from "@/utils/orderLabels";

export function OrdersListScreen() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [queryFilter, setQueryFilter] = useState("");
  const [categoryIdFilter, setCategoryIdFilter] = useState<
    string | undefined
  >();

  const { data: orders, isLoading } = useOrders({
    status: statusFilter,
    query: queryFilter,
    categoryId: categoryIdFilter,
    limit: 100,
  });

  const handleClearFilters = () => {
    setStatusFilter(undefined);
    setQueryFilter("");
    setCategoryIdFilter(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Text variant="h1">{ORDER_LABELS.ordersList}</Text>
      </div>

      <OrdersFilters
        status={statusFilter}
        query={queryFilter}
        categoryId={categoryIdFilter}
        onStatusChange={setStatusFilter}
        onQueryChange={setQueryFilter}
        onCategoryChange={setCategoryIdFilter}
        onClear={handleClearFilters}
      />

      <OrdersTable
        orders={(orders as unknown as Order[]) || []}
        isLoading={isLoading}
      />
    </div>
  );
}
