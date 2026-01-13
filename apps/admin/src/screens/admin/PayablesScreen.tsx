"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { PayablesTable } from "@/components/admin/PayablesTable";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export function PayablesScreen() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedPro, setSelectedPro] = useState<{
    proProfileId: string;
    displayName: string;
  } | null>(null);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);

  const { data: pros, isLoading, refetch } = trpc.payout.listPayablePros.useQuery();

  const createMutation = trpc.payout.createForPro.useMutation({
    onSuccess: (data) => {
      setShowCreateModal(false);
      setSelectedPro(null);
      setSelectedPayoutId(data.payoutId);
      setShowSendModal(true);
      refetch();
    },
  });

  const sendMutation = trpc.payout.send.useMutation({
    onSuccess: () => {
      setShowSendModal(false);
      setSelectedPayoutId(null);
      refetch();
      if (selectedPayoutId) {
        router.push(`/admin/payouts/${selectedPayoutId}`);
      }
    },
  });

  const handleCreatePayout = (proProfileId: string, displayName: string) => {
    setSelectedPro({ proProfileId, displayName });
    setShowCreateModal(true);
  };

  const handleConfirmCreate = () => {
    if (selectedPro) {
      createMutation.mutate({
        proProfileId: selectedPro.proProfileId,
        provider: "MERCADO_PAGO", // Default provider for MVP
      });
    }
  };

  const handleConfirmSend = () => {
    if (selectedPayoutId) {
      sendMutation.mutate({ payoutId: selectedPayoutId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Text variant="h1">Profesionales con cobros pendientes</Text>
      </div>

      <PayablesTable
        pros={pros || []}
        isLoading={isLoading}
        onCreatePayout={handleCreatePayout}
      />

      {/* Create Payout Modal */}
      {showCreateModal && selectedPro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full m-4">
            <Text variant="h2" className="mb-4">
              Crear payout
            </Text>
            <Text variant="body" className="mb-4">
              ¿Estás seguro de crear un payout para {selectedPro.displayName}?
            </Text>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleConfirmCreate}
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? "Creando..." : "Confirmar"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedPro(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Send Payout Modal */}
      {showSendModal && selectedPayoutId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full m-4">
            <Text variant="h2" className="mb-4">
              Enviar payout
            </Text>
            <Text variant="body" className="mb-4">
              ¿Estás seguro de enviar el payout al proveedor?
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
                onClick={() => {
                  setShowSendModal(false);
                  setSelectedPayoutId(null);
                }}
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
