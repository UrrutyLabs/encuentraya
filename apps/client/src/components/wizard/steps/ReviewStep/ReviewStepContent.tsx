"use client";

import { Card } from "@repo/ui";
import type { OrderEstimateOutput } from "@repo/domain";
import { ReviewSectionProfessional } from "./ReviewSectionProfessional";
import { ReviewSectionServiceDetails } from "./ReviewSectionServiceDetails";
import { ReviewSectionLocation } from "./ReviewSectionLocation";
import { ReviewSectionSummary } from "./ReviewSectionSummary";
import type { FormattedQuestionAnswer } from "./ReviewQuestionAnswers";

interface ReviewStepContentProps {
  proName: string;
  categoryName: string;
  formattedDate: string;
  formattedTime: string;
  formattedQuestionAnswers: FormattedQuestionAnswer[];
  address: string;
  hours: string;
  /** Undefined for fixed-price (pro will send quote) */
  estimatedCost: number | undefined;
  hourlyRate: number;
  costEstimation: OrderEstimateOutput | null | undefined;
  isEstimatingCost: boolean;
  costEstimationError: unknown;
  isFixedPrice?: boolean;
}

/**
 * Presentational: three separate Cards
 * Card 1: Professional info
 * Card 2: Service details + Location + Hours
 * Card 3: Cost summary
 */
export function ReviewStepContent({
  proName,
  categoryName,
  formattedDate,
  formattedTime,
  formattedQuestionAnswers,
  address,
  hours,
  estimatedCost,
  hourlyRate,
  costEstimation,
  isEstimatingCost,
  costEstimationError,
  isFixedPrice = false,
}: ReviewStepContentProps) {
  return (
    <>
      {/* Card 1: Professional */}
      <ReviewSectionProfessional
        proName={proName}
        categoryName={categoryName}
      />

      {/* Card 2: Service Details + Location */}
      <Card className="p-4 md:p-6 mb-4 md:mb-6">
        <div className="space-y-6 md:space-y-6">
          <ReviewSectionServiceDetails
            formattedDate={formattedDate}
            formattedTime={formattedTime}
            formattedQuestionAnswers={formattedQuestionAnswers}
          />

          <div className="border-t border-border" aria-hidden />

          <ReviewSectionLocation
            address={address}
            hours={hours}
            isFixedPrice={isFixedPrice}
          />
        </div>
      </Card>

      {/* Card 3: Cost Summary */}
      <Card className="p-4 md:p-6 mb-4 md:mb-6">
        <ReviewSectionSummary
          costEstimation={costEstimation}
          isEstimatingCost={isEstimatingCost}
          costEstimationError={costEstimationError}
          estimatedCost={estimatedCost}
          hourlyRate={hourlyRate}
          hours={hours}
          isFixedPrice={isFixedPrice}
        />
      </Card>
    </>
  );
}
