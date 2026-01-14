"use client";

import { Badge } from "@repo/ui";

interface PayoutStatusBadgeProps {
  status: string;
}

export function PayoutStatusBadge({ status }: PayoutStatusBadgeProps) {
  const getStatusBadgeVariant = (
    status: string
  ): "info" | "success" | "warning" | "danger" => {
    const statusMap: Record<string, "info" | "success" | "warning" | "danger"> = {
      CREATED: "info",
      SENT: "info",
      SETTLED: "success",
      FAILED: "danger",
    };
    return statusMap[status] || "info";
  };

  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      CREATED: "Creado",
      SENT: "Enviado",
      SETTLED: "Liquidado",
      FAILED: "Fallido",
    };
    return statusLabels[status] || status;
  };

  return (
    <Badge variant={getStatusBadgeVariant(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
}
