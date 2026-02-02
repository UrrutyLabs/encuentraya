"use client";

import { CheckCircle, Hourglass } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import type { OrderDetailView } from "@repo/domain";

interface JobDetailAwaitingApprovalProps {
  job: OrderDetailView;
  onApproveHours: () => void;
  isPending: boolean;
}

/**
 * Section for AWAITING_CLIENT_APPROVAL: fixed → "Marcar como completado"; hourly → "Aprobar horas".
 */
export function JobDetailAwaitingApproval({
  job,
  onApproveHours,
  isPending,
}: JobDetailAwaitingApprovalProps) {
  const isFixed = job.pricingMode === "fixed";

  if (isFixed) {
    return (
      <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          <Text variant="h2" className="text-text">
            Confirmar realización
          </Text>
        </div>
        <Text variant="body" className="text-muted mb-4">
          El profesional marcó el trabajo como completado. Confirmá que el
          trabajo se realizó para cerrar el pago.
        </Text>
        <Button
          variant="primary"
          onClick={onApproveHours}
          disabled={isPending}
          className="w-full md:w-auto flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {isPending ? "Procesando..." : "Marcar como completado"}
        </Button>
      </Card>
    );
  }

  // Hourly: approve hours
  const finalHours = job.finalHoursSubmitted ?? 0;
  return (
    <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-primary/5 border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <Hourglass className="w-5 h-5 text-primary" />
        <Text variant="h2" className="text-text">
          Aprobar horas
        </Text>
      </div>
      <Text variant="body" className="text-muted mb-2">
        Horas realizadas: {finalHours} {finalHours === 1 ? "hora" : "horas"}
      </Text>
      <Text variant="body" className="text-muted mb-4">
        Confirmá las horas para cerrar el pago.
      </Text>
      <Button
        variant="primary"
        onClick={onApproveHours}
        disabled={isPending}
        className="w-full md:w-auto flex items-center gap-2"
      >
        <CheckCircle className="w-4 h-4" />
        {isPending ? "Procesando..." : "Aprobar horas"}
      </Button>
    </Card>
  );
}
