"use client";

import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Calendar, CreditCard, Wallet, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  formatCurrency,
  toMajorUnits,
  OrderStatus,
  PaymentStatus,
} from "@repo/domain";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
} from "@/utils/orderStatus";
import { ORDER_LABELS } from "@/utils/orderLabels";

interface RecentActivityFeedProps {
  recentOrders: Array<{
    id: string;
    displayId: string;
    createdAt: Date;
    status: OrderStatus;
    totalAmount: number | null;
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

const getStatusBadgeVariant = (
  status: string | OrderStatus | PaymentStatus
): "info" | "success" | "warning" | "danger" => {
  // Handle order statuses
  if (Object.values(OrderStatus).includes(status as OrderStatus)) {
    return getOrderStatusVariant(status as OrderStatus);
  }
  // Handle payment/payout statuses
  if (
    status.includes("COMPLETED") ||
    status.includes("CAPTURED") ||
    status.includes("SETTLED")
  ) {
    return "success";
  }
  if (
    status.includes("PENDING") ||
    status.includes("CREATED") ||
    status.includes("AUTHORIZED")
  ) {
    return "warning";
  }
  if (
    status.includes("FAILED") ||
    status.includes("CANCELLED") ||
    status.includes("REJECTED")
  ) {
    return "danger";
  }
  return "info";
};

const getStatusLabel = (
  status: string | OrderStatus | PaymentStatus
): string => {
  // Handle order statuses
  if (Object.values(OrderStatus).includes(status as OrderStatus)) {
    return getOrderStatusLabel(status as OrderStatus);
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
  recentOrders,
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
    ...recentOrders.map((o) => {
      // adminListOrders returns limited fields, use what's available
      // All amounts are in minor units, convert to major for display
      const displayAmountMinor = o.totalAmount || 0;
      const displayAmount = toMajorUnits(displayAmountMinor);
      return {
        type: "order" as const,
        id: o.id,
        date: o.createdAt,
        title: `${ORDER_LABELS.singular} ${o.displayId || o.id}`,
        subtitle:
          displayAmount > 0
            ? formatCurrency(displayAmount, o.currency)
            : "Sin monto",
        status: o.status,
        onClick: () => router.push(`/admin/orders/${o.id}`),
      };
    }),
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

  const getIcon = (type: "order" | "payment" | "payout") => {
    switch (type) {
      case "order":
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
                  <Badge
                    variant={getStatusBadgeVariant(activity.status)}
                    showIcon
                  >
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
