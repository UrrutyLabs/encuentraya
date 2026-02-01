"use client";

import { Text } from "@repo/ui";
import { CostBreakdown } from "@/components/presentational/CostBreakdown";
import type { OrderEstimateOutput } from "@repo/domain";

interface ReviewSectionSummaryProps {
  costEstimation: OrderEstimateOutput | null | undefined;
  isEstimatingCost: boolean;
  costEstimationError: unknown;
  // Fallback values when estimation is not available
  estimatedCost: number;
  hourlyRate: number;
  hours: string;
}

/**
 * Section 3: Resumen / Costo estimado
 * Shows detailed cost breakdown with line items, taxes, and totals
 * Note: No Card wrapper - wrapped by parent component
 */
export function ReviewSectionSummary({
  costEstimation,
  isEstimatingCost,
  costEstimationError,
  estimatedCost,
  hourlyRate,
  hours,
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
      <CostBreakdown
        estimation={costEstimation}
        isLoading={isEstimatingCost}
        error={costEstimationError}
        fallbackLaborAmount={estimatedCost}
        fallbackHourlyRate={hourlyRate}
        fallbackHours={hours}
      />
    </section>
  );
}
