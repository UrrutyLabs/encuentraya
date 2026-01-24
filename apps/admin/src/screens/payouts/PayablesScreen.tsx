"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  usePayablePros,
  useCreatePayout,
  useSendPayout,
} from "@/hooks/usePayouts";
import { PayablesTable } from "@/components/payouts/PayablesTable";
import { Text } from "@repo/ui";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

export function PayablesScreen() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedPro, setSelectedPro] = useState<{
    proProfileId: string;
    displayName: string;
  } | null>(null);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);

  const { data: pros, isLoading, refetch } = usePayablePros();
  const createMutation = useCreatePayout();
  const sendMutation = useSendPayout();

  const handleCreatePayout = (proProfileId: string, displayName: string) => {
    setSelectedPro({ proProfileId, displayName });
    setShowCreateModal(true);
  };

  const handleConfirmCreate = () => {
    if (selectedPro) {
      createMutation.mutate(
        {
          proProfileId: selectedPro.proProfileId,
          provider: "MERCADO_PAGO", // Default provider for MVP
        },
        {
          onSuccess: (data) => {
            setShowCreateModal(false);
            setSelectedPro(null);
            setSelectedPayoutId(data.payoutId);
            setShowSendModal(true);
            refetch();
          },
          onError: (error) => {
            console.error("Error creating payout:", error);
            // Modal will stay open, user can retry or cancel
          },
        }
      );
    }
  };

  const handleConfirmSend = () => {
    if (selectedPayoutId) {
      sendMutation.mutate(
        { payoutId: selectedPayoutId },
        {
          onSuccess: () => {
            const payoutIdToNavigate = selectedPayoutId;
            setShowSendModal(false);
            setSelectedPayoutId(null);
            refetch();
            if (payoutIdToNavigate) {
              router.push(`/admin/payouts/${payoutIdToNavigate}`);
            }
          },
          onError: (error) => {
            console.error("Error sending payout:", error);
            // Modal will stay open, user can retry or cancel
          },
        }
      );
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

      {showCreateModal && selectedPro && (
        <ConfirmModal
          title="Crear payout"
          message={`¿Estás seguro de crear un payout para ${selectedPro.displayName}?`}
          confirmLabel="Confirmar"
          onConfirm={handleConfirmCreate}
          onCancel={() => {
            setShowCreateModal(false);
            setSelectedPro(null);
          }}
          isPending={createMutation.isPending}
        />
      )}

      {showSendModal && selectedPayoutId && (
        <ConfirmModal
          title="Enviar payout"
          message="¿Estás seguro de enviar el payout al proveedor?"
          confirmLabel="Confirmar"
          onConfirm={handleConfirmSend}
          onCancel={() => {
            setShowSendModal(false);
            setSelectedPayoutId(null);
          }}
          isPending={sendMutation.isPending}
        />
      )}
    </div>
  );
}
