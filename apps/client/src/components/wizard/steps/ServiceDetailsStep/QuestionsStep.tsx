"use client";

import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import type { QuickQuestion } from "@/hooks/category";
import { WizardQuestionInput } from "./WizardQuestionInput";

interface QuestionsStepProps {
  questions: QuickQuestion[];
  answers: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onNext: () => void;
  canProceed: boolean;
  isLoading?: boolean;
}

/**
 * QuestionsStep Component
 *
 * Renders the questions step of the wizard
 * Shows all quick questions with centered h1 labels and radio buttons
 */
export function QuestionsStep({
  questions,
  answers,
  onChange,
  onNext,
  canProceed,
  isLoading = false,
}: QuestionsStepProps) {
  return (
    <div className="animate-in fade-in duration-200">
      <Card className="p-4 md:p-6">
        <div className="space-y-8">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-8 bg-muted/30 rounded w-3/4 mx-auto animate-pulse" />
                  <div className="h-12 bg-muted/30 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <Text variant="body" className="text-muted text-center">
              No hay preguntas adicionales para este servicio.
            </Text>
          ) : (
            questions.map((question) => (
              <WizardQuestionInput
                key={question.key}
                question={question}
                value={answers[question.key]}
                onChange={(value) => onChange(question.key, value)}
                required={question.required || false}
              />
            ))
          )}
        </div>
      </Card>

      {/* Continue button - only show if there are questions */}
      {!isLoading && questions.length > 0 && (
        <div className="flex justify-end mt-6 md:mt-6">
          <button
            onClick={onNext}
            disabled={!canProceed}
            aria-label="Continuar a disponibilidad"
            aria-describedby={
              !canProceed ? "questions-validation-message" : undefined
            }
            className="min-h-[44px] px-6 py-3 md:py-2 bg-primary text-white rounded-lg font-medium text-base md:text-sm hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation w-full md:w-auto"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Validation message */}
      {!canProceed && !isLoading && questions.length > 0 && (
        <div
          id="questions-validation-message"
          className="mt-2 text-sm text-warning text-center"
          role="alert"
          aria-live="polite"
        >
          Por favor, completá todas las preguntas requeridas antes de continuar.
        </div>
      )}
    </div>
  );
}
