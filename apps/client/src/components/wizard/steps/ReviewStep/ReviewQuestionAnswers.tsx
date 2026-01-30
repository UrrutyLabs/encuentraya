"use client";

import { HelpCircle } from "lucide-react";
import { Text } from "@repo/ui";

export interface FormattedQuestionAnswer {
  label: string;
  value: string;
}

interface ReviewQuestionAnswersProps {
  items: FormattedQuestionAnswer[];
}

/**
 * Presentational block: "Preguntas adicionales" heading + list of label/value rows
 */
export function ReviewQuestionAnswers({ items }: ReviewQuestionAnswersProps) {
  if (items.length === 0) return null;

  return (
    <div
      className="pt-2"
      role="region"
      aria-labelledby="review-questions-title"
    >
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle className="w-5 h-5 text-muted shrink-0" aria-hidden />
        <Text
          id="review-questions-title"
          variant="small"
          className="text-muted font-medium"
        >
          Preguntas adicionales
        </Text>
      </div>
      <div className="space-y-3 pl-7">
        {items.map(({ value }, index) => (
          <div key={`qa-${index}-${value}`} className="min-w-0">
            <Text variant="body" className="font-medium wrap-break-word">
              {value}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}
