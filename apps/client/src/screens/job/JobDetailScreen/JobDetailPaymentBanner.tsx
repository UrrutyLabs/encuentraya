"use client";

import { AlertCircle, CreditCard } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui";
import { formatCurrency } from "@repo/domain";
import { JOB_LABELS } from "@/utils/jobLabels";

interface PaymentInfo {
  amountEstimated: number;
  currency: string;
}

interface JobDetailPaymentBannerProps {
  payment: PaymentInfo | null | undefined;
  onAuthorizePayment: () => void;
}

export function JobDetailPaymentBanner({
  payment,
  onAuthorizePayment,
}: JobDetailPaymentBannerProps) {
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
