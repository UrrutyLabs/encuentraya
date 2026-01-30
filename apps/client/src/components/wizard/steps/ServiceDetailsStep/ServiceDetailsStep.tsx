"use client";

import { useMemo } from "react";
import { useWizardState } from "@/lib/wizard/useWizardState";
import { useProDetail } from "@/hooks/pro";
import { useTodayDate } from "@/hooks/shared";
import { useCategoryConfig } from "@/hooks/category";
import {
  useServiceDetailsPreselectedValues,
  useServiceDetailsDateTimeSync,
  useServiceDetailsWizardSteps,
  useServiceDetailsWizardCompletion,
  useServiceDetailsErrorStates,
} from "./hooks";
import { ServiceDetailsStepHeader } from "./ServiceDetailsStepHeader";
import { ServiceDetailsStepErrors } from "./ServiceDetailsStepErrors";
import { ServiceDetailsWizardContent } from "./ServiceDetailsWizardContent";
import { Wizard } from "../../core";

interface ServiceDetailsStepProps {
  onNext?: () => void;
}

export function ServiceDetailsStep({}: ServiceDetailsStepProps) {
  const { state, updateState, navigateToStep } = useWizardState();
  const today = useTodayDate();

  // Get preselected values (rebook + URL params) via custom hook
  const {
    effectiveProId,
    selectedCategory,
    selectedSubcategory: urlSubcategory,
    categoryId,
    isCategoryPreSelected,
    rebookValues,
    isLoadingRebook,
    isLoadingCategory: isLoadingCategoryData,
  } = useServiceDetailsPreselectedValues({
    rebookFrom: state.rebookFrom,
    categorySlug: state.categorySlug,
    subcategorySlug: state.subcategorySlug,
    proId: state.proId,
  });

  // Fetch category config to get quick questions
  const subcategoryId = urlSubcategory?.id || undefined;
  const { config, isLoading: isLoadingConfig } = useCategoryConfig(
    categoryId || undefined,
    subcategoryId
  );

  // Get quick questions from config
  const quickQuestions = useMemo(() => config?.quick_questions || [], [config]);

  // Determine if questions exist
  const hasQuestions = quickQuestions.length > 0;

  const { pro, isLoading: isLoadingPro } = useProDetail(
    effectiveProId || undefined
  );

  // Manage date/time state and synchronization
  const {
    date,
    time,
    setDate,
    setTime,
    availableTimes,
    handleDateChangeWithValidation,
  } = useServiceDetailsDateTimeSync({
    initialDate: state.date,
    initialTime: state.time,
    categoryId,
    proAvailabilitySlots: pro?.availabilitySlots,
  });

  // Build wizard steps configuration
  const wizardSteps = useServiceDetailsWizardSteps({
    hasQuestions,
    quickQuestions,
    date,
    today,
    availableTimes,
    setDate,
    setTime,
    handleDateChangeWithValidation,
  });

  // Handle wizard completion and validation
  const { handleWizardComplete, initialAnswers } =
    useServiceDetailsWizardCompletion({
      quickQuestions,
      date,
      time,
      categoryId,
      isCategoryPreSelected,
      categorySlug: state.categorySlug,
      subcategorySlug: state.subcategorySlug,
      effectiveProId,
      pro: pro ?? null,
      rebookValues,
      wizardStateDate: state.date,
      wizardStateTime: state.time,
      wizardStateQuickQuestionAnswers: state.quickQuestionAnswers,
      updateState,
      navigateToStep,
    });

  // Check error states
  const { shouldShowErrors, isLoading, hasProId, hasPro, hasCategory } =
    useServiceDetailsErrorStates({
      isLoadingRebook,
      isLoadingCategory: isLoadingCategoryData,
      isLoadingPro,
      isLoadingConfig,
      effectiveProId,
      pro: pro ?? null,
      isCategoryPreSelected,
      selectedCategory,
    });

  if (shouldShowErrors) {
    return (
      <ServiceDetailsStepErrors
        isLoading={isLoading}
        hasProId={hasProId}
        hasPro={hasPro}
        hasCategory={hasCategory}
      />
    );
  }

  return (
    <div>
      {pro && (
        <ServiceDetailsStepHeader
          category={selectedCategory}
          subcategory={urlSubcategory}
          pro={pro}
        />
      )}

      <Wizard
        steps={wizardSteps}
        initialAnswers={initialAnswers}
        onComplete={handleWizardComplete}
        persistToUrl={true}
        urlParamPrefix="wizard_"
        className="space-y-6"
      >
        <ServiceDetailsWizardContent
          date={date}
          time={time}
          setDate={setDate}
          setTime={setTime}
          handleDateChangeWithValidation={handleDateChangeWithValidation}
        />
      </Wizard>
    </div>
  );
}
