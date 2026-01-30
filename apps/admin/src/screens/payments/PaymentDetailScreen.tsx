"use client";

import { useRouter } from "next/navigation";
import { usePayment, useSyncPaymentStatus } from "@/hooks/usePayments";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import { PaymentDetailSkeleton } from "@/components/presentational/PaymentDetailSkeleton";
import { formatCurrency } from "@repo/domain";

interface PaymentDetailScreenProps {
  paymentId: string;
}

export function PaymentDetailScreen({ paymentId }: PaymentDetailScreenProps) {
  const router = useRouter();

  const { data: payment, isLoading, refetch } = usePayment(paymentId);
  const syncStatusMutation = useSyncPaymentStatus();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-UY", {
      year: "numeric",
      month: "long",
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

  const handleSyncStatus = () => {
    if (
      confirm(
        "¿Estás seguro de sincronizar el estado del pago con el proveedor?"
      )
    ) {
      syncStatusMutation.mutate(
        { paymentId },
        {
          onSuccess: () => {
            refetch();
          },
        }
      );
    }
  };

  if (isLoading) {
    return <PaymentDetailSkeleton />;
  }

  if (!payment) {
    return (
      <div className="space-y-6">
        <Text variant="h1">Pago no encontrado</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="h1">Pago #{payment.id}</Text>
          <Badge
            variant={getStatusBadgeVariant(payment.status)}
            className="mt-2"
          >
            {payment.status}
          </Badge>
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      {/* Payment Summary */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Resumen
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text variant="small" className="text-gray-600">
              Pedido
            </Text>
            <Text variant="body">{payment.orderId}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Proveedor
            </Text>
            <Text variant="body">{payment.provider}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Referencia del proveedor
            </Text>
            <Text variant="body">{payment.providerReference || "-"}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Creado
            </Text>
            <Text variant="body">{formatDate(payment.createdAt)}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Última actualización
            </Text>
            <Text variant="body">{formatDate(payment.updatedAt)}</Text>
          </div>
        </div>
      </Card>

      {/* Amounts */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Montos
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Text variant="small" className="text-gray-600">
              Monto estimado
            </Text>
            <Text variant="body">
              {formatCurrency(payment.amountEstimated, payment.currency, true)}
            </Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Monto autorizado
            </Text>
            <Text variant="body">
              {payment.amountAuthorized
                ? formatCurrency(
                    payment.amountAuthorized,
                    payment.currency,
                    true
                  )
                : "-"}
            </Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Monto capturado
            </Text>
            <Text variant="body">
              {payment.amountCaptured
                ? formatCurrency(payment.amountCaptured, payment.currency, true)
                : "-"}
            </Text>
          </div>
        </div>
      </Card>

      {/* Webhook Events */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Eventos de webhook
        </Text>
        {payment.events.length === 0 ? (
          <Text variant="body" className="text-gray-600">
            No hay eventos registrados
          </Text>
        ) : (
          <div className="space-y-4">
            {payment.events.map(
              (event: {
                id: string;
                eventType: string;
                raw: unknown;
                createdAt: Date;
              }) => (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-md p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Text variant="body" className="font-medium">
                        {event.eventType}
                      </Text>
                      <Text variant="small" className="text-gray-600">
                        {formatDate(event.createdAt)}
                      </Text>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(event.raw, null, 2)}
                    </pre>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Card>

      {/* Actions */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Acciones
        </Text>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="secondary"
            onClick={handleSyncStatus}
            disabled={syncStatusMutation.isPending}
          >
            {syncStatusMutation.isPending
              ? "Sincronizando..."
              : "Sincronizar estado"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
