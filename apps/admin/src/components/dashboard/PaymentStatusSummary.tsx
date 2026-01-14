"use client";

import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import { CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@repo/domain";
import { PaymentStatus } from "@repo/domain";

interface PaymentStatusSummaryProps {
  breakdown: {
    CREATED: number;
    REQUIRES_ACTION: number;
    AUTHORIZED: number;
    CAPTURED: number;
    FAILED: number;
    CANCELLED: number;
    REFUNDED: number;
  };
  amounts: {
    CREATED: number;
    REQUIRES_ACTION: number;
    AUTHORIZED: number;
    CAPTURED: number;
    FAILED: number;
    CANCELLED: number;
    REFUNDED: number;
  };
  isLoading?: boolean;
}

const statusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.CREATED]: "Creado",
  [PaymentStatus.REQUIRES_ACTION]: "Requiere acción",
  [PaymentStatus.AUTHORIZED]: "Autorizado",
  [PaymentStatus.CAPTURED]: "Capturado",
  [PaymentStatus.FAILED]: "Fallido",
  [PaymentStatus.CANCELLED]: "Cancelado",
  [PaymentStatus.REFUNDED]: "Reembolsado",
};

const statusVariants: Record<PaymentStatus, "info" | "success" | "warning" | "danger"> = {
  [PaymentStatus.CREATED]: "info",
  [PaymentStatus.REQUIRES_ACTION]: "warning",
  [PaymentStatus.AUTHORIZED]: "info",
  [PaymentStatus.CAPTURED]: "success",
  [PaymentStatus.FAILED]: "danger",
  [PaymentStatus.CANCELLED]: "danger",
  [PaymentStatus.REFUNDED]: "warning",
};

const statusOrder: PaymentStatus[] = [
  PaymentStatus.CAPTURED,
  PaymentStatus.AUTHORIZED,
  PaymentStatus.CREATED,
  PaymentStatus.REQUIRES_ACTION,
  PaymentStatus.FAILED,
  PaymentStatus.CANCELLED,
  PaymentStatus.REFUNDED,
];

export function PaymentStatusSummary({
  breakdown,
  amounts,
  isLoading,
}: PaymentStatusSummaryProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-muted/30 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
  const totalAmount = Object.values(amounts).reduce((sum, amount) => sum + amount, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-primary" />
        <Text variant="h2">Estado de Pagos</Text>
      </div>
      <div className="space-y-3">
        {statusOrder.map((status) => {
          const count = breakdown[status];
          const amount = amounts[status];
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

          if (count === 0) return null;

          return (
            <div
              key={status}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-surface/50 cursor-pointer transition-colors"
              onClick={() => router.push(`/admin/payments?status=${status}`)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
                <Text variant="small" className="text-muted">
                  {count} pagos
                </Text>
              </div>
              <div className="flex items-center gap-4">
                <Text variant="small" className="text-muted font-medium">
                  {formatCurrency(amount, "UYU", true)}
                </Text>
                <Text variant="small" className="text-muted font-medium">
                  {percentage}%
                </Text>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <Text variant="body" className="font-medium">
            Total
          </Text>
          <div className="text-right">
            <Text variant="body" className="font-semibold">
              {total} pagos
            </Text>
            <Text variant="small" className="text-muted">
              {formatCurrency(totalAmount, "UYU", true)}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
}
