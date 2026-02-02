"use client";

import { AlertCircle, CreditCard } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui";
import { formatCurrency } from "@repo/domain";
import { JOB_LABELS } from "@/utils/jobLabels";
import type { OrderDetailView } from "@repo/domain";

interface PaymentInfo {
  amountEstimated: number;
  currency: string;
}

interface JobDetailAcceptedBannerProps {
  job: OrderDetailView;
  payment: PaymentInfo | null | undefined;
  onAuthorizePayment: () => void;
  onAcceptQuote: () => void;
  isAcceptingQuote: boolean;
}

/**
 * Banner for ACCEPTED orders: fixed-price quote flow (wait | accept | authorize) or hourly (authorize).
 */
export function JobDetailAcceptedBanner({
  job,
  payment,
  onAuthorizePayment,
  onAcceptQuote,
  isAcceptingQuote,
}: JobDetailAcceptedBannerProps) {
  const isFixed = job.pricingMode === "fixed";
  const hasQuote = (job.quotedAmountCents ?? 0) > 0;
  const quoteAccepted = !!job.quoteAcceptedAt;

  // Fixed: wait for quote
  if (isFixed && !hasQuote) {
    return (
      <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-warning/10 border-warning/20">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-warning" />
          <Text variant="h2" className="text-text">
            Presupuesto pendiente
          </Text>
        </div>
        <Text variant="body" className="text-muted">
          El profesional te enviará un presupuesto. Te avisaremos cuando esté
          listo.
        </Text>
      </Card>
    );
  }

  // Fixed: quote received – accept quote
  if (isFixed && hasQuote && !quoteAccepted) {
    const currency = job.currency ?? "UYU";
    return (
      <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-warning/10 border-warning/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              <Text variant="h2" className="text-text">
                Presupuesto recibido
              </Text>
            </div>
            <Text variant="body" className="text-muted mb-2">
              Presupuesto:{" "}
              {formatCurrency(job.quotedAmountCents!, currency, true)}
            </Text>
          </div>
          <Badge variant="warning" showIcon>
            Aceptar y pagar
          </Badge>
        </div>
        <Button
          variant="primary"
          onClick={onAcceptQuote}
          disabled={isAcceptingQuote}
          className="w-full md:w-auto flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          {isAcceptingQuote ? "Procesando..." : "Aceptar y pagar"}
        </Button>
      </Card>
    );
  }

  // Fixed quote accepted OR hourly: authorize payment (existing banner)
  return (
    <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-warning/10 border-warning/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            <Text variant="h2" className="text-text">
              Pago pendiente
            </Text>
          </div>
          <Text variant="body" className="text-muted mb-2">
            El profesional aceptó tu solicitud. Para continuar, necesitás
            autorizar el pago.
          </Text>
          {payment && (
            <div className="mt-2">
              <Text variant="body" className="text-text font-medium">
                Monto estimado:{" "}
                {formatCurrency(
                  payment.amountEstimated,
                  payment.currency,
                  true
                )}
              </Text>
            </div>
          )}
        </div>
        <Badge variant="warning" showIcon>
          Pago pendiente
        </Badge>
      </div>
      <Button
        variant="primary"
        onClick={onAuthorizePayment}
        className="w-full md:w-auto flex items-center gap-2"
      >
        <CreditCard className="w-4 h-4" />
        {JOB_LABELS.payJob}
      </Button>
    </Card>
  );
}
