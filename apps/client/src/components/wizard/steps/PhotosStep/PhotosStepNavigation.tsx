"use client";

import { Button } from "@repo/ui";

interface PhotosStepNavigationProps {
  onBack: () => void;
  onNext: () => void;
  isUploading: boolean;
}

/**
 * Presentational navigation: Atrás + Continuar
 */
export function PhotosStepNavigation({
  onBack,
  onNext,
  isUploading,
}: PhotosStepNavigationProps) {
  return (
    <div className="flex flex-col-reverse md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-6">
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={isUploading}
        className="min-h-[44px] px-6 py-3 md:py-2 w-full md:w-auto text-base md:text-sm"
      >
        Atrás
      </Button>
      <Button
        variant="primary"
        onClick={onNext}
        disabled={isUploading}
        className="min-h-[44px] px-6 py-3 md:py-2 w-full md:w-auto text-base md:text-sm"
      >
        {isUploading ? "Subiendo..." : "Continuar"}
      </Button>
    </div>
  );
}
