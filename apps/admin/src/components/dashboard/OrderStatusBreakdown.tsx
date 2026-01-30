"use client";

import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import { OrderStatus } from "@repo/domain";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
} from "@/utils/orderStatus";
import { ORDER_LABELS } from "@/utils/orderLabels";
import { useRouter } from "next/navigation";

interface OrderStatusBreakdownProps {
  breakdown: {
    draft: number;
    pending_pro_confirmation: number;
    accepted: number;
    confirmed: number;
    in_progress: number;
    awaiting_client_approval: number;
    disputed: number;
    completed: number;
    paid: number;
    canceled: number;
  };
  isLoading?: boolean;
}

export function OrderStatusBreakdown({
  breakdown,
  isLoading,
}: OrderStatusBreakdownProps) {
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

  const statuses: OrderStatus[] = [
    OrderStatus.DRAFT,
    OrderStatus.PENDING_PRO_CONFIRMATION,
    OrderStatus.ACCEPTED,
    OrderStatus.CONFIRMED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.AWAITING_CLIENT_APPROVAL,
    OrderStatus.DISPUTED,
    OrderStatus.COMPLETED,
    OrderStatus.PAID,
    OrderStatus.CANCELED,
  ];

  const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="p-6">
      <Text variant="h2" className="mb-4">
        Estado de {ORDER_LABELS.plural}
      </Text>
      <div className="space-y-3">
        {statuses.map((status) => {
          // Map OrderStatus enum to breakdown key
          const statusKeyMap: Record<OrderStatus, keyof typeof breakdown> = {
            [OrderStatus.DRAFT]: "draft",
            [OrderStatus.PENDING_PRO_CONFIRMATION]: "pending_pro_confirmation",
            [OrderStatus.ACCEPTED]: "accepted",
            [OrderStatus.CONFIRMED]: "confirmed",
            [OrderStatus.IN_PROGRESS]: "in_progress",
            [OrderStatus.AWAITING_CLIENT_APPROVAL]: "awaiting_client_approval",
            [OrderStatus.DISPUTED]: "disputed",
            [OrderStatus.COMPLETED]: "completed",
            [OrderStatus.PAID]: "paid",
            [OrderStatus.CANCELED]: "canceled",
          };
          const statusKey = statusKeyMap[status];
          const count = breakdown[statusKey] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div
              key={status}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-surface/50 cursor-pointer transition-colors"
              onClick={() => router.push(`/admin/orders?status=${status}`)}
            >
              <div className="flex items-center gap-3">
                <Badge variant={getOrderStatusVariant(status)} showIcon>
                  {getOrderStatusLabel(status)}
                </Badge>
                <Text variant="small" className="text-muted">
                  {count} {ORDER_LABELS.plural.toLowerCase()}
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
            {total} {ORDER_LABELS.plural.toLowerCase()}
          </Text>
        </div>
      </div>
    </Card>
  );
}
