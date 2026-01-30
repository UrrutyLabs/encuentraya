"use client";

import { Text } from "@repo/ui";
import { ReviewDateTimeRow } from "./ReviewDateTimeRow";
import { ReviewQuestionAnswers } from "./ReviewQuestionAnswers";
import type { FormattedQuestionAnswer } from "./ReviewQuestionAnswers";

interface ReviewSectionServiceDetailsProps {
  formattedDate: string;
  formattedTime: string;
  formattedQuestionAnswers: FormattedQuestionAnswer[];
}

/**
 * Section 2 (part 1): Service details (date+time, question answers)
 * Uses horizontal layout on desktop, vertical on mobile
 * Note: No Card wrapper - wrapped by parent component
 */
export function ReviewSectionServiceDetails({
  formattedDate,
  formattedTime,
  formattedQuestionAnswers,
}: ReviewSectionServiceDetailsProps) {
  return (
    <section aria-labelledby="review-section-service">
      <Text
        id="review-section-service"
        variant="small"
        className="text-muted font-semibold uppercase tracking-wide mb-3 md:mb-4 block"
      >
        Detalles del servicio
      </Text>
      <div className="space-y-2">
        <ReviewDateTimeRow
          formattedDate={formattedDate}
          formattedTime={formattedTime}
        />
        <ReviewQuestionAnswers items={formattedQuestionAnswers} />
      </div>
    </section>
  );
}
