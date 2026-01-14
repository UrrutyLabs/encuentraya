"use client";

import { useRouter } from "next/navigation";
import { CalendarX } from "lucide-react";
import { Badge } from "@repo/ui";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@repo/ui";
import { formatCurrency, BookingStatus, getBookingStatusLabel, getBookingStatusVariant } from "@repo/domain";

interface BookingRow {
  id: string;
  createdAt: Date;
  status: string;
  clientEmail: string | null;
  clientName: string | null;
  proName: string | null;
  estimatedAmount: number;
  paymentStatus: string | null;
  currency: string;
}

interface BookingsTableProps {
  bookings: BookingRow[];
  isLoading?: boolean;
}

export function BookingsTable({ bookings, isLoading }: BookingsTableProps) {
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


  const getPaymentStatusBadgeVariant = (status: string | null) => {
    if (!status) return "info";
    const statusMap: Record<string, "info" | "success" | "warning" | "danger"> = {
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
    return <TableSkeleton rows={5} columns={6} />;
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={CalendarX}
        title="No se encontraron reservas"
        description="No hay reservas que coincidan con los filtros seleccionados."
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
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profesional
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto estimado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado pago
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(booking.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getBookingStatusVariant(booking.status as BookingStatus)} showIcon>
                    {getBookingStatusLabel(booking.status as BookingStatus)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.clientName || booking.clientEmail || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.proName || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(booking.estimatedAmount, booking.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.paymentStatus ? (
                    <Badge variant={getPaymentStatusBadgeVariant(booking.paymentStatus)}>
                      {booking.paymentStatus}
                    </Badge>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
