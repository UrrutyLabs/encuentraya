"use client";

import { Card } from "@repo/ui";
import { WizardAvailabilityFilter } from "./WizardAvailabilityFilter";

interface AvailabilityStepProps {
  selectedOption: "today" | "thisWeek" | "specificDays" | null;
  selectedDate: string;
  onOptionChange: (option: "today" | "thisWeek" | "specificDays") => void;
  onDateChange: (date: string) => void;
  onBack: () => void;
  minDate: string; // Today's date in YYYY-MM-DD format
}

/**
 * AvailabilityStep Component
 *
 * Renders the availability selection step
 * Shows availability filter with options: Today, This week, Specific days
 */
export function AvailabilityStep({
  selectedOption,
  selectedDate,
  onOptionChange,
  onDateChange,
  onBack,
  minDate,
}: AvailabilityStepProps) {
  return (
    <div className="animate-in fade-in duration-200">
      <Card className="p-4 md:p-6">
        <WizardAvailabilityFilter
          selectedOption={selectedOption}
          selectedDate={selectedDate}
          onOptionChange={onOptionChange}
          onDateChange={onDateChange}
          minDate={minDate}
        />
      </Card>
      <div className="flex justify-end mt-6 md:mt-6">
        <button
          onClick={onBack}
          aria-label="Volver a preguntas"
          className="min-h-[44px] px-6 py-3 md:py-2 border border-border rounded-lg font-medium text-base md:text-sm hover:bg-surface active:bg-surface/80 transition-colors touch-manipulation w-full md:w-auto"
        >
          Atrás
        </button>
      </div>
    </div>
  );
}
