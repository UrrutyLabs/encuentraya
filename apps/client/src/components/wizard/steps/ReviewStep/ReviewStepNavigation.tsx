"use client";

import { Button } from "@repo/ui";

interface ReviewStepNavigationProps {
  onBack: () => void;
  onSubmit: () => void;
  isPending: boolean;
}

/**
 * Presentational navigation: Atrás + Confirmar trabajo buttons
 */
export function ReviewStepNavigation({
  onBack,
  onSubmit,
  isPending,
}: ReviewStepNavigationProps) {
  return (
    <div className="flex flex-col-reverse md:flex-row justify-between gap-3 md:gap-4">
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={isPending}
        className="min-h-[44px] w-full md:w-auto text-base md:text-sm py-3 md:py-2"
      >
        Atrás
      </Button>
      <Button
        variant="primary"
        onClick={onSubmit}
        disabled={isPending}
        className="min-h-[44px] w-full md:w-auto text-base md:text-sm py-3 md:py-2"
      >
        {isPending ? "Creando trabajo..." : "Confirmar trabajo"}
      </Button>
    </div>
  );
}
