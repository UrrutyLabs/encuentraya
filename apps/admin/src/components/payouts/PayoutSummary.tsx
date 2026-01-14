"use client";

import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { formatCurrency } from "@repo/domain";
import { formatDate } from "@/components/utils/formatDate";

interface PayoutSummaryProps {
  proProfileId: string;
  provider: string;
  amount: number;
  currency: string;
  providerReference: string | null;
  createdAt: Date;
  sentAt: Date | null;
}

export function PayoutSummary({
  proProfileId,
  provider,
  amount,
  currency,
  providerReference,
  createdAt,
  sentAt,
}: PayoutSummaryProps) {
  return (
    <Card className="p-6">
      <Text variant="h2" className="mb-4">
        Resumen
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Text variant="small" className="text-gray-600">
            Profesional
          </Text>
          <Text variant="body">{proProfileId}</Text>
        </div>
        <div>
          <Text variant="small" className="text-gray-600">
            Proveedor
          </Text>
          <Text variant="body">{provider}</Text>
        </div>
        <div>
          <Text variant="small" className="text-gray-600">
            Monto
          </Text>
          <Text variant="body">
            {formatCurrency(amount, currency, true)}
          </Text>
        </div>
        <div>
          <Text variant="small" className="text-gray-600">
            Referencia del proveedor
          </Text>
          <Text variant="body">{providerReference || "-"}</Text>
        </div>
        <div>
          <Text variant="small" className="text-gray-600">
            Creado
          </Text>
          <Text variant="body">{formatDate(createdAt)}</Text>
        </div>
        {sentAt && (
          <div>
            <Text variant="small" className="text-gray-600">
              Enviado
            </Text>
            <Text variant="body">{formatDate(sentAt)}</Text>
          </div>
        )}
      </div>
    </Card>
  );
}
