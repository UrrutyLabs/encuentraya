"use client";

import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Calendar, CreditCard, Wallet, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency, BookingStatus, PaymentStatus, getBookingStatusLabel, getBookingStatusVariant } from "@repo/domain";

interface RecentActivityFeedProps {
  recentBookings: Array<{
    id: string;
    createdAt: Date;
    status: BookingStatus;
    clientName: string | null;
    clientEmail: string | null;
    estimatedAmount: number;
    currency: string;
  }>;
  recentPayments: Array<{
    id: string;
    updatedAt: Date;
    status: PaymentStatus;
    amountCaptured: number | null;
    currency: string;
  }>;
  recentPayouts: Array<{
    id: string;
    createdAt: Date;
    status: string;
    amount: number;
    currency: string;
    proProfileId: string;
  }>;
  isLoading?: boolean;
}

const getStatusBadgeVariant = (status: string | BookingStatus | PaymentStatus): "info" | "success" | "warning" | "danger" => {
  // Handle booking statuses
  if (Object.values(BookingStatus).includes(status as BookingStatus)) {
    return getBookingStatusVariant(status as BookingStatus);
  }
  // Handle payment/payout statuses
  if (status.includes("COMPLETED") || status.includes("CAPTURED") || status.includes("SETTLED")) {
    return "success";
  }
  if (status.includes("PENDING") || status.includes("CREATED") || status.includes("AUTHORIZED")) {
    return "warning";
  }
  if (status.includes("FAILED") || status.includes("CANCELLED") || status.includes("REJECTED")) {
    return "danger";
  }
  return "info";
};

const getStatusLabel = (status: string | BookingStatus | PaymentStatus): string => {
  // Handle booking statuses
  if (Object.values(BookingStatus).includes(status as BookingStatus)) {
    return getBookingStatusLabel(status as BookingStatus);
  }
  // For payment/payout statuses, return as-is (they're already translated elsewhere)
  return status;
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("es-UY", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function RecentActivityFeed({
  recentBookings,
  recentPayments,
  recentPayouts,
  isLoading,
}: RecentActivityFeedProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  // Combine and sort all activities by date
  const activities = [
    ...recentBookings.map((b) => ({
      type: "booking" as const,
      id: b.id,
      date: b.createdAt,
      title: `Reserva de ${b.clientName || b.clientEmail || "Cliente"}`,
      subtitle: formatCurrency(b.estimatedAmount, b.currency),
      status: b.status,
      onClick: () => router.push(`/admin/bookings/${b.id}`),
    })),
    ...recentPayments.map((p) => ({
      type: "payment" as const,
      id: p.id,
      date: p.updatedAt,
      title: `Pago ${p.amountCaptured ? formatCurrency(p.amountCaptured, p.currency, true) : "N/A"}`,
      subtitle: `Estado: ${p.status}`,
      status: p.status,
      onClick: () => router.push(`/admin/payments/${p.id}`),
    })),
    ...recentPayouts.map((p) => ({
      type: "payout" as const,
      id: p.id,
      date: p.createdAt,
      title: `Cobro a Profesional`,
      subtitle: formatCurrency(p.amount, p.currency, true),
      status: p.status,
      onClick: () => router.push(`/admin/payouts/${p.id}`),
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const getIcon = (type: "booking" | "payment" | "payout") => {
    switch (type) {
      case "booking":
        return Calendar;
      case "payment":
        return CreditCard;
      case "payout":
        return Wallet;
    }
  };

  return (
    <Card className="p-6">
      <Text variant="h2" className="mb-4">
        Actividad Reciente
      </Text>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <Text variant="body" className="text-muted text-center py-8">
            No hay actividad reciente
          </Text>
        ) : (
          activities.map((activity) => {
            const Icon = getIcon(activity.type);
            return (
              <div
                key={`${activity.type}-${activity.id}`}
                onClick={activity.onClick}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface/50 cursor-pointer transition-colors"
              >
                <div className="p-2 bg-muted/20 rounded-lg">
                  <Icon className="w-4 h-4 text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <Text variant="body" className="font-medium truncate">
                    {activity.title}
                  </Text>
                  <Text variant="small" className="text-muted">
                    {activity.subtitle}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(activity.status)} showIcon>
                    {getStatusLabel(activity.status)}
                  </Badge>
                  <Text variant="xs" className="text-muted whitespace-nowrap">
                    {formatDate(activity.date)}
                  </Text>
                  <ArrowRight className="w-4 h-4 text-muted" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
