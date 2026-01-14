"use client";

import { useState } from "react";
import { BookingStatus } from "@repo/domain";
import { useBookings } from "@/hooks/useBookings";
import { BookingsTable } from "@/components/bookings/BookingsTable";
import { BookingsFilters } from "@/components/bookings/BookingsFilters";
import { Text } from "@repo/ui";

export function BookingsListScreen() {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | undefined>();
  const [queryFilter, setQueryFilter] = useState("");

  const { data: bookings, isLoading } = useBookings({
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
        <Text variant="h1">Reservas</Text>
      </div>

      <BookingsFilters
        status={statusFilter}
        query={queryFilter}
        onStatusChange={setStatusFilter}
        onQueryChange={setQueryFilter}
        onClear={handleClearFilters}
      />

      <BookingsTable bookings={bookings || []} isLoading={isLoading} />
    </div>
  );
}
