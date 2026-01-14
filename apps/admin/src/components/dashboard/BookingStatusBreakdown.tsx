"use client";

import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import { BookingStatus } from "@repo/domain";
import { useRouter } from "next/navigation";

interface BookingStatusBreakdownProps {
  breakdown: {
    pending_payment: number;
    pending: number;
    accepted: number;
    on_my_way: number;
    arrived: number;
    completed: number;
    rejected: number;
    cancelled: number;
  };
  isLoading?: boolean;
}

const statusLabels: Record<BookingStatus, string> = {
  [BookingStatus.PENDING_PAYMENT]: "Pago pendiente",
  [BookingStatus.PENDING]: "Pendiente",
  [BookingStatus.ACCEPTED]: "Aceptada",
  [BookingStatus.ON_MY_WAY]: "En camino",
  [BookingStatus.ARRIVED]: "Llegó",
  [BookingStatus.COMPLETED]: "Completada",
  [BookingStatus.REJECTED]: "Rechazada",
  [BookingStatus.CANCELLED]: "Cancelada",
};

const statusVariants: Record<BookingStatus, "info" | "success" | "warning" | "danger"> = {
  [BookingStatus.PENDING_PAYMENT]: "warning",
  [BookingStatus.PENDING]: "info",
  [BookingStatus.ACCEPTED]: "info",
  [BookingStatus.ON_MY_WAY]: "info",
  [BookingStatus.ARRIVED]: "info",
  [BookingStatus.COMPLETED]: "success",
  [BookingStatus.REJECTED]: "danger",
  [BookingStatus.CANCELLED]: "danger",
};

export function BookingStatusBreakdown({
  breakdown,
  isLoading,
}: BookingStatusBreakdownProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-muted/30 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  const statuses: BookingStatus[] = [
    BookingStatus.PENDING_PAYMENT,
    BookingStatus.PENDING,
    BookingStatus.ACCEPTED,
    BookingStatus.ON_MY_WAY,
    BookingStatus.ARRIVED,
    BookingStatus.COMPLETED,
    BookingStatus.REJECTED,
    BookingStatus.CANCELLED,
  ];

  const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="p-6">
      <Text variant="h2" className="mb-4">
        Estado de Reservas
      </Text>
      <div className="space-y-3">
        {statuses.map((status) => {
          const statusKey = status as keyof typeof breakdown;
          const count = breakdown[statusKey] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div
              key={status}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-surface/50 cursor-pointer transition-colors"
              onClick={() => router.push(`/admin/bookings?status=${status}`)}
            >
              <div className="flex items-center gap-3">
                <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
                <Text variant="small" className="text-muted">
                  {count} reservas
                </Text>
              </div>
              <Text variant="small" className="text-muted font-medium">
                {percentage}%
              </Text>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <Text variant="body" className="font-medium">
            Total
          </Text>
          <Text variant="body" className="font-semibold">
            {total} reservas
          </Text>
        </div>
      </div>
    </Card>
  );
}
