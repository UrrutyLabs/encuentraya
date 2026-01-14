"use client";

import { useState } from "react";
import { PaymentStatus } from "@repo/domain";
import { usePayments } from "@/hooks/usePayments";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { PaymentsFilters } from "@/components/payments/PaymentsFilters";
import { Text } from "@repo/ui";

export function PaymentsListScreen() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>();
  const [queryFilter, setQueryFilter] = useState("");

  const { data: payments, isLoading } = usePayments({
    status: statusFilter,
    query: queryFilter,
    limit: 100,
  });

  const handleClearFilters = () => {
    setStatusFilter(undefined);
    setQueryFilter("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Text variant="h1">Pagos</Text>
      </div>

      <PaymentsFilters
        status={statusFilter}
        query={queryFilter}
        onStatusChange={setStatusFilter}
        onQueryChange={setQueryFilter}
        onClear={handleClearFilters}
      />

      <PaymentsTable payments={payments || []} isLoading={isLoading} />
    </div>
  );
}
