"use client";

import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Badge } from "@repo/ui";

type AuditEventType =
  | "PRO_SUSPENDED"
  | "PRO_UNSUSPENDED"
  | "PRO_APPROVED"
  | "BOOKING_STATUS_FORCED"
  | "PAYMENT_SYNCED"
  | "PAYOUT_CREATED"
  | "PAYOUT_SENT"
  | "USER_ROLE_CHANGED";

interface AuditLog {
  id: string;
  eventType: AuditEventType;
  actorId: string;
  actorRole: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

interface ProAuditHistoryProps {
  logs: AuditLog[];
  isLoading?: boolean;
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("es-UY", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getEventLabel = (eventType: AuditEventType): string => {
  const labels: Record<AuditEventType, string> = {
    PRO_SUSPENDED: "Profesional Suspendido",
    PRO_UNSUSPENDED: "Profesional Reactivado",
    PRO_APPROVED: "Profesional Aprobado",
    BOOKING_STATUS_FORCED: "Estado de Reserva Forzado",
    PAYMENT_SYNCED: "Pago Sincronizado",
    PAYOUT_CREATED: "Cobro Creado",
    PAYOUT_SENT: "Cobro Enviado",
    USER_ROLE_CHANGED: "Rol de Usuario Cambiado",
  };
  return labels[eventType] || eventType;
};

const getEventBadgeVariant = (
  eventType: AuditEventType
): "info" | "success" | "warning" | "danger" => {
  const variantMap: Record<AuditEventType, "info" | "success" | "warning" | "danger"> = {
    PRO_SUSPENDED: "danger",
    PRO_UNSUSPENDED: "success",
    PRO_APPROVED: "success",
    BOOKING_STATUS_FORCED: "warning",
    PAYMENT_SYNCED: "info",
    PAYOUT_CREATED: "info",
    PAYOUT_SENT: "success",
    USER_ROLE_CHANGED: "warning",
  };
  return variantMap[eventType] || "info";
};

export function ProAuditHistory({ logs, isLoading }: ProAuditHistoryProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Historial de Acciones
        </Text>
        <Text variant="body" className="text-gray-600">
          Cargando historial...
        </Text>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Historial de Acciones
        </Text>
        <Text variant="body" className="text-gray-600">
          No hay acciones registradas para este profesional.
        </Text>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <Text variant="h2" className="mb-4">
        Historial de Acciones
      </Text>
      <div className="relative pl-4">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-6">
          {logs.map((log) => (
            <div key={log.id} className="relative pl-6">
              <div className="absolute left-0 top-0 mt-1 h-3 w-3 rounded-full bg-blue-500 ring-8 ring-white" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getEventBadgeVariant(log.eventType)}>
                      {getEventLabel(log.eventType)}
                    </Badge>
                  </div>
                  <Text variant="small" className="text-gray-500 mb-1">
                    {formatDate(log.createdAt)}
                  </Text>
                  {log.metadata?.reason != null && (
                    <Text variant="body" className="text-gray-700 mt-2">
                      <span className="font-medium">Razón:</span>{" "}
                      {String(log.metadata.reason)}
                    </Text>
                  )}
                  {log.metadata?.previousStatus != null &&
                    log.metadata?.newStatus != null && (
                      <Text variant="small" className="text-gray-600 mt-1">
                        Estado: {String(log.metadata.previousStatus)} →{" "}
                        {String(log.metadata.newStatus)}
                      </Text>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
