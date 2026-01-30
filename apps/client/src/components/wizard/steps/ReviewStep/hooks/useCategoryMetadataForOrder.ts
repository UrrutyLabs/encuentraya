"use client";

import { useMemo } from "react";
import type { CategoryMetadataInput } from "@repo/domain";
import type { Category } from "@repo/domain";

/**
 * Builds categoryMetadataJson for order creation (category + question answers).
 */
export function useCategoryMetadataForOrder(
  category: Category | null | undefined,
  questionAnswers: Record<string, unknown>
): CategoryMetadataInput | undefined {
  return useMemo((): CategoryMetadataInput | undefined => {
    if (!category?.id) return undefined;
    const metadata: CategoryMetadataInput = {
      categoryId: category.id,
      categoryKey: category.key,
      categoryName: category.name,
    };
    if (Object.keys(questionAnswers).length > 0) {
      (metadata as Record<string, unknown>).quickQuestionAnswers =
        questionAnswers;
    }
    return metadata;
  }, [category, questionAnswers]);
}
