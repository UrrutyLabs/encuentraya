import { useMemo, useCallback } from "react";
import type { QuickQuestion } from "@/hooks/category";
import type { Pro } from "@repo/domain";
import { serializeQuestionAnswers } from "@/lib/wizard/useWizardState";

interface RebookValues {
  categorySlug: string;
  address: string;
  hours: string;
}

interface UseServiceDetailsWizardCompletionProps {
  quickQuestions: QuickQuestion[];
  date: string;
  time: string;
  categoryId: string | "";
  isCategoryPreSelected: boolean;
  categorySlug?: string | null;
  subcategorySlug?: string | null;
  effectiveProId: string | null;
  pro: Pro | null;
  rebookValues: RebookValues | null;
  wizardStateDate?: string | null;
  wizardStateTime?: string | null;
  wizardStateQuickQuestionAnswers?: Record<string, unknown> | null;
  updateState: (state: {
    quickQuestionAnswers?: Record<string, unknown>;
    date?: string;
    time?: string;
  }) => void;
  navigateToStep: (step: string, params?: Record<string, string>) => void;
}

interface UseServiceDetailsWizardCompletionReturn {
  canProceedToLocation: boolean;
  handleWizardComplete: (answers: Record<string, unknown>) => void;
  initialAnswers: Record<string, unknown>;
}

/**
 * Hook to handle wizard completion logic for ServiceDetailsStep
 *
 * Handles:
 * - Building initial answers from wizard state
 * - Validating if can proceed to location step
 * - Processing wizard completion (extracting answers, building params, navigating)
 *
 * @param props - Configuration object
 * @returns Completion handler, validation flag, and initial answers
 */
export function useServiceDetailsWizardCompletion({
  quickQuestions,
  date,
  time,
  categoryId,
  isCategoryPreSelected,
  categorySlug,
  subcategorySlug,
  effectiveProId,
  pro,
  rebookValues,
  wizardStateDate,
  wizardStateTime,
  wizardStateQuickQuestionAnswers,
  updateState,
  navigateToStep,
}: UseServiceDetailsWizardCompletionProps): UseServiceDetailsWizardCompletionReturn {
  // Initial answers from wizard state
  const initialAnswers = useMemo(() => {
    const answers: Record<string, unknown> = {
      date: wizardStateDate || date || "",
      time: wizardStateTime || time || "",
    };

    // Add question answers
    if (wizardStateQuickQuestionAnswers) {
      Object.assign(answers, wizardStateQuickQuestionAnswers);
    }

    return answers;
  }, [
    wizardStateDate,
    wizardStateTime,
    wizardStateQuickQuestionAnswers,
    date,
    time,
  ]);

  // Validation for final step (can proceed to location)
  const canProceedToLocation = useMemo(() => {
    return !!(
      isCategoryPreSelected &&
      categoryId &&
      date &&
      time &&
      effectiveProId &&
      pro &&
      pro.categoryIds.includes(categoryId)
    );
  }, [isCategoryPreSelected, categoryId, date, time, effectiveProId, pro]);

  // Handle wizard completion
  const handleWizardComplete = useCallback(
    (answers: Record<string, unknown>) => {
      // Extract question answers
      const questionAnswers: Record<string, unknown> = {};
      quickQuestions.forEach((q) => {
        if (answers[q.key] !== undefined) {
          questionAnswers[q.key] = answers[q.key];
        }
      });

      const finalDate = (answers.date as string) || date;
      const finalTime = (answers.time as string) || time;

      if (!canProceedToLocation) return;

      // Save answers to wizard state
      updateState({
        quickQuestionAnswers: questionAnswers,
        date: finalDate,
        time: finalTime,
      });

      // Build params for location step. Include serialized question answers so they
      // are not lost: updateState's router.push is async, so navigateToStep would
      // otherwise read stale searchParams without question_* params.
      const updatedParams: Record<string, string> = {
        proId: effectiveProId!,
        date: finalDate,
        time: finalTime,
        ...serializeQuestionAnswers(questionAnswers),
      };

      if (isCategoryPreSelected && categorySlug) {
        updatedParams.categorySlug = categorySlug;
      }

      if (subcategorySlug) {
        updatedParams.subcategorySlug = subcategorySlug;
      }

      if (rebookValues) {
        updatedParams.address = rebookValues.address;
        updatedParams.hours = rebookValues.hours;
      }

      navigateToStep("location", updatedParams);
    },
    [
      quickQuestions,
      date,
      time,
      canProceedToLocation,
      updateState,
      effectiveProId,
      isCategoryPreSelected,
      categorySlug,
      subcategorySlug,
      rebookValues,
      navigateToStep,
    ]
  );

  return {
    canProceedToLocation,
    handleWizardComplete,
    initialAnswers,
  };
}
