"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@repo/ui";

interface WizardNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  showBack?: boolean;
  showNext?: boolean;
  nextDisabled?: boolean;
  nextLoading?: boolean;
}

export function WizardNavigation({
  onBack,
  onNext,
  backLabel = "Atrás",
  nextLabel = "Siguiente",
  showBack = true,
  showNext = true,
  nextDisabled = false,
  nextLoading = false,
}: WizardNavigationProps) {
  return (
    <div className="flex flex-col-reverse md:flex-row justify-between gap-4 mt-8 pt-6 border-t border-border">
      {showBack && onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full md:w-auto flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Button>
      )}
      {!showBack && <div />}

      {showNext && onNext && (
        <Button
          variant="primary"
          onClick={onNext}
          disabled={nextDisabled || nextLoading}
          className="w-full md:w-auto flex items-center justify-center gap-2"
        >
          {nextLoading ? "Cargando..." : nextLabel}
          {!nextLoading && <ArrowRight className="w-4 h-4" />}
        </Button>
      )}
    </div>
  );
}
