"use client";

import { useMemo } from "react";
import { useWizardState } from "@/lib/wizard/useWizardState";
import { useProDetail } from "@/hooks/pro";
import { useCategoryBySlug, useCategoryConfig } from "@/hooks/category";
import { useSubcategoryBySlugAndCategoryId } from "@/hooks/subcategory";
import { useEstimateOrderCost } from "@/hooks/order/useEstimateOrderCost";
import { useReviewStepFormattedAnswers } from "./useReviewStepFormattedAnswers";
import { useCategoryMetadataForOrder } from "./useCategoryMetadataForOrder";
import type { FormattedQuestionAnswer } from "../ReviewQuestionAnswers";
import type { OrderEstimateOutput } from "@repo/domain";

export interface UseReviewStepDataReturn {
  state: ReturnType<typeof useWizardState>["state"];
  navigateToStep: ReturnType<typeof useWizardState>["navigateToStep"];
  pro: ReturnType<typeof useProDetail>["pro"];
  category: ReturnType<typeof useCategoryBySlug>["category"];
  formattedDate: string;
  formattedTime: string;
  formattedQuestionAnswers: FormattedQuestionAnswer[];
  /** Fallback simple calculation; undefined for fixed-price (pro will send quote) */
  estimatedCost: number | undefined;
  costEstimation: OrderEstimateOutput | null | undefined;
  isEstimatingCost: boolean;
  costEstimationError: unknown;
  categoryMetadataJson: ReturnType<typeof useCategoryMetadataForOrder>;
}

/**
 * Encapsulates all data fetching and derived state for the Review step.
 */
export function useReviewStepData(): UseReviewStepDataReturn {
  const { state, navigateToStep } = useWizardState();
  const { pro } = useProDetail(state.proId || undefined);
  const { category } = useCategoryBySlug(state.categorySlug || undefined);
  const { subcategory } = useSubcategoryBySlugAndCategoryId(
    state.subcategorySlug || undefined,
    category?.id
  );
  const { config } = useCategoryConfig(category?.id, subcategory?.id);

  const quickQuestions = useMemo(() => config?.quick_questions || [], [config]);

  const questionAnswers = useMemo(
    () => state.quickQuestionAnswers || {},
    [state.quickQuestionAnswers]
  );

  const formattedQuestionAnswers = useReviewStepFormattedAnswers(
    quickQuestions,
    questionAnswers
  );

  const categoryMetadataJson = useCategoryMetadataForOrder(
    category,
    questionAnswers
  );

  const isFixedPrice = category?.pricingMode === "fixed";
  // Fallback simple calculation (for error states). Fixed-price: no estimate until quote.
  const estimatedCost = useMemo(() => {
    if (isFixedPrice) return undefined;
    if (!pro || !state.hours) return 0;
    return parseFloat(state.hours) * pro.hourlyRate;
  }, [pro, state.hours, isFixedPrice]);

  // Cost estimation from API (not used for fixed-price; pro will send quote)
  const estimationInput = useMemo(() => {
    if (isFixedPrice) return null;
    if (!pro?.id || !state.hours || parseFloat(state.hours) <= 0) {
      return null;
    }
    return {
      proProfileId: pro.id,
      estimatedHours: parseFloat(state.hours),
      categoryId: category?.id,
    };
  }, [pro, state.hours, category, isFixedPrice]);

  const {
    data: costEstimation,
    isLoading: isEstimatingCost,
    error: costEstimationError,
  } = useEstimateOrderCost(estimationInput);

  const formattedDate = useMemo(() => {
    if (!state.date) return "";
    const date = new Date(state.date);
    return date.toLocaleDateString("es-UY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [state.date]);

  const formattedTime = useMemo(() => {
    if (!state.time) return "";
    const [hours, minutes] = state.time.split(":");
    return `${hours}:${minutes}`;
  }, [state.time]);

  return {
    state,
    navigateToStep,
    pro,
    category,
    formattedDate,
    formattedTime,
    formattedQuestionAnswers,
    estimatedCost,
    costEstimation,
    isEstimatingCost,
    costEstimationError,
    categoryMetadataJson,
  };
}
