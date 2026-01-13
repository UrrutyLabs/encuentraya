"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { PaymentStatus } from "@repo/domain";
import { PaymentsTable } from "@/components/admin/PaymentsTable";
import { PaymentsFilters } from "@/components/admin/PaymentsFilters";
import { Text } from "@/components/ui/Text";

export function PaymentsListScreen() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>();
  const [queryFilter, setQueryFilter] = useState("");

  const { data: payments, isLoading } = trpc.payment.adminList.useQuery({
    status: statusFilter,
    query: queryFilter || undefined,
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
