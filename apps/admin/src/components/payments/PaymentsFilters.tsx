"use client";

import { Input } from "@repo/ui";
import { Button } from "@repo/ui";
import { PaymentStatus } from "@repo/domain";

interface PaymentsFiltersProps {
  status: PaymentStatus | undefined;
  query: string;
  onStatusChange: (status: PaymentStatus | undefined) => void;
  onQueryChange: (query: string) => void;
  onClear: () => void;
}

export function PaymentsFilters({
  status,
  query,
  onStatusChange,
  onQueryChange,
  onClear,
}: PaymentsFiltersProps) {
  const statusOptions: Array<{ value: PaymentStatus | ""; label: string }> = [
    { value: "", label: "Todos" },
    { value: PaymentStatus.CREATED, label: "Creado" },
    { value: PaymentStatus.REQUIRES_ACTION, label: "Requiere acción" },
    { value: PaymentStatus.AUTHORIZED, label: "Autorizado" },
    { value: PaymentStatus.CAPTURED, label: "Capturado" },
    { value: PaymentStatus.FAILED, label: "Fallido" },
    { value: PaymentStatus.CANCELLED, label: "Cancelado" },
    { value: PaymentStatus.REFUNDED, label: "Reembolsado" },
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
            placeholder="ID de pedido o referencia del proveedor"
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
                e.target.value ? (e.target.value as PaymentStatus) : undefined
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
