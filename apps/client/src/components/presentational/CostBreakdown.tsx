"use client";

import { DollarSign, Loader2 } from "lucide-react";
import { Text } from "@repo/ui";
import { toMajorUnits, type OrderEstimateOutput } from "@repo/domain";

interface CostBreakdownProps {
  estimation: OrderEstimateOutput | null | undefined;
  isLoading: boolean;
  error: unknown;
  /** Fallback when estimation is not available */
  fallbackLaborAmount: number;
  fallbackHourlyRate: number;
  fallbackHours: string;
}

/**
 * Presentational: Cost breakdown with line items, taxes, and totals.
 * Shows loading state, error fallback, or full breakdown.
 */
export function CostBreakdown({
  estimation,
  isLoading,
  error,
  fallbackLaborAmount,
  fallbackHourlyRate,
  fallbackHours,
}: CostBreakdownProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-muted animate-spin" aria-hidden />
          <Text variant="small" className="text-muted">
            Calculando costo...
          </Text>
        </div>
      </div>
    );
  }

  if (error || !estimation) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-primary shrink-0" aria-hidden />
            <div>
              <Text variant="body" className="font-medium">
                Costo estimado
              </Text>
              <Text variant="small" className="text-muted">
                ${fallbackHourlyRate.toFixed(0)}/hora × {fallbackHours} horas
              </Text>
            </div>
          </div>
          <Text variant="h2" className="text-primary shrink-0">
            ${fallbackLaborAmount.toFixed(0)}
          </Text>
        </div>
      </div>
    );
  }

  const { lineItems, subtotalAmount, taxAmount, totalAmount, currency } =
    estimation;
  const subtotalMajor = toMajorUnits(subtotalAmount);
  const taxMajor = toMajorUnits(taxAmount);
  const totalMajor = toMajorUnits(totalAmount);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {lineItems.map((item, index) => (
          <div
            key={`${item.type}-${index}`}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4"
          >
            <Text variant="small" className="text-muted">
              {item.description}
            </Text>
            <Text variant="body" className="font-medium md:text-right">
              ${toMajorUnits(item.amount).toFixed(0)} {currency}
            </Text>
          </div>
        ))}
      </div>

      <div className="border-t border-border my-2" aria-hidden />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4">
        <Text variant="body" className="font-medium">
          Subtotal
        </Text>
        <Text variant="body" className="font-medium md:text-right">
          ${subtotalMajor.toFixed(0)} {currency}
        </Text>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4">
        <Text variant="small" className="text-muted">
          IVA ({estimation.taxRate * 100}%)
        </Text>
        <Text variant="body" className="font-medium md:text-right">
          ${taxMajor.toFixed(0)} {currency}
        </Text>
      </div>

      <div className="border-t border-border pt-2 mt-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary shrink-0" aria-hidden />
            <Text variant="body" className="font-semibold">
              Total
            </Text>
          </div>
          <Text variant="h2" className="text-primary shrink-0">
            ${totalMajor.toFixed(0)} {currency}
          </Text>
        </div>
      </div>
    </div>
  );
}
