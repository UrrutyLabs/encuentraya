"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@repo/domain";
import {
  useOrder,
  useOrderAuditLogs,
  useCancelOrder,
  useForceOrderStatus,
} from "@/hooks/useOrders";
import { useCategory } from "@/hooks/useCategories";
import { useSubcategory } from "@/hooks/useSubcategories";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
} from "@/utils/orderStatus";
import { ORDER_LABELS } from "@/utils/orderLabels";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import { formatCurrency, toMajorUnits } from "@repo/domain";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { ProAuditHistory } from "@/components/pros/ProAuditHistory";
import { OrderDetailSkeleton } from "@/components/presentational/OrderDetailSkeleton";

interface OrderDetailScreenProps {
  orderId: string;
}

export function OrderDetailScreen({ orderId }: OrderDetailScreenProps) {
  const router = useRouter();
  const [showForceStatusModal, setShowForceStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(
    null
  );

  const { data: order, isLoading, refetch } = useOrder(orderId);
  const cancelMutation = useCancelOrder();
  const forceStatusMutation = useForceOrderStatus();

  const { data: orderAuditLogs, isLoading: isLoadingOrderAudit } =
    useOrderAuditLogs(orderId, { enabled: !!order?.id });

  // Fetch category and subcategory data
  const { data: category } = useCategory(order?.categoryId || "", {
    includeDeleted: true, // Include deleted to show if category was deleted
  });
  const { data: subcategory } = useSubcategory(order?.subcategoryId || "");

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-UY", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancel = () => {
    if (confirm("¿Estás seguro de que querés cancelar este pedido?")) {
      cancelMutation.mutate(
        { orderId },
        {
          onSuccess: () => {
            refetch();
          },
        }
      );
    }
  };

  const handleForceStatus = () => {
    if (
      selectedStatus &&
      confirm(
        `¿Estás seguro de cambiar el estado a ${getOrderStatusLabel(selectedStatus)}?`
      )
    ) {
      forceStatusMutation.mutate(
        {
          orderId,
          status: selectedStatus,
        },
        {
          onSuccess: () => {
            setShowForceStatusModal(false);
            setSelectedStatus(null);
            refetch();
          },
        }
      );
    }
  };

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Text variant="h1">Pedido no encontrado</Text>
      </div>
    );
  }

  const statusOptions: OrderStatus[] = [
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

  // Calculate display amount
  // All amounts are in minor units, convert to major units for display
  const displayAmountMinor = order.totalAmount
    ? order.totalAmount
    : order.hourlyRateSnapshotAmount * order.estimatedHours;
  const displayAmount = toMajorUnits(displayAmountMinor);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="h1">
            {ORDER_LABELS.singular} #{order.displayId || order.id}
          </Text>
          <Badge
            variant={getOrderStatusVariant(order.status)}
            showIcon
            className="mt-2"
          >
            {getOrderStatusLabel(order.status)}
          </Badge>
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      {/* Order Summary */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Resumen
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text variant="small" className="text-gray-600">
              Categoría
            </Text>
            <Text variant="body">
              {category
                ? category.deletedAt || !category.isActive
                  ? `${category.name} (eliminada)`
                  : category.name
                : order.categoryId
                  ? "Cargando..."
                  : "—"}
            </Text>
          </div>
          {order.subcategoryId && (
            <div>
              <Text variant="small" className="text-gray-600">
                Subcategoría
              </Text>
              <Text variant="body">
                {subcategory ? subcategory.name : "Cargando..."}
              </Text>
            </div>
          )}
          <div>
            <Text variant="small" className="text-gray-600">
              Fecha programada
            </Text>
            <Text variant="body">
              {formatDate(order.scheduledWindowStartAt)}
            </Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Horas estimadas
            </Text>
            <Text variant="body">{order.estimatedHours}</Text>
          </div>
          {order.finalHoursSubmitted && (
            <div>
              <Text variant="small" className="text-gray-600">
                Horas finales
              </Text>
              <Text variant="body">{order.finalHoursSubmitted}</Text>
            </div>
          )}
          {order.approvedHours && (
            <div>
              <Text variant="small" className="text-gray-600">
                Horas aprobadas
              </Text>
              <Text variant="body">{order.approvedHours}</Text>
            </div>
          )}
          <div>
            <Text variant="small" className="text-gray-600">
              Monto total
            </Text>
            <Text variant="body">
              {formatCurrency(displayAmount, order.currency)}
            </Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Creada
            </Text>
            <Text variant="body">{formatDate(order.createdAt)}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Última actualización
            </Text>
            <Text variant="body">{formatDate(order.updatedAt)}</Text>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-6">
        <OrderTimeline
          createdAt={order.createdAt}
          updatedAt={order.updatedAt}
          scheduledWindowStartAt={order.scheduledWindowStartAt}
          status={order.status}
          acceptedAt={order.acceptedAt}
          confirmedAt={order.confirmedAt}
          startedAt={order.startedAt}
          arrivedAt={order.arrivedAt}
          completedAt={order.completedAt}
          paidAt={order.paidAt}
          canceledAt={order.canceledAt}
        />
      </Card>

      {/* Order audit history (e.g. contact info blocked, status forced) */}
      <ProAuditHistory
        logs={(orderAuditLogs ?? []).map((log) => ({
          ...log,
          eventType: log.eventType as
            | "PRO_SUSPENDED"
            | "PRO_UNSUSPENDED"
            | "PRO_APPROVED"
            | "ORDER_STATUS_FORCED"
            | "PAYMENT_SYNCED"
            | "PAYOUT_CREATED"
            | "PAYOUT_SENT"
            | "USER_ROLE_CHANGED"
            | "CHAT_CONTACT_INFO_DETECTED",
          actorRole: log.actorRole as string,
        }))}
        isLoading={isLoadingOrderAudit}
        emptyMessage="No hay acciones registradas para este pedido."
      />

      {/* Address */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          {ORDER_LABELS.address}
        </Text>
        <Text variant="body">{order.addressText}</Text>
      </Card>

      {/* Category Metadata */}
      {order.categoryMetadataJson &&
        Object.keys(order.categoryMetadataJson).length > 0 && (
          <Card className="p-6">
            <Text variant="h2" className="mb-4">
              Metadatos de Categoría
            </Text>
            <div className="space-y-2">
              {Object.entries(order.categoryMetadataJson).map(
                ([key, value]) => (
                  <div key={key}>
                    <Text variant="small" className="text-gray-600 capitalize">
                      {key.replace(/_/g, " ")}
                    </Text>
                    <Text variant="body">
                      {typeof value === "object"
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </Text>
                  </div>
                )
              )}
            </div>
          </Card>
        )}

      {/* Dispute Info */}
      {order.status === OrderStatus.DISPUTED && (
        <Card className="p-6 border-danger/20 bg-danger/5">
          <Text variant="h2" className="mb-4 text-danger">
            Disputa
          </Text>
          <div className="space-y-2">
            {order.disputeReason && (
              <div>
                <Text variant="small" className="text-gray-600">
                  Razón
                </Text>
                <Text variant="body">{order.disputeReason}</Text>
              </div>
            )}
            {order.disputeOpenedBy && (
              <div>
                <Text variant="small" className="text-gray-600">
                  Abierta por
                </Text>
                <Text variant="body">{order.disputeOpenedBy}</Text>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Acciones
        </Text>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="danger"
            onClick={handleCancel}
            disabled={
              cancelMutation.isPending || order.status === OrderStatus.CANCELED
            }
          >
            {cancelMutation.isPending
              ? "Cancelando..."
              : ORDER_LABELS.cancelOrder}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowForceStatusModal(true)}
          >
            {ORDER_LABELS.forceStatus}
          </Button>
        </div>
      </Card>

      {/* Force Status Modal */}
      {showForceStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full m-4">
            <Text variant="h2" className="mb-4">
              {ORDER_LABELS.forceStatus}
            </Text>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nuevo estado
                </label>
                <select
                  value={selectedStatus || ""}
                  onChange={(e) =>
                    setSelectedStatus(
                      e.target.value ? (e.target.value as OrderStatus) : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Seleccionar estado</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {getOrderStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleForceStatus}
                  disabled={!selectedStatus || forceStatusMutation.isPending}
                  className="flex-1"
                >
                  {forceStatusMutation.isPending
                    ? "Actualizando..."
                    : "Confirmar"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowForceStatusModal(false);
                    setSelectedStatus(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
