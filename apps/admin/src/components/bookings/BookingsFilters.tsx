"use client";

import { Input } from "@repo/ui";
import { Button } from "@repo/ui";
import { BookingStatus } from "@repo/domain";

interface BookingsFiltersProps {
  status: BookingStatus | undefined;
  query: string;
  onStatusChange: (status: BookingStatus | undefined) => void;
  onQueryChange: (query: string) => void;
  onClear: () => void;
}

export function BookingsFilters({
  status,
  query,
  onStatusChange,
  onQueryChange,
  onClear,
}: BookingsFiltersProps) {
  const statusOptions: Array<{ value: BookingStatus | ""; label: string }> = [
    { value: "", label: "Todos" },
    { value: BookingStatus.PENDING_PAYMENT, label: "Pago pendiente" },
    { value: BookingStatus.PENDING, label: "Pendiente" },
    { value: BookingStatus.ACCEPTED, label: "Aceptada" },
    { value: BookingStatus.ON_MY_WAY, label: "En camino" },
    { value: BookingStatus.ARRIVED, label: "Llegó" },
    { value: BookingStatus.COMPLETED, label: "Completada" },
    { value: BookingStatus.REJECTED, label: "Rechazada" },
    { value: BookingStatus.CANCELLED, label: "Cancelada" },
  ];

  const hasFilters = status || query;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <Input
            type="text"
            placeholder="Email cliente o nombre profesional"
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
                e.target.value ? (e.target.value as BookingStatus) : undefined
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
