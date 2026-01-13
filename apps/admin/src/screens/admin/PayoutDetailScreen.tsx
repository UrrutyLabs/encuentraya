"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@repo/domain";

interface PayoutDetailScreenProps {
  payoutId: string;
}

export function PayoutDetailScreen({ payoutId }: PayoutDetailScreenProps) {
  const router = useRouter();
  const [showSendModal, setShowSendModal] = useState(false);

  const { data: payout, isLoading, refetch } = trpc.payout.get.useQuery({
    payoutId,
  });

  const sendMutation = trpc.payout.send.useMutation({
    onSuccess: () => {
      setShowSendModal(false);
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
      CREATED: "info",
      SENT: "info",
      SETTLED: "success",
      FAILED: "danger",
    };
    return statusMap[status] || "info";
  };

  const handleSend = () => {
    setShowSendModal(true);
  };

  const handleConfirmSend = () => {
    sendMutation.mutate({ payoutId });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Text variant="h1">Cargando...</Text>
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="space-y-6">
        <Text variant="h1">Payout no encontrado</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="h1">Payout #{payout.id}</Text>
          <Badge variant={getStatusBadgeVariant(payout.status)} className="mt-2">
            {payout.status}
          </Badge>
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      {/* Payout Summary */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Resumen
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text variant="small" className="text-gray-600">
              Profesional
            </Text>
            <Text variant="body">{payout.proProfileId}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Proveedor
            </Text>
            <Text variant="body">{payout.provider}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Monto
            </Text>
            <Text variant="body">
              {formatCurrency(payout.amount, payout.currency)}
            </Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Referencia del proveedor
            </Text>
            <Text variant="body">{payout.providerReference || "-"}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Creado
            </Text>
            <Text variant="body">{formatDate(payout.createdAt)}</Text>
          </div>
          {payout.sentAt && (
            <div>
              <Text variant="small" className="text-gray-600">
                Enviado
              </Text>
              <Text variant="body">{formatDate(payout.sentAt)}</Text>
            </div>
          )}
        </div>
      </Card>

      {/* Earnings */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Cobros incluidos
        </Text>
        {payout.earnings.length === 0 ? (
          <Text variant="body" className="text-gray-600">
            No hay cobros registrados
          </Text>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Reserva
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Monto neto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payout.earnings.map((earning: { earningId: string; bookingId: string; netAmount: number }) => (
                  <tr key={earning.earningId}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {earning.bookingId}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {formatCurrency(earning.netAmount, payout.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Actions */}
      {payout.status === "FAILED" && (
        <Card className="p-6">
          <Text variant="h2" className="mb-4">
            Acciones
          </Text>
          <Button
            variant="secondary"
            onClick={handleSend}
            disabled={sendMutation.isPending}
          >
            {sendMutation.isPending ? "Reenviando..." : "Reenviar payout"}
          </Button>
        </Card>
      )}

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full m-4">
            <Text variant="h2" className="mb-4">
              Reenviar payout
            </Text>
            <Text variant="body" className="mb-4">
              ¿Estás seguro de reenviar el payout al proveedor?
            </Text>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleConfirmSend}
                disabled={sendMutation.isPending}
                className="flex-1"
              >
                {sendMutation.isPending ? "Enviando..." : "Confirmar"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSendModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
