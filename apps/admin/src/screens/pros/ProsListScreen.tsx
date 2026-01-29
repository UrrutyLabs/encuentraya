"use client";

import { useState } from "react";
import { usePros } from "@/hooks/usePros";
import { ProsTable } from "@/components/pros/ProsTable";
import { ProsFilters } from "@/components/pros/ProsFilters";
import { Text } from "@repo/ui";

export function ProsListScreen() {
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "active" | "suspended" | undefined
  >();
  const [queryFilter, setQueryFilter] = useState("");
  const [categoryIdFilter, setCategoryIdFilter] = useState<
    string | undefined
  >();

  const { data: pros, isLoading } = usePros({
    status: statusFilter,
    query: queryFilter,
    // TODO: Uncomment when backend supports categoryId filtering
    // categoryId: categoryIdFilter,
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
        <Text variant="h1">Profesionales</Text>
      </div>

      <ProsFilters
        status={statusFilter}
        query={queryFilter}
        categoryId={categoryIdFilter}
        onStatusChange={setStatusFilter}
        onQueryChange={setQueryFilter}
        onCategoryChange={setCategoryIdFilter}
        onClear={handleClearFilters}
      />

      <ProsTable pros={pros || []} isLoading={isLoading} />
    </div>
  );
}
