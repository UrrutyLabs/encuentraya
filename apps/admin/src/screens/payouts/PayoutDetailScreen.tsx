"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePayout, useSendPayout } from "@/hooks/usePayouts";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";
import { PayoutStatusBadge } from "@/components/utils/PayoutStatusBadge";
import { PayoutSummary } from "@/components/payouts/PayoutSummary";
import { PayoutEarningsList } from "@/components/payouts/PayoutEarningsList";
import { PayoutDetailSkeleton } from "@/components/presentational/PayoutDetailSkeleton";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface PayoutDetailScreenProps {
  payoutId: string;
}

export function PayoutDetailScreen({ payoutId }: PayoutDetailScreenProps) {
  const router = useRouter();
  const [showSendModal, setShowSendModal] = useState(false);

  const { data: payout, isLoading, refetch } = usePayout(payoutId);
  const sendMutation = useSendPayout();

  const handleSend = () => {
    setShowSendModal(true);
  };

  const handleConfirmSend = () => {
    sendMutation.mutate(
      { payoutId },
      {
        onSuccess: () => {
          setShowSendModal(false);
          refetch();
        },
        onError: (error) => {
          console.error("Error sending payout:", error);
          // Modal will stay open, user can retry or cancel
        },
      }
    );
  };

  if (isLoading) {
    return <PayoutDetailSkeleton />;
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
          <div className="mt-2">
            <PayoutStatusBadge status={payout.status} />
          </div>
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      <PayoutSummary
        proProfileId={payout.proProfileId}
        provider={payout.provider}
        amount={payout.amount}
        currency={payout.currency}
        providerReference={payout.providerReference}
        createdAt={payout.createdAt}
        sentAt={payout.sentAt}
      />

      <PayoutEarningsList
        earnings={payout.earnings}
        currency={payout.currency}
      />

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

      {showSendModal && (
        <ConfirmModal
          title="Reenviar payout"
          message="¿Estás seguro de reenviar el payout al proveedor?"
          confirmLabel="Confirmar"
          onConfirm={handleConfirmSend}
          onCancel={() => setShowSendModal(false)}
          isPending={sendMutation.isPending}
        />
      )}
    </div>
  );
}
