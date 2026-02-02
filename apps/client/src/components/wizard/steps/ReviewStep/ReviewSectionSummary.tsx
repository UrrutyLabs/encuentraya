"use client";

import { Text } from "@repo/ui";
import { CostBreakdown } from "@/components/presentational/CostBreakdown";
import type { OrderEstimateOutput } from "@repo/domain";

interface ReviewSectionSummaryProps {
  costEstimation: OrderEstimateOutput | null | undefined;
  isEstimatingCost: boolean;
  costEstimationError: unknown;
  /** Fallback when estimation is not available; undefined for fixed-price */
  estimatedCost: number | undefined;
  hourlyRate: number;
  hours: string;
  isFixedPrice?: boolean;
}

/**
 * Section 3: Resumen / Costo estimado
 * Shows detailed cost breakdown, or fixed-price message when isFixedPrice.
 * Note: No Card wrapper - wrapped by parent component
 */
export function ReviewSectionSummary({
  costEstimation,
  isEstimatingCost,
  costEstimationError,
  estimatedCost,
  hourlyRate,
  hours,
  isFixedPrice = false,
}: ReviewSectionSummaryProps) {
  return (
    <section aria-labelledby="review-section-summary">
      <Text
        id="review-section-summary"
        variant="small"
        className="text-muted font-semibold uppercase tracking-wide mb-3 md:mb-4 block"
      >
        Resumen
      </Text>
      {isFixedPrice ? (
        <Text variant="body" className="text-muted">
          El profesional te enviará un presupuesto después de aceptar el
          trabajo.
        </Text>
      ) : (
        <CostBreakdown
          estimation={costEstimation}
          isLoading={isEstimatingCost}
          error={costEstimationError}
          fallbackLaborAmount={estimatedCost ?? 0}
          fallbackHourlyRate={hourlyRate}
          fallbackHours={hours}
        />
      )}
    </section>
  );
}
