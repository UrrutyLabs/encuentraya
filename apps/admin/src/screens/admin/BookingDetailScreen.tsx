"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { BookingStatus } from "@repo/domain";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@repo/domain";
import { BookingTimeline } from "@/components/admin/BookingTimeline";

interface BookingDetailScreenProps {
  bookingId: string;
}

export function BookingDetailScreen({ bookingId }: BookingDetailScreenProps) {
  const router = useRouter();
  const [showForceStatusModal, setShowForceStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | null>(null);

  const { data: booking, isLoading, refetch } = trpc.booking.adminById.useQuery({
    bookingId,
  });

  const cancelMutation = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const forceStatusMutation = trpc.booking.adminForceStatus.useMutation({
    onSuccess: () => {
      setShowForceStatusModal(false);
      setSelectedStatus(null);
      refetch();
    },
  });

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
    const statusMap: Record<string, "info" | "success" | "warning" | "danger"> = {
      pending_payment: "warning",
      pending: "info",
      accepted: "info",
      on_my_way: "info",
      arrived: "info",
      completed: "success",
      rejected: "danger",
      cancelled: "danger",
    };
    return statusMap[status] || "info";
  };

  const handleCancel = () => {
    if (confirm("¿Estás seguro de que querés cancelar esta reserva?")) {
      cancelMutation.mutate({ bookingId });
    }
  };

  const handleForceStatus = () => {
    if (selectedStatus && confirm(`¿Estás seguro de cambiar el estado a ${selectedStatus}?`)) {
      forceStatusMutation.mutate({
        bookingId,
        status: selectedStatus,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Text variant="h1">Cargando...</Text>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <Text variant="h1">Reserva no encontrada</Text>
      </div>
    );
  }

  const statusOptions: BookingStatus[] = [
    BookingStatus.PENDING_PAYMENT,
    BookingStatus.PENDING,
    BookingStatus.ACCEPTED,
    BookingStatus.ON_MY_WAY,
    BookingStatus.ARRIVED,
    BookingStatus.COMPLETED,
    BookingStatus.REJECTED,
    BookingStatus.CANCELLED,
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="h1">Reserva #{booking.id}</Text>
          <Badge variant={getStatusBadgeVariant(booking.status)} className="mt-2">
            {booking.status}
          </Badge>
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      {/* Booking Summary */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Resumen
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text variant="small" className="text-gray-600">
              Categoría
            </Text>
            <Text variant="body">{booking.category}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Fecha programada
            </Text>
            <Text variant="body">{formatDate(booking.scheduledAt)}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Horas estimadas
            </Text>
            <Text variant="body">{booking.hoursEstimate}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Monto estimado
            </Text>
            <Text variant="body">
              {formatCurrency(booking.estimatedAmount, booking.payment?.currency || "UYU")}
            </Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Creada
            </Text>
            <Text variant="body">{formatDate(booking.createdAt)}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Última actualización
            </Text>
            <Text variant="body">{formatDate(booking.updatedAt)}</Text>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-6">
        <BookingTimeline
          createdAt={booking.createdAt}
          updatedAt={booking.updatedAt}
          scheduledAt={booking.scheduledAt}
          status={booking.status}
        />
      </Card>

      {/* Address */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Dirección
        </Text>
        <Text variant="body">{booking.addressText}</Text>
      </Card>

      {/* Client Info */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Cliente
        </Text>
        <div className="space-y-2">
          <div>
            <Text variant="small" className="text-gray-600">
              Nombre
            </Text>
            <Text variant="body">
              {booking.client.firstName || booking.client.lastName
                ? `${booking.client.firstName || ""} ${booking.client.lastName || ""}`.trim()
                : "-"}
            </Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Email
            </Text>
            <Text variant="body">{booking.client.email || "-"}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Teléfono
            </Text>
            <Text variant="body">{booking.client.phone || "-"}</Text>
          </div>
        </div>
      </Card>

      {/* Pro Info */}
      {booking.pro && (
        <Card className="p-6">
          <Text variant="h2" className="mb-4">
            Profesional
          </Text>
          <div className="space-y-2">
            <div>
              <Text variant="small" className="text-gray-600">
                Nombre
              </Text>
              <Text variant="body">{booking.pro.displayName}</Text>
            </div>
            <div>
              <Text variant="small" className="text-gray-600">
                Email
              </Text>
              <Text variant="body">{booking.pro.email}</Text>
            </div>
            <div>
              <Text variant="small" className="text-gray-600">
                Teléfono
              </Text>
              <Text variant="body">{booking.pro.phone || "-"}</Text>
            </div>
          </div>
        </Card>
      )}

      {/* Payment Info */}
      {booking.payment && (
        <Card className="p-6">
          <Text variant="h2" className="mb-4">
            Pago
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text variant="small" className="text-gray-600">
                Estado
              </Text>
              <Text variant="body">{booking.payment.status}</Text>
            </div>
            <div>
              <Text variant="small" className="text-gray-600">
                Monto estimado
              </Text>
              <Text variant="body">
                {formatCurrency(booking.payment.amountEstimated, booking.payment.currency, true)}
              </Text>
            </div>
            {booking.payment.amountAuthorized && (
              <div>
                <Text variant="small" className="text-gray-600">
                  Monto autorizado
                </Text>
                <Text variant="body">
                  {formatCurrency(booking.payment.amountAuthorized, booking.payment.currency, true)}
                </Text>
              </div>
            )}
            {booking.payment.amountCaptured && (
              <div>
                <Text variant="small" className="text-gray-600">
                  Monto capturado
                </Text>
                <Text variant="body">
                  {formatCurrency(booking.payment.amountCaptured, booking.payment.currency, true)}
                </Text>
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
            disabled={cancelMutation.isPending || booking.status === BookingStatus.CANCELLED}
          >
            {cancelMutation.isPending ? "Cancelando..." : "Cancelar reserva"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowForceStatusModal(true)}
          >
            Forzar estado
          </Button>
        </div>
      </Card>

      {/* Force Status Modal */}
      {showForceStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full m-4">
            <Text variant="h2" className="mb-4">
              Forzar estado
            </Text>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nuevo estado
                </label>
                <select
                  value={selectedStatus || ""}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value ? (e.target.value as BookingStatus) : null)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Seleccionar estado</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
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
                  {forceStatusMutation.isPending ? "Actualizando..." : "Confirmar"}
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
