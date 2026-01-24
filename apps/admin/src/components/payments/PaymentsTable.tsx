"use client";

import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { Badge } from "@repo/ui";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@repo/ui";
import { formatCurrency } from "@repo/domain";

interface PaymentRow {
  id: string;
  status: string;
  bookingId: string;
  provider: string;
  amountEstimated: number;
  amountAuthorized: number | null;
  amountCaptured: number | null;
  currency: string;
  updatedAt: Date;
}

interface PaymentsTableProps {
  payments: PaymentRow[];
  isLoading?: boolean;
}

export function PaymentsTable({ payments, isLoading }: PaymentsTableProps) {
  const router = useRouter();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-UY", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    const statusMap: Record<string, "info" | "success" | "warning" | "danger"> =
      {
        CREATED: "info",
        REQUIRES_ACTION: "warning",
        AUTHORIZED: "info",
        CAPTURED: "success",
        FAILED: "danger",
        CANCELLED: "danger",
        REFUNDED: "warning",
      };
    return statusMap[status] || "info";
  };

  if (isLoading) {
    return <TableSkeleton rows={5} columns={5} />;
  }

  if (payments.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No se encontraron pagos"
        description="No hay pagos que coincidan con los filtros seleccionados."
      />
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reserva
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proveedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actualizado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr
                key={payment.id}
                onClick={() => router.push(`/admin/payments/${payment.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getStatusBadgeVariant(payment.status)}>
                    {payment.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {payment.bookingId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="space-y-1">
                    <div>
                      Est:{" "}
                      {formatCurrency(
                        payment.amountEstimated,
                        payment.currency
                      )}
                    </div>
                    {payment.amountAuthorized && (
                      <div className="text-xs text-gray-600">
                        Aut:{" "}
                        {formatCurrency(
                          payment.amountAuthorized,
                          payment.currency
                        )}
                      </div>
                    )}
                    {payment.amountCaptured && (
                      <div className="text-xs text-gray-600">
                        Cap:{" "}
                        {formatCurrency(
                          payment.amountCaptured,
                          payment.currency
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {payment.provider}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(payment.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
