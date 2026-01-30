"use client";

import React, { useMemo } from "react";
import { Card } from "@repo/ui";
import { Clock } from "lucide-react";
import { QuickQuestion } from "@/hooks/category";
import { WizardOption, WizardStepType } from "../../../core";
import { WizardQuestionInput } from "../WizardQuestionInput";
import { AvailabilityOptionRenderer } from "../../../steps/ServiceDetailsStep";

interface UseServiceDetailsWizardStepsProps {
  hasQuestions: boolean;
  quickQuestions: QuickQuestion[];
  date: string;
  today: string;
  availableTimes: Array<{ value: string; label: string }>;
  setDate: (date: string) => void;
  setTime: (time: string) => void;
  handleDateChangeWithValidation: (date: string) => void;
}

/**
 * Hook to build wizard steps configuration for ServiceDetailsStep
 *
 * Converts QuickQuestions to WizardOptions and builds the steps array
 * with questions, availability, and time selection steps.
 *
 * @param props - Configuration object
 * @returns Array of wizard steps
 */
export function useServiceDetailsWizardSteps({
  hasQuestions,
  quickQuestions,
  date,
  today,
  availableTimes,
  setDate,
  setTime,
  handleDateChangeWithValidation,
}: UseServiceDetailsWizardStepsProps): WizardStepType[] {
  // Convert QuickQuestion to WizardOption
  const convertQuestionToOption = (question: QuickQuestion): WizardOption => {
    const baseOption: WizardOption = {
      id: question.key,
      type:
        question.type === "boolean"
          ? "boolean"
          : question.type === "select"
            ? "select"
            : question.type === "number"
              ? "number"
              : "text",
      label: question.label,
      required: question.required || false,
      options: question.type === "select" ? question.options : undefined,
      render: ({ value, onChange, error, required }) => (
        <WizardQuestionInput
          question={question}
          value={value}
          onChange={onChange}
          error={error}
          required={required}
        />
      ),
    };
    return baseOption;
  };

  // Build wizard steps: one step per quick question, then availability, then time
  const wizardSteps = useMemo((): WizardStepType[] => {
    const steps: WizardStepType[] = [];

    // One step per quick question (each step shows a single question)
    if (hasQuestions) {
      quickQuestions.forEach((question) => {
        steps.push({
          id: `question_${question.key}`,
          title: question.label,
          options: [convertQuestionToOption(question)],
        });
      });
    }

    // Availability (date picker)
    steps.push({
      id: "availability",
      title: "¿Cuándo querés que empiece?",
      options: [
        {
          id: "availability_option",
          type: "custom",
          label: "",
          render: ({ value }) => {
            // This component needs access to wizard context to update both availability_option and date
            // We'll use a wrapper component inside the render
            return (
              <AvailabilityOptionRenderer
                value={value}
                date={date}
                today={today}
                setDate={setDate}
                handleDateChangeWithValidation={handleDateChangeWithValidation}
              />
            );
          },
          required: false, // Date field is required, not this one
        },
        {
          id: "date",
          type: "text",
          label: "Fecha",
          required: true,
          // Hidden - managed by availability filter
          render: () => null,
          validate: (value) => {
            if (!value || value === "") {
              return "Por favor seleccioná una fecha";
            }
            return true;
          },
        },
      ],
    });

    // Step 3: Time - use closure to access availableTimes and date
    steps.push({
      id: "time",
      title: "Hora",
      options: [
        {
          id: "time",
          type: "custom",
          label: "",
          render: ({ value, onChange }) => {
            const currentDate = date; // Use local date state
            return (
              <Card className="p-4 md:p-6">
                <div className="space-y-5 md:space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-text mb-2 md:mb-2">
                      <Clock className="w-4 h-4 text-muted" />
                      Hora
                    </label>
                    <select
                      value={String(value || "")}
                      onChange={(e) => {
                        onChange(e.target.value);
                        setTime(e.target.value);
                      }}
                      required
                      disabled={!currentDate}
                      className="w-full px-4 py-3 md:px-3 md:py-2 border border-border rounded-lg md:rounded-md bg-surface text-text text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      <option value="">
                        {currentDate
                          ? "Seleccionar hora"
                          : "Seleccionar fecha primero"}
                      </option>
                      {availableTimes.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            );
          },
          required: true,
          validate: (value) => {
            if (!value || value === "") {
              return "Por favor seleccioná una hora";
            }
            return true;
          },
        },
      ],
    });

    return steps;
  }, [
    hasQuestions,
    quickQuestions,
    date,
    today,
    availableTimes,
    setDate,
    setTime,
    handleDateChangeWithValidation,
  ]);

  return wizardSteps;
}
