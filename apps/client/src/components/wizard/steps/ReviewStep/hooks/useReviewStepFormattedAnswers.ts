"use client";

import { useMemo } from "react";
import type { QuickQuestion } from "@/hooks/category";
import type { FormattedQuestionAnswer } from "../ReviewQuestionAnswers";

function formatAnswerValue(value: unknown): string {
  if (value === true || value === "true") return "Sí";
  if (value === false || value === "false") return "No";
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);
  return String(value);
}

/**
 * Formats question answers for display: returns only values (no labels)
 */
export function useReviewStepFormattedAnswers(
  quickQuestions: QuickQuestion[],
  questionAnswers: Record<string, unknown>
): FormattedQuestionAnswer[] {
  return useMemo((): FormattedQuestionAnswer[] => {
    if (!Object.keys(questionAnswers).length) return [];

    if (quickQuestions.length > 0) {
      const fromConfig = quickQuestions
        .filter((question) => {
          const value = questionAnswers[question.key];
          if (value === undefined || value === null) return false;
          if (question.type === "boolean")
            return (
              value === true ||
              value === false ||
              value === "true" ||
              value === "false"
            );
          if (question.type === "select")
            return Array.isArray(value) && value.length > 0;
          if (typeof value === "string" && value === "") return false;
          if (typeof value === "number" && isNaN(value)) return false;
          return true;
        })
        .map((question) => ({
          label: "",
          value: formatAnswerValue(questionAnswers[question.key]),
        }));
      if (fromConfig.length > 0) return fromConfig;
    }

    return Object.entries(questionAnswers)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .map(([, value]) => ({
        label: "",
        value: formatAnswerValue(value),
      }));
  }, [quickQuestions, questionAnswers]);
}
