"use client";

import { useCallback } from "react";
import { Card, Text } from "@repo/ui";
import { ReviewStepHeader } from "./ReviewStepHeader";
import { ReviewStepErrors } from "./ReviewStepErrors";
import { ReviewStepContent } from "./ReviewStepContent";
import { ReviewStepNavigation } from "./ReviewStepNavigation";
import { usePhotoUrls } from "@/contexts/PhotoUrlsContext";
import {
  useReviewStepData,
  useReviewStepValidation,
  useReviewStepSubmit,
} from "./hooks";

interface ReviewStepProps {
  onBack?: () => void;
}

export function ReviewStep({}: ReviewStepProps) {
  const {
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
  } = useReviewStepData();

  const { hasCompleteState, isLoadingPro } = useReviewStepValidation({
    state,
    category,
    pro,
  });

  const { photoUrls } = usePhotoUrls();
  const {
    handleSubmit,
    isPending,
    error: createError,
  } = useReviewStepSubmit({
    category,
    categoryMetadataJson,
  });

  const handleBack = useCallback(() => {
    navigateToStep("photos");
  }, [navigateToStep]);

  if (!hasCompleteState || isLoadingPro) {
    return (
      <ReviewStepErrors
        hasCompleteState={hasCompleteState}
        isLoadingPro={isLoadingPro}
      />
    );
  }

  return (
    <div className="min-w-0">
      <ReviewStepHeader />

      <ReviewStepContent
        proName={pro!.name}
        categoryName={category?.name ?? "Cargando..."}
        formattedDate={formattedDate}
        formattedTime={formattedTime}
        formattedQuestionAnswers={formattedQuestionAnswers}
        address={state.address ?? ""}
        hours={state.hours ?? ""}
        estimatedCost={estimatedCost}
        hourlyRate={pro!.hourlyRate}
        costEstimation={costEstimation}
        isEstimatingCost={isEstimatingCost}
        costEstimationError={costEstimationError}
        isFixedPrice={category?.pricingMode === "fixed"}
        photoUrls={photoUrls}
      />

      {createError != null && (
        <Card className="p-4 mb-6 bg-danger/10 border-danger/20">
          <Text variant="small" className="text-danger">
            {(createError as Error).message || "Error al crear el trabajo"}
          </Text>
        </Card>
      )}

      <ReviewStepNavigation
        onBack={handleBack}
        onSubmit={handleSubmit}
        isPending={isPending}
      />
    </div>
  );
}
